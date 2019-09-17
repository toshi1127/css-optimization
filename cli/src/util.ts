import { default as Handlebars } from "handlebars";
import { BrowserType } from "./types";

export function convert(yaml: string): string {
  const data = {
    hostUrl: process.env.HOST_URL || "http://localhost:3000",
    password: process.env.PASSWORD || "passw0rd",
    userId: process.env.USER_ID || "test@example.com"
  };
  registerEnvHelper(Handlebars);
  const template = Handlebars.compile(yaml);
  const converted = template(data);
  return converted;
}

export function isPuppeteer(browser: any): boolean {
  return browser.newPage !== undefined;
}

function registerEnvHelper(handlebars) {
  handlebars.registerHelper("env", (envName, options) => {
    if (process.env[envName] && process.env[envName] !== "") {
      return process.env[envName];
    }

    return options.hash.default;
  });
}
