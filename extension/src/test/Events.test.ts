import * as assert from "assert";
import * as path from "path";
import * as vscode from "vscode";
import { xliffCache } from "../Xliff/XLIFFCache";

// Delayed example from mochajs.org https://mochajs.org/#delayed-root-suite
const fn = async (x: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, 3000, 2 * x);
  });
};
(async function () {
  await fn(3);
  suite("Events Tests", async () => {
    const cachedFilePath = path.join(
      __dirname,
      "../../",
      "src/test/resources/XliffCacheTest.da-DK.xlf"
    );
    test("NABFunctions.onDidChangeTextDocument", async function () {
      this.timeout(5000);
      const expectedTargetContent = "Lionel Richie";
      const newText = `\n          <target>${expectedTargetContent}</target>`;
      const startPosition = new vscode.Position(8, 37);
      // Clear cache
      xliffCache.clear();
      assert.ok(xliffCache.size === 0, "Cache is not empty.");

      const editor = await vscode.window.showTextDocument(
        await vscode.workspace.openTextDocument(cachedFilePath),
        {
          preserveFocus: true,
          preview: false,
        }
      );
      await editor.edit((editBuilder) => {
        editBuilder.insert(startPosition, newText);
      });
      await editor.document.save();
      setTimeout(() => {
        if (editor.document.isDirty) {
          return;
        }
        assert.strictEqual(xliffCache.size, 1, "Expected 1 document in cache.");
        assert.ok(
          xliffCache.isCached(cachedFilePath),
          "Document is not in cache."
        );
        const cachedXliff = xliffCache.get(cachedFilePath);
        assert.ok(cachedXliff, "Document was not cached.");
        assert.strictEqual(
          cachedXliff.transunit[0].target.textContent,
          expectedTargetContent,
          "Cached Xliff was not updated."
        );
      }, 200);

      // Restore document
      editor.edit((editBuilder) => {
        editBuilder.delete(
          new vscode.Range(
            new vscode.Position(startPosition.line, 37),
            new vscode.Position(startPosition.line + 1, newText.length)
          )
        );
      });
      await editor.document.save();
      setTimeout(() => {
        if (editor.document.isDirty) {
          return;
        }
        assert.strictEqual(
          xliffCache.get(cachedFilePath).transunit[0].target.textContent,
          undefined,
          "Cache was not updated"
        );
      }, 200);

      // Clear cache
      xliffCache.clear();
    });
  });
  //run();
})();
