import * as assert from "assert";
import { anonymizePath } from "../Telemetry";

suite("Telemetry", function () {
  test.only("Anonymize paths", function () {
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
});
