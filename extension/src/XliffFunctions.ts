import * as fs from "fs";
import * as path from "path";
import * as WorkspaceFunctions from "./WorkspaceFunctions";
import {
  CustomNoteType,
  StateQualifier,
  Target,
  TargetState,
  TranslationToken,
  TransUnit,
  Xliff,
} from "./Xliff/XLIFFDocument";
import {
  baseAppTranslationFiles,
  localBaseAppTranslationFiles,
} from "./externalresources/BaseAppTranslationFiles";
import { readFileSync } from "fs";
import { AppManifest, Settings } from "./Settings/Settings";
import * as FileFunctions from "./FileFunctions";
import { Dictionary } from "./Dictionary";
import { RefreshXlfHint, TranslationMode } from "./Enums";
import { LanguageFunctionsSettings } from "./Settings/LanguageFunctionsSettings";
import { RefreshResult } from "./RefreshResult";

export async function getGXlfDocument(
  settings: Settings,
  appManifest: AppManifest
): Promise<{
  fileName: string;
  gXlfDoc: Xliff;
}> {
  const gXlfPath = WorkspaceFunctions.getGXlfFilePath(settings, appManifest);
  if (gXlfPath === undefined) {
    throw new Error("No g.xlf file was found");
  }

  const gXlfDoc = Xliff.fromFileSync(gXlfPath, "utf8");
  return {
    fileName: FileFunctions.getFilename(gXlfPath),
    gXlfDoc: gXlfDoc,
  };
}

export async function updateGXlfFromAlFiles(
  settings: Settings,
  appManifest: AppManifest
): Promise<RefreshResult> {
  const gXlfDocument = await getGXlfDocument(settings, appManifest);

  const totals = new RefreshResult();
  totals.fileName = gXlfDocument.fileName;

  let alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
    settings,
    appManifest,
    true
  );
  alObjects = alObjects
    .sort((a, b) => (a.objectName < b.objectName ? -1 : 1))
    .sort((a, b) => (a.objectType < b.objectType ? -1 : 1));
  alObjects.forEach((alObject) => {
    const result = updateGXlf(gXlfDocument.gXlfDoc, alObject.getTransUnits());
    totals.numberOfAddedTransUnitElements +=
      result.numberOfAddedTransUnitElements;
    totals.numberOfRemovedTransUnits += result.numberOfRemovedTransUnits;
    totals.numberOfUpdatedMaxWidths += result.numberOfUpdatedMaxWidths;
    totals.numberOfUpdatedNotes += result.numberOfUpdatedNotes;
    totals.numberOfUpdatedSources += result.numberOfUpdatedSources;
  });
  const gXlfFilePath = WorkspaceFunctions.getGXlfFilePath(
    settings,
    appManifest
  );
  gXlfDocument.gXlfDoc.toFileSync(gXlfFilePath, true, true, "utf8bom");

  return totals;
}

export function updateGXlf(
  gXlfDoc: Xliff | null,
  transUnits: TransUnit[] | null
): RefreshResult {
  const result = new RefreshResult();
  if (gXlfDoc === null || transUnits === null) {
    return result;
  }
  transUnits.forEach((transUnit) => {
    const gTransUnit = gXlfDoc.transunit.find((x) => x.id === transUnit.id);
    if (gTransUnit) {
      if (!transUnit.translate) {
        gXlfDoc.transunit = gXlfDoc.transunit.filter(
          (x) => x.id !== transUnit.id
        );
        result.numberOfRemovedTransUnits++;
      } else {
        if (gTransUnit.source !== transUnit.source) {
          gTransUnit.source = transUnit.source;
          result.numberOfUpdatedSources++;
        }
        if (gTransUnit.maxwidth !== transUnit.maxwidth) {
          gTransUnit.maxwidth = transUnit.maxwidth;
          result.numberOfUpdatedMaxWidths++;
        }
        if (transUnit.notes) {
          if (gTransUnit.notes) {
            if (
              gTransUnit.developerNote().toString() !==
              transUnit.developerNote().toString()
            ) {
              result.numberOfUpdatedNotes++;
            }
          } else {
            result.numberOfUpdatedNotes++;
          }

          gTransUnit.notes = transUnit.notes;
        }
        if (gTransUnit.sizeUnit !== transUnit.sizeUnit) {
          gTransUnit.sizeUnit = transUnit.sizeUnit;
        }
        if (gTransUnit.translate !== transUnit.translate) {
          gTransUnit.translate = transUnit.translate;
        }
      }
    } else if (transUnit.translate) {
      gXlfDoc.transunit.push(transUnit);
      result.numberOfAddedTransUnitElements++;
    }
  });
  return result;
}

export async function refreshXlfFilesFromGXlf({
  settings,
  appManifest,
  sortOnly,
  matchXlfFilePath,
  languageFunctionsSettings,
}: {
  settings: Settings;
  appManifest: AppManifest;
  sortOnly?: boolean;
  matchXlfFilePath?: string;
  languageFunctionsSettings: LanguageFunctionsSettings;
}): Promise<RefreshResult> {
  sortOnly = sortOnly === null ? false : sortOnly;
  const suggestionsMaps = await createSuggestionMaps(
    settings,
    appManifest,
    languageFunctionsSettings,
    matchXlfFilePath
  );
  const gXlfFileUri = WorkspaceFunctions.getGXlfFilePath(settings, appManifest);
  const langFiles = WorkspaceFunctions.getLangXlfFiles(settings, appManifest);
  return await _refreshXlfFilesFromGXlf({
    gXlfFilePath: gXlfFileUri,
    langFiles,
    languageFunctionsSettings,
    sortOnly,
    suggestionsMaps,
  });
}

export async function _refreshXlfFilesFromGXlf({
  gXlfFilePath,
  langFiles,
  languageFunctionsSettings,
  sortOnly,
  suggestionsMaps = new Map(),
}: {
  gXlfFilePath: string;
  langFiles: string[];
  languageFunctionsSettings: LanguageFunctionsSettings;
  sortOnly?: boolean;
  suggestionsMaps?: Map<string, Map<string, string[]>[]>;
}): Promise<RefreshResult> {
  const refreshResult = new RefreshResult();
  refreshResult.numberOfCheckedFiles = langFiles.length;
  const gXliff = Xliff.fromFileSync(gXlfFilePath, "utf8");
  // 1. Sync with gXliff
  // 2. Match with
  //    - Itself
  //    - Selected matching file
  //    - Files from configured suggestions paths
  //    - Base Application

  for (let langIndex = 0; langIndex < langFiles.length; langIndex++) {
    const langXlfFilePath = langFiles[langIndex];
    const langXliff = Xliff.fromFileSync(langXlfFilePath);

    const newLangXliff = refreshSelectedXlfFileFromGXlf(
      langXliff,
      gXliff,
      languageFunctionsSettings,
      suggestionsMaps,
      refreshResult,
      sortOnly
    );
    newLangXliff.toFileSync(
      langXlfFilePath,
      languageFunctionsSettings.replaceSelfClosingXlfTags
    );
  }

  return refreshResult;
}
export function refreshSelectedXlfFileFromGXlf(
  langXliff: Xliff,
  gXliff: Xliff,
  languageFunctionsSettings: LanguageFunctionsSettings,
  suggestionsMaps: Map<string, Map<string, string[]>[]>,
  refreshResult: RefreshResult,
  sortOnly = false
): Xliff {
  const transUnitsToTranslate = gXliff.transunit.filter((x) => x.translate);
  const langMatchMap = getXlfMatchMap(langXliff);
  const gXlfFileName = path.basename(gXliff._path);
  const langIsSameAsGXlf = langXliff.targetLanguage === gXliff.targetLanguage;
  const newLangXliff = langXliff.cloneWithoutTransUnits();

  newLangXliff.original = gXlfFileName;
  newLangXliff.lineEnding = langXliff.lineEnding;

  for (let index = 0; index < transUnitsToTranslate.length; index++) {
    const gTransUnit = transUnitsToTranslate[index];
    const langTransUnit = langXliff.transunit.filter(
      (x) => x.id === gTransUnit.id
    )[0];

    if (langTransUnit !== undefined) {
      if (!sortOnly) {
        if (!langTransUnit.hasTargets()) {
          langTransUnit.targets.push(
            getNewTarget(
              languageFunctionsSettings.translationMode,
              langIsSameAsGXlf,
              gTransUnit
            )
          );
          if (langIsSameAsGXlf) {
            langTransUnit.insertCustomNote(
              CustomNoteType.refreshXlfHint,
              RefreshXlfHint.newCopiedSource
            );
          } else {
            langTransUnit.insertCustomNote(
              CustomNoteType.refreshXlfHint,
              RefreshXlfHint.new
            );
          }
          refreshResult.numberOfAddedTransUnitElements++;
        }
        if (langTransUnit.source !== gTransUnit.source) {
          if (
            langIsSameAsGXlf &&
            langTransUnit.hasTargets() &&
            langTransUnit.targetMatchesSource()
          ) {
            langTransUnit.target.textContent = gTransUnit.source;
          }
          // Source has changed
          if (gTransUnit.source !== "") {
            switch (languageFunctionsSettings.translationMode) {
              case TranslationMode.external:
                langTransUnit.target.state = TargetState.needsAdaptation;
                break;
              case TranslationMode.dts:
                langTransUnit.target.state = TargetState.needsReviewTranslation;
                break;
              default:
                langTransUnit.target.state = undefined;
                langTransUnit.target.translationToken = TranslationToken.review;
                break;
            }
            langTransUnit.insertCustomNote(
              CustomNoteType.refreshXlfHint,
              RefreshXlfHint.modifiedSource
            );
            langTransUnit.target.stateQualifier = undefined;
          }
          langTransUnit.source = gTransUnit.source;
          refreshResult.numberOfUpdatedSources++;
        }
        if (
          langTransUnit.maxwidth !== gTransUnit.maxwidth &&
          languageFunctionsSettings.translationMode !== TranslationMode.dts
        ) {
          langTransUnit.maxwidth = gTransUnit.maxwidth;
          refreshResult.numberOfUpdatedMaxWidths++;
        }
        if (
          langTransUnit.developerNoteContent() !==
          gTransUnit.developerNoteContent()
        ) {
          if (langTransUnit.developerNote() === undefined) {
            langTransUnit.notes.push(gTransUnit.developerNote());
          } else {
            langTransUnit.developerNote().textContent = gTransUnit.developerNote().textContent;
          }
          refreshResult.numberOfUpdatedNotes++;
        }
        if (langTransUnit.sourceIsEmpty() && langTransUnit.targetIsEmpty()) {
          langTransUnit.insertCustomNote(
            CustomNoteType.refreshXlfHint,
            RefreshXlfHint.emptySource
          );
          refreshResult.numberOfReviewsAdded++;
        }
        formatTransUnitForTranslationMode(
          languageFunctionsSettings.translationMode,
          langTransUnit
        );
        detectInvalidValues(langTransUnit, languageFunctionsSettings);
        if (langTransUnit.needsReview(true)) {
          refreshResult.numberOfReviewsAdded++;
        }
      }
      newLangXliff.transunit.push(langTransUnit);
      langXliff.transunit.splice(langXliff.transunit.indexOf(langTransUnit), 1); // Remove all handled TransUnits -> The rest will be deleted.
    } else {
      // Does not exist in target
      if (!sortOnly) {
        const newTransUnit = TransUnit.fromString(gTransUnit.toString());
        newTransUnit.targets = [];
        newTransUnit.targets.push(
          getNewTarget(
            languageFunctionsSettings.translationMode,
            langIsSameAsGXlf,
            gTransUnit
          )
        );
        if (langIsSameAsGXlf) {
          newTransUnit.insertCustomNote(
            CustomNoteType.refreshXlfHint,
            RefreshXlfHint.newCopiedSource
          );
        } else {
          newTransUnit.insertCustomNote(
            CustomNoteType.refreshXlfHint,
            RefreshXlfHint.new
          );
        }
        if (newTransUnit.sourceIsEmpty()) {
          newTransUnit.insertCustomNote(
            CustomNoteType.refreshXlfHint,
            RefreshXlfHint.emptySource
          );
        }
        formatTransUnitForTranslationMode(
          languageFunctionsSettings.translationMode,
          newTransUnit
        );
        detectInvalidValues(newTransUnit, languageFunctionsSettings);
        if (newTransUnit.needsReview(true)) {
          refreshResult.numberOfReviewsAdded++;
        }
        newLangXliff.transunit.push(newTransUnit);
        refreshResult.numberOfAddedTransUnitElements++;
      }
    }
  }
  refreshResult.numberOfRemovedTransUnits += langXliff.transunit.length;
  if (languageFunctionsSettings.useMatchingSetting) {
    // Match it's own translations
    addMapToSuggestionMap(
      suggestionsMaps,
      langXliff.targetLanguage,
      langMatchMap
    );
  }
  refreshResult.numberOfSuggestionsAdded += matchTranslationsFromTranslationMaps(
    newLangXliff,
    suggestionsMaps,
    languageFunctionsSettings
  );
  newLangXliff.transunit
    .filter(
      (tu) =>
        tu.hasCustomNote(CustomNoteType.refreshXlfHint) &&
        ((tu.target.translationToken === undefined &&
          (tu.target.state === undefined || tu.target.state === null)) ||
          tu.target.state === TargetState.translated ||
          tu.target.state === TargetState.signedOff ||
          tu.target.state === TargetState.final)
    )
    .forEach((tu) => {
      tu.removeCustomNote(CustomNoteType.refreshXlfHint);
      if (languageFunctionsSettings.translationMode === TranslationMode.dts) {
        tu.target.state = TargetState.translated;
        tu.target.stateQualifier = undefined;
      }
      refreshResult.numberOfRemovedNotes++;
    });
  return newLangXliff;
}

function getNewTarget(
  translationMode: TranslationMode,
  langIsSameAsGXlf: boolean,
  gTransUnit: TransUnit
): Target {
  if (gTransUnit.source === "") {
    return new Target("");
  }
  const newTargetText = langIsSameAsGXlf ? gTransUnit.source : "";
  switch (translationMode) {
    case TranslationMode.external:
      return new Target(
        newTargetText,
        langIsSameAsGXlf
          ? TargetState.needsAdaptation
          : TargetState.needsTranslation
      );
    case TranslationMode.dts: {
      const newTarget = new Target(
        newTargetText,
        langIsSameAsGXlf
          ? TargetState.needsReviewTranslation
          : TargetState.needsTranslation
      );
      newTarget.stateQualifier = langIsSameAsGXlf
        ? StateQualifier.exactMatch
        : undefined;
      return newTarget;
    }
    default:
      return new Target(
        (langIsSameAsGXlf
          ? TranslationToken.review
          : TranslationToken.notTranslated) + newTargetText
      );
  }
}

export function formatTransUnitForTranslationMode(
  translationMode: TranslationMode,
  transUnit: TransUnit
): void {
  switch (translationMode) {
    case TranslationMode.external:
      setTargetStateFromToken(transUnit);
      break;
    case TranslationMode.dts:
      setTargetStateFromToken(transUnit);
      // Might want to include this later, keep for now...
      // transUnit.removeDeveloperNoteIfEmpty();
      // transUnit.sizeUnit = undefined;
      // transUnit.maxwidth = undefined;
      // transUnit.alObjectTarget = undefined;
      break;
    default:
      if (transUnit.target.translationToken === undefined) {
        switch (transUnit.target.state) {
          case TargetState.new:
          case TargetState.needsTranslation:
            transUnit.target.translationToken = TranslationToken.notTranslated;
            break;
          case TargetState.needsAdaptation:
          case TargetState.needsL10n:
          case TargetState.needsReviewAdaptation:
          case TargetState.needsReviewL10n:
          case TargetState.needsReviewTranslation:
            transUnit.target.translationToken = TranslationToken.review;
            break;
          default:
            transUnit.target.translationToken = undefined;
            break;
        }
      }

      transUnit.target.state = undefined;
      transUnit.target.stateQualifier = undefined;
      break;
  }
}

function setTargetStateFromToken(transUnit: TransUnit): void {
  if (transUnit.target.state !== undefined || transUnit.target.state !== null) {
    return;
  }
  switch (transUnit.target.translationToken) {
    case TranslationToken.notTranslated:
      transUnit.target.state = TargetState.needsTranslation;
      transUnit.target.stateQualifier = undefined;
      break;
    case TranslationToken.review:
      transUnit.target.state = TargetState.needsReviewTranslation;
      transUnit.target.stateQualifier = undefined;
      break;
    case TranslationToken.suggestion:
      transUnit.target.state = TargetState.translated;
      transUnit.target.stateQualifier = StateQualifier.exactMatch;
      break;
    default:
      transUnit.target.state = TargetState.translated;
      transUnit.target.stateQualifier = undefined;
      break;
  }
  transUnit.target.translationToken = undefined;
}

export async function createSuggestionMaps(
  settings: Settings,
  appManifest: AppManifest,
  languageFunctionsSettings: LanguageFunctionsSettings,
  matchXlfFilePath?: string
): Promise<Map<string, Map<string, string[]>[]>> {
  const languageCodes = existingTargetLanguageCodes(settings, appManifest);
  const suggestionMaps: Map<string, Map<string, string[]>[]> = new Map();
  if (languageCodes === undefined) {
    return suggestionMaps;
  }
  // Maps added in reverse priority, lowest priority first in
  if (languageFunctionsSettings.matchBaseAppTranslation) {
    // Base Application translations
    for await (const langCode of languageCodes) {
      const baseAppTranslationMap = await getBaseAppTranslationMap(langCode);
      if (baseAppTranslationMap) {
        addMapToSuggestionMap(suggestionMaps, langCode, baseAppTranslationMap);
      }
    }
  }
  // Any configured translation paths
  languageFunctionsSettings.translationSuggestionPaths.forEach(
    (relFolderPath) => {
      const xlfFolderPath = path.join(
        settings.workspaceFolderPath,
        relFolderPath
      );
      fs.readdirSync(xlfFolderPath)
        .filter((item) => item.endsWith(".xlf") && !item.endsWith("g.xlf"))
        .forEach((fileName) => {
          const filePath = path.join(xlfFolderPath, fileName);
          addXliffToSuggestionMap(languageCodes, suggestionMaps, filePath);
        });
    }
  );

  // Manually selected match file
  if (matchXlfFilePath !== undefined) {
    const matchFilePath = matchXlfFilePath ? matchXlfFilePath : "";
    if (matchFilePath === "") {
      throw new Error("No xlf selected for matching");
    }
    addXliffToSuggestionMap(languageCodes, suggestionMaps, matchFilePath);
  }
  return suggestionMaps;
}

function addXliffToSuggestionMap(
  languageCodes: string[],
  suggestionMaps: Map<string, Map<string, string[]>[]>,
  filePath: string
): void {
  const matchXliff = Xliff.fromFileSync(filePath, "utf8");
  const langCode = matchXliff.targetLanguage.toLowerCase();
  if (languageCodes.includes(langCode)) {
    const matchMap = getXlfMatchMap(matchXliff);
    addMapToSuggestionMap(suggestionMaps, langCode, matchMap);
  }
}

function addMapToSuggestionMap(
  suggestionMaps: Map<string, Map<string, string[]>[]>,
  langCode: string,
  matchMap: Map<string, string[]>
): void {
  langCode = langCode.toLowerCase();
  if (!suggestionMaps.has(langCode)) {
    suggestionMaps.set(langCode, []);
  }
  const matchArray = suggestionMaps.get(langCode);
  matchArray?.push(matchMap);
}

export function matchTranslationsFromTranslationMap(
  xlfDocument: Xliff,
  matchMap: Map<string, string[]>,
  languageFunctionsSettings: LanguageFunctionsSettings
): number {
  let numberOfMatchedTranslations = 0;
  const xlf = xlfDocument;
  xlf.transunit
    .filter(
      (tu) =>
        !tu.hasTargets() ||
        tu.target.translationToken === TranslationToken.notTranslated ||
        tu.target.state === TargetState.needsTranslation
    )
    .forEach((transUnit) => {
      let suggestionAdded = false;
      if (
        languageFunctionsSettings.translationMode === TranslationMode.nabTags
      ) {
        matchMap.get(transUnit.source)?.forEach((target) => {
          transUnit.addTarget(new Target(TranslationToken.suggestion + target));
          numberOfMatchedTranslations++;
          suggestionAdded = true;
        });
      } else {
        const match = matchMap.get(transUnit.source);
        if (match !== undefined) {
          const newTarget = new Target(match[0], TargetState.translated);
          newTarget.stateQualifier = StateQualifier.exactMatch;
          transUnit.removeCustomNote(CustomNoteType.refreshXlfHint);
          transUnit.targets = [];
          transUnit.target = newTarget;
          changeStateForExactMatch(languageFunctionsSettings, transUnit);
          numberOfMatchedTranslations++;
          suggestionAdded = true;
        }
      }
      if (suggestionAdded) {
        // Remove "NAB: NOT TRANSLATED" if we've got suggestion(s)
        transUnit.targets = transUnit.targets.filter(
          (x) => x.translationToken !== TranslationToken.notTranslated
        );
        if (
          languageFunctionsSettings.translationMode === TranslationMode.nabTags
        ) {
          transUnit.insertCustomNote(
            CustomNoteType.refreshXlfHint,
            RefreshXlfHint.suggestion
          );
        }
      }
    });
  return numberOfMatchedTranslations;
}

export async function matchTranslationsFromBaseApp(
  xlfDoc: Xliff,
  languageFunctionsSettings: LanguageFunctionsSettings
): Promise<number> {
  const targetLanguage = xlfDoc.targetLanguage;
  let numberOfMatches = 0;
  const baseAppTranslationMap = await getBaseAppTranslationMap(targetLanguage);
  if (baseAppTranslationMap !== undefined) {
    numberOfMatches = matchTranslationsFromTranslationMap(
      xlfDoc,
      baseAppTranslationMap,
      languageFunctionsSettings
    );
  }
  return numberOfMatches;
}

export async function getBaseAppTranslationMap(
  targetLanguage: string
): Promise<Map<string, string[]> | undefined> {
  const persistantMsg = `If this persists, try disabling the setting "NAB: Match Base App Translation" and log an issue at https://github.com/jwikman/nab-al-tools/issues`;
  const targetFilename = targetLanguage.toLocaleLowerCase().concat(".json");
  let localTransFiles = localBaseAppTranslationFiles();
  if (!localTransFiles.has(targetFilename)) {
    const downloadResult = await baseAppTranslationFiles.getBlobs([
      targetFilename,
    ]);
    if (downloadResult.failed.length > 0) {
      throw new Error(
        `Failed to download translation map for ${targetLanguage}. ${persistantMsg}.`
      );
    }
    localTransFiles = localBaseAppTranslationFiles();
  }

  const baseAppJsonPath = localTransFiles.get(targetFilename);
  let parsedBaseApp = {};
  if (baseAppJsonPath !== undefined) {
    let fileErrorMsg = "";
    const baseAppJsonContent = readFileSync(baseAppJsonPath, "utf8");
    if (baseAppJsonContent.length === 0) {
      fileErrorMsg = `No content in file, file was deleted: "${baseAppJsonPath}".`;
    } else {
      try {
        parsedBaseApp = JSON.parse(baseAppJsonContent);
      } catch (err) {
        fileErrorMsg = `Could not parse match file for "${targetFilename}". Message: ${
          (err as Error).message
        }. ${persistantMsg}. Deleted corrupt file at: "${baseAppJsonPath}".`;
      }
    }
    if (fileErrorMsg !== "") {
      fs.unlinkSync(baseAppJsonPath);
      throw new Error(fileErrorMsg);
    }
  }
  return Object.keys(parsedBaseApp).length > 0
    ? new Map(Object.entries(parsedBaseApp))
    : undefined;
}

export function loadMatchXlfIntoMap(
  matchXlfDom: Document,
  xmlns: string
): Map<string, string[]> {
  const matchMap: Map<string, string[]> = new Map();
  const matchTransUnitNodes = matchXlfDom.getElementsByTagNameNS(
    xmlns,
    "trans-unit"
  );
  for (let i = 0, len = matchTransUnitNodes.length; i < len; i++) {
    const matchTransUnitElement = matchTransUnitNodes[i];
    const matchSourceElement = matchTransUnitElement.getElementsByTagNameNS(
      xmlns,
      "source"
    )[0];
    const matchTargetElement = matchTransUnitElement.getElementsByTagNameNS(
      xmlns,
      "target"
    )[0];
    if (matchSourceElement && matchTargetElement) {
      const source = matchSourceElement.textContent
        ? matchSourceElement.textContent
        : "";
      const target = matchTargetElement.textContent
        ? matchTargetElement.textContent
        : "";
      if (
        source !== "" &&
        target !== "" &&
        !(
          target.includes(TranslationToken.review) ||
          target.includes(TranslationToken.notTranslated) ||
          target.includes(TranslationToken.suggestion)
        )
      ) {
        let mapElements = matchMap.get(source);
        let updateMap = true;
        if (mapElements) {
          if (!mapElements.includes(target)) {
            mapElements.push(target);
          } else {
            updateMap = false;
          }
        } else {
          mapElements = [target];
        }
        if (updateMap) {
          matchMap.set(source, mapElements);
        }
      }
    }
  }
  return matchMap;
}

export function getXlfMatchMap(matchXlfDom: Xliff): Map<string, string[]> {
  /**
   * Reimplementation of loadMatchXlfIntoMap
   */
  const matchMap: Map<string, string[]> = new Map();
  matchXlfDom.transunit.forEach((transUnit) => {
    if (transUnit.source && transUnit.targets) {
      const source = transUnit.source ? transUnit.source : "";
      transUnit.targets.forEach((target) => {
        if (source !== "" && target.hasContent() && !target.translationToken) {
          let mapElements = matchMap.get(source);
          let updateMap = true;
          if (mapElements) {
            if (!mapElements.includes(target.textContent)) {
              mapElements.push(target.textContent);
            } else {
              updateMap = false;
            }
          } else {
            mapElements = [target.textContent];
          }
          if (updateMap) {
            matchMap.set(source, mapElements);
          }
        }
      });
    }
  });

  return matchMap;
}

/**
 * @description returns an array of existing target languages
 * @returnsType {string[]}
 */
export function existingTargetLanguageCodes(
  settings: Settings,
  appManifest: AppManifest
): string[] | undefined {
  const langXlfFiles = WorkspaceFunctions.getLangXlfFiles(
    settings,
    appManifest
  );
  const languages: string[] = [];
  for (const langFilePath of langXlfFiles) {
    const xlf = Xliff.fromFileSync(langFilePath);
    languages.push(xlf.targetLanguage.toLowerCase());
  }

  return languages;
}

export function setTranslationUnitTranslated(
  xliffDoc: Xliff,
  transUnit: TransUnit,
  newTargetState: TargetState,
  languageFunctionsSettings: LanguageFunctionsSettings
): string {
  switch (languageFunctionsSettings.translationMode) {
    case TranslationMode.external:
      transUnit.target.state = newTargetState;
      transUnit.target.stateQualifier = undefined;
      break;
    case TranslationMode.dts:
      transUnit.target.state = newTargetState;
      transUnit.target.stateQualifier = undefined;
      break;
  }
  transUnit.target.translationToken = undefined;
  transUnit.removeCustomNote(CustomNoteType.refreshXlfHint);
  return xliffDoc.toString(
    languageFunctionsSettings.replaceSelfClosingXlfTags,
    languageFunctionsSettings.formatXml
  );
}

export function detectInvalidValues(
  tu: TransUnit,
  languageFunctionsSettings: LanguageFunctionsSettings
): void {
  const checkTargetState = [
    TranslationMode.external,
    TranslationMode.dts,
  ].includes(languageFunctionsSettings.translationMode);
  if (
    !languageFunctionsSettings.detectInvalidValuesEnabled ||
    (tu.target.textContent === "" && tu.needsReview(checkTargetState))
  ) {
    return;
  }
  const xliffIdArr = tu.getXliffIdTokenArray();
  if (
    xliffIdArr[xliffIdArr.length - 1].type === "Property" &&
    xliffIdArr[xliffIdArr.length - 1].name === "OptionCaption"
  ) {
    // An option caption, check number of options
    const sourceOptions = tu.source.split(",");
    const translatedOptions = tu.target.textContent.split(",");
    if (sourceOptions.length !== translatedOptions.length) {
      setErrorStateAndMessage(
        languageFunctionsSettings.translationMode,
        "source and target has different number of option captions."
      );
      return;
    } else {
      // Check that blank options remains blank, and non-blank remains non-blank
      for (let index = 0; index < sourceOptions.length; index++) {
        const sourceOption = sourceOptions[index];
        const translatedOption = translatedOptions[index];
        if (
          (sourceOption === "" && translatedOption !== "") ||
          (sourceOption !== "" && translatedOption === "")
        ) {
          setErrorStateAndMessage(
            languageFunctionsSettings.translationMode,
            `Option no. ${index} of source is "${sourceOptions[index]}", but the same option in target is "${translatedOptions[index]}". Empty Options must be empty in both source and target.`
          );
          return;
        }
      }
    }
  }

  if (xliffIdArr[xliffIdArr.length - 1].type === "NamedType") {
    // A Label

    // Check that all @1@@@@@@@@ and #1########### placeholders are intact
    const dialogPlaceHolderRegex = new RegExp(/(@\d+@[@]+|#\d+#[#]+)/g);
    const dialogPlaceHolderResult = tu.source.match(dialogPlaceHolderRegex);
    const targetDialogPlaceHolderResult = tu.target.textContent.match(
      dialogPlaceHolderRegex
    );
    if (dialogPlaceHolderResult) {
      dialogPlaceHolderResult.forEach((match) => {
        if (tu.target.textContent.indexOf(match) < 0) {
          setErrorStateAndMessage(
            languageFunctionsSettings.translationMode,
            `The placeholder "${match}" was found in source, but not in target.`
          );
          return;
        }
      });
    }
    if (targetDialogPlaceHolderResult) {
      targetDialogPlaceHolderResult.forEach((match) => {
        if (tu.source.indexOf(match) < 0) {
          setErrorStateAndMessage(
            languageFunctionsSettings.translationMode,
            `The placeholder "${match}" was found in target, but not in source.`
          );
          return;
        }
      });
    }

    // Check that all %1, %2 placeholders are intact and same number
    const placeHolderRegex = new RegExp(/(%\d+)/g);
    const sourceResult = tu.source.match(placeHolderRegex);
    const targetResult = tu.target.textContent.match(placeHolderRegex);
    let sourceOccurrences = 0;
    let targetOccurrences = 0;
    if (sourceResult) {
      sourceResult.forEach((match) => {
        sourceOccurrences = sourceResult.filter((x) => x === match).length;
        targetOccurrences = targetResult
          ? targetResult.filter((x) => x === match).length
          : 0;
        if (tu.target.textContent.indexOf(match) < 0) {
          setErrorStateAndMessage(
            languageFunctionsSettings.translationMode,
            `The placeholder "${match}" was found in source, but not in target.`
          );
          return;
        } else if (sourceOccurrences !== targetOccurrences) {
          setErrorStateAndMessage(
            languageFunctionsSettings.translationMode,
            `The placeholder "${match}" was found in source ${sourceOccurrences} times, but ${targetOccurrences} times in target.`
          );
          return;
        }
      });
    }

    if (targetResult) {
      targetResult.forEach((match) => {
        sourceOccurrences = sourceResult
          ? sourceResult.filter((x) => x === match).length
          : 0;
        targetOccurrences = targetResult.filter((x) => x === match).length;
        if (sourceOccurrences === 0) {
          setErrorStateAndMessage(
            languageFunctionsSettings.translationMode,
            `The placeholder "${match}" was found in target ${targetOccurrences} times, but was not found in source.`
          );
          return;
        }
      });
    }
  }

  function setErrorStateAndMessage(
    translationMode: TranslationMode,
    errorMessage: string
  ): void {
    switch (translationMode) {
      case TranslationMode.external:
        tu.target.state = TargetState.needsReviewTranslation;
        break;
      case TranslationMode.dts:
        tu.target.state = TargetState.needsReviewL10n;
        tu.target.stateQualifier = StateQualifier.rejectedInaccurate;
        break;
      default:
        tu.target.translationToken = TranslationToken.review;
        break;
    }
    tu.insertCustomNote(CustomNoteType.refreshXlfHint, errorMessage);
  }
}

export function matchTranslationsFromTranslationMaps(
  xlfDocument: Xliff,
  suggestionsMaps: Map<string, Map<string, string[]>[]>,
  languageFunctionsSettings: LanguageFunctionsSettings
): number {
  let numberOfMatchedTranslations = 0;
  const maps = suggestionsMaps.get(xlfDocument.targetLanguage.toLowerCase());
  if (maps === undefined) {
    return 0;
  }
  // Reverse order because of priority, latest added has highest priority
  for (let index = maps.length - 1; index >= 0; index--) {
    const map = maps[index];
    numberOfMatchedTranslations += matchTranslationsFromTranslationMap(
      xlfDocument,
      map,
      languageFunctionsSettings
    );
  }
  return numberOfMatchedTranslations;
}

export function matchTranslations(
  matchXlfDoc: Xliff,
  languageFunctionsSettings: LanguageFunctionsSettings
): number {
  const matchMap: Map<string, string[]> = getXlfMatchMap(matchXlfDoc);
  return matchTranslationsFromTranslationMap(
    matchXlfDoc,
    matchMap,
    languageFunctionsSettings
  );
}

export function importTranslatedFileIntoTargetXliff(
  source: Xliff,
  target: Xliff,
  languageFunctionsSettings: LanguageFunctionsSettings,
  translationFolderPath: string
): void {
  if (languageFunctionsSettings.translationMode !== TranslationMode.dts) {
    throw new Error(
      "The setting NAB.UseDTS is not active, this function cannot be executed."
    );
  }
  const dictionary = getDictionary(
    languageFunctionsSettings.useDTSDictionary,
    target.targetLanguage,
    translationFolderPath
  );
  source.transunit.forEach((sourceTransUnit) => {
    let targetTransUnit = target.getTransUnitById(sourceTransUnit.id);
    if (targetTransUnit === undefined) {
      // a new translation
      targetTransUnit = sourceTransUnit;
      target.transunit.push(targetTransUnit);
    } else {
      if (!isTranslatedState(targetTransUnit.target.state)) {
        if (targetTransUnit.targets.length === 0) {
          // No target element
          targetTransUnit.targets.push(sourceTransUnit.target);
        } else {
          if (
            sourceTransUnit.target.stateQualifier === StateQualifier.idMatch
          ) {
            targetTransUnit.target.stateQualifier = undefined;
          } else {
            targetTransUnit.target.state = sourceTransUnit.target.state;
            targetTransUnit.target.stateQualifier =
              sourceTransUnit.target.stateQualifier;
            targetTransUnit.target.textContent =
              sourceTransUnit.target.textContent;
          }
        }
      }
    }
    targetTransUnit.target.textContent = dictionary
      ? dictionary.searchAndReplace(targetTransUnit.target.textContent)
      : targetTransUnit.target.textContent;
    changeStateForExactMatch(languageFunctionsSettings, targetTransUnit);
    detectInvalidValues(targetTransUnit, languageFunctionsSettings);
  });
}

function changeStateForExactMatch(
  languageFunctionsSettings: LanguageFunctionsSettings,
  targetTransUnit: TransUnit
): void {
  if (
    languageFunctionsSettings.exactMatchState !== undefined &&
    isExactMatch(targetTransUnit.target.stateQualifier)
  ) {
    targetTransUnit.target.state = languageFunctionsSettings.exactMatchState;
    targetTransUnit.target.stateQualifier = undefined;
  }
}

function isTranslatedState(state: TargetState | undefined | null): boolean {
  return [
    TargetState.translated,
    TargetState.signedOff,
    TargetState.final,
  ].includes(state as TargetState);
}

function isExactMatch(stateQualifier: string | undefined): boolean {
  return [(StateQualifier.exactMatch, StateQualifier.msExactMatch)].includes(
    stateQualifier as StateQualifier
  );
}

function getDictionary(
  useDictionary: boolean,
  languageCode: string,
  translationPath: string
): Dictionary | undefined {
  if (!useDictionary) {
    return undefined;
  }
  const dictionaryPath = path.join(translationPath, `${languageCode}.dts.json`);
  return fs.existsSync(dictionaryPath)
    ? new Dictionary(dictionaryPath)
    : Dictionary.newDictionary(translationPath, languageCode, "dts");
}