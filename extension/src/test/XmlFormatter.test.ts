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

  test("Space is preserved", function () {
    const xlfDoc = Xliff.fromString(langXliffXml());
    const transformedXlfDoc = Xliff.fromString(xlfDoc.toString());
    assert.deepStrictEqual(
      transformedXlfDoc,
      xlfDoc,
      "Transformed Xliff does not match original Xliff."
    );
  });

  test("Multiple spaces in text content are preserved", function () {
    const xmlFormatter = new ClassicXmlFormatter();
    const formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();

    const xmlWithMultipleSpaces =
      '<note from="Developer" priority="2">%1="Function Setup".TableCaption;           %2="Function Setup".Id;</note>';

    const minified = xmlFormatter.minifyXml(
      xmlWithMultipleSpaces,
      formattingOptions
    );

    assert.ok(
      minified.includes(";           %2="),
      "Multiple spaces in text content should be preserved"
    );
    assert.strictEqual(
      minified,
      xmlWithMultipleSpaces,
      "Text content with multiple spaces should remain unchanged"
    );
  });

  test("Tag attribute spacing is normalized while preserving text content", function () {
    const xmlFormatter = new ClassicXmlFormatter();
    const formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();

    const xmlWithExtraSpacing =
      '<tag   attr1="val1"    attr2="val2"   >Text with    multiple   spaces</tag>';

    const expected =
      '<tag attr1="val1" attr2="val2">Text with    multiple   spaces</tag>';

    const minified = xmlFormatter.minifyXml(
      xmlWithExtraSpacing,
      formattingOptions
    );

    assert.strictEqual(
      minified,
      expected,
      "Tag attributes should be normalized while text content spaces are preserved"
    );
  });

  test("Self-closing tag spacing is normalized", function () {
    const xmlFormatter = new ClassicXmlFormatter();
    const formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();

    const xmlWithExtraSpacing = '<tag   attr1="val1"    attr2="val2"   />';
    const expected = '<tag attr1="val1" attr2="val2" />';

    const minified = xmlFormatter.minifyXml(
      xmlWithExtraSpacing,
      formattingOptions
    );

    assert.strictEqual(
      minified,
      expected,
      "Self-closing tag attributes should be normalized"
    );
  });

  test("Complex nested tags with mixed spacing", function () {
    const xmlFormatter = new ClassicXmlFormatter();
    const formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();

    const complexXml =
      '<outer   attr="value"   ><inner    attr1="val1"   attr2="val2">Text with    multiple   spaces</inner></outer>';

    const expected =
      '<outer attr="value"><inner attr1="val1" attr2="val2">Text with    multiple   spaces</inner></outer>';

    const minified = xmlFormatter.minifyXml(complexXml, formattingOptions);

    assert.strictEqual(
      minified,
      expected,
      "Nested tags should have normalized attributes while preserving text content"
    );
  });

  test("XLIFF-like structure preserves developer note spacing", function () {
    const xmlFormatter = new ClassicXmlFormatter();
    const formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();

    const xliffLike = `<trans-unit   id="test"   translate="yes">
  <source>Source text</source>
  <target   state="final">Target text</target>
  <note   from="Developer"   priority="2">%1="Test";     %2="Test2"; Comments with    spaces</note>
</trans-unit>`;

    const minified = xmlFormatter.minifyXml(xliffLike, formattingOptions);

    // Check that tag attributes are normalized
    assert.ok(
      minified.includes('<trans-unit id="test" translate="yes">'),
      "trans-unit attributes should be normalized"
    );
    assert.ok(
      minified.includes('<target state="final">'),
      "target attributes should be normalized"
    );
    assert.ok(
      minified.includes('<note from="Developer" priority="2">'),
      "note attributes should be normalized"
    );

    // Check that text content spacing is preserved
    assert.ok(
      minified.includes(";     %2="),
      "Multiple spaces in note content should be preserved"
    );
    assert.ok(
      minified.includes("with    spaces"),
      "Multiple spaces in note content should be preserved"
    );
  });

  test("Edge case: Text content with semicolons and equals signs", function () {
    const xmlFormatter = new ClassicXmlFormatter();
    const formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();

    // This tests the specific pattern that was causing issues in the original bug
    const problematicText =
      '<note>%1="Setup";           %2="Id"; %3=Table; %4="Field"="Value"</note>';

    const minified = xmlFormatter.minifyXml(problematicText, formattingOptions);

    assert.strictEqual(
      minified,
      problematicText,
      "Text content with semicolons, equals signs, and multiple spaces should be preserved exactly"
    );
  });

  test("Edge case: Empty and single space content", function () {
    const xmlFormatter = new ClassicXmlFormatter();
    const formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();

    const emptyTag = "<tag></tag>";
    const singleSpaceTag = "<tag> </tag>";
    const multiSpaceTag = "<tag>   </tag>";

    assert.strictEqual(
      xmlFormatter.minifyXml(emptyTag, formattingOptions),
      emptyTag,
      "Empty tag content should be preserved"
    );

    assert.strictEqual(
      xmlFormatter.minifyXml(singleSpaceTag, formattingOptions),
      singleSpaceTag,
      "Single space content should be preserved"
    );

    assert.strictEqual(
      xmlFormatter.minifyXml(multiSpaceTag, formattingOptions),
      multiSpaceTag,
      "Multiple space-only content should be preserved"
    );
  });

  test("Edge case: Tags with no attributes but extra spacing", function () {
    const xmlFormatter = new ClassicXmlFormatter();
    const formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();

    const xmlWithSpacing = "<tag   >Content with    spaces</tag>";
    const expected = "<tag>Content with    spaces</tag>";

    const minified = xmlFormatter.minifyXml(xmlWithSpacing, formattingOptions);

    assert.strictEqual(
      minified,
      expected,
      "Extra spacing after tag name should be removed while preserving text content"
    );
  });
});

function langXliffXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="MyApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Table 588885680 - NamedType 2709120928" size-unit="char" translate="yes" xml:space="preserve">
          <source>%1 %2, "%6" is used in %3 %4, %5, and cannot be deleted.</source>
          <target state="final">%1 %2, "%6" används i %3 %4, %5, och kan inte raderas.</target>
          <note from="Developer" annotates="general" priority="2">%1="Function Setup".TableCaption;           %2="Function Setup".Id; %3=Workflow/AdvKPI.TableCaption; %4=Workflow.Id/AdvKPI."No."; %5=Workflow/AdvKPI.Name; %6=FunctionSetup.Description</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table QWEEG Function Setup - NamedType UsedInDeleteErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}
