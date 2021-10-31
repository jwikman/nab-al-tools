import * as assert from "assert";
import { existsSync, unlinkSync } from "fs";
import { Dictionary } from "../Dictionary";

suite("Dictionary Tests", () => {
  const existingDict = `${__dirname}/../../src/test/resources/sv-se.dts.json`;
  const resourcesDir = __dirname;
  test.only("Dictionary integration", function () {
    const dict = new Dictionary(existingDict);
    assert.strictEqual(
      dict.translate("Kontrakt"),
      "Avtal",
      "Expected word to be translated."
    );
    assert.strictEqual(
      dict.translate("kontrakt"),
      "avtal",
      "Expected casing to be kept for first character."
    );
  });

  // Static functions
  test("Dictionary.keepCasingOnFirstChar()", function () {
    Dictionary.keepCasingOnFirstChar("word", "Replacement");
  });

  test("Dictionary.newDictionary", function () {
    const dict = Dictionary.newDictionary(resourcesDir, "da-dk", "dts");
    assert.ok(
      existsSync(dict.dictionaryFile),
      "New dictionary was expected to be created."
    );
    unlinkSync(dict.dictionaryFile);
  });
});
