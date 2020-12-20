import * as vscode from 'vscode';
import * as path from 'path';
import * as XlfHighlighter from '../XlfHighlighter';
import * as assert from 'assert';
import { invalidXmlSearchExpression, translationTokenSearchExpression } from '../constants';

const testResourcesPath = '../../src/test/resources/highlights/';
let translationTokenXlfUri: vscode.Uri = vscode.Uri.file(path.resolve(__dirname, testResourcesPath, 'translationtokens.xlf'));
let invalidXlfUri: vscode.Uri = vscode.Uri.file(path.resolve(__dirname, testResourcesPath, 'invalid.xlf'));

suite("Xlf Highlighter", function () {

  test("Ranges TranslationToken", async function () {
    const document: vscode.TextDocument = await vscode.workspace.openTextDocument(translationTokenXlfUri);
    let ranges: vscode.Range[] = [];
    ranges = XlfHighlighter.getHighlightRanges(document, translationTokenSearchExpression, ranges);
    assert.equal(ranges.length, 6, 'unexpected number of ranges');
    assert.equal(ranges[5].start.line, 49, 'unexpected start line no.');
    assert.equal(ranges[5].end.character, 23, 'unexpected end char no.');
  });

  test("Ranges Invalid Xml", async function () {
    const document: vscode.TextDocument = await vscode.workspace.openTextDocument(invalidXlfUri);
    let ranges: vscode.Range[] = [];
    ranges = XlfHighlighter.getHighlightRanges(document, invalidXmlSearchExpression, ranges);
    assert.equal(ranges.length, 4, 'unexpected number of ranges');
    assert.equal(ranges[0].start.line, 9, 'unexpected start line no.');
    assert.equal(ranges[0].end.character, 41, 'unexpected end char no.');
  });

});
