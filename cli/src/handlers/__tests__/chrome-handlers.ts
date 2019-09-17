import * as assert from "power-assert";
import {
  clickHandler,
  ensureHandler,
  inputHandler,
  radioHandler,
  selectHandler,
  waitHandler
} from "../chrome-handlers";

describe("inputHandler", () => {
  test("input.value", done => {
    return inputHandler(
      {
        type: async (selector, value) => {
          assert.strictEqual(selector, "#test");
          assert.strictEqual(value, "test");
          done();
        },
        waitForSelector: async selector => {
          assert.strictEqual(selector, "#test");
        }
      } as any,
      {
        action: {
          form: {
            selector: "#test",
            value: "test"
          }
        }
      } as any
    );
  });
  test("input.value.faker", done => {
    return inputHandler(
      {
        type: async (selector, value) => {
          assert.strictEqual(selector, "#test");
          assert(value);
          done();
        },
        waitForSelector: async selector => {
          assert.strictEqual(selector, "#test");
        }
      } as any,
      {
        action: {
          form: {
            selector: "#test",
            value: {
              faker: "name.lastName"
            }
          }
        }
      } as any
    );
  });
  test("input.value.faker", done => {
    return inputHandler(
      {
        type: async (selector, value) => {
          assert.strictEqual(selector, "#test");
          assert(value);
          done();
        },
        waitForSelector: async selector => {
          assert.strictEqual(selector, "#test");
        }
      } as any,
      {
        action: {
          form: {
            selector: "#test",
            value: {
              faker: "name.lastName"
            }
          }
        }
      } as any
    );
  });
  test("input.value.date", done => {
    return inputHandler(
      {
        type: async (selector, value) => {
          assert.strictEqual(selector, "#test");
          assert(value);
          done();
        },
        waitForSelector: async selector => {
          assert.strictEqual(selector, "#test");
        }
      } as any,
      {
        action: {
          form: {
            selector: "#test",
            value: {
              date: "2016/01/02"
            }
          }
        }
      } as any
    );
  });
  test("input.constraint", done => {
    return inputHandler(
      {
        type: async (selector, value) => {
          assert.strictEqual(selector, "#test");
          assert.strictEqual(value, "test");
          done();
        },
        waitForSelector: async selector => {
          assert.strictEqual(selector, "#test");
        }
      } as any,
      {
        action: {
          form: {
            constrains: {
              regexp: /test/
            },
            selector: "#test"
          }
        }
      } as any
    );
  });
});

describe("waitHandler", () => {
  test("wait", done => {
    return waitHandler(
      {
        waitFor: async duration => {
          assert.strictEqual(duration, 100);
          done();
        }
      } as any,
      {
        action: {
          duration: 100
        }
      } as any
    );
  });
});

describe("clickHandler", () => {
  test("waitForSelector", done => {
    return clickHandler(
      {
        waitForSelector: async selector => {
          assert.strictEqual(selector, "#test");
        },
        tap: async selector => {
          assert.strictEqual(selector, "body");
        },
        $eval: async () => {
          done();
        }
      } as any,
      {
        action: {
          selector: "#test"
        }
      } as any
    );
  });
});

describe("radioHandler", () => {
  test("form.value", done => {
    return radioHandler(
      {
        $eval: async selectorWithValue => {
          assert.strictEqual(selectorWithValue, '#test[value="test"]');
          done();
        },
        waitForSelector: async selector => {
          assert.strictEqual(selector, "#test");
        }
      } as any,
      {
        action: {
          form: {
            selector: "#test",
            value: "test"
          }
        }
      } as any
    );
  });
});

describe("selectHandler", () => {
  test("constrains.values(length=1)", done => {
    return selectHandler(
      {
        select: async () => {
          done();
        },
        evaluate: async (fn, selector) => {
          assert.strictEqual(selector, "#test");
        },
        waitForSelector: async selector => {
          assert.strictEqual(selector, "#test");
        }
      } as any,
      {
        action: {
          form: {
            selector: "#test"
          }
        }
      } as any
    );
  });
  test("constrains.values(length=2)", done => {
    return selectHandler(
      {
        select: async (selector, value) => {
          assert.strictEqual(selector, "#test");
          assert(value);
          done();
        },
        waitForSelector: async selector => {
          assert.strictEqual(selector, "#test");
        }
      } as any,
      {
        action: {
          form: {
            constrains: {
              values: [1, 2]
            },
            selector: "#test"
          }
        }
      } as any
    );
  });
});

describe("ensureHandler", () => {
  test("location.value", () => {
    return ensureHandler(
      {
        url: async () => "http://test.com"
      } as any,
      {
        action: {
          location: {
            value: "http://test.com"
          }
        }
      } as any
    );
  });
  test("location.regexp", () => {
    return ensureHandler(
      {
        url: async () => "http://test.com/109"
      } as any,
      {
        action: {
          location: {
            regexp: /http:\/\/test.com\/[0-9]+/
          }
        }
      } as any
    );
  });
});
