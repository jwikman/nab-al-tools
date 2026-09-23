import * as assert from "assert";
import * as path from "path";
import { anonymizeException, anonymizePath } from "../Telemetry/Telemetry";

suite("Telemetry", function () {
  test("Anonymize paths", function () {
    assert.strictEqual(
      anonymizePath("c:\\users\\user.name\\.vscode\\whatever\\path\\file.js"),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
    assert.strictEqual(
      anonymizePath("c:\\users\\user name\\.vscode\\whatever\\path\\file.js"),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
    assert.strictEqual(
      anonymizePath("c:\\users\\user-name\\.vscode\\whatever\\path\\file.js"),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
    assert.strictEqual(
      anonymizePath("c:\\users\\username\\.vscode\\whatever\\path\\file.js"),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
    assert.strictEqual(
      anonymizePath("c:\\users\\Ûsèr.nàmÈ\\.vscode\\whatever\\path\\file.js"),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
    assert.strictEqual(
      anonymizePath(
        "c:\\users\\Ìsür.nÄÅÖåäöme\\.vscode\\whatever\\path\\file.js"
      ),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
  });

  test("anonymizeException anonymizes message and stack without mutating original", function () {
    const original = new Error(
      "Failed reading c:\\users\\user.name\\.vscode\\ext\\file.js"
    );
    original.name = "CustomError";
    original.stack =
      "CustomError: boom\n    at fn (c:\\users\\user.name\\.vscode\\ext\\file.js:10:5)";
    const originalMessage = original.message;
    const originalStack = original.stack;

    const result = anonymizeException(original);

    assert.strictEqual(
      result.message,
      "Failed reading %user%\\.vscode\\ext\\file.js",
      "Message paths should be anonymized"
    );
    assert.strictEqual(result.name, "CustomError", "Name should be preserved");
    assert.ok(
      result.stack?.includes("%user%\\.vscode\\ext\\file.js") &&
        !result.stack?.includes("user.name"),
      "Stack paths should be anonymized"
    );
    assert.strictEqual(
      original.message,
      originalMessage,
      "Original message must not be mutated"
    );
    assert.strictEqual(
      original.stack,
      originalStack,
      "Original stack must not be mutated"
    );
  });

  test("anonymizeException handles missing stack", function () {
    const original = new Error("no path here");
    original.stack = undefined;
    const result = anonymizeException(original);
    assert.strictEqual(result.message, "no path here");
    assert.strictEqual(result.stack, undefined);
  });

  test("applicationinsights runtime dependencies are bundled, not externalized", function () {
    // applicationinsights v3 eagerly loads these OpenTelemetry modules. If they
    // are declared as webpack externals they must be resolvable at runtime, but
    // the packaged VSIX ships no node_modules, so externalizing them crashes
    // extension activation with "Cannot find module". They must be bundled.
    // Regression guard for the activation failure caused by the appinsights v3 upgrade.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpackConfig = require(path.resolve(
      __dirname,
      "../../webpack.config.js"
    ));
    const externals = Object.keys(webpackConfig.externals ?? {});
    const mustBeBundled = [
      "@opentelemetry/instrumentation",
      "@azure/opentelemetry-instrumentation-azure-sdk",
    ];
    for (const moduleName of mustBeBundled) {
      assert.ok(
        !externals.includes(moduleName),
        `"${moduleName}" must not be a webpack external; it must be bundled ` +
          `since the packaged extension ships no node_modules.`
      );
    }
  });
});
