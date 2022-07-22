/**
 * The super class for Xliff formatting errors
 */
export class InvalidXliffError extends Error {
  constructor(msg: string, public path?: string) {
    super(msg);
    this.name = "InvalidXliffError";
  }
}

/**
 * Thrown when there is invalid or no xml in the Xliff data
 */
export class InvalidXmlError extends InvalidXliffError {
  constructor(
    msg: string,
    public path: string,
    public index: number,
    public length: number
  ) {
    super(msg, path);
    this.name = "InvalidXmlError";
  }
}

/**
 * Thrown when there are Translation Units inside other Translation Units
 */
export class InvalidTranslationUnitError extends InvalidXliffError {
  constructor(msg: string, public id?: string, path?: string) {
    super(msg, path);
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
