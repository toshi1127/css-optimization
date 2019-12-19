// ここにActionを追加する

import { PathLike } from "fs";
import { default as puppeteer } from "puppeteer";
import { ActionName, ActionType, RunnerOptions } from "./main";

export type Context = {
  info: {
    name: string;
    options: RunnerOptions;
  };
  currentIteration: number;
  precondition: {
    steps: Array<{}>;
  };
  iterations: Array<{
    steps: Array<{}>;
  }>;
  postcondition: {
    steps: Array<{}>;
  };
  error?: Error;
};

export type BrowserType = "chrome" | "firefox";

export type BrowserEngine = puppeteer.Browser;

export type BrowserPage = puppeteer.Page;

export type ActionHandler<T extends ActionName, E extends BrowserType> = (
  page: BrowserPage,
  action: ActionType<T>,
  options?: { imageDir: PathLike; browserType: E; context: Context }
) => Promise<any>;

export type Scenario = {
  skip?: boolean;
  name: string;
  iteration: number;
  url: string;
  coverage?: boolean;
  precondition?: PreCondition;
  steps: Action[];
  postcondition?: PostCondition;
  userAgent?: string;
};

export type PreCondition = {
  url: string;
  steps: Action[];
};

export type PostCondition = {
  steps: Action[];
};

export type Action =
  | InputAction
  | ClickAction
  | SelectAction
  | WaitAction
  | EnsureAction
  | RadioAction
  | ScreenshotAction
  | GotoAction
  | ClearAction
  | DumpAction;

type Value =
  | string
  | {
      faker: string;
    }
  | {
      date: string;
    };

export type ActionName =
  | "input"
  | "click"
  | "select"
  | "hover"
  | "wait"
  | "ensure"
  | "radio"
  | "screenshot"
  | "goto"
  | "clear"
  | "dump";
  // | "coverage.stopCSSCoverage"
  // | "coverage.startCSSCoverage";

export type ActionType<T extends ActionName> = T extends "input"
  ? InputAction
  : T extends "click"
  ? ClickAction
  : T extends "select"
  ? SelectAction
  : T extends "wait"
  ? WaitAction
  : T extends "ensure"
  ? EnsureAction
  : T extends "radio"
  ? RadioAction
  : T extends "screenshot"
  ? ScreenshotAction
  : T extends "goto"
  ? GotoAction
  : T extends "clear"
  ? ClearAction
  : T extends "dump"
  ? DumpAction
  : T extends "focus"
  ? FocusAction
  : T extends "hover"
  ? HoverAction
  : never;

type Constrains = {
  required: boolean;
  regexp: string;
};

type ActionMeta = {
  name?: string;
  tag?: string;
};

export type InputAction = {
  action: {
    meta?: ActionMeta;
    type: "input";
    form: {
      selector: string;
      constrains?: Constrains;
      value?: Value;
    };
  };
};

export type ClickAction = {
  action: {
    meta?: ActionMeta;
    type: "click";
    selector: string;
    navigation: boolean;
    avoidClear: boolean;
    emulateMouse: boolean;
  };
};

export type SelectAction = {
  action: {
    meta?: ActionMeta;
    type: "select";
    form: {
      selector: string;
      constrains: {
        required: boolean;
        values: Value[];
      };
    };
  };
};

export type WaitAction = {
  action: {
    meta?: ActionMeta;
    name?: string;
    type: "wait";
    duration: number;
  };
};

export type ScreenshotAction = {
  action: {
    meta?: ActionMeta;
    type: "screenshot";
    name: string;
    fullPage?: boolean;
  };
};

export type EnsureAction = {
  action: {
    meta?: ActionMeta;
    name?: string;
    type: "ensure";
    location: {
      regexp?: string;
      value?: string;
    };
  };
};

export type RadioAction = {
  action: {
    meta?: ActionMeta;
    type: "radio";
    form: {
      selector: string;
      constrains?: {
        required: boolean;
      };
      value: string;
    };
  };
};

export type GotoAction = {
  action: {
    meta?: ActionMeta;
    type: "goto";
    url: string;
  };
};

export type ClearAction = {
  action: {
    meta?: ActionMeta;
    type: "clear";
    selector: string;
  };
};

export type DumpAction = {
  action: {
    meta?: ActionMeta;
    type: "dump";
  };
};

export type HoverAction = {
  action: {
    meta?: ActionMeta;
    type: "hover";
    selector: string;
  }
}

export type FocusAction = {
  action: {
    meta?: ActionMeta;
    type: "focus";
    selector: string;
  }
}
