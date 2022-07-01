export class InvalidXmlError extends Error {
  constructor(
    msg: string,
    public path: string,
    public index: number,
    public length: number
  ) {
    super(msg);
    this.name = "InvalidXmlError";
  }
}

export class InvalidTranslationUnitError extends Error {
  constructor(msg: string, public id?: string, public path?: string) {
    super(msg);
    this.name = "InvalidTranslationUnitError";
  }
}

/**
 * Thrown when a Json file cannot be parsed as valid Json
 */
export class InvalidJsonError extends Error {
  constructor(msg: string, public path: string, public content: string) {
    super(msg);
    this.name = "InvalidJsonError";
  }
}
/**
 * Thrown when there is no language files (xlf files) in the Translation folder
 */
export class NoLanguageFilesError extends Error {
  constructor(msg: string, public path: string) {
    super(msg);
    this.name = "NoLanguageFilesError";
  }
}
