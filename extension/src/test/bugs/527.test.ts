import * as assert from "assert";
import { TransUnit, Xliff } from "../../Xliff/XLIFFDocument";
import * as XliffFunctions from "../../XliffFunctions";

suite(
  "#527 Adding Locked=true to a label does not remove label from *.g.xlf",
  function () {
    test("Regression test: Label with translate=false should be removed from g.xlf", function () {
      // Reproduce the issue: When a label has Locked=true, translate=false
      // The trans-unit should be removed from the g.xlf
      const gXlfDoc = Xliff.fromString(gXlfXmlWithLabel());
      const transUnitsWithLockedLabel = createTransUnitsWithLockedLabel();

      const result = XliffFunctions.updateGXlf(
        gXlfDoc,
        transUnitsWithLockedLabel
      );

      // The locked label should be removed from g.xlf
      assert.strictEqual(
        gXlfDoc.transunit.length,
        0,
        "Expected all translation units to be removed when translate=false"
      );
      assert.strictEqual(
        result.numberOfRemovedTransUnits,
        1,
        "Expected 1 removed translation unit"
      );
      assert.strictEqual(
        result.numberOfAddedTransUnitElements,
        0,
        "Expected 0 added translation units"
      );
    });

    test("Label with translate=true should be added to g.xlf", function () {
      // When a label doesn't have Locked=true, translate=true
      // The trans-unit should be added to the g.xlf
      const gXlfDoc = Xliff.fromString(getEmptyGXlf());
      const transUnitsWithUnlockedLabel = createTransUnitsWithUnlockedLabel();

      const result = XliffFunctions.updateGXlf(
        gXlfDoc,
        transUnitsWithUnlockedLabel
      );

      assert.strictEqual(
        gXlfDoc.transunit.length,
        1,
        "Expected 1 translation unit to be added"
      );
      assert.strictEqual(
        result.numberOfAddedTransUnitElements,
        1,
        "Expected 1 added translation unit"
      );
      assert.strictEqual(
        result.numberOfRemovedTransUnits,
        0,
        "Expected 0 removed translation units"
      );
      assert.strictEqual(
        gXlfDoc.transunit[0].source,
        "0.00",
        "Expected source to match"
      );
      assert.strictEqual(
        gXlfDoc.transunit[0].translate,
        true,
        "Expected translate to be true"
      );
    });

    test("Changing label from unlocked to locked should remove from g.xlf", function () {
      // Start with an existing unlocked label in g.xlf
      const gXlfDoc = Xliff.fromString(gXlfXmlWithLabel());
      assert.strictEqual(
        gXlfDoc.transunit.length,
        1,
        "Expected 1 translation unit initially"
      );

      // Update with locked label (translate=false)
      const transUnitsWithLockedLabel = createTransUnitsWithLockedLabel();
      const result = XliffFunctions.updateGXlf(
        gXlfDoc,
        transUnitsWithLockedLabel
      );

      // Should remove the translation unit
      assert.strictEqual(
        gXlfDoc.transunit.length,
        0,
        "Expected translation unit to be removed"
      );
      assert.strictEqual(
        result.numberOfRemovedTransUnits,
        1,
        "Expected 1 removed translation unit"
      );
    });

    test("Changing label from locked to unlocked should add to g.xlf", function () {
      // Start with empty g.xlf (locked label was previously removed)
      const gXlfDoc = Xliff.fromString(getEmptyGXlf());
      assert.strictEqual(
        gXlfDoc.transunit.length,
        0,
        "Expected 0 translation units initially"
      );

      // Update with unlocked label (translate=true)
      const transUnitsWithUnlockedLabel = createTransUnitsWithUnlockedLabel();
      const result = XliffFunctions.updateGXlf(
        gXlfDoc,
        transUnitsWithUnlockedLabel
      );

      // Should add the translation unit
      assert.strictEqual(
        gXlfDoc.transunit.length,
        1,
        "Expected translation unit to be added"
      );
      assert.strictEqual(
        result.numberOfAddedTransUnitElements,
        1,
        "Expected 1 added translation unit"
      );
    });

    test("Multiple labels with mixed locked/unlocked status", function () {
      const gXlfDoc = Xliff.fromString(gXlfXmlWithMultipleLabels());
      assert.strictEqual(
        gXlfDoc.transunit.length,
        3,
        "Expected 3 translation units initially"
      );

      // Create mixed trans-units: one locked (should be removed), two unlocked existing, one new unlocked
      const transUnits = [
        createLockedTransUnit("Codeunit 123 - NamedType 456", "0.00"),
        createUnlockedTransUnit(
          "Codeunit 123 - NamedType 789",
          "Updated Label"
        ),
        createUnlockedTransUnit(
          "Codeunit 123 - NamedType 101112",
          "Third Label"
        ),
        createUnlockedTransUnit("Codeunit 123 - NamedType 999", "New Label"),
      ];

      const result = XliffFunctions.updateGXlf(gXlfDoc, transUnits);

      // Should have 3 trans-units (locked one removed, two existing kept, one new added)
      assert.strictEqual(
        gXlfDoc.transunit.length,
        3,
        "Expected 3 translation units after update"
      );
      assert.strictEqual(
        result.numberOfRemovedTransUnits,
        1,
        "Expected 1 removed translation unit (locked)"
      );
      assert.strictEqual(
        result.numberOfAddedTransUnitElements,
        1,
        "Expected 1 added translation unit (new)"
      );
      assert.strictEqual(
        result.numberOfUpdatedSources,
        1,
        "Expected 1 updated source (the one with 'Updated Label')"
      );

      // Verify the remaining trans-units
      const remainingIds = gXlfDoc.transunit.map((tu) => tu.id);
      assert.ok(
        remainingIds.includes("Codeunit 123 - NamedType 789"),
        "Expected existing unlocked label to remain"
      );
      assert.ok(
        remainingIds.includes("Codeunit 123 - NamedType 101112"),
        "Expected third label to remain"
      );
      assert.ok(
        remainingIds.includes("Codeunit 123 - NamedType 999"),
        "Expected new unlocked label to be added"
      );
      assert.ok(
        !remainingIds.includes("Codeunit 123 - NamedType 456"),
        "Expected locked label to be removed"
      );
    });
  }
);

// Helper functions to create test data
function createTransUnitsWithLockedLabel(): TransUnit[] {
  return [createLockedTransUnit("Codeunit 123 - NamedType 456", "0.00")];
}

function createTransUnitsWithUnlockedLabel(): TransUnit[] {
  return [createUnlockedTransUnit("Codeunit 123 - NamedType 456", "0.00")];
}

function createLockedTransUnit(id: string, source: string): TransUnit {
  const tu = TransUnit.fromString(
    `<trans-unit id="${id}" size-unit="char" translate="no" xml:space="preserve">
      <source>${source}</source>
      <note from="Developer" annotates="general" priority="2"></note>
      <note from="Xliff Generator" annotates="general" priority="3">Codeunit MyCodeunit - NamedType NumberFormatTok</note>
    </trans-unit>`
  );
  return tu;
}

function createUnlockedTransUnit(id: string, source: string): TransUnit {
  const tu = TransUnit.fromString(
    `<trans-unit id="${id}" size-unit="char" translate="yes" xml:space="preserve">
      <source>${source}</source>
      <note from="Developer" annotates="general" priority="2"></note>
      <note from="Xliff Generator" annotates="general" priority="3">Codeunit MyCodeunit - NamedType NumberFormatTok</note>
    </trans-unit>`
  );
  return tu;
}

function getEmptyGXlf(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="MyApp">
    <body>
      <group id="body">
      </group>
    </body>
  </file>
</xliff>`;
}

function gXlfXmlWithLabel(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="MyApp">
    <body>
      <group id="body">
        <trans-unit id="Codeunit 123 - NamedType 456" size-unit="char" translate="yes" xml:space="preserve">
          <source>0.00</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit MyCodeunit - NamedType NumberFormatTok</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

function gXlfXmlWithMultipleLabels(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="MyApp">
    <body>
      <group id="body">
        <trans-unit id="Codeunit 123 - NamedType 456" size-unit="char" translate="yes" xml:space="preserve">
          <source>0.00</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit MyCodeunit - NamedType NumberFormatTok</note>
        </trans-unit>
        <trans-unit id="Codeunit 123 - NamedType 789" size-unit="char" translate="yes" xml:space="preserve">
          <source>Another Label</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit MyCodeunit - NamedType AnotherLabelTok</note>
        </trans-unit>
        <trans-unit id="Codeunit 123 - NamedType 101112" size-unit="char" translate="yes" xml:space="preserve">
          <source>Third Label</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit MyCodeunit - NamedType ThirdLabelTok</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}
