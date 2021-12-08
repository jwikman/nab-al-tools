import * as vscode from "vscode";
import * as path from "path";
import * as XlfHighlighter from "../XlfHighlighter";
import * as assert from "assert";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import {
  invalidXmlSearchExpression,
  translationTokenSearchExpression,
} from "../constants";
import * as SettingsLoader from "../Settings/SettingsLoader";
import { TranslationMode } from "../Enums";
import * as XliffFunctions from "../XliffFunctions";

const testResourcesPath = "../../src/test/resources/highlights/";
const translationTokenXlfUri: vscode.Uri = vscode.Uri.file(
  path.resolve(__dirname, testResourcesPath, "translationtokens.xlf")
);
const invalidXlfUri: vscode.Uri = vscode.Uri.file(
  path.resolve(__dirname, testResourcesPath, "invalid.xlf")
);

suite("Xlf Highlighter", function () {
  test("Ranges TranslationToken", async function () {
    const document: vscode.TextDocument = await vscode.workspace.openTextDocument(
      translationTokenXlfUri
    );
    let ranges: vscode.Range[] = [];
    ranges = XlfHighlighter.getHighlightRanges(
      document,
      translationTokenSearchExpression,
      ranges
    );
    assert.equal(ranges.length, 6, "unexpected number of ranges");
    assert.equal(ranges[5].start.line, 49, "unexpected start line no.");
    assert.equal(ranges[5].end.character, 23, "unexpected end char no.");
  });

  test("Ranges Invalid Xml", async function () {
    const document: vscode.TextDocument = await vscode.workspace.openTextDocument(
      invalidXlfUri
    );
    let ranges: vscode.Range[] = [];
    ranges = XlfHighlighter.getHighlightRanges(
      document,
      invalidXmlSearchExpression,
      ranges
    );
    assert.equal(ranges.length, 4, "unexpected number of ranges");
    assert.equal(ranges[0].start.line, 9, "unexpected start line no.");
    assert.equal(ranges[0].end.character, 41, "unexpected end char no.");
  });

  test("Refresh with Invalid Xml", async function () {
    const gXlfUri = path.resolve(__dirname, testResourcesPath, "invalid.g.xlf");
    const langFilesUri: string[] = [
      path.resolve(__dirname, testResourcesPath, "invalid.xlf"),
    ];
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionsSettings.translationMode = TranslationMode.nabTags;

    await assert.rejects(
      async () => {
        await XliffFunctions._refreshXlfFilesFromGXlf({
          gXlfFilePath: gXlfUri,
          langFiles: langFilesUri,
          languageFunctionsSettings,
          sortOnly: false,
        });
      },
      (err) => {
        assert.strictEqual(err.name, "Error");
        assert.strictEqual(err.message, "The xml in invalid.xlf is invalid.");
        return true;
      }
    );
  });
});
