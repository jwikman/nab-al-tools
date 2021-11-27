import * as assert from "assert";
import * as vscode from "vscode";
import * as DocumentFunctions from "../DocumentFunctions";

suite("DocumentFunctions", function () {
  test("openTextFileWithSelectionOnLineNo", async function () {
    await assert.doesNotReject(async () => {
      await DocumentFunctions.openTextFileWithSelectionOnLineNo(
        `${__filename}`,
        0
      );
    }, "Unexpected rejection of promise");
  });

  test("eolToLineEnding", function () {
    assert.strictEqual(
      DocumentFunctions.eolToLineEnding(vscode.EndOfLine.CRLF),
      "\r\n",
      "Incorrect EOL returned."
    );
    assert.strictEqual(
      DocumentFunctions.eolToLineEnding(vscode.EndOfLine.LF),
      "\n",
      "Incorrect EOL returned."
    );
  });
});
