import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";
import { xliffCache } from "../Xliff/XLIFFCache";

suite("Events Tests", () => {
  const cachedFilePath = path.join(
    __dirname,
    "../../",
    "src/test/resources/NAB_AL_Tools.da-DK.xlf"
  );
  test("NABFunctions.onDidChangeTextDocument", async function () {
    assert.ok(xliffCache.size === 0, "Cache is not empty.");
    const textDocument = await vscode.workspace.openTextDocument(
      cachedFilePath
    );
    const editor = await vscode.window.showTextDocument(textDocument);
    editor.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(0, 0), "    ");
    });
    await textDocument.save();
    assert.ok(xliffCache.get(cachedFilePath), "Document was not cached.");
    assert.strictEqual(xliffCache.size, 1, "Expected 1 document in cache.");

    // Restore document
    editor.edit((editBuilder) => {
      editBuilder.delete(
        new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 4))
      );
    });
    await textDocument.save();
  });
});
