import * as fs from "graceful-fs";
import {
  Xliff,
  TargetState,
  CustomNoteType,
  TranslationToken,
  TransUnit,
} from "../../Xliff/XLIFFDocument";
import { LanguageFunctionsSettings } from "../../Settings/LanguageFunctionsSettings";
import { AppManifest, Settings } from "../../Settings/Settings";
import * as XliffFunctions from "../../XliffFunctions";
import { getAppManifestFromXlfPath } from "./ToolHelpers";

/**
 * Core XLIFF functionality that is independent of VS Code.
 * This module can be used by both ChatTools (with VS Code) and MCP tools (without VS Code).
 */

export interface ITelemetryData {
  [key: string]: string | number | boolean | undefined;
}

export interface ICoreResult<T> {
  data: T;
  telemetry: ITelemetryData;
}

export interface IUntranslatedText {
  id: string;
  sourceText: string;
  sourceLanguage: string;
  comment?: string;
  maxLength?: number;
  type: string;
}

export interface ITranslatedText {
  sourceText: string;
  targetTexts: string[];
  sourceLanguage: string;
}

export interface ITranslatedTextWithState {
  id: string;
  sourceText: string;
  sourceLanguage: string;
  targetText: string;
  comment?: string;
  translationState?: string;
  reviewReason?: string;
  maxLength?: number;
  type: string;
}

export interface ITranslationToSave {
  id: string;
  targetText: string;
  targetState?: string;
}

/**
 * Core logic for getting untranslated texts from XLF file
 */
export function getTextsToTranslateCore(
  filePath: string,
  offset = 0,
  limit: number,
  sourceLanguageFilePath?: string
): ICoreResult<IUntranslatedText[]> {
  // Validation
  if (!filePath) {
    throw new Error(
      "The File path parameter is required. Please provide an absolute path to an XLF file. The path must be absolute, not relative."
    );
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `The file at path ${filePath} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
    );
  }

  const useCustomSourceLanguage = sourceLanguageFilePath
    ? sourceLanguageFilePath !== ""
    : false;
  const defaultLanguage = "en-US";
  let sourceLanguage = defaultLanguage;

  let sourceXliffDoc: Xliff | undefined;
  if (useCustomSourceLanguage) {
    const sourceLanguageFilePathNonNull = sourceLanguageFilePath || "";
    if (!fs.existsSync(sourceLanguageFilePathNonNull)) {
      throw new Error(
        `The source language file at path ${sourceLanguageFilePathNonNull} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
      );
    }
    sourceXliffDoc = Xliff.fromFileSync(sourceLanguageFilePathNonNull);
    sourceLanguage = sourceXliffDoc.targetLanguage;
  }

  const xliffDoc = Xliff.fromFileSync(filePath);

  if (!xliffDoc) {
    throw new Error(
      `Failed to load XLIFF document from ${filePath}. Please ensure the file is a valid XLIFF file.`
    );
  }

  let counter = 0;
  const untranslatedTexts = xliffDoc.transunit.filter((tu) =>
    tu.needsTranslation()
  );
  const response: IUntranslatedText[] = [];

  untranslatedTexts.forEach((tu) => {
    counter++;
    if (counter - offset > limit && limit !== 0) {
      return;
    }
    if (counter > offset) {
      let sourceText = tu.source;
      let currentSourceLanguage = sourceLanguage;
      if (useCustomSourceLanguage) {
        const sourceTu = sourceXliffDoc?.getTransUnitById(tu.id);
        if (sourceTu) {
          sourceText = sourceTu.target.textContent;
        } else {
          currentSourceLanguage = defaultLanguage;
        }
      }
      let maxLength = undefined;
      if (tu.maxwidth) {
        maxLength = tu.maxwidth;
      }
      response.push({
        id: tu.id,
        sourceText: sourceText,
        sourceLanguage: currentSourceLanguage,
        maxLength: maxLength,
        comment: !tu.developerNote()
          ? undefined
          : tu.developerNoteContent() === ""
          ? undefined
          : tu.developerNoteContent(),
        type: tu.xliffGeneratorNoteContent(),
      });
    }
  });

  // Prepare telemetry data
  const telemetryData: ITelemetryData = {
    sourceLanguage: sourceLanguage,
    targetLanguage: xliffDoc.targetLanguage,
    offset: offset,
    limit: limit,
    resultCount: response.length,
  };

  return {
    data: response,
    telemetry: telemetryData,
  };
}

/**
 * Core logic for saving translated texts to XLF file
 */
export function saveTranslatedTextsCore(
  filePath: string,
  translations: ITranslationToSave[],
  settings: Settings,
  _languageFunctionsSettings?: LanguageFunctionsSettings
): ICoreResult<string> {
  // Validation
  if (!filePath) {
    throw new Error(
      "The File path parameter is required. Please provide an absolute path to an XLF file. The path must be absolute, not relative."
    );
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `The file at path ${filePath} does not exist. Please provide a valid file path.`
    );
  }

  const xliffDoc = Xliff.fromFileSync(filePath);

  if (!xliffDoc) {
    throw new Error(
      `Failed to load XLIFF document from ${filePath}. Please ensure the file is a valid XLIFF file.`
    );
  }
  const languageFunctionsSettings =
    _languageFunctionsSettings ?? new LanguageFunctionsSettings(settings);

  let translatedCount = 0;
  for (const translation of translations) {
    const tu = xliffDoc.transunit.find((tu) => tu.id === translation.id);
    if (tu) {
      tu.target.textContent = translation.targetText;
      translatedCount++;
      if (languageFunctionsSettings.useTargetStates) {
        switch (translation.targetState) {
          case undefined:
            tu.target.state = TargetState.translated;
            break;
          case "needs-review-translation":
            tu.target.state = TargetState.needsReviewTranslation;
            break;
          case "translated":
            tu.target.state = TargetState.translated;
            break;
          case "final":
            tu.target.state = TargetState.final;
            break;
          case "signed-off":
            tu.target.state = TargetState.signedOff;
            break;
          default:
            throw new Error(
              `Invalid target state: ${translation.targetState}. Valid states are: needs-review-translation, translated, final, signed-off.`
            );
        }
      } else {
        tu.target.translationToken = undefined; // Clear the translation token
      }
      tu.removeCustomNote(CustomNoteType.refreshXlfHint);
    } else {
      throw new Error(`Translation unit with id ${translation.id} not found.`);
    }
  }

  xliffDoc.toFileSync(
    filePath,
    languageFunctionsSettings.replaceSelfClosingXlfTags,
    languageFunctionsSettings.formatXml,
    languageFunctionsSettings.searchReplaceBeforeSaveXliff,
    "UTF8"
  );

  const pluralize = (text: string, count: number): string => {
    if (count === 1) {
      return text;
    }
    return `${text}s`; // Simple pluralization
  };

  const result = `${translatedCount} ${pluralize(
    "translation",
    translatedCount
  )} saved successfully.`;

  // Prepare telemetry data
  const telemetryData: ITelemetryData = {
    targetLanguage: xliffDoc.targetLanguage,
    savedCount: translatedCount,
  };

  return {
    data: result,
    telemetry: telemetryData,
  };
}

/**
 * Core logic for refreshing XLF from generated XLF
 */
export async function refreshXlfFromGXlfCore(
  generatedXlfFilePath: string,
  targetXlfFilePath: string,
  settings: Settings
): Promise<ICoreResult<string>> {
  // Validation
  if (!generatedXlfFilePath) {
    throw new Error(
      "The generated XLF file path parameter is required. Please provide an absolute path to the generated XLF file (*.g.xlf)."
    );
  }
  if (!fs.existsSync(generatedXlfFilePath)) {
    throw new Error(
      `The generated XLF file at path ${generatedXlfFilePath} does not exist. Please provide a valid file path.`
    );
  }
  if (!targetXlfFilePath) {
    throw new Error(
      "The target XLF file path parameter is required. Please provide an absolute path to the target XLF file."
    );
  }
  if (!fs.existsSync(targetXlfFilePath)) {
    throw new Error(
      `The target XLF file at path ${targetXlfFilePath} does not exist. Please provide a valid file path.`
    );
  }

  const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
  // Get app manifest
  const appManifest = getAppManifestFromXlfPath(generatedXlfFilePath);

  // Use the existing XliffFunctions module with the private function
  const result = await XliffFunctions.refreshXlfFilesFromGXlf({
    gXlfFilePath: generatedXlfFilePath,
    targetXlfFilePath: targetXlfFilePath,
    languageFunctionsSettings,
    sortOnly: false,
    settings,
    appManifest,
  });

  const report = result.getReport();

  // Prepare telemetry data (empty for refresh operation)
  const telemetryData: ITelemetryData = {};

  return {
    data: report,
    telemetry: telemetryData,
  };
}

/**
 * Core logic for getting translated texts map
 */
export function getTranslatedTextsMapCore(
  filePath: string,
  offset = 0,
  limit: number,
  sourceLanguageFilePath?: string
): ICoreResult<ITranslatedText[]> {
  // Validation
  if (!filePath) {
    throw new Error(
      "The File path parameter is required. Please provide an absolute path to an XLF file. The path must be absolute, not relative."
    );
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `The file at path ${filePath} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
    );
  }

  const useCustomSourceLanguage = sourceLanguageFilePath
    ? sourceLanguageFilePath !== ""
    : false;
  const defaultLanguage = "en-US";
  let sourceLanguage = defaultLanguage;

  let sourceXliffDoc: Xliff | undefined;
  if (useCustomSourceLanguage) {
    const sourceLanguageFilePathNonNull = sourceLanguageFilePath || "";
    if (!fs.existsSync(sourceLanguageFilePathNonNull)) {
      throw new Error(
        `The source language file at path ${sourceLanguageFilePathNonNull} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
      );
    }
    sourceXliffDoc = Xliff.fromFileSync(sourceLanguageFilePathNonNull);
    sourceLanguage = sourceXliffDoc.targetLanguage;
  }

  const xliffDoc = Xliff.fromFileSync(filePath);

  if (!xliffDoc) {
    throw new Error(
      `Failed to load XLIFF document from ${filePath}. Please ensure the file is a valid XLIFF file.`
    );
  }

  let counter = 0;
  const map = xliffDoc.translationMap();
  const response: ITranslatedText[] = [];
  map.forEach((item, key) => {
    counter++;
    if (counter - offset > limit && limit !== 0) {
      return;
    }
    if (counter > offset) {
      let sourceText = key;
      let currentSourceLanguage = sourceLanguage;
      if (useCustomSourceLanguage) {
        const sourceTu = sourceXliffDoc?.getTransUnitsBySource(key)[0];
        if (sourceTu) {
          sourceText = sourceTu.target.textContent;
        } else {
          currentSourceLanguage = defaultLanguage;
        }
      }
      response.push({
        sourceText: sourceText,
        targetTexts: item,
        sourceLanguage: currentSourceLanguage,
      });
    }
  });

  // Prepare telemetry data
  const telemetryData: ITelemetryData = {
    sourceLanguage: sourceLanguage,
    targetLanguage: xliffDoc.targetLanguage,
    resultCount: response.length,
    offset: offset,
    limit: limit,
  };

  return {
    data: response,
    telemetry: telemetryData,
  };
}

/**
 * Core logic for getting translated texts by state
 */
export function getTranslatedTextsByStateCore(
  filePath: string,
  offset = 0,
  limit: number,
  translationStateFilter?: string,
  sourceText?: string,
  sourceLanguageFilePath?: string
): ICoreResult<ITranslatedTextWithState[]> {
  // Validation
  if (!filePath) {
    throw new Error(
      "The File path parameter is required. Please provide an absolute path to an XLF file. The path must be absolute, not relative."
    );
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `The file at path ${filePath} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
    );
  }

  const useCustomSourceLanguage = sourceLanguageFilePath
    ? sourceLanguageFilePath !== ""
    : false;
  const defaultLanguage = "en-US";
  let sourceLanguage = defaultLanguage;
  let sourceXliffDoc: Xliff | undefined;
  if (useCustomSourceLanguage) {
    const sourceLanguageFilePathNonNull = sourceLanguageFilePath || "";
    if (!fs.existsSync(sourceLanguageFilePathNonNull)) {
      throw new Error(
        `The source language file at path ${sourceLanguageFilePathNonNull} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
      );
    }
    sourceXliffDoc = Xliff.fromFileSync(sourceLanguageFilePathNonNull);
    sourceLanguage = sourceXliffDoc.targetLanguage;
  }

  const xliffDoc = Xliff.fromFileSync(filePath);

  if (!xliffDoc) {
    throw new Error(
      `Failed to load XLIFF document from ${filePath}. Please ensure the file is a valid XLIFF file.`
    );
  }
  let counter = 0;
  const translationsToExport = xliffDoc.transunit.filter((tu) =>
    shouldBeExported(tu, translationStateFilter, sourceText)
  );
  const response: ITranslatedTextWithState[] = [];
  translationsToExport.forEach((tu) => {
    counter++;
    if (counter - offset > limit && limit !== 0) {
      return;
    }
    if (counter > offset) {
      let sourceText = tu.source;
      let currentSourceLanguage = sourceLanguage;
      if (useCustomSourceLanguage) {
        const sourceTu = sourceXliffDoc?.getTransUnitById(tu.id);
        if (sourceTu) {
          sourceText = sourceTu.target.textContent;
        } else {
          currentSourceLanguage = defaultLanguage;
        }
      }
      let maxLength = undefined;
      if (tu.maxwidth) {
        maxLength = tu.maxwidth;
      }
      response.push({
        id: tu.id,
        sourceText: sourceText,
        sourceLanguage: currentSourceLanguage,
        targetText: tu.target.textContent,
        maxLength: maxLength,
        comment: !tu.developerNote()
          ? undefined
          : tu.developerNoteContent() === ""
          ? undefined
          : tu.developerNoteContent(),
        reviewReason: getReviewReason(tu),
        translationState: getTranslationState(tu),
        type: tu.xliffGeneratorNoteContent(),
      });
    }
  });

  // Prepare telemetry data
  const telemetryData: ITelemetryData = {
    sourceLanguage: sourceLanguage,
    targetLanguage: xliffDoc.targetLanguage,
    resultCount: response.length,
    offset: offset,
    limit: limit,
    translationStateFilter: translationStateFilter || "all",
  };

  return {
    data: response,
    telemetry: telemetryData,
  };

  function shouldBeExported(
    tu: TransUnit,
    translationStateFilter: string | undefined,
    sourceText: string | undefined
  ): boolean {
    if (tu.target.textContent === "") {
      return false;
    }
    if (sourceText && tu.source !== sourceText) {
      return false; // Filter by source text if provided
    }
    switch (translationStateFilter) {
      case undefined:
      case "":
        return true;
      case "translated":
        return (
          tu.target.state === "translated" ||
          (!tu.target.state && !tu.target.translationToken)
        );
      case "needs-review":
        return tu.needsReview();
      case "final":
        return tu.targetState === TargetState.final;
      case "signed-off":
        return tu.targetState === TargetState.signedOff;
      default:
        throw new Error(
          `Invalid translation state filter: ${translationStateFilter}. Valid states are 'translated', 'needs-review', 'final','signed-off'. Skip this filter to include all translations.`
        );
    }
  }
}

/**
 * Core logic for finding texts by keyword/phrase or regex in the source or target text.
 * Returns the same shape as getTranslatedTextsByStateCore but matches by substring/regex
 * on the source or target text and includes untranslated units (when searching source only).
 */
export function getTextsByKeywordCore(
  filePath: string,
  offset = 0,
  limit: number,
  keyword: string,
  caseSensitive = false,
  isRegex = false,
  searchInTarget = false
): ICoreResult<ITranslatedTextWithState[]> {
  // Validation
  if (!filePath) {
    throw new Error(
      "The File path parameter is required. Please provide an absolute path to an XLF file. The path must be absolute, not relative."
    );
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `The file at path ${filePath} does not exist. Please provide a valid file path. The path must be absolute, not relative.`
    );
  }

  if (!keyword) {
    throw new Error(
      "The keyword parameter is required and must be a non-empty string."
    );
  }

  const xliffDoc = Xliff.fromFileSync(filePath);

  if (!xliffDoc) {
    throw new Error(
      `Failed to load XLIFF document from ${filePath}. Please ensure the file is a valid XLIFF file.`
    );
  }

  let counter = 0;
  const response: ITranslatedTextWithState[] = [];

  // Prepare matcher
  let regex: RegExp | undefined = undefined;
  if (isRegex) {
    try {
      regex = new RegExp(keyword, caseSensitive ? "" : "i");
    } catch (err) {
      throw new Error(
        `Invalid regular expression: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    }
  }

  const matches = xliffDoc.transunit.filter((tu) => {
    if (searchInTarget && !tu.target.textContent) {
      // Exclude untranslated units when searching in target
      return false;
    }
    const textToSearch = searchInTarget
      ? tu.target.textContent
      : tu.source || "";
    if (isRegex && regex) {
      return regex.test(textToSearch);
    }
    if (caseSensitive) {
      return textToSearch.includes(keyword);
    }
    return textToSearch.toLowerCase().includes(keyword.toLowerCase());
  });

  matches.forEach((tu) => {
    counter++;
    if (counter - offset > limit && limit !== 0) {
      return;
    }
    if (counter > offset) {
      let maxLength = undefined;
      if (tu.maxwidth) {
        maxLength = tu.maxwidth;
      }
      response.push({
        id: tu.id,
        sourceText: tu.source,
        sourceLanguage: xliffDoc.sourceLanguage,
        targetText: tu.target.textContent,
        maxLength: maxLength,
        comment: !tu.developerNote()
          ? undefined
          : tu.developerNoteContent() === ""
          ? undefined
          : tu.developerNoteContent(),
        reviewReason: getReviewReason(tu),
        translationState: getTranslationState(tu),
        type: tu.xliffGeneratorNoteContent(),
      });
    }
  });

  const telemetryData: ITelemetryData = {
    targetLanguage: xliffDoc.targetLanguage,
    resultCount: response.length,
    offset: offset,
    limit: limit,
    keyword: keyword,
    caseSensitive: caseSensitive,
    isRegex: isRegex,
    searchInTarget: searchInTarget,
  };

  return {
    data: response,
    telemetry: telemetryData,
  };
}

/**
 * Gets the review reason based on NAB tokens and state qualifiers
 */
function getReviewReason(tu: TransUnit): string | undefined {
  if (tu.targetState === "" && tu.targetTranslationToken === "") {
    return undefined;
  }
  const reason = tu.customNoteContent(CustomNoteType.refreshXlfHint);
  if (reason !== "") {
    return reason;
  }
  const targetStateExplanations: Record<TargetState, string> = {
    [TargetState.final]:
      "The translation has been finalized and should not be modified.",
    [TargetState.needsAdaptation]:
      "The translation requires adaptation for non-textual content (like formatting or images).",
    [TargetState.needsL10n]:
      "The translation requires localization for both textual and non-textual content.",
    [TargetState.needsReviewAdaptation]:
      "The non-textual content in the translation needs review.",
    [TargetState.needsReviewL10n]:
      "Both the text and non-textual content need review for localization.",
    [TargetState.needsReviewTranslation]:
      "The translated text needs review before it can be considered final.",
    [TargetState.needsTranslation]: "The content still needs to be translated.",
    [TargetState.new]:
      "The translation unit is new and has not been processed yet.",
    [TargetState.signedOff]: "The translation has been reviewed and approved.",
    [TargetState.translated]:
      "The content has been translated but not yet reviewed or approved.",
  };
  const targetStateExplanation = tu.target.state
    ? targetStateExplanations[tu.target.state]
    : "";
  if (targetStateExplanation) {
    return targetStateExplanation;
  }
  return undefined;
}

function getTranslationState(tu: TransUnit): string | undefined {
  if (tu.targetState === "" && tu.targetTranslationToken === "") {
    return undefined;
  }
  switch (tu.target.translationToken) {
    case TranslationToken.review:
    case TranslationToken.suggestion:
      return "needs-review";
  }
  if (tu.targetState) {
    return tu.targetState;
  }

  return "translated"; // Not using target states, and have no translation token, so we assume it's translated.
}

/**
 * Core logic for creating a target XLF file
 */
export async function createTargetXlfFileCore(
  settings: Settings,
  gXlfPath: string,
  targetLanguage: string,
  matchBaseAppTranslation: boolean,
  appManifest: AppManifest
): Promise<
  ICoreResult<{
    numberOfMatches: number;
    targetXlfFilepath: string;
  }>
> {
  const result = await XliffFunctions.createTargetXlfFile(
    settings,
    gXlfPath,
    targetLanguage,
    matchBaseAppTranslation,
    appManifest
  );

  // Prepare telemetry data
  const telemetryData: ITelemetryData = {
    targetLanguage: targetLanguage,
    numberOfMatches: result.numberOfMatches,
    matchBaseAppTranslation: matchBaseAppTranslation,
  };

  return {
    data: result,
    telemetry: telemetryData,
  };
}
