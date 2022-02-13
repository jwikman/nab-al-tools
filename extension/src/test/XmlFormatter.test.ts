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
});
