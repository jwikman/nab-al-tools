import * as assert from "assert";
import * as vscode from "vscode";
import * as DocumentFunctions from "../DocumentFunctions";

suite("DocumentFunctions", function () {
  test("openTextFileWithSelectionOnLineNo", function () {
    assert.ok(
      DocumentFunctions.openTextFileWithSelectionOnLineNo("", 0),
      "Failed to open text file with selection"
    );
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