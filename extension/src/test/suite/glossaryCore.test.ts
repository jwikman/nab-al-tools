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
      "en-US\tda-dk\tDescription",
      "Item\tVare\tItem description",
      "EmptySource\t\tShould be skipped",
      "\tEmptyTarget\tShould be skipped",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);
    const result = getGlossaryTermsCore(filePath, "da-dk", "en-US");
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
      "en-US\tda-dk\tDescription",
      "A\tA1\tFirst",
      "B\tB1\tSecond",
      "C\tC1\tThird",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);
    const result = getGlossaryTermsCore(filePath, "da-dk", "en-US");
    const sources = result.data.map((e) => e.source).join("");
    assert.strictEqual(sources, "ABC", "Order of entries should be preserved");
  });

  test("throws when description column missing", () => {
    const glossary = ["en-US\tda-dk", "Item\tVare"].join("\n");
    const filePath = writeTempGlossary(glossary);
    assert.throws(
      () => getGlossaryTermsCore(filePath, "da-dk", "en-US"),
      /Description column not found/i
    );
  });

  test("throws when target column missing", () => {
    const glossary = ["en-US\tsv-se\tDescription", "Item\tArtikel\tDesc"].join(
      "\n"
    );
    const filePath = writeTempGlossary(glossary);
    assert.throws(
      () => getGlossaryTermsCore(filePath, "da-dk", "en-US"),
      /Target language column 'da-dk' not found/i
    );
  });

  test("throws when source column missing", () => {
    const glossary = ["da-dk\tDescription", "Vare\tDesc"].join("\n");
    const filePath = writeTempGlossary(glossary);
    assert.throws(
      () => getGlossaryTermsCore(filePath, "da-dk", "en-US"),
      /Source language column 'en-US' not found/i
    );
  });

  test("returns empty when file has only header", () => {
    const glossary = "en-US\tda-dk\tDescription";
    const filePath = writeTempGlossary(glossary);
    const result = getGlossaryTermsCore(filePath, "da-dk", "en-US");
    assert.strictEqual(result.data.length, 0);
  });

  test("supports non-en-US source language while en-US column still exists", () => {
    const glossary = [
      "en-US\tda-dk\tfi-fi\tDescription",
      "Item\tVare\tNimike\tMaster item record",
      "Variant\tVariantDK\tVariantFI\tItem variant",
    ].join("\n");
    const filePath = writeTempGlossary(glossary);
    // Use fi-fi as source, da-dk as target, ensure returned source column uses fi-fi
    const result = getGlossaryTermsCore(filePath, "da-dk", "fi-fi");
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
});
