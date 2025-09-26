import * as fs from "graceful-fs";
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
import { readFileSync } from "graceful-fs";
import {
  AppManifest,
  ISkipTranslationPropertyForLanguage,
  Settings,
} from "./Settings/Settings";
import * as FileFunctions from "./FileFunctions";
import { Dictionary } from "./Dictionary";
import { RefreshXlfHint, TranslationMode } from "./Enums";
import { LanguageFunctionsSettings } from "./Settings/LanguageFunctionsSettings";
import { RefreshResult } from "./RefreshResult";
import * as ALParser from "./ALObject/ALParser";
import { XliffIdToken } from "./ALObject/XliffIdToken";
import { ALObject } from "./ALObject/ALElementTypes";
import { MultiLanguageType } from "./ALObject/Enums";

export async function createTargetXlfFile(
  settings: Settings,
  gXlfPath: string,
  targetLanguage: string,
  matchBaseAppTranslation: boolean,
  appManifest: AppManifest
): Promise<{
  numberOfMatches: number;
  targetXlfFilename: string;
  targetXlfFilepath: string;
}> {
  // Validate parameters
  if (!targetLanguage || targetLanguage.trim() === "") {
    throw new Error("Target language cannot be empty");
  }

  const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
  const translationFolderPath = path.dirname(gXlfPath);
  let numberOfMatches = 0;
  const targetXlfFilename = `${appManifest.name}.${targetLanguage}.xlf`;
  const targetXlfFilepath = path.join(translationFolderPath, targetXlfFilename);

  if (fs.existsSync(targetXlfFilepath)) {
    throw new Error(`File already exists: '${targetXlfFilepath}'`);
  }

  const targetXlfDoc = Xliff.fromFileSync(gXlfPath);
  targetXlfDoc.targetLanguage = targetLanguage;
  if (matchBaseAppTranslation) {
    numberOfMatches = await matchTranslationsFromBaseApp(
      targetXlfDoc,
      languageFunctionsSettings
    );
  }

  targetXlfDoc.toFileSync(
    targetXlfFilepath,
    languageFunctionsSettings.replaceSelfClosingXlfTags,
    true,
    languageFunctionsSettings.searchReplaceBeforeSaveXliff
  );
  await refreshXlfFilesFromGXlf({
    settings: settings,
    appManifest: appManifest,
    matchXlfFilePath: targetXlfFilepath,
    languageFunctionsSettings,
  });
  return { numberOfMatches, targetXlfFilename, targetXlfFilepath };
}
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
  gXlfDocument.gXlfDoc.toFileSync(gXlfFilePath, true, true, [], "utf8bom");

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
    settings,
  });
}

export async function _refreshXlfFilesFromGXlf({
  gXlfFilePath,
  langFiles,
  languageFunctionsSettings,
  sortOnly,
  suggestionsMaps = new Map(),
  settings,
}: {
  gXlfFilePath: string;
  langFiles: string[];
  languageFunctionsSettings: LanguageFunctionsSettings;
  sortOnly?: boolean;
  suggestionsMaps?: Map<string, Map<string, string[]>[]>;
  settings: Settings;
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
      sortOnly,
      settings
    );
    newLangXliff.toFileSync(
      langXlfFilePath,
      languageFunctionsSettings.replaceSelfClosingXlfTags,
      true,
      languageFunctionsSettings.searchReplaceBeforeSaveXliff
    );
  }
  if (gXliff._isModified) {
    gXliff.toFileSync(gXliff._path, undefined, true, []);
  }

  return refreshResult;
}
export function refreshSelectedXlfFileFromGXlf(
  langXliff: Xliff,
  gXliff: Xliff,
  lfSettings: LanguageFunctionsSettings,
  suggestionsMaps: Map<string, Map<string, string[]>[]>,
  refreshResult: RefreshResult,
  sortOnly = false,
  settings: Settings
): Xliff {
  const transUnitsToTranslate = gXliff.transunit.filter((x) => x.translate);
  const langMatchMap = getXlfMatchMap(langXliff);
  const gXlfFileName = path.basename(gXliff._path);
  const langIsSameAsGXlf = langXliff.targetLanguage === gXliff.targetLanguage;
  const newLangXliff = langXliff.cloneWithoutTransUnits();
  const transUnitsToRemoveCommentsInCode: Map<TransUnit, string> = new Map();
  const threeLetterAbbreviationLanguageCode = settings.languageCodesInComments.find(
    (x) => x.languageTag === langXliff.targetLanguage
  )?.threeLetterAbbreviation;
  const skipTranslationPropertyForLanguage = getSkipTranslationPropertyForLanguage(
    settings,
    langXliff.targetLanguage
  );
  const doNotSkipTranslated = keepTranslated(
    skipTranslationPropertyForLanguage
  );
  const prospectsToBeRemoved: string[] = [];
  const resultCorrectionMap: Map<string, RefreshResult> = new Map();
  let lastRefreshResult: RefreshResult;
  newLangXliff.original = settings.preserveOriginalAttribute
    ? gXliff.original
    : gXlfFileName;
  newLangXliff.lineEnding = langXliff.lineEnding;

  for (let index = 0; index < transUnitsToTranslate.length; index++) {
    const gTransUnit = transUnitsToTranslate[index];
    const langTransUnit = langXliff.transunit.find(
      (x) => x.id === gTransUnit.id
    );
    let targetFoundInComments = false;
    lastRefreshResult = refreshResult.clone();

    const skipThisTranslationUnit = shouldSkipTranslationUnit(
      skipTranslationPropertyForLanguage,
      gTransUnit
    );
    if (langTransUnit !== undefined) {
      if (!sortOnly) {
        if (!langTransUnit.hasTargets()) {
          langTransUnit.targets.push(
            getNewTarget(
              lfSettings.translationMode,
              langIsSameAsGXlf,
              gTransUnit
            )
          );
          const hintText = langIsSameAsGXlf
            ? RefreshXlfHint.newCopiedSource
            : RefreshXlfHint.new;
          langTransUnit.insertCustomNote(
            CustomNoteType.refreshXlfHint,
            hintText
          );
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
            switch (lfSettings.translationMode) {
              case TranslationMode.external:
                if (lfSettings.clearTargetWhenSourceHasChanged) {
                  langTransUnit.target.state = TargetState.needsTranslation;
                  langTransUnit.target.stateQualifier = undefined;
                  langTransUnit.target.textContent = "";
                } else {
                  langTransUnit.target.state = TargetState.needsAdaptation;
                }
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
          lfSettings.translationMode !== TranslationMode.dts
        ) {
          langTransUnit.maxwidth = gTransUnit.maxwidth;
          refreshResult.numberOfUpdatedMaxWidths++;
        }
        if (threeLetterAbbreviationLanguageCode) {
          targetFoundInComments = addTranslationIfFound(
            langTransUnit,
            gTransUnit,
            threeLetterAbbreviationLanguageCode,
            transUnitsToRemoveCommentsInCode
          );
          if (targetFoundInComments) {
            gXliff._isModified = true;
          }
        }
        if (
          !targetFoundInComments &&
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
        const gXliffGeneratorNote = gTransUnit.xliffGeneratorNote();
        const langXliffGeneratorNote = langTransUnit.xliffGeneratorNote();
        if (
          gXliffGeneratorNote &&
          langTransUnit.xliffGeneratorNoteContent() !==
            gTransUnit.xliffGeneratorNoteContent()
        ) {
          if (langXliffGeneratorNote === undefined) {
            langTransUnit.notes.push(gXliffGeneratorNote);
          } else {
            langXliffGeneratorNote.textContent =
              gXliffGeneratorNote.textContent;
          }
          refreshResult.numberOfUpdatedNotes++;
        }
        if (
          langTransUnit.sourceIsEmpty() &&
          langTransUnit.targetIsEmpty() &&
          lfSettings.preferLockedTranslations
        ) {
          setEmptySourceNote(langTransUnit);
        }
        formatTransUnitForTranslationMode(
          lfSettings.translationMode,
          langTransUnit
        );
        detectInvalidValues(langTransUnit, lfSettings);
        refreshResult.numberOfReviewsAdded += langTransUnit.needsAction(true)
          ? 1
          : 0;
      }
      newLangXliff.transunit.push(langTransUnit);
      langXliff.transunit.splice(langXliff.transunit.indexOf(langTransUnit), 1); // Remove all handled TransUnits -> The rest will be deleted.
      if (skipThisTranslationUnit) {
        // Save for later checks if this translation unit should be removed
        prospectsToBeRemoved.push(langTransUnit.id);
        resultCorrectionMap.set(
          langTransUnit.id,
          refreshResult.getDelta(lastRefreshResult)
        );
      }
    } else if (!sortOnly) {
      // TransUnit does not exist in language xlf
      const newTransUnit = TransUnit.fromString(gTransUnit.toString());
      newTransUnit.targets = [];
      if (threeLetterAbbreviationLanguageCode) {
        targetFoundInComments = addTranslationIfFound(
          newTransUnit,
          gTransUnit,
          threeLetterAbbreviationLanguageCode,
          transUnitsToRemoveCommentsInCode
        );
        if (targetFoundInComments) {
          gXliff._isModified = true;
        }
      }
      if (!targetFoundInComments) {
        newTransUnit.targets.push(
          getNewTarget(lfSettings.translationMode, langIsSameAsGXlf, gTransUnit)
        );
        const hintText = langIsSameAsGXlf
          ? RefreshXlfHint.newCopiedSource
          : RefreshXlfHint.new;
        newTransUnit.insertCustomNote(CustomNoteType.refreshXlfHint, hintText);
      }

      if (newTransUnit.sourceIsEmpty() && lfSettings.preferLockedTranslations) {
        setEmptySourceNote(newTransUnit);
      }
      formatTransUnitForTranslationMode(
        lfSettings.translationMode,
        newTransUnit
      );
      detectInvalidValues(newTransUnit, lfSettings);
      refreshResult.numberOfReviewsAdded += newTransUnit.needsAction(true)
        ? 1
        : 0;
      newLangXliff.transunit.push(newTransUnit);
      refreshResult.numberOfAddedTransUnitElements++;
      if (skipThisTranslationUnit) {
        // Save for later checks if this translation unit should be removed
        prospectsToBeRemoved.push(newTransUnit.id);
        resultCorrectionMap.set(
          newTransUnit.id,
          refreshResult.getDelta(lastRefreshResult)
        );
      }
    }
  }
  refreshResult.numberOfRemovedTransUnits += langXliff.transunit.length;
  if (lfSettings.useMatchingSetting) {
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
    lfSettings
  );
  if (prospectsToBeRemoved.length > 0) {
    // Remove TransUnits that should not be translated according to the settings
    for (let index = 0; index < prospectsToBeRemoved.length; index++) {
      const transUnitIdToCheck = prospectsToBeRemoved[index];
      const transUnitToCheck = newLangXliff.getTransUnitById(
        transUnitIdToCheck
      );
      if (transUnitToCheck) {
        if (
          (!transUnitToCheck.targetsHasTextContent() &&
            !transUnitToCheck.sourceIsEmpty()) ||
          !doNotSkipTranslated
        ) {
          const transUnitIndex = newLangXliff.transunit.findIndex(
            (x) => x.id === transUnitIdToCheck
          );
          newLangXliff.transunit.splice(transUnitIndex, 1);
          const resultCorrection = resultCorrectionMap.get(transUnitIdToCheck);
          refreshResult.subtract(resultCorrection);
          if (transUnitToCheck.hasSuggestion()) {
            refreshResult.numberOfSuggestionsAdded -= 1;
          }
        }
      }
    }
  }
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
      if (lfSettings.translationMode === TranslationMode.dts) {
        tu.target.state = TargetState.translated;
        tu.target.stateQualifier = undefined;
      }
      refreshResult.numberOfRemovedNotes++;
    });

  if (lfSettings.translationMode === TranslationMode.nabTags) {
    refreshResult.totalNumberOfNeedsReview += newLangXliff.transunit.filter(
      (tu) =>
        tu.target.translationToken === TranslationToken.review ||
        tu.target.translationToken === TranslationToken.suggestion
    ).length;
    refreshResult.totalNumberOfNeedsTranslation += newLangXliff.transunit.filter(
      (tu) => tu.target.translationToken === TranslationToken.notTranslated
    ).length;
  } else {
    refreshResult.totalNumberOfNeedsReview += newLangXliff.transunit.filter(
      (tu) =>
        tu.target.state === TargetState.needsAdaptation ||
        tu.target.state === TargetState.needsL10n ||
        tu.target.state === TargetState.needsReviewAdaptation ||
        tu.target.state === TargetState.needsReviewTranslation ||
        tu.target.state === TargetState.needsReviewL10n
    ).length;
    refreshResult.totalNumberOfNeedsTranslation += newLangXliff.transunit.filter(
      (tu) => tu.target.state === TargetState.needsTranslation
    ).length;
  }
  if (transUnitsToRemoveCommentsInCode.size > 0) {
    removeCommentsInCode(transUnitsToRemoveCommentsInCode, settings);
  }

  return newLangXliff;

  function setEmptySourceNote(tu: TransUnit): void {
    tu.insertCustomNote(
      CustomNoteType.refreshXlfHint,
      RefreshXlfHint.emptySource
    );
    if (lfSettings.translationMode === TranslationMode.nabTags) {
      tu.target.translationToken = TranslationToken.review;
    } else {
      tu.target.state = TargetState.needsReviewTranslation;
      tu.target.stateQualifier = undefined;
    }
  }

  function addTranslationIfFound(
    langTransUnit: TransUnit,
    gTransUnit: TransUnit,
    threeLetterAbbreviationLanguageCode: string,
    transUnitsToRemoveCommentsInCode: Map<TransUnit, string>
  ): boolean {
    const regex = new RegExp(
      `(?<language>${threeLetterAbbreviationLanguageCode})="(?<translation>.*?)"(;|$)`
    );
    const matchResult = langTransUnit.developerNoteContent().match(regex);
    if (matchResult) {
      if (matchResult.groups?.translation) {
        langTransUnit.targets = [];
        langTransUnit.targets.push(
          new Target(matchResult.groups.translation, TargetState.translated)
        );
        langTransUnit.developerNote().textContent = langTransUnit
          .developerNote()
          .textContent.replace(matchResult[0], "");
        transUnitsToRemoveCommentsInCode.set(langTransUnit, matchResult[0]);
        if (
          gTransUnit.developerNote().textContent !==
          langTransUnit.developerNote().textContent
        ) {
          gTransUnit.developerNote().textContent = langTransUnit.developerNote().textContent;
        }
      }
      return true;
    }
    return false;
  }
}

export function getSkipTranslationPropertyForLanguage(
  settings: Settings,
  targetLanguage: string
): ISkipTranslationPropertyForLanguage | undefined {
  const skipTranslationPropertyForLanguage = settings.skipTranslationPropertyForLanguage.find(
    (x) => x.languageTag === targetLanguage
  );
  if (
    skipTranslationPropertyForLanguage &&
    skipTranslationPropertyForLanguage.skipTranslationProperties.includes(
      MultiLanguageType.label
    ) &&
    !skipTranslationPropertyForLanguage.skipTranslationProperties.includes(
      MultiLanguageType.namedType
    )
  ) {
    skipTranslationPropertyForLanguage.skipTranslationProperties.push(
      MultiLanguageType.namedType
    );
  }
  return skipTranslationPropertyForLanguage;
}

export function keepTranslated(
  skipTranslationPropertyForLanguage:
    | ISkipTranslationPropertyForLanguage
    | undefined
): boolean {
  return skipTranslationPropertyForLanguage
    ? skipTranslationPropertyForLanguage.keepTranslated
    : true;
}

export function shouldSkipTranslationUnit(
  skipTranslationPropertyForLanguage:
    | ISkipTranslationPropertyForLanguage
    | undefined,
  transUnit: TransUnit
): boolean {
  let skipThisTranslationUnit = false;
  if (skipTranslationPropertyForLanguage) {
    const xliffIdTokenArray = transUnit.getXliffIdTokenArray();
    const lastXliffIdToken = xliffIdTokenArray[xliffIdTokenArray.length - 1];
    skipThisTranslationUnit =
      skipTranslationPropertyForLanguage.skipTranslationProperties.includes(
        lastXliffIdToken.type
      ) ||
      (lastXliffIdToken.type === MultiLanguageType.property &&
        skipTranslationPropertyForLanguage.skipTranslationProperties.includes(
          lastXliffIdToken.name
        ));
  }
  return skipThisTranslationUnit;
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
      transUnit.setTargetStateFromToken();
      break;
    case TranslationMode.dts:
      transUnit.setTargetStateFromToken();
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
    (relativeOrAbsoluteFolderPath) => {
      const absoluteXlfFolderPath = path.isAbsolute(
        relativeOrAbsoluteFolderPath
      )
        ? relativeOrAbsoluteFolderPath
        : path.join(settings.workspaceFolderPath, relativeOrAbsoluteFolderPath);
      fs.readdirSync(absoluteXlfFolderPath)
        .filter((item) => item.endsWith(".xlf") && !item.endsWith("g.xlf"))
        .forEach((fileName) => {
          const filePath = path.join(absoluteXlfFolderPath, fileName);
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
        if (languageFunctionsSettings.autoAcceptSuggestions) {
          const match = matchMap.get(transUnit.source);
          if (match !== undefined) {
            transUnit.addTarget(new Target(match[0]));
            numberOfMatchedTranslations++;
            suggestionAdded = true;
          }
        } else {
          matchMap.get(transUnit.source)?.forEach((target) => {
            transUnit.addTarget(
              new Target(TranslationToken.suggestion + target)
            );
            numberOfMatchedTranslations++;
            suggestionAdded = true;
          });
        }
      } else {
        const match = matchMap.get(transUnit.source);
        if (match !== undefined) {
          const newTargetState = languageFunctionsSettings.setExactMatchToState
            ? languageFunctionsSettings.setExactMatchToState
            : TargetState.translated;
          const newTarget = new Target(match[0], newTargetState);
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
    languageFunctionsSettings.formatXml,
    languageFunctionsSettings.searchReplaceBeforeSaveXliff
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
    (tu.target.textContent === "" && tu.needsAction(checkTargetState))
  ) {
    return;
  }
  const xliffIdArr = tu.getXliffIdTokenArray();
  if (
    xliffIdArr[xliffIdArr.length - 1].type === MultiLanguageType.property &&
    xliffIdArr[xliffIdArr.length - 1].name === MultiLanguageType.optionCaption
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

  if (xliffIdArr[xliffIdArr.length - 1].type === MultiLanguageType.namedType) {
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
  if (targetTransUnit.target.stateQualifier !== null) {
    if (
      languageFunctionsSettings.exactMatchState !== undefined &&
      isExactMatch(targetTransUnit.target.stateQualifier)
    ) {
      targetTransUnit.target.state = languageFunctionsSettings.exactMatchState;
      targetTransUnit.target.stateQualifier = undefined;
    }
  }
}

function isTranslatedState(state: TargetState | undefined | null): boolean {
  return [
    TargetState.translated,
    TargetState.signedOff,
    TargetState.final,
  ].includes(state as TargetState);
}

function isExactMatch(stateQualifier: StateQualifier | undefined): boolean {
  if (!stateQualifier) {
    return false;
  }
  return [(StateQualifier.exactMatch, StateQualifier.msExactMatch)].includes(
    stateQualifier
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
async function removeCommentsInCode(
  transUnitsToRemoveCommentsInCode: Map<TransUnit, string>,
  settings: Settings
): Promise<void> {
  const alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
    settings,
    undefined,
    false
  );
  let lastObject: ALObject;
  let lastObjectModified = false;
  transUnitsToRemoveCommentsInCode.forEach((text, transUnit) => {
    const tokens = transUnit.getXliffIdTokenArray();
    let obj: ALObject = getObjectFromTokens(alObjects, tokens);
    if (obj.isIdentical(lastObject)) {
      obj = lastObject;
    } else {
      if (lastObjectModified && lastObject) {
        fs.writeFileSync(lastObject.fileName, lastObject.toString(), "utf8");
      }
      lastObjectModified = false;
    }

    obj.endLineIndex = ALParser.parseCode(obj, obj.startLineIndex + 1, 0);
    const xliffToSearchFor = XliffIdToken.getXliffId(tokens).toLowerCase();
    const mlObjects = obj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const mlObject = mlObjects.find(
      (x) => x.xliffId().toLowerCase() === xliffToSearchFor
    );
    let codeLineIndex: number | undefined;
    if (mlObject) {
      codeLineIndex = mlObject.startLineIndex;
      if (mlObject.comment === text) {
        const replaceText = `, Comment = '${text}'`;
        obj.alCodeLines[codeLineIndex].code = obj.alCodeLines[
          codeLineIndex
        ].code.replace(replaceText, "");
        lastObjectModified = true;
      } else if (mlObject.comment.includes(text)) {
        obj.alCodeLines[codeLineIndex].code = obj.alCodeLines[
          codeLineIndex
        ].code.replace(text, "");
        lastObjectModified = true;
      }
      lastObject = obj;
    }
    if (lastObjectModified) {
      fs.writeFileSync(lastObject.fileName, lastObject.toString(), "utf8");
    }
  });
}

export async function createCrossLanguageXlfFromFiles(
  settings: Settings,
  sourceXlfDoc: Xliff,
  targetXlfDoc: Xliff,
  newXlfDoc: Xliff
): Promise<void> {
  const skipTranslationPropertyForLanguage = getSkipTranslationPropertyForLanguage(
    settings,
    targetXlfDoc.targetLanguage
  );
  const doNotSkipTranslated = keepTranslated(
    skipTranslationPropertyForLanguage
  );
  const prospectsToBeRemoved: string[] = [];

  sourceXlfDoc.transunit.forEach((tu) => {
    if (!tu.needsAction(true)) {
      // Only include translation units that are not marked for review
      tu.source = tu.target.textContent;
      const targetTransUnit = targetXlfDoc.getTransUnitById(tu.id);
      if (targetTransUnit) {
        tu.target = targetTransUnit.target;
      } else {
        tu.target = new Target("", TargetState.needsTranslation);
      }
      if (shouldSkipTranslationUnit(skipTranslationPropertyForLanguage, tu)) {
        // Save for later checks if this translation unit should be removed
        prospectsToBeRemoved.push(tu.id);
      }
      newXlfDoc.transunit.push(tu);
    }
  });
  if (prospectsToBeRemoved.length > 0) {
    // Remove TransUnits that should not be translated according to the settings
    for (let index = 0; index < prospectsToBeRemoved.length; index++) {
      const transUnitIdToCheck = prospectsToBeRemoved[index];
      const transUnitToCheck = newXlfDoc.getTransUnitById(transUnitIdToCheck);
      if (transUnitToCheck) {
        if (!transUnitToCheck.targetsHasTextContent() || !doNotSkipTranslated) {
          const transUnitIndex = newXlfDoc.transunit.findIndex(
            (x) => x.id === transUnitIdToCheck
          );
          newXlfDoc.transunit.splice(transUnitIndex, 1);
        }
      }
    }
  }
}

export function getObjectFromTokens(
  alObjects: ALObject[],
  tokens: XliffIdToken[]
): ALObject {
  const obj = alObjects.find(
    (x) =>
      x.objectType.toLowerCase() === tokens[0].type.toLowerCase() &&
      x.objectName.toLowerCase() === tokens[0].name.toLowerCase()
  );
  if (!obj) {
    throw new Error(
      `Could not find any object matching '${XliffIdToken.getXliffIdWithNames(
        tokens
      )}'`
    );
  }
  return obj;
}
