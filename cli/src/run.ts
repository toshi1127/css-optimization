import { default as fs, PathLike } from "fs";
import { default as produce } from "immer";
import { reduce } from "p-iteration";
import { default as puppeteer, LaunchOptions } from "puppeteer";
import postcss from "postcss"
import {
  Action,
  ActionName,
  BrowserEngine,
  BrowserPage,
  Scenario
} from "./main";
import { ActionHandler, BrowserType, Context } from "./types";

export type RunnerOptions = {
  browserType: BrowserType;
  scenario: Scenario;
  imageDir: PathLike;
  cssDir: PathLike;
  launchOption?: LaunchOptions;
  handlers: { [key in ActionName]: ActionHandler<key, BrowserType> };
};

async function getBrowser(
  opts
): Promise<BrowserEngine> {
  return puppeteer.launch(opts);
}

async function getPage(
  browser: BrowserEngine
): Promise<BrowserPage> {
  return (browser as puppeteer.Browser).newPage();
}

function convertUrl(url) {
  const splitUrl = url
    .replace(/\#.*$/, '')
    .replace(/\?.*$/, '')
    .replace('.css', '')
    .split('/')
    .filter(e => Boolean(e));
  return `${splitUrl[splitUrl.length - 1]}${url.match(/\?.*$/) ? url.match(/\?.*$/)[0] : ''}.css`;
}

function removeUnusedLines(fileCoverageMap, cssDir) {
  fileCoverageMap.forEach(fileCoverage => {
    const { fileName, coverage } = fileCoverage;
    new Promise(() => {
      fs.writeFile(`/${cssDir}/${fileName}`, coverage, err => {
        if (err) {
          return
        }
      });
    });
  });
}

const isNodeUnneeded = (node) => {
  if (["root", "decl"].includes(node.type)) {
    return false;
  }

  if (node.type === "atrule" && node.name === "font-face") {
    return false;
  }

  return true
};

const removeUnusedCSS = coverage => {
  let root
  const { text, ranges } = coverage
  const source = coverage.ranges.map((range, index) => {
    let code = '';
    const prevRange = ranges[index - 1];
    if (index === 0 && range.start > 0) {
      const comment = text
        .slice(0, range.start)
        .match(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm);
      const annotation = text.slice(0, range.start).match(/@.*?;/gm);

      if (annotation) {
        code = code + annotation[0] + '\n';
      }
      if (comment) {
        code = code + comment[0] + '\n';
      }
    }
    if (prevRange) {
      const comment = text
        .slice(prevRange.end, range.start)
        .match(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm);
      return comment
        ? code +
            comment[0] +
            '\n' +
            text.slice(range.start, range.end) +
            '\n'
        : code + text.slice(range.start, range.end) + '\n';
    } else {
      return code + text.slice(range.start, range.end) + '\n';
    }
  })
  .join('\n')

  try{
    root = postcss.parse(coverage.text);
    root.walk(node => {
      if (isNodeUnneeded(node)) {
        node.remove();
      }
    });
  } catch {
    return source
  }

  return root.toString() + source;
};

export async function run({
  browserType,
  scenario,
  handlers,
  imageDir,
  cssDir,
  launchOption
}: RunnerOptions) {
  const browser = await getBrowser(launchOption);

  const page = await getPage(browser);

  if (scenario.userAgent) {
    await page.setUserAgent(scenario.userAgent);
  }

  let context: Context = {
    info: {
      options: { browserType, scenario, imageDir, cssDir, launchOption, handlers, },
      name: scenario.name
    },
    currentIteration: 0,
    precondition: { steps: [] },
    iterations: [{ steps: [] }],
    postcondition: { steps: [] }
  };

  const errorHandler = async (ctx: Context) => {
    if (!ctx.error) {
      return;
    }
    const screenshotHandler = handlers.screenshot;
    await screenshotHandler(
      page,
      {
        action: {
          type: "screenshot",
          name: "error",
          fullPage: true
        }
      },
      {
        imageDir,
        browserType,
        context: ctx
      } as any
    );

    const dumpHandler = handlers.dump;
    await dumpHandler(page, { action: { type: "dump" } });
  };

  try {
    const precondition = scenario.precondition;
    await (page as puppeteer.Page).coverage.startCSSCoverage()
    if (precondition) {
      console.log("precondition start.");
      context = await handlePreCondition(page, handlers, precondition, {
        imageDir,
        context,
        browserType
      });
      await errorHandler(context);
      console.log("precondition done.");
    }

    console.log("main scenario start.");

    if (!context.error) {
      context = await handleIteration(page, handlers, scenario, {
        imageDir,
        context,
        browserType
      });

      await errorHandler(context);
    }
    console.log("main scenario end.");

    if (scenario.postcondition) {
      await handlePostCondition(page, handlers, scenario.postcondition, {
        imageDir,
        context,
        browserType
      });
    }
  } finally {
    const [cssCoverage] = await Promise.all([(page as puppeteer.Page).coverage.stopCSSCoverage()]);
    const fileCoverageMap = cssCoverage
      .filter(entry => entry.ranges.length > 0)
      .map(entry => {
        const { url } = entry;
        return {
          url,
          fileName: convertUrl(url),
          coverage: removeUnusedCSS(entry)
        };
      });
    removeUnusedLines(fileCoverageMap, cssDir);
    await browser.close();
  }
}

type ContextReducer = (ctx: Context, res: any) => Context;

export async function handlePreCondition<T extends BrowserType>(
  page: BrowserPage,
  handlers: { [key in ActionName]: ActionHandler<key, T> },
  condition: { url?: string; steps: Action[] },
  {
    imageDir,
    context,
    browserType
  }: { imageDir: PathLike; context: Context; browserType: T }
): Promise<Context> {
  if (condition.url) {
    await handlers.goto(page, {
      action: { type: "goto", url: condition.url }
    });
  }
  return handleAction(
    0,
    page,
    handlers,
    condition.steps,
    {
      imageDir,
      context,
      browserType
    },
    (ctx, res) => {
      return produce(ctx, draft => {
        draft.precondition.steps.push(res);
      });
    }
  );
}

export async function handlePostCondition<T extends BrowserType>(
  page: BrowserPage,
  handlers: { [key in ActionName]: ActionHandler<key, T> },
  condition: { url?: string; steps: Action[] },
  {
    imageDir,
    context,
    browserType
  }: { imageDir: PathLike; context: Context; browserType: T }
): Promise<Context> {
  if (condition.url) {
    await handlers.goto(page, {
      action: { type: "goto", url: condition.url }
    });
  }
  return handleAction(
    0,
    page,
    handlers,
    condition.steps,
    {
      imageDir,
      context,
      browserType
    },
    (ctx, res) => {
      return produce(ctx, draft => {
        draft.postcondition.steps.push(res);
      });
    }
  );
}

export async function handleIteration<T extends BrowserType>(
  page: BrowserPage,
  handlers: { [key in ActionName]: ActionHandler<key, T> },
  scenario: Scenario,
  {
    imageDir,
    browserType,
    context
  }: { imageDir: PathLike; browserType: T; context: Context }
): Promise<Context> {
  return reduce(
    Array.from({ length: 1 }),
    async (acc: Context, current: number, idx) => {
      await handlers.goto(page, {
        action: { type: "goto", url: scenario.url }
      });
      return handleAction(
        idx + 1,
        page,
        handlers,
        scenario.steps,
        {
          context: acc,
          imageDir,
          browserType
        },
        (ctx, res) => {
          return produce(ctx, draft => {
            if (!draft.iterations[idx]) {
              draft.iterations.push({ steps: [] });
            }
            draft.iterations[idx].steps.push(res);
          });
        }
      );
    },
    context
  );
}

export async function handleAction<T extends BrowserType>(
  iteration: number,
  page: BrowserPage,
  handlers: { [key in ActionName]: ActionHandler<key, T> },
  steps: Action[],
  {
    imageDir,
    browserType,
    context
  }: { imageDir: PathLike; browserType: T; context: Context },
  reducer: ContextReducer
): Promise<Context> {
  for (const step of steps) {
    const action = step.action;
    const handler = handlers[action.type] as ActionHandler<ActionName, BrowserType>;
    if (!handler) {
      throw new Error(`unknown action type: ${(action as any).type}`);
    }
    const res = await handler(page, { action } as any, {
      context: {
        ...context,
        currentIteration: iteration
      },
      imageDir,
      browserType
    }).catch(e => {
      return { error: e };
    });

    if (res.error) {
      return {
        ...context,
        ...res
      };
    }
    context = reducer(context, res);
  }
  return context;
}
