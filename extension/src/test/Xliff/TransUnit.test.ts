import * as assert from "assert";
import { TransUnit } from "../../Xliff/XLIFFDocument";
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
