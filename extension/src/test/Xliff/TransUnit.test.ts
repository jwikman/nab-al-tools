import * as assert from "assert";
import { TransUnit, Xliff } from "../../Xliff/XLIFFDocument";
import { TransUnitElementType } from "../../Enums";

suite("TransUnit Tests", function () {
  const testStrings = {
    transUnit:
      '<trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">',
    source: "<source>Table</source>",
    target: "<target>Table</target>",
    developerNote:
      '<note from="Developer" annotates="general" priority="2">TableComment</note>',
    descriptionNote:
      '<note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>',
    transUnitEnd: "</trans-unit>",
    customNote:
      '<note from="Some custom note" annotates="general" priority="2">My note</note>',
  };

  test("TransUnit.lineType", function () {
    assert.strictEqual(
      TransUnit.lineType(testStrings.transUnit),
      TransUnitElementType.transUnit,
      "Expected 'transUnit'"
    );
    assert.strictEqual(
      TransUnit.lineType(testStrings.source),
      TransUnitElementType.source,
      "Expected 'source'"
    );
    assert.strictEqual(
      TransUnit.lineType(testStrings.target),
      TransUnitElementType.target,
      "Expected 'target'"
    );
    assert.strictEqual(
      TransUnit.lineType(testStrings.developerNote),
      TransUnitElementType.developerNote,
      "Expected 'developerNote'"
    );
    assert.strictEqual(
      TransUnit.lineType(testStrings.descriptionNote),
      TransUnitElementType.descriptionNote,
      "Expected 'descriptionNote'"
    );
    assert.strictEqual(
      TransUnit.lineType(testStrings.transUnitEnd),
      TransUnitElementType.transUnitEnd,
      "Expected 'transUnitEnd'"
    );
    assert.strictEqual(
      TransUnit.lineType(testStrings.customNote),
      TransUnitElementType.customNote,
      "Expected 'customNote'"
    );
  });

  test("TransUnit.approved", function () {
    let transUnitText = `<trans-unit id="Table 1365275863 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve" approved="yes"><source>MyField</source><note from="Developer" annotates="general" priority="2"></note><note from="Xliff Generator" annotates="general" priority="3">Table Empty - Field MyField - Property Caption</note></trans-unit>`;
    let tu = TransUnit.fromString(transUnitText);
    assert.strictEqual(
      Xliff.replaceSelfClosingTags(tu.toString()),
      transUnitText,
      "1. Unexpected TransUnit value"
    );
    transUnitText = `<trans-unit id="Table 1365275863 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>MyField</source><note from="Developer" annotates="general" priority="2"></note><note from="Xliff Generator" annotates="general" priority="3">Table Empty - Field MyField - Property Caption</note></trans-unit>`;
    tu = TransUnit.fromString(transUnitText);
    assert.strictEqual(
      Xliff.replaceSelfClosingTags(tu.toString()),
      transUnitText,
      "2. Unexpected TransUnit value"
    );

    let xliffText = `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1365275863 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>MyField</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table Empty - Field MyField - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
    let xliff = Xliff.fromString(xliffText);
    assert.strictEqual(
      xliff.toString(true, true),
      xliffText,
      "3. Unexpected TransUnit value"
    );

    xliffText = `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1365275863 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve" approved="no">
          <source>MyField</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table Empty - Field MyField - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
    xliff = Xliff.fromString(xliffText);
    assert.strictEqual(
      xliff.toString(true, true),
      xliffText,
      "4. Unexpected TransUnit value"
    );
  });

  test("TransUnit.lineType: error", function () {
    assert.throws(
      () => TransUnit.lineType('<group id="body">'),
      (err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, "Not inside a trans-unit element");
        return true;
      }
    );
  });
});
