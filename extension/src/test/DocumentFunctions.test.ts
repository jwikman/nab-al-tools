import * as assert from "assert";
import { resolve } from "path";
import * as vscode from "vscode";
import * as DocumentFunctions from "../DocumentFunctions";
import * as LanguageFunctions from "../LanguageFunctions";
import * as SettingsLoader from "../Settings/SettingsLoader";

suite("DocumentFunctions", function () {
  test("openTextFileWithSelection()", async function () {
    this.timeout(5000);

    await assert.doesNotReject(async () => {
      await DocumentFunctions.openTextFileWithSelection(__filename, 0, 34);
    }, "Unexpected rejection of promise");
  });

  test("openTextFileWithSelectionOnLineNo", async function () {
    await assert.doesNotReject(async () => {
      await DocumentFunctions.openTextFileWithSelectionOnLineNo(__filename, 0);
    }, "Unexpected rejection of promise");
  });

  test("find field definition if caption property is missing", async function () {
    const textToFind =
      "Table NAB ToolTip - Field Field No Caption - Property Caption";
    const document = await vscode.workspace.openTextDocument(
      resolve(__dirname, "../../../test-app/Xliff-test/Translations/Al.g.xlf")
    );
    const textEditor = await vscode.window.showTextDocument(document);
    const docText = document.getText();
    const foundAtCharInSingleString = docText.search(textToFind);
    const docTextSubstring = docText.substring(0, foundAtCharInSingleString);
    const foundAtLineNo =
      docTextSubstring.length - docTextSubstring.replace(/\n/g, "").length;
    const pos = new vscode.Position(foundAtLineNo, 0);
    textEditor.selection = new vscode.Selection(pos, pos);

    const tokens = await LanguageFunctions.getCurrentXlfData();
    const location = await DocumentFunctions.openAlFileFromXliffTokens(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest(),
      tokens
    );

    assert.strictEqual(
      true,
      location.uri.path.endsWith("ToolTip.Table.al"),
      "TransUnit should be found"
    );
    const selectedLine = (await vscode.workspace.openTextDocument(location.uri))
      .lineAt(location.range.start.line)
      .text.trim();

    assert.strictEqual(
      'field(13; "Field No Caption"; Decimal)',
      selectedLine,
      "Field should be selected as the caption property is missing"
    );
  }).timeout(0);
});
