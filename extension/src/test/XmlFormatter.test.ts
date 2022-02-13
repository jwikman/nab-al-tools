import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";

import { Xliff } from "../Xliff/XLIFFDocument";
import {
  XmlFormattingOptionsFactory,
  ClassicXmlFormatter,
} from "../XmlFormatter";
import { getSmallXliffXml } from "./XLIFFTypes.test";

const testResourcesPath = "../../src/test/resources/";

suite("XML Formatting", function () {
  test("Format Xliff Document", function () {
    const replaceSelfClosingTags = false;
    const sourceXml = getSmallXliffXml();
    const outXml = Xliff.fromString(getSmallXliffXml()).toString(
      replaceSelfClosingTags
    );
    assert.strictEqual(
      outXml.length,
      sourceXml.length,
      "Formatted string length does match string length of source."
    );
    assert.strictEqual(
      outXml,
      sourceXml,
      "Formatted string does match source."
    );
  });

  test("Minify Xml", function () {
    const xmlFormatter = new ClassicXmlFormatter();
    const formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();
    const xml = getSmallXliffXml();
    const minifiedXml = xmlFormatter.minifyXml(xml, formattingOptions);
    assert.ok(minifiedXml);
    assert.strictEqual(
      minifiedXml.split(formattingOptions.newLine).length,
      3,
      "Whoops! Minified XML contains to many line breaks"
    );
  });

  test("Leading newline is removed", function () {
    const crlfFilename = "NAB_AL_Tools.sv-SE.xlf";
    const inFile: vscode.Uri = vscode.Uri.file(
      path.resolve(__dirname, testResourcesPath, crlfFilename)
    );
    const xlfDoc = Xliff.fromFileSync(inFile.fsPath, "UTF8");
    assert.strictEqual(
      xlfDoc.toString()[0],
      "<",
      "Unexpected character on index 0"
    );
  });

  test("XmlFormattingOptionsFactory", function () {
    const formattingOptions = XmlFormattingOptionsFactory.getXmlFormattingOptions();
    assert.strictEqual(
      formattingOptions.enforcePrettySelfClosingTagOnFormat,
      true,
      "Static option 'enforcePrettySelfClosingTagOnFormat' changed."
    );
    assert.strictEqual(
      formattingOptions.newLine,
      "\r\n",
      "Static option 'newLine' changed."
    );
    assert.strictEqual(
      formattingOptions.removeCommentsOnMinify,
      true,
      "Static option 'removeCommentsOnMinify' changed."
    );
    assert.strictEqual(
      formattingOptions.splitAttributesOnFormat,
      false,
      "Static option 'splitAttributesOnFormat' changed."
    );
    assert.strictEqual(
      formattingOptions.splitXmlnsOnFormat,
      false,
      "Static option 'splitXmlnsOnFormat' changed."
    );
    assert.strictEqual(
      formattingOptions.initialIndentLevel,
      0,
      "Static option 'initialIndentLevel' changed."
    );
    assert.strictEqual(
      formattingOptions.tabSize,
      4,
      "Static option 'tabSize' changed."
    );
    assert.strictEqual(
      formattingOptions.preferSpaces,
      true,
      "Static option 'preferSpaces' changed."
    );
    assert.strictEqual(
      formattingOptions.keepInsignificantWhitespaceOnMinify,
      false,
      "Static option 'keepInsignificantWhitespaceOnMinify' changed."
    );
  });
});
