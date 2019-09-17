import { default as produce } from "immer";
import * as assert from "power-assert";
import { handleAction, handlePreCondition, handleIteration } from "../run";

const handlers = {
  action1: async (page, action, { context }) => {
    assert.deepStrictEqual(context, {
      currentIteration: 0,
      iterations: [{ steps: [] }]
    });
    return { value: "action1" };
  },
  action2: async (page, action, { context }) => {
    assert.deepStrictEqual(context, {
      currentIteration: 0,
      iterations: [{ steps: [{ value: "action1" }] }]
    });
    return { value: "action2" };
  },
  action3: async (page, action, { context }) => {
    assert.deepStrictEqual(context, {
      currentIteration: 0,
      iterations: [{ steps: [{ value: "action1" }, { value: "action2" }] }]
    });
    return { value: "action3" };
  },
  goto: async () => ({})
};

describe("handleAction", () => {
  test("reduce context", async () => {
    const result = await handleAction(
      0,
      {} as any,
      handlers as any,
      [
        { action: { type: "action1" } },
        { action: { type: "action2" } },
        { action: { type: "action3" } }
      ] as any,
      {
        context: {
          currentIteration: 0,
          iterations: [{ steps: [] }]
        }
      } as any,
      (ctx, res) => {
        return produce(ctx, draft => {
          draft.iterations[0].steps.push(res);
        });
      }
    );

    assert.deepStrictEqual(result, {
      currentIteration: 0,
      iterations: [
        {
          steps: [
            { value: "action1" },
            { value: "action2" },
            { value: "action3" }
          ]
        }
      ]
    });
  });
});

describe("handlePreCondition", () => {
  test("reduce precondition context", async () => {
    const result = await handlePreCondition(
      {} as any,
      {
        action1: async (page, action, { context }) => {
          return { value: "action1" };
        },
        action2: async (page, action, { context }) => {
          return { value: "action2" };
        },
        action3: async (page, action, { context }) => {
          return { value: "action3" };
        },
        goto: async () => ({})
      } as any,
      {
        steps: [
          { action: { type: "action1" } },
          { action: { type: "action2" } },
          { action: { type: "action3" } }
        ]
      } as any,
      { context: { precondition: { steps: [] } } } as any
    );

    assert.deepStrictEqual(result, {
      precondition: {
        steps: [
          { value: "action1" },
          { value: "action2" },
          { value: "action3" }
        ]
      }
    });
  });
});

describe("handleIteration", () => {
  test("reduce iterate context", async () => {
    const result = await handleIteration(
      {} as any,
      {
        action1: async (page, action, { context }) => {
          return { value: "action1" };
        },
        action2: async (page, action, { context }) => {
          return { value: "action2" };
        },
        goto: async () => ({})
      } as any,
      {
        iteration: 2,
        steps: [
          { action: { type: "action1" } },
          { action: { type: "action2" } }
        ]
      } as any,
      { context: { iterations: [{ steps: [] }] } } as any
    );

    assert.deepStrictEqual(result, {
      iterations: [
        {
          steps: [{ value: "action1" }, { value: "action2" }]
        },
        {
          steps: [{ value: "action1" }, { value: "action2" }]
        }
      ]
    });
  });
});
