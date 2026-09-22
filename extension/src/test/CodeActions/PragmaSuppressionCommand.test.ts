import * as vscode from "vscode";
import * as assert from "assert";
import * as fs from "graceful-fs";
import * as os from "os";
import * as path from "path";
import { saveEditedDocuments } from "../../CodeActions/PragmaSuppressionCommand";

suite("PragmaSuppressionCommand", function () {
  suite("saveEditedDocuments", function () {
    let tempFilePath: string;

    setup(function () {
      tempFilePath = path.join(
        os.tmpdir(),
        `nab-al-tools-pragma-suppression-${Date.now()}.al`
      );
      fs.writeFileSync(tempFilePath, "procedure Foo()\nend;\n");
    });

    teardown(function () {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    });

    test("saves documents touched by the edit", async function () {
      const uri = vscode.Uri.file(tempFilePath);
      const document = await vscode.workspace.openTextDocument(uri);

      const edit = new vscode.WorkspaceEdit();
      edit.insert(uri, new vscode.Position(0, 0), "// inserted\n");
      const applied = await vscode.workspace.applyEdit(edit);
      assert.strictEqual(applied, true, "expected the edit to apply");
      assert.strictEqual(
        document.isDirty,
        true,
        "expected document to be dirty after applyEdit"
      );

      await saveEditedDocuments(edit);

      assert.strictEqual(
        document.isDirty,
        false,
        "expected document to be saved (not dirty)"
      );
      const contentOnDisk = fs.readFileSync(tempFilePath, "utf-8");
      assert.strictEqual(contentOnDisk, "// inserted\nprocedure Foo()\nend;\n");
    });

    test("does nothing for documents that are not dirty", async function () {
      const uri = vscode.Uri.file(tempFilePath);
      await vscode.workspace.openTextDocument(uri);

      const edit = new vscode.WorkspaceEdit();
      // No edits added; entries() will be empty, nothing to save.
      await saveEditedDocuments(edit);

      const contentOnDisk = fs.readFileSync(tempFilePath, "utf-8");
      assert.strictEqual(contentOnDisk, "procedure Foo()\nend;\n");
    });
  });
});
