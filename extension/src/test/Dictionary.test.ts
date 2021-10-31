import * as assert from "assert";
import { existsSync, unlinkSync } from "fs";
import { Dictionary } from "../Dictionary";

suite("Dictionary Tests", () => {
  const existingDict = `${__dirname}/../../src/test/resources/sv-se.dts.json`;
  const resourcesDir = __dirname;
  const leDict = new Dictionary(existingDict);
  test.only("Dictionary.addWord()", function () {
    assert.strictEqual(
      leDict.wordList.length,
      1,
      "Unexpected length of wordList"
    );
    leDict.addWord("Satan", "Beelzebub");
    assert.strictEqual(
      leDict.wordList.length,
      2,
      "Unexpected length of wordList"
    );
  });

  test("Dictionary.searchAndReplace()", function () {
    leDict.wordList[0].settings.matchCasing = false;
    translationTestList().forEach((t) => {
      assert.strictEqual(
        leDict.searchAndReplace(t.actual),
        t.expected,
        `Expected translation ${t.actual} => ${t.expected}`
      );
    });
    const translateText = {
      actual: `The quick brown fox hade ett kontrakt. Lata hunden åkte dit för kontraktsbrott. Hunden var snabb som Satan!`,
      expected: `The quick brown fox hade ett avtal. Lata hunden åkte dit för kontraktsbrott. Hunden var snabb som Beelzebub!`,
    };
    assert.strictEqual(
      leDict.searchAndReplace(translateText.actual),
      translateText.expected,
      "Translated result unexpected"
    );
  });

  test.only("Dictionary.translate()", function () {
    assert.strictEqual(
      leDict.translate("Satan"),
      "Beelzebub",
      "The air smells of sulfur and you hear the sound of hoofs approaching from behind."
    );
    assert.strictEqual(
      leDict.translate("Kontrakt"),
      "Avtal",
      "Expected word to be translated."
    );
    assert.strictEqual(
      leDict.translate("kontrakt"),
      "avtal",
      "Expected casing to be kept for first character."
    );
  });
  // Static functions
  test.only("Dictionary.keepCasingOnFirstChar()", function () {
    Dictionary.keepCasingOnFirstChar("word", "Replacement");
  });

  test.only("Dictionary.newDictionary", function () {
    const dict = Dictionary.newDictionary(resourcesDir, "da-dk", "dts");
    assert.ok(
      existsSync(dict.dictionaryFile),
      "New dictionary was expected to be created."
    );
    unlinkSync(dict.dictionaryFile);
  });
});

function translationTestList(): { actual: string; expected: string }[] {
  return [
    {
      actual: "Kontraktslista",
      expected: "Kontraktslista",
    },
    {
      actual: "Mina kontrakt",
      expected: "Mina avtal",
    },
  ];
}
