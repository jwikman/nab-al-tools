import { existsSync, readFileSync, writeFileSync } from "fs";
import { escapeRegex } from "./Common";

export class Dictionary implements IDictionary {
  language: string;
  wordList: DictPair[];
  dictionaryFile: string;

  constructor(dictionaryFile: string) {
    this.dictionaryFile = dictionaryFile;
    if (!existsSync(dictionaryFile)) {
      throw new Error(`Could not open file: "${this.dictionaryFile}"`);
    }
    const d = JSON.parse(
      readFileSync(this.dictionaryFile, "utf8")
    ) as IDictionary;
    this.language = d.language;
    this.wordList = d.wordList;
  }

  toJSON(): unknown {
    return {
      language: this.language,
      wordList: this.wordList,
    };
  }

  saveDictionary(): void {
    const spaces = 2;
    writeFileSync(
      this.dictionaryFile,
      JSON.stringify(this.toJSON(), null, spaces),
      "utf8"
    );
  }

  addWord(word: string, replaceWith: string): DictPair {
    let wordInList = this.find(word);
    if (wordInList === undefined) {
      const newWord: DictPair = {
        word: word,
        replacement: replaceWith,
        settings: this.defaultSetting(),
      };
      this.wordList.push(newWord);
      this.saveDictionary();
      wordInList = newWord;
    }
    return wordInList;
  }

  deleteWord(word: string): void {
    this.wordList = this.wordList.filter((w) => w.word !== word);
    this.saveDictionary();
  }

  find(word: string): DictPair | undefined {
    return this.wordList.find(
      (w) => w.word.toLocaleLowerCase() === word.toLocaleLowerCase()
    );
  }

  /**
   * Replaces all words found in the dictionary word list.
   *
   * @param text the text to translate
   * @returns translated text
   */
  searchAndReplace(text: string): string {
    this.wordList.forEach((word) => {
      word.settings = this.defaultSetting(word.settings);
      text = this.replaceWord(text, word);
    });
    return text;
  }

  replaceWord(text: string, word: DictPair): string {
    const flags = `gm${word.settings.matchCasing ? "" : "i"}`;
    const b = word.settings.matchWholeWord ? "\\b" : "";
    const searchWord = word.settings.useRegex
      ? word.word
      : escapeRegex(word.word);
    text.match(new RegExp(`${b}(${searchWord})${b}`, flags))?.forEach((m) => {
      const replaceValue = word.settings.keepCasingOnFirstCharacter
        ? Dictionary.keepCasingOnFirstChar(m[0], word.replacement)
        : word.replacement;
      text = text.replace(new RegExp(`${m}`), replaceValue);
    });
    return text;
  }

  static keepCasingOnFirstChar(word: string, replacement: string): string {
    const isUpper = word[0] === word[0].toUpperCase();
    const firstChar = isUpper
      ? replacement.charAt(0).toUpperCase()
      : replacement.charAt(0).toLocaleLowerCase();
    replacement = `${firstChar}${replacement.slice(1)}`;

    return replacement;
  }

  exists(word: string): boolean {
    return this.find(word) !== undefined;
  }

  defaultSetting(wordSettings?: WordSetting): WordSetting {
    const defaultSetting: WordSetting = {
      matchWholeWord: true,
      matchCasing: true,
      useRegex: false,
      keepCasingOnFirstCharacter: true,
    };
    if (wordSettings === undefined) {
      return defaultSetting;
    }
    wordSettings.matchWholeWord =
      wordSettings.matchWholeWord ?? defaultSetting.matchWholeWord;
    wordSettings.matchCasing =
      wordSettings.matchCasing ?? defaultSetting.matchCasing;
    wordSettings.useRegex = wordSettings.useRegex ?? defaultSetting.useRegex;
    wordSettings.keepCasingOnFirstCharacter =
      wordSettings.keepCasingOnFirstCharacter ??
      defaultSetting.keepCasingOnFirstCharacter;

    return wordSettings;
  }

  static newDictionary(
    path: string,
    language: string,
    suffix?: string
  ): Dictionary {
    const fileName = `${path}/${language}${
      suffix === undefined ? "" : `.${suffix}`
    }.json`;
    writeFileSync(
      fileName,
      JSON.stringify({ language: language, wordList: [] }),
      "utf8"
    );
    const dict = new Dictionary(fileName);
    return dict;
  }
}

interface IDictionary {
  language: string;
  wordList: DictPair[];
}

interface DictPair {
  word: string;
  replacement: string;
  settings: WordSetting;
}

interface WordSetting {
  matchWholeWord: boolean;
  matchCasing: boolean;
  useRegex: boolean;
  keepCasingOnFirstCharacter: boolean;
}
