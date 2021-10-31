import { existsSync, readFileSync, writeFileSync } from "fs";

export class Dictionary implements IDictonary {
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
    ) as IDictonary;
    this.language = d.language;
    this.wordList = d.wordList;
  }

  addWord(word: string, replaceWith: string): Dictionary {
    const newWord: DictPair = {
      word: word,
      replacement: replaceWith,
      setting: this.defaultSetting(),
    };
    this.wordList.push(newWord);
    return this;
  }

  find(word: string): DictPair | undefined {
    return this.wordList.find(
      (w) => w.word.toLocaleLowerCase() === word.toLocaleLowerCase()
    );
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

  defaultSetting(): WordSetting {
    return {
      matchWholeWord: true,
      matchCasing: true,
      useRegex: false,
      keepCasingOnFirstCharacter: true,
    };
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
      JSON.stringify({ language: language, words: [] }),
      "utf8"
    );
    const dict = new Dictionary(fileName);
    dict.dictionaryFile = fileName;
    return dict;
  }
}

interface IDictonary {
  language: string;
  wordList: DictPair[];
}

interface DictPair {
  word: string;
  replacement: string;
  setting: WordSetting;
}

interface WordSetting {
  matchWholeWord: boolean;
  matchCasing: boolean;
  useRegex: boolean;
  keepCasingOnFirstCharacter: boolean;
}
