import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";
import { xliffCache } from "../Xliff/XLIFFCache";

suite("Events Tests", () => {
  const cachedFilePath = path.join(
    __dirname,
    "../../",
    "src/test/resources/XliffCacheTest.da-DK.xlf"
  );
  test("NABFunctions.onDidChangeTextDocument", async function () {
    const expectedTargetContent = "Lionel Richie";
    const newText = `\n          <target>${expectedTargetContent}</target>`;
    const startPosition = new vscode.Position(8, 37);
    // Clear cache
    xliffCache.clear();
    assert.ok(xliffCache.size === 0, "Cache is not empty.");
    const textDocument = await vscode.workspace.openTextDocument(
      cachedFilePath
    );
    const editor = await vscode.window.showTextDocument(textDocument);
    editor.edit((editBuilder) => {
      editBuilder.insert(startPosition, newText);
    });
    await textDocument.save();
    const cachedXliff = xliffCache.get(cachedFilePath);
    assert.strictEqual(xliffCache.size, 1, "Expected 1 document in cache.");
    assert.ok(cachedXliff, "Document was not cached.");
    assert.strictEqual(
      cachedXliff.transunit[0].target.textContent,
      expectedTargetContent,
      "Cached Xliff was not updated."
    );
    // Clear cache
    xliffCache.clear();

    // Restore document
    editor.edit((editBuilder) => {
      editBuilder.delete(
        new vscode.Range(
          new vscode.Position(startPosition.line, 37),
          new vscode.Position(startPosition.line + 1, newText.length)
        )
      );
    });
    await textDocument.save();
  });
});
