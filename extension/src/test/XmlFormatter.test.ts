import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

import { Xliff, } from '../XLIFFDocument';
import { XmlFormattingOptionsFactory, ClassicXmlFormatter } from '../XmlFormatter';
import { getSmallXliffXml } from './XLIFFTypes.test';

const testResourcesPath = '../../src/test/resources/';

suite("XML Formatting", function () {

    test("Format Xliff Document", function () {
        const replaceSelfClosingTags = false;
        const sourceXml = getSmallXliffXml();
        const outXml = Xliff.fromString(getSmallXliffXml()).toString(replaceSelfClosingTags);
        assert.equal(outXml.length, sourceXml.length, 'Formatted string length does match string length of source.');
        assert.equal(outXml, sourceXml, 'Formatted string does match source.');
    });

    test("Minify Xml", function () {
        let xmlFormatter = new ClassicXmlFormatter();
        let formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();
        const xml = getSmallXliffXml();
        const minifiedXml = xmlFormatter.minifyXml(xml, formattingOptions);
        assert.ok(minifiedXml);
        assert.equal(minifiedXml.split(formattingOptions.newLine).length, 3, 'Whoops! Minified XML contains to many line breaks');
    });

    test("Leading newline is removed", function () {
        const crlfFilename = 'NAB_AL_Tools.sv-SE.xlf';
        let inFile: vscode.Uri = vscode.Uri.file(path.resolve(__dirname, testResourcesPath, crlfFilename));
        let xlfDoc = Xliff.fromFileSync(inFile.fsPath, 'UTF8');
        assert.equal(xlfDoc.toString()[0], '<', 'Unexpected charater on index 0');
    });
});