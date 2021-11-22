import * as assert from "assert";
import { existsSync, unlinkSync } from "fs";
import { Dictionary } from "../Dictionary";

suite("Dictionary Tests", () => {
  const existingDict = `${__dirname}/../../src/test/resources/sv-SE.dts.json`;
  const resourcesDir = __dirname;
  const leDict = new Dictionary(existingDict);

  test("Dictionary.addWord()", function () {
    assert.strictEqual(
      leDict.wordList.length,
      2,
      "Unexpected length of wordList"
    );
    leDict.addWord("Satan", "Beelzebub");
    assert.strictEqual(
      leDict.wordList.length,
      3,
      "Unexpected length of wordList"
    );
    leDict.addWord("Kontrakt", "Whatever");
    assert.strictEqual(
      leDict.wordList.length,
      3,
      "Duplicate word should not be added."
    );

    // Test method chaining with new word
    leDict.addWord(
      "Hello",
      "HelloWorld"
    ).settings.keepCasingOnFirstCharacter = false;
    assert.strictEqual(
      leDict.find("Hello")?.settings.keepCasingOnFirstCharacter,
      false,
      "Expected setting to be false"
    );

    // Test method chaining with existing word
    leDict.addWord(
      "Kontrakt",
      "HelloWorld"
    ).settings.keepCasingOnFirstCharacter = false;
    assert.strictEqual(
      leDict.find("Kontrakt")?.settings.keepCasingOnFirstCharacter,
      false,
      "Expected setting to be false"
    );
    // Delete test word
    leDict.deleteWord("Hello");
    // Restore setting for word
    leDict.addWord("Kontrakt", "").settings.keepCasingOnFirstCharacter = true;
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
    leDict.wordList[0].settings.matchCasing = true; // restore
  });

  test("Dictionary.replaceWord()", function () {
    /**
     * Default settings:
     *
     * matchWholeWord: true
     * matchCasing: true
     * useRegex: false
     * keepCasingOnFirstCharacter: true
     */
    const word = {
      word: "Kontrakt",
      replacement: "Avtal",
      settings: leDict.defaultSetting(undefined),
    };
    const text = "Kontrakt kontrakt Kontraktkontrakt";
    // Default Settings
    assert.strictEqual(
      leDict.replaceWord(text, word),
      "Avtal kontrakt Kontraktkontrakt"
    );

    word.settings.matchCasing = false;
    assert.strictEqual(
      leDict.replaceWord(text, word),
      "Avtal avtal Kontraktkontrakt"
    );

    word.settings.matchCasing = false;
    word.settings.matchWholeWord = false;
    assert.strictEqual(
      leDict.replaceWord(text, word),
      "Avtal avtal Avtalavtal",
      "Case insensitive non word boundary match"
    );

    word.settings.matchCasing = true;
    word.settings.matchWholeWord = false;
    assert.strictEqual(
      leDict.replaceWord(text, word),
      "Avtal kontrakt Avtalkontrakt",
      "Case sensitve non word boundary replacement"
    );

    word.settings.matchCasing = false;
    word.settings.matchWholeWord = false;
    word.settings.keepCasingOnFirstCharacter = false;
    assert.strictEqual(
      leDict.replaceWord(text, word),
      "Avtal Avtal AvtalAvtal",
      "Case preservation of first character"
    );

    word.settings = leDict.defaultSetting(undefined);
    word.settings.useRegex = true;
    word.word = "Kon[tT]rakt";
    assert.strictEqual(
      leDict.replaceWord("Kontrakt KonTrakt Kontraktkontrakt", word),
      "Avtal Avtal Kontraktkontrakt",
      "useRegex = true"
    );
  });

  test("Dictionary.deleteWord()", function () {
    leDict.deleteWord("Satan");
    assert.strictEqual(
      leDict.wordList.length,
      2,
      "Unexpected length of wordList"
    );
  });

  // Static functions
  test("Dictionary.keepCasingOnFirstChar()", function () {
    assert.strictEqual(
      Dictionary.keepCasingOnFirstChar("word", "Replacement").charAt(0),
      "r",
      "Expected casing to be kept for word."
    );
    assert.strictEqual(
      Dictionary.keepCasingOnFirstChar("Word", "replacement").charAt(0),
      "R",
      "Expected casing to be kept for word."
    );
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
    {
      actual: "kontrakt kontrakt kontrakt",
      expected: "avtal avtal avtal",
    },
  ];
}
