import * as assert from "assert";
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
});
