import assert from "assert";
import { default as fs } from "fs";
import { default as path } from "path";
import { convert } from "../util";

const expectedConvertYaml = ({ hostUrl, userId, password }) => `skip: false
name: 'convert_test'
version: 1
url: '${hostUrl}/login'
iteration: 1
steps:
  - action:
      type: input
      form:
        selector: 'input[name="email"]'
        value: '${userId}'
  - action:
      type: input
      form:
        selector: 'input[name="password"]'
        value: '${password}'
  - action:
      type: click
      selector: 'button[type="submit"]'
  - action:
      type: wait
      duration: 1000
  - action:
      type: screenshot
      name: 'login_success'
`;

describe("utils convert functions test", () => {
  test("convert simple test", () => {
    const hostUrl = process.env.HOST_URL || "http://localhost:3000";
    const original = `{{ hostUrl }}`;
    const yaml = convert(original);
    assert.strictEqual(yaml, hostUrl);
  });
  test("convert file test", async () => {
    const hostUrl = process.env.HOST_URL || "http://localhost:3000";
    const userId = process.env.USER_ID || "test@example.com";
    const password = process.env.PASSWORD || "passw0rd";
    const f = path.resolve("samples/convert_test.yaml");
    const originalBuffer = fs.readFileSync(f);
    const originalYaml = originalBuffer.toString();
    const yaml = convert(originalYaml);
    assert.strictEqual(
      yaml,
      expectedConvertYaml({ hostUrl, userId, password })
    );
  });
});
