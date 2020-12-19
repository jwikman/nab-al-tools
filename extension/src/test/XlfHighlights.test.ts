import * as vscode from 'vscode';
import * as path from 'path';
import * as XlfHighlighter from '../XlfHighlighter';
import * as assert from 'assert';

const testResourcesPath = '../../src/test/resources/highlights/';
let translationTokenXlfUri: vscode.Uri = vscode.Uri.file(path.resolve(__dirname, testResourcesPath, 'translationtokens.xlf'));

suite("Xlf Highlights", function () {

  test("Ranges TranslationToken", async function () {
    let document: vscode.TextDocument = await vscode.workspace.openTextDocument(translationTokenXlfUri);
    const ranges = XlfHighlighter.getHighlightRanges(document, XlfHighlighter.translationTokenSearchExpression);
    assert.equal(ranges.length, 6, 'unexpected number of ranges');
    assert.equal(ranges[5].start.line, 49, 'unexpected start line no.')
    assert.equal(ranges[5].end.character, 23, 'unexpected end char no.')
  });

});
