#!/usr/bin/env node

// tslint:disable-next-line
require("source-map-support").install();

import { default as cluster } from "cluster";
import { default as program } from "commander";
import { default as fs, PathLike } from "fs";
import { default as yaml } from "js-yaml";
import { default as path } from "path";
import { default as readdir } from "recursive-readdir";
import {
  ActionHandler,
  ActionName,
  BrowserType,
  ChromeHandler,
  run
} from "../main";
import { convert } from "../util";

import { default as d } from "debug";
const debug = d("pprunner");

import os from "os";
const numCPUs = os.cpus().length;

program
  .version("0.6.5")
  .option("-p, --path <caseDir>", "cases root dir")
  .option("-i, --image-dir <imgDir>", "screehshots dir")
  .option("-c, --css-dir <cssDir>", "optimize css dir")
  .option("-h, --disable-headless", "disable headless mode")
  .option("--puppeteer-args <puppeteerArgs>")
  .parse(process.argv);

process.on("unhandledRejection", err => {
  // tslint:disable-next-line
  console.error(err);
  process.exit(1);
});

type CliOptions = {
  parallel: number;
  path: string;
} & RunningOptions;

type RunningOptions = {
  puppeteerArgs: string[];
  imageDir: string;
  cssDir: string
  targetScenarios: string[];
  handlers: { [key in ActionName]: ActionHandler<key, BrowserType> };
  headlessFlag: boolean;
  browserType: BrowserType;
};

async function main(pg) {
  debug(pg);
  const { parallel, path: caseDir, ...options } = prepare(pg);

  if (cluster.isMaster) {
    const files = ((await readdir(
      path.resolve(process.cwd(), caseDir)
    )) as string[])
      .sort()
      .filter(f => {
        return f.endsWith("yaml") || f.endsWith("yml");
      });
    if (!parallel) {
      // single thread
      for (const f of files) {
        await pprun({ file: f, options });
      }
      return;
    }
    // multi thread
    const pNum = Math.max(numCPUs, parallel);
    for (let i = 0; i < pNum; i++) {
      cluster.fork();
    }
    const workerIds = Object.keys(cluster.workers);
    const workers = workerIds.map(id => cluster.workers[id]);

    let index = 0;
    let done = 0;
    workers.forEach(worker => {
      worker.on("message", message => {
        if (message === "done") {
          done++;
        }
        if (done === files.length) {
          // All files finished
          process.exit();
        }
        const file = files[index++];
        if (file) {
          worker.send({ file });
        }
      });
    });
    return;
  }
  // worker
  process.send("ready");
  process.on("message", async message => {
    await pprun({ file: message.file, options });
    process.send("done");
  });
}

async function pprun({
  file,
  options: {
    targetScenarios,
    handlers,
    imageDir,
    cssDir,
    headlessFlag,
    browserType,
    puppeteerArgs
  }
}: {
  file: PathLike;
  options: RunningOptions;
}) {
  const originalBuffer = fs.readFileSync(file);
  const originalYaml = originalBuffer.toString();
  const convertedYaml = convert(originalYaml);

  const doc = yaml.safeLoad(convertedYaml);
  if (doc.skip) {
    console.log(`${file} skip...`);
    return;
  }

  if (doc.onlyBrowser && !doc.onlyBrowser.includes(browserType)) {
    console.log(
      `this scenario only browser ${doc.onlyBrowser} ${file} skip...`
    );
    return;
  }

  if (!doc.name) {
    console.error(`scenario: ${file} must be set name prop`);
    return;
  }
  if (targetScenarios.length !== 0 && !targetScenarios.includes(doc.name)) {
    debug(`skip scenario ${file}`);
    return;
  }

  const args = ["--no-sandbox", "--disable-setuid-sandbox", ...puppeteerArgs];

  const launchOption = {
    args,
    headless: headlessFlag,
    ignoreHTTPSErrors: true,
    defaultViewport: doc.defaultViewport
  };

  await run({
    browserType,
    handlers,
    imageDir,
    cssDir,
    launchOption,
    scenario: doc
  });
}

function prepare(pg): CliOptions {
  const imageDir = path.resolve(process.cwd(), pg.imageDir);
  const cssDir = path.resolve(process.cwd(), pg.cssDir);

  const extensions = {};
  if (pg.extensionDir && pg.extensionDir !== "") {
    const extensionsDir = path.resolve(process.cwd(), pg.extensionDir);
    const filenames = fs.readdirSync(extensionsDir);

    filenames.forEach(f => {
      const mod = require(path.resolve(extensionsDir, f));
      if (!mod.name) {
        // tslint:disable-next-line
        console.error(`module: ${f} is invalid. required name`);
      }
      extensions[mod.name] = mod.handler;
    });
  }

  const targetScenarios =
    pg.target && pg.target !== "" ? pg.target.split(",") : [];

  const handlers = {
    ...getHandlers(pg.browser),
    ...extensions
  };

  const puppeteerArgs =
    pg.puppeteerArgs && pg.puppeteerArgs !== ""
      ? pg.puppeteerArgs.split(",")
      : [];

  return {
    browserType: pg.browser || "chrome",
    puppeteerArgs,
    handlers,
    headlessFlag: !pg.disableHeadless,
    imageDir,
    cssDir,
    parallel: pg.parallel,
    path: pg.path,
    targetScenarios
  };
}

function getHandlers(browser: BrowserType) {
  const handlers = ChromeHandler;

  return {
    clear: handlers.clearHandler,
    click: handlers.clickHandler,
    ensure: handlers.ensureHandler,
    goto: handlers.gotoHandler,
    input: handlers.inputHandler,
    radio: handlers.radioHandler,
    screenshot: handlers.screenshotHandler,
    select: handlers.selectHandler,
    wait: handlers.waitHandler,
    dump: handlers.dumpHandler,
    hover: handlers.hoverHandler,
    focus: handlers.focusHandler
  };
}

main(program);
