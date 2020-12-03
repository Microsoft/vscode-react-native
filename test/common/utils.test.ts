import * as assert from "assert";
import { stripJsonTrailingComma } from "../../src/common/utils";

suite("utilHelper", function () {
  suite("stripJsonTrailingComma", function () {
    test("should remove trailing comma from a JSON", (done: Mocha.Done) => {
      const strWithTrailingComma = `
            {
                "runtimeArgs": [
                    "--inspect-brk=9237",
                    "start",
                ],
                "runtimeVersion": "12.16.3",
                "port": 9237,
                "type": "node",
                "name": "some-project",
                "timeout": 300000
            }
            `;
      const strippedStr = `
            {
                "runtimeArgs": [
                    "--inspect-brk=9237",
                    "start"
                ],
                "runtimeVersion": "12.16.3",
                "port": 9237,
                "type": "node",
                "name": "some-project",
                "timeout": 300000
            }
            `;
      assert.strictEqual(
        stripJsonTrailingComma(strWithTrailingComma),
        strippedStr
      );
      done();
    });
    test("should manage string containings end of string trailing comma", (done: Mocha.Done) => {
      const strWithTrailingComma = `
            {
              "version": "0.2.0",
              "configurations": [
                {
                  "name": "Debug Android",
                  "cwd": "\${workspaceFolder\}",
                  "type": "reactnative",
                  "request": "launch",
                  "platform": "android",
                  "logCatArguments": ["ReactNative", "ReactNativeJS"],
                  "env": {
                    "testvar": "(value0), (value1), (value2)"
                  }
                }
              ]
            }
            `;
      const strippedStr = `
            {
              "version": "0.2.0",
              "configurations": [
                {
                  "name": "Debug Android",
                  "cwd": "\${workspaceFolder\}",
                  "type": "reactnative",
                  "request": "launch",
                  "platform": "android",
                  "logCatArguments": ["ReactNative", "ReactNativeJS"],
                  "env": {
                    "testvar": "(value0), (value1), (value2)"
                  }
                }
              ]
            }
            `;
      assert.strictEqual(
        stripJsonTrailingComma(strWithTrailingComma),
        strippedStr
      );
      done();
    });
  });
});
