import * as assert from "assert";
import * as path from "path";
import * as fs from "graceful-fs";
import {
  getTextsByKeywordCore,
  ITranslatedTextWithState,
} from "../../ChatTools/shared/XliffToolsCore";

const sampleXlf = path.resolve(
  __dirname,
  "../../../src/test/resources/NAB_AL_Tools.sv-SE.xlf"
);

suite("getTextsByKeywordCore", function () {
  test("substring match (case-insensitive) returns matching units", function () {
    const result = getTextsByKeywordCore(
      sampleXlf,
      0,
      0,
      "this is a test",
      false,
      false
    );
    const data = result.data as ITranslatedTextWithState[];
    assert.ok(Array.isArray(data), "Expected result data to be an array");
    // Expect at least two units from sample that contain 'This is a test'
    assert.ok(
      data.length >= 2,
      `Expected at least 2 matches, got ${data.length}`
    );
    const ids = data.map((d) => d.id);
    assert.ok(
      ids.some((id) => id.includes("NamedType")),
      "Expected some id containing NamedType"
    );
  });

  test("case-sensitive match respects caseSensitive flag", function () {
    const resultInsensitive = getTextsByKeywordCore(
      sampleXlf,
      0,
      0,
      "This is a test",
      false,
      false
    );
    const resultSensitive = getTextsByKeywordCore(
      sampleXlf,
      0,
      0,
      "This is a test",
      true,
      false
    );
    // Both should match since the source text has capitalized 'This'
    assert.ok(
      resultInsensitive.data.length >= 2,
      "Expected insensitive match to find items"
    );
    assert.ok(
      resultSensitive.data.length >= 2,
      "Expected sensitive match to find items"
    );

    // Now search for lower-case 'this is a test' with caseSensitive=true -> should find none
    const resultLowerCaseSensitive = getTextsByKeywordCore(
      sampleXlf,
      0,
      0,
      "this is a test",
      true,
      false
    );
    assert.strictEqual(
      resultLowerCaseSensitive.data.length,
      0,
      "Expected no matches for case-sensitive lower-case search"
    );
  });

  test("regex match works and invalid regex throws", function () {
    const result = getTextsByKeywordCore(
      sampleXlf,
      0,
      0,
      "This.*test",
      false,
      true
    );
    const data = result.data as ITranslatedTextWithState[];
    assert.ok(data.length >= 2, "Expected regex to match multiple items");

    // Invalid regex
    assert.throws(() =>
      getTextsByKeywordCore(sampleXlf, 0, 0, "[unclosed", false, true)
    );
  });

  test("limit=0 returns all matches and pagination works", function () {
    const all = getTextsByKeywordCore(sampleXlf, 0, 0, "This", false, false);
    const page = getTextsByKeywordCore(sampleXlf, 1, 2, "This", false, false);
    const allData = all.data as ITranslatedTextWithState[];
    const pageData = page.data as ITranslatedTextWithState[];
    assert.ok(allData.length >= 2, "Expected at least 2 matches in total");
    // pageData should be at most 2 items
    assert.ok(pageData.length <= 2, "Expected page size <= 2");
  });

  test("should return alternativeTranslations when multiple targets exist", function () {
    // Create a temporary XLF with multiple targets
    const testXlf = path.resolve(
      __dirname,
      "../../../src/test/resources/temp/ChatTools/test-getTextsByKeyword-alt.xlf"
    );
    const xliffContent = `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1 - Property 1" size-unit="char" translate="yes" xml:space="preserve">
          <source>Customer Name</source>
          <target>[NAB: SUGGESTION]Kundnamn</target>
          <target>[NAB: SUGGESTION]Kundens namn</target>
          <target>[NAB: SUGGESTION]Namn på kund</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Customer - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2 - Property 2" size-unit="char" translate="yes" xml:space="preserve">
          <source>Customer Address</source>
          <target>Kundadress</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table Customer - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;

    // Ensure directory exists
    const dir = path.dirname(testXlf);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(testXlf, xliffContent, "utf8");

    try {
      // Search for "Customer" - should match both units
      const result = getTextsByKeywordCore(
        testXlf,
        0,
        0,
        "Customer",
        false,
        false
      );
      const data = result.data as ITranslatedTextWithState[];

      assert.strictEqual(data.length, 2, "Expected 2 matches for 'Customer'");

      // First unit should have alternative translations
      const firstUnit = data[0];
      assert.strictEqual(
        firstUnit.sourceText,
        "Customer Name",
        "Unexpected source text"
      );
      assert.ok(
        firstUnit.alternativeTranslations,
        "Should have alternativeTranslations property"
      );
      assert.strictEqual(
        firstUnit.alternativeTranslations?.length,
        2,
        "Should have 2 alternative translations"
      );
      assert.deepStrictEqual(
        firstUnit.alternativeTranslations,
        ["Kundens namn", "Namn på kund"],
        "Unexpected alternative translations"
      );

      // Second unit should NOT have alternative translations
      const secondUnit = data[1];
      assert.strictEqual(
        secondUnit.sourceText,
        "Customer Address",
        "Unexpected source text"
      );
      assert.strictEqual(
        secondUnit.alternativeTranslations,
        undefined,
        "Should not have alternativeTranslations when only one target exists"
      );
    } finally {
      // Clean up
      if (fs.existsSync(testXlf)) {
        fs.unlinkSync(testXlf);
      }
    }
  });
});
