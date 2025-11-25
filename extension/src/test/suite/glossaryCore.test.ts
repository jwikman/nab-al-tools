import * as assert from "assert";
import * as fs from "graceful-fs";
import * as os from "os";
import * as path from "path";
import { getGlossaryTermsCore } from "../../ChatTools/shared/GlossaryCore";

function writeTempGlossary(content: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "glossary-test-"));
  const file = path.join(dir, "glossary.tsv");
  fs.writeFileSync(file, content, { encoding: "utf-8" });
  return file;
}

suite("getGlossaryTermsCore", () => {
  test("returns entries for valid glossary with required columns and filters empty rows", () => {
    const glossary = [
      "en-US\tda-DK\tDescription",
      "Item\tVare\tItem description",
      "EmptySource\t\tShould be skipped",
      "\tEmptyTarget\tShould be skipped",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);
    const result = getGlossaryTermsCore(filePath, "da-DK", "en-US");
    assert.strictEqual(
      result.data.length,
      1,
      "Should include only one valid entry"
    );
    assert.deepStrictEqual(result.data[0], {
      source: "Item",
      target: "Vare",
      description: "Item description",
    });
  });

  test("preserves order of entries", () => {
    const glossary = [
      "en-US\tda-DK\tDescription",
      "A\tA1\tFirst",
      "B\tB1\tSecond",
      "C\tC1\tThird",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);
    const result = getGlossaryTermsCore(filePath, "da-DK", "en-US");
    const sources = result.data.map((e) => e.source).join("");
    assert.strictEqual(sources, "ABC", "Order of entries should be preserved");
  });

  test("returns entries even when description column is missing", () => {
    const glossary = ["en-US\tda-DK", "Item\tVare", "Customer\tKunde"].join(
      "\n"
    );
    const filePath = writeTempGlossary(glossary);
    const result = getGlossaryTermsCore(filePath, "da-DK", "en-US");
    assert.strictEqual(result.data.length, 2);
    assert.deepStrictEqual(result.data[0], {
      source: "Item",
      target: "Vare",
      description: "",
    });
    assert.deepStrictEqual(result.data[1], {
      source: "Customer",
      target: "Kunde",
      description: "",
    });
  });

  test("throws when target column missing", () => {
    const glossary = ["en-US\tsv-SE\tDescription", "Item\tArtikel\tDesc"].join(
      "\n"
    );
    const filePath = writeTempGlossary(glossary);
    assert.throws(
      () => getGlossaryTermsCore(filePath, "da-DK", "en-US"),
      /Target language column 'da-DK' not found in NAB AL Tools Glossary/i
    );
  });

  test("throws when source column missing", () => {
    const glossary = ["da-DK\tDescription", "Vare\tDesc"].join("\n");
    const filePath = writeTempGlossary(glossary);
    assert.throws(
      () => getGlossaryTermsCore(filePath, "da-DK", "en-US"),
      /Source language column 'en-US' not found in NAB AL Tools Glossary/i
    );
  });

  test("returns empty when file has only header", () => {
    const glossary = "en-US\tda-DK\tDescription";
    const filePath = writeTempGlossary(glossary);
    const result = getGlossaryTermsCore(filePath, "da-DK", "en-US");
    assert.strictEqual(result.data.length, 0);
  });

  test("supports non-en-US source language while en-US column still exists", () => {
    const glossary = [
      "en-US\tda-DK\tfi-FI\tDescription",
      "Item\tVare\tNimike\tMaster item record",
      "Variant\tVariantDK\tVariantFI\tItem variant",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);
    // Use fi-FI as source, da-DK as target, ensure returned source column uses fi-FI
    const result = getGlossaryTermsCore(filePath, "da-DK", "fi-FI");
    assert.strictEqual(result.data.length, 2);
    assert.deepStrictEqual(result.data[0], {
      source: "Nimike",
      target: "Vare",
      description: "Master item record",
    });
    assert.deepStrictEqual(result.data[1], {
      source: "VariantFI",
      target: "VariantDK",
      description: "Item variant",
    });
    // Ensure en-US not mistakenly used as source
    assert.notStrictEqual(result.data[0].source, "Item");
  });

  test("supports case-insensitive language code matching for input parameters", () => {
    const glossary = [
      "en-US\tda-DK\tDescription",
      "Item\tVare\tItem description",
      "Variant\tVariant\tItem variant",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);

    // Test lowercase input parameters
    const resultLowercase = getGlossaryTermsCore(filePath, "da-dk", "en-us");
    assert.strictEqual(resultLowercase.data.length, 2);
    assert.deepStrictEqual(resultLowercase.data[0], {
      source: "Item",
      target: "Vare",
      description: "Item description",
    });

    // Test mixed case input parameters
    const resultMixedCase = getGlossaryTermsCore(filePath, "Da-Dk", "En-Us");
    assert.strictEqual(resultMixedCase.data.length, 2);
    assert.deepStrictEqual(resultMixedCase.data[0], {
      source: "Item",
      target: "Vare",
      description: "Item description",
    });

    // Test uppercase input parameters
    const resultUppercase = getGlossaryTermsCore(filePath, "DA-DK", "EN-US");
    assert.strictEqual(resultUppercase.data.length, 2);
    assert.deepStrictEqual(resultUppercase.data[0], {
      source: "Item",
      target: "Vare",
      description: "Item description",
    });
  });

  test("supports case-insensitive language code matching for glossary file headers", () => {
    const glossary = [
      "en-us\tda-dk\tDescription",
      "Item\tVare\tItem description",
      "Variant\tVariant\tItem variant",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);

    // Test with proper case input parameters against lowercase headers
    const result = getGlossaryTermsCore(filePath, "da-DK", "en-US");
    assert.strictEqual(result.data.length, 2);
    assert.deepStrictEqual(result.data[0], {
      source: "Item",
      target: "Vare",
      description: "Item description",
    });
  });

  test("supports mixed case scenarios between headers and input parameters", () => {
    const glossary = [
      "En-Us\tDa-Dk\tfi-fi\tDescription",
      "Item\tVare\tNimike\tMaster item record",
      "Variant\tVariantDK\tVariantFI\tItem variant",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);

    // Test lowercase parameters with mixed case headers
    const result = getGlossaryTermsCore(filePath, "da-dk", "fi-fi");
    assert.strictEqual(result.data.length, 2);
    assert.deepStrictEqual(result.data[0], {
      source: "Nimike",
      target: "Vare",
      description: "Master item record",
    });
  });

  test("merges local glossary with built-in glossary, prioritizing local terms", () => {
    // Create built-in glossary
    const builtInGlossary = [
      "en-US\tda-DK\tDescription",
      "Item\tVare\tBuilt-in item term",
      "Customer\tKunde\tBuilt-in customer term",
      "Vendor\tLeverandør\tBuilt-in vendor term",
    ].join("\n");
    const builtInPath = writeTempGlossary(builtInGlossary);

    // Create local glossary with one override and one new term
    const localGlossary = [
      "en-US\tda-DK\tDescription",
      "Item\tArtikel\tLocal item term override",
      "Order\tOrdre\tLocal order term",
    ].join("\n");
    const localPath = writeTempGlossary(localGlossary);

    const result = getGlossaryTermsCore(
      builtInPath,
      "da-DK",
      "en-US",
      localPath
    );

    assert.strictEqual(result.data.length, 4, "Should have 4 total entries");

    // Find specific entries
    const itemEntry = result.data.find((e) => e.source === "Item");
    const customerEntry = result.data.find((e) => e.source === "Customer");
    const vendorEntry = result.data.find((e) => e.source === "Vendor");
    const orderEntry = result.data.find((e) => e.source === "Order");

    // Verify local override took precedence
    assert.deepStrictEqual(itemEntry, {
      source: "Item",
      target: "Artikel",
      description: "Local item term override",
    });

    // Verify built-in entries that weren't overridden
    assert.deepStrictEqual(customerEntry, {
      source: "Customer",
      target: "Kunde",
      description: "Built-in customer term",
    });
    assert.deepStrictEqual(vendorEntry, {
      source: "Vendor",
      target: "Leverandør",
      description: "Built-in vendor term",
    });

    // Verify new local entry
    assert.deepStrictEqual(orderEntry, {
      source: "Order",
      target: "Ordre",
      description: "Local order term",
    });

    // Verify telemetry
    assert.strictEqual(result.telemetry.entryCount, 4);
    assert.strictEqual(result.telemetry.localGlossaryEntryCount, 2);
    assert.strictEqual(result.telemetry.builtInGlossaryEntryCount, 3);
  });

  test("returns only built-in glossary when local glossary path is not provided", () => {
    const builtInGlossary = [
      "en-US\tda-DK\tDescription",
      "Item\tVare\tBuilt-in item term",
      "Customer\tKunde\tBuilt-in customer term",
    ].join("\n");
    const builtInPath = writeTempGlossary(builtInGlossary);

    const result = getGlossaryTermsCore(builtInPath, "da-DK", "en-US");

    assert.strictEqual(result.data.length, 2);
    assert.strictEqual(
      result.telemetry.localGlossaryFileName,
      undefined,
      "No local glossary telemetry should be present"
    );
    assert.strictEqual(
      result.telemetry.localGlossaryEntryCount,
      undefined,
      "No local glossary entry count should be present"
    );
  });

  test("throws descriptive error when local glossary file does not exist", () => {
    const builtInGlossary = [
      "en-US\tda-DK\tDescription",
      "Item\tVare\tBuilt-in item term",
    ].join("\n");
    const builtInPath = writeTempGlossary(builtInGlossary);
    const nonExistentPath = "/tmp/non-existent-glossary.tsv";

    try {
      getGlossaryTermsCore(builtInPath, "da-DK", "en-US", nonExistentPath);
      assert.fail("Should have thrown an error");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      assert.ok(
        errorMessage.includes("Failed to read local glossary file"),
        "Error should mention local glossary file"
      );
      assert.ok(
        errorMessage.includes("Expected glossary format"),
        "Error should include format description"
      );
      assert.ok(
        errorMessage.includes("TSV"),
        "Error should mention TSV format"
      );
      assert.ok(
        errorMessage.includes("First column: en-US"),
        "Error should describe first column"
      );
      assert.ok(
        errorMessage.includes("Last column: Description"),
        "Error should describe last column"
      );
      assert.ok(
        errorMessage.includes("ISO language codes"),
        "Error should mention ISO language codes"
      );
    }
  });

  test("throws descriptive error when local glossary is missing target language column", () => {
    const builtInGlossary = [
      "en-US\tda-DK\tDescription",
      "Item\tVare\tBuilt-in item term",
    ].join("\n");
    const builtInPath = writeTempGlossary(builtInGlossary);

    // Local glossary missing da-DK column
    const invalidLocalGlossary = ["en-US\tsv-SE", "Item\tArtikel"].join("\n");
    const localPath = writeTempGlossary(invalidLocalGlossary);

    try {
      getGlossaryTermsCore(builtInPath, "da-DK", "en-US", localPath);
      assert.fail("Should have thrown an error");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      assert.ok(
        errorMessage.includes("Failed to read local glossary file"),
        "Error should mention local glossary file"
      );
      assert.ok(
        errorMessage.includes("Expected glossary format"),
        "Error should include format description"
      );
      assert.ok(
        errorMessage.includes("Target language column 'da-DK' not found"),
        "Error should mention the specific validation error"
      );
      assert.ok(
        errorMessage.includes(localPath),
        "Error should include the local glossary file path"
      );
    }
  });

  test("local glossary without description column works correctly", () => {
    const builtInGlossary = [
      "en-US\tda-DK\tDescription",
      "Item\tVare\tBuilt-in item term",
    ].join("\n");
    const builtInPath = writeTempGlossary(builtInGlossary);

    // Local glossary without Description column (which is optional)
    const localGlossary = [
      "en-US\tda-DK",
      "Item\tArtikel",
      "Order\tOrdre",
    ].join("\n");
    const localPath = writeTempGlossary(localGlossary);

    const result = getGlossaryTermsCore(
      builtInPath,
      "da-DK",
      "en-US",
      localPath
    );

    assert.strictEqual(result.data.length, 2, "Should have 2 entries");

    const itemEntry = result.data.find((e) => e.source === "Item");
    const orderEntry = result.data.find((e) => e.source === "Order");

    // Local entry should override with empty description
    assert.deepStrictEqual(itemEntry, {
      source: "Item",
      target: "Artikel",
      description: "",
    });
    assert.deepStrictEqual(orderEntry, {
      source: "Order",
      target: "Ordre",
      description: "",
    });
  });

  test("handles empty local glossary gracefully", () => {
    const builtInGlossary = [
      "en-US\tda-DK\tDescription",
      "Item\tVare\tBuilt-in item term",
      "Customer\tKunde\tBuilt-in customer term",
    ].join("\n");
    const builtInPath = writeTempGlossary(builtInGlossary);

    // Empty local glossary (only header)
    const emptyLocalGlossary = "en-US\tda-DK\tDescription";
    const localPath = writeTempGlossary(emptyLocalGlossary);

    const result = getGlossaryTermsCore(
      builtInPath,
      "da-DK",
      "en-US",
      localPath
    );

    assert.strictEqual(
      result.data.length,
      2,
      "Should have only built-in entries"
    );
    assert.strictEqual(
      result.telemetry.localGlossaryEntryCount,
      0,
      "Local glossary should have 0 entries"
    );
    assert.strictEqual(
      result.telemetry.builtInGlossaryEntryCount,
      2,
      "Built-in should have 2 entries"
    );
  });

  test("local glossary can override all built-in entries", () => {
    const builtInGlossary = [
      "en-US\tda-DK\tDescription",
      "Item\tVare\tBuilt-in item",
      "Customer\tKunde\tBuilt-in customer",
    ].join("\n");
    const builtInPath = writeTempGlossary(builtInGlossary);

    // Local glossary overrides all
    const localGlossary = [
      "en-US\tda-DK\tDescription",
      "Item\tArtikel\tLocal item",
      "Customer\tKlient\tLocal customer",
    ].join("\n");
    const localPath = writeTempGlossary(localGlossary);

    const result = getGlossaryTermsCore(
      builtInPath,
      "da-DK",
      "en-US",
      localPath
    );

    assert.strictEqual(result.data.length, 2);

    const itemEntry = result.data.find((e) => e.source === "Item");
    const customerEntry = result.data.find((e) => e.source === "Customer");

    // Both should be from local glossary
    assert.deepStrictEqual(itemEntry, {
      source: "Item",
      target: "Artikel",
      description: "Local item",
    });
    assert.deepStrictEqual(customerEntry, {
      source: "Customer",
      target: "Klient",
      description: "Local customer",
    });
  });

  test("ignoreMissingLanguage returns empty array when target language column is missing", () => {
    const glossary = [
      "en-US\tsv-SE\tDescription",
      "Item\tArtikel\tItem description",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);

    // Without ignoreMissingLanguage, this would throw
    const result = getGlossaryTermsCore(
      filePath,
      "da-DK",
      "en-US",
      undefined,
      true // ignoreMissingLanguage
    );

    assert.strictEqual(result.data.length, 0);
    assert.strictEqual(result.telemetry.languageNotFound, true);
  });

  test("ignoreMissingLanguage returns empty array when source language column is missing", () => {
    const glossary = [
      "da-DK\tsv-SE\tDescription",
      "Vare\tArtikel\tItem description",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);

    // Without ignoreMissingLanguage, this would throw
    const result = getGlossaryTermsCore(
      filePath,
      "da-DK",
      "en-US",
      undefined,
      true // ignoreMissingLanguage
    );

    assert.strictEqual(result.data.length, 0);
    assert.strictEqual(result.telemetry.languageNotFound, true);
  });

  test("ignoreMissingLanguage still throws when false", () => {
    const glossary = [
      "en-US\tsv-SE\tDescription",
      "Item\tArtikel\tItem description",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);

    assert.throws(
      () =>
        getGlossaryTermsCore(
          filePath,
          "da-DK",
          "en-US",
          undefined,
          false // ignoreMissingLanguage
        ),
      /Target language column 'da-DK' not found/i
    );
  });

  test("ignoreMissingLanguage with local glossary returns built-in entries when local is missing language", () => {
    const builtInGlossary = [
      "en-US\tda-DK\tDescription",
      "Item\tVare\tBuilt-in item",
      "Customer\tKunde\tBuilt-in customer",
    ].join("\n");
    const builtInPath = writeTempGlossary(builtInGlossary);

    // Local glossary is missing da-DK column
    const localGlossary = [
      "en-US\tsv-SE\tDescription",
      "Item\tArtikel\tLocal item",
    ].join("\n");
    const localPath = writeTempGlossary(localGlossary);

    const result = getGlossaryTermsCore(
      builtInPath,
      "da-DK",
      "en-US",
      localPath,
      true // ignoreMissingLanguage
    );

    // Should return built-in entries since local glossary language column was not found
    assert.strictEqual(result.data.length, 2);
    assert.strictEqual(result.telemetry.localGlossaryLanguageNotFound, true);
    assert.strictEqual(result.telemetry.localGlossaryEntryCount, 0);

    const itemEntry = result.data.find((e) => e.source === "Item");
    assert.deepStrictEqual(itemEntry, {
      source: "Item",
      target: "Vare",
      description: "Built-in item",
    });
  });
});
