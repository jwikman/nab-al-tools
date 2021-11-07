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

  addWord(word: string, replaceWith: string): Dictionary {
    if (!this.exists(word)) {
      const newWord: DictPair = {
        word: word,
        replacement: replaceWith,
        settings: this.defaultSetting(),
      };
      this.wordList.push(newWord);
      this.saveDictionary();
    }
    return this;
  }

  deleteWord(word: string): Dictionary {
    this.wordList = this.wordList.filter((w) => w.word !== word);
    this.saveDictionary();
    return this;
  }

  find(word: string): DictPair | undefined {
    return this.wordList.find(
      (w) => w.word.toLocaleLowerCase() === word.toLocaleLowerCase()
    );
  }

  searchAndReplace(text: string): string {
    this.wordList.forEach((word) => {
      word.settings = this.defaultSetting(word.settings);
      const flags = word.settings.matchCasing ? "" : "i";
      const re = new RegExp(`\\b${word.word}\\b`, flags);
      const match = text.match(re);
      if (match) {
        const replaceValue = word.settings.keepCasingOnFirstCharacter
          ? Dictionary.keepCasingOnFirstChar(match[0], word.replacement)
          : word.replacement;
        text = text.replace(re, replaceValue);
      }
    });
    return text;
  }

  translateList(wordList: string[]): string[] {
    return wordList.map((word): string => {
      return this.translate(word);
    });
  }

  translate(word: string): string {
    const foundWord = this.find(word);
    if (foundWord === undefined) {
      return word;
    }
    foundWord.settings = this.defaultSetting(foundWord.settings);
    const translatedWord = foundWord.settings.keepCasingOnFirstCharacter
      ? Dictionary.keepCasingOnFirstChar(word, foundWord.replacement)
      : foundWord.replacement;
    return translatedWord;
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

interface IDictonary {
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
