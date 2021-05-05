import * as AdmZip from "adm-zip";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as WorkspaceFunctions from "./WorkspaceFunctions";
import * as DocumentFunctions from "./DocumentFunctions";
import * as VSCodeFunctions from "./VSCodeFunctions";
import * as escapeStringRegexp from "escape-string-regexp";
import { XliffIdToken } from "./ALObject/XliffIdToken";
import { Settings, Setting } from "./Settings";
import {
  targetStateActionNeededToken,
  targetStateActionNeededKeywordList,
} from "./Xliff/XlfFunctions";
import * as Logging from "./Logging";
import {
  CustomNoteType,
  StateQualifier,
  Target,
  TargetState,
  TranslationToken,
  TransUnit,
  Xliff,
} from "./Xliff/XLIFFDocument";
import { isNull, isNullOrUndefined } from "util";
import {
  baseAppTranslationFiles,
  localBaseAppTranslationFiles,
} from "./externalresources/BaseAppTranslationFiles";
import { readFileSync } from "fs";
import { invalidXmlSearchExpression } from "./constants";
import { createFolderIfNotExist } from "./Common";

const logger = Logging.ConsoleLogger.getInstance();

export class LanguageFunctionsSettings {
  translationMode: TranslationMode = this.getTranslationMode();
  useExternalTranslationTool: boolean = Settings.getConfigSettings()[
    Setting.useExternalTranslationTool
  ];
  searchOnlyXlfFiles: boolean = Settings.getConfigSettings()[
    Setting.searchOnlyXlfFiles
  ];
  detectInvalidValuesEnabled: boolean = Settings.getConfigSettings()[
    Setting.detectInvalidTargets
  ];
  translationSuggestionPaths: string[] = Settings.getConfigSettings()[
    Setting.translationSuggestionPaths
  ];
  matchBaseAppTranslation: boolean = Settings.getConfigSettings()[
    Setting.matchBaseAppTranslation
  ];
  useMatchingSetting: boolean = Settings.getConfigSettings()[
    Setting.matchTranslation
  ];
  replaceSelfClosingXlfTags: boolean =
    Settings.getConfigSettings()[Setting.replaceSelfClosingXlfTags] === true;
  exactMatchState?: TargetState = this.getDtsExactMatchToState();
  formatXml = true;

  private getDtsExactMatchToState(): TargetState | undefined {
    const setDtsExactMatchToState: string = Settings.getConfigSettings()[
      Setting.setDtsExactMatchToState
    ];
    let exactMatchState: TargetState | undefined;
    if (setDtsExactMatchToState.toLowerCase() !== "(keep)") {
      exactMatchState = setDtsExactMatchToState as TargetState;
    }
    return exactMatchState;
  }

  private getTranslationMode(): TranslationMode {
    const useDTS: boolean = Settings.getConfigSettings()[Setting.useDTS];
    if (useDTS) {
      return TranslationMode.dts;
    }
    const useExternalTranslationTool: boolean = Settings.getConfigSettings()[
      Setting.useExternalTranslationTool
    ];
    if (useExternalTranslationTool) {
      return TranslationMode.external;
    }
    return TranslationMode.nabTags;
  }
}

export enum TranslationMode {
  nabTags,
  dts,
  external,
}

export async function getGXlfDocument(): Promise<{
  fileName: string;
  gXlfDoc: Xliff;
}> {
  const uri = await WorkspaceFunctions.getGXlfFile();
  if (isNullOrUndefined(uri)) {
    throw new Error("No g.xlf file was found");
  }

  const gXlfDoc = Xliff.fromFileSync(uri.fsPath, "utf8");
  return {
    fileName: await VSCodeFunctions.getFilename(uri.fsPath),
    gXlfDoc: gXlfDoc,
  };
}

export async function updateGXlfFromAlFiles(): Promise<RefreshResult> {
  const gXlfDocument = await getGXlfDocument();

  const totals = new RefreshResult();
  totals.fileName = gXlfDocument.fileName;

  let alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
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
  const gXlfFilePath = await WorkspaceFunctions.getGXlfFile();
  gXlfDocument.gXlfDoc.toFileSync(gXlfFilePath.fsPath, true, true, "utf8bom");

  return totals;
}
export function updateGXlf(
  gXlfDoc: Xliff | null,
  transUnits: TransUnit[] | null
): RefreshResult {
  const result = new RefreshResult();
  if (isNullOrUndefined(gXlfDoc) || isNullOrUndefined(transUnits)) {
    return result;
  }
  transUnits.forEach((transUnit) => {
    const gTransUnit = gXlfDoc.transunit.filter(
      (x) => x.id === transUnit.id
    )[0];
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

export async function findNextUnTranslatedText(
  searchCurrentDocument: boolean,
  replaceSelfClosingXlfTags: boolean,
  lowerThanTargetState?: TargetState
): Promise<boolean> {
  let filesToSearch: vscode.Uri[] = [];
  let startOffset = 0;
  if (searchCurrentDocument) {
    if (vscode.window.activeTextEditor === undefined) {
      return false;
    }
    await vscode.window.activeTextEditor.document.save();
    filesToSearch.push(vscode.window.activeTextEditor.document.uri);
    startOffset = vscode.window.activeTextEditor.document.offsetAt(
      vscode.window.activeTextEditor.selection.active
    );
  } else {
    await vscode.workspace.saveAll();
    filesToSearch = await WorkspaceFunctions.getLangXlfFiles(
      vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.document.uri
        : undefined
    );
    if (vscode.window.activeTextEditor !== undefined) {
      //To avoid get stuck on the first file in the array we shift it.
      if (
        vscode.window.activeTextEditor.document.uri.path ===
        filesToSearch[0].path
      ) {
        const first: vscode.Uri = filesToSearch[0];
        filesToSearch.push(first);
        filesToSearch.shift();
      }
    }
  }
  for (let i = 0; i < filesToSearch.length; i++) {
    const xlfUri = filesToSearch[i];
    const fileContents = fs.readFileSync(xlfUri.fsPath, "utf8");
    let searchFor: Array<string> = [];
    searchFor = searchFor.concat(Object.values(TranslationToken)); // NAB: tokens
    searchFor = searchFor.concat(
      targetStateActionNeededKeywordList(lowerThanTargetState)
    ); // States
    searchFor = searchFor.concat("></target>"); // Empty target

    const wordSearch = findNearestWordMatch(
      fileContents,
      startOffset,
      searchFor
    );
    const multipleTargetsSearch = findNearestMultipleTargets(
      fileContents,
      startOffset
    );
    const searchResult = [wordSearch, multipleTargetsSearch]
      .filter((a) => a.foundNode)
      .sort((a, b) => a.foundAtPosition - b.foundAtPosition)[0];

    if (searchResult?.foundNode) {
      // The mess with \r and \n below is to handle mixed line endings that happens now and then.
      const lineEndPos = fileContents.indexOf(
        "\n",
        searchResult.foundAtPosition + searchResult.foundWord.length
      );
      const lineStartPos = fileContents
        .substring(0, lineEndPos)
        .lastIndexOf("\n");
      const lineText = fileContents
        .substring(lineStartPos, lineEndPos)
        .replace("\r\n", "");

      const targetTextRegex = new RegExp(/>(\[NAB:.*?\])?/);
      const matches = targetTextRegex.exec(lineText);
      let fallBack = true;
      if (matches) {
        if (matches.index > 0) {
          await DocumentFunctions.openTextFileWithSelection(
            xlfUri,
            lineStartPos + matches.index + 1,
            matches[0].length - 1
          );
          fallBack = false;
        }
      }
      if (fallBack) {
        await DocumentFunctions.openTextFileWithSelection(
          xlfUri,
          searchResult.foundAtPosition,
          searchResult.foundWord.length
        );
      }

      return true;
    }

    removeCustomNotesFromFile(xlfUri, replaceSelfClosingXlfTags);
  }
  return false;
}

export function findNearestWordMatch(
  fileContents: string,
  startOffset: number,
  searchFor: string[]
): { foundNode: boolean; foundWord: string; foundAtPosition: number } {
  const results: Array<{
    foundNode: boolean;
    foundWord: string;
    foundAtPosition: number;
  }> = [];
  for (const word of searchFor) {
    const foundAt = fileContents.indexOf(word, startOffset);
    if (foundAt > 0) {
      results.push({
        foundNode: true,
        foundWord: word,
        foundAtPosition: foundAt,
      });
    }
  }
  if (results.length > 0) {
    results.sort((a, b) => a.foundAtPosition - b.foundAtPosition);
    return results[0];
  }
  return { foundNode: false, foundWord: "", foundAtPosition: 0 };
}

export function findNearestMultipleTargets(
  fileContents: string,
  startOffset: number
): { foundNode: boolean; foundWord: string; foundAtPosition: number } {
  const result = { foundNode: false, foundWord: "", foundAtPosition: 0 };
  const multipleTargetsRE = new RegExp(
    /^\s*<target>.*\r*\n*(\s*<target>.*)+/gm
  );
  const matches = multipleTargetsRE.exec(fileContents.substring(startOffset)); //start from position
  if (matches) {
    if (matches.index > 0) {
      result.foundNode = true;
      result.foundWord = matches[0];
      result.foundAtPosition = startOffset + matches.index;
    }
  }
  return result;
}

export async function copySourceToTarget(): Promise<boolean> {
  if (vscode.window.activeTextEditor) {
    const editor = vscode.window.activeTextEditor;
    if (vscode.window.activeTextEditor.document.uri.fsPath.endsWith("xlf")) {
      // in a xlf file
      await vscode.window.activeTextEditor.document.save();
      const docText = vscode.window.activeTextEditor.document.getText();
      const lineEnding = DocumentFunctions.documentLineEnding(
        vscode.window.activeTextEditor.document
      );
      const docArray = docText.split(lineEnding);
      if (
        docArray[vscode.window.activeTextEditor.selection.active.line].match(
          /<target.*>.*<\/target>/i
        )
      ) {
        // on a target line
        const sourceLine = docArray[
          vscode.window.activeTextEditor.selection.active.line - 1
        ].match(/<source>(.*)<\/source>/i);
        if (sourceLine) {
          // source line just above
          const newLineText = `          <target>${sourceLine[1]}</target>`;
          await editor.edit((editBuilder) => {
            const targetLineRange = new vscode.Range(
              editor.selection.active.line,
              0,
              editor.selection.active.line,
              docArray[editor.selection.active.line].length
            );
            editBuilder.replace(targetLineRange, newLineText);
          });
          editor.selection = new vscode.Selection(
            editor.selection.active.line,
            18,
            editor.selection.active.line,
            18 + sourceLine[1].length
          );
          return true;
        }
      }
    }
  }
  return false;
}
export async function findAllUnTranslatedText(
  languageFunctionsSettings: LanguageFunctionsSettings
): Promise<void> {
  let findText = "";
  if (languageFunctionsSettings.useExternalTranslationTool) {
    findText = targetStateActionNeededToken();
  } else {
    findText =
      escapeStringRegexp(TranslationToken.review) +
      "|" +
      escapeStringRegexp(TranslationToken.notTranslated) +
      "|" +
      escapeStringRegexp(TranslationToken.suggestion);
  }
  let fileFilter = "";
  if (languageFunctionsSettings.searchOnlyXlfFiles) {
    fileFilter = "*.xlf";
  }
  await VSCodeFunctions.findTextInFiles(findText, true, fileFilter);
}

export async function findMultipleTargets(
  languageFunctionsSettings: LanguageFunctionsSettings
): Promise<void> {
  const findText = "^\\s*<target>.*\\r*\\n*(\\s*<target>.*)+";
  let fileFilter = "";
  if (languageFunctionsSettings.useExternalTranslationTool) {
    fileFilter = "*.xlf";
  }
  await VSCodeFunctions.findTextInFiles(findText, true, fileFilter);
}

export async function refreshXlfFilesFromGXlf({
  sortOnly,
  matchXlfFileUri,
  languageFunctionsSettings,
}: {
  sortOnly?: boolean;
  matchXlfFileUri?: vscode.Uri;
  languageFunctionsSettings: LanguageFunctionsSettings;
}): Promise<RefreshResult> {
  sortOnly = sortOnly === null ? false : sortOnly;
  const suggestionsMaps = await createSuggestionMaps(
    languageFunctionsSettings,
    matchXlfFileUri
  );
  const currentUri: vscode.Uri | undefined = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.document.uri
    : undefined;
  const gXlfFileUri = await WorkspaceFunctions.getGXlfFile(currentUri);
  const langFiles = await WorkspaceFunctions.getLangXlfFiles(currentUri);
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
  gXlfFilePath: vscode.Uri;
  langFiles: vscode.Uri[];
  languageFunctionsSettings: LanguageFunctionsSettings;
  sortOnly?: boolean;
  suggestionsMaps?: Map<string, Map<string, string[]>[]>;
}): Promise<RefreshResult> {
  const refreshResult = new RefreshResult();
  logOutput("Translate file path: ", gXlfFilePath.fsPath);
  refreshResult.numberOfCheckedFiles = langFiles.length;
  const gXliff = Xliff.fromFileSync(gXlfFilePath.fsPath, "utf8");
  // 1. Sync with gXliff
  // 2. Match with
  //    - Itself
  //    - Selected matching file
  //    - Files from configured suggestions paths
  //    - Base Application

  for (let langIndex = 0; langIndex < langFiles.length; langIndex++) {
    const langUri = langFiles[langIndex];
    logOutput("Language file: ", langUri.fsPath);
    const langXlfFilePath = langUri.fsPath;
    const langContent = getValidatedXml(langUri);
    const langXliff = Xliff.fromString(langContent);

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

    if (!isNullOrUndefined(langTransUnit)) {
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
            langTransUnit.targets.length === 1 &&
            langTransUnit.target.textContent === langTransUnit.source
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
          if (isNullOrUndefined(langTransUnit.developerNote())) {
            langTransUnit.notes.push(gTransUnit.developerNote());
          } else {
            langTransUnit.developerNote().textContent = gTransUnit.developerNote().textContent;
          }
          refreshResult.numberOfUpdatedNotes++;
        }
        formatTransUnitForTranslationMode(
          languageFunctionsSettings.translationMode,
          langTransUnit
        );
        detectInvalidValues(langTransUnit, languageFunctionsSettings);
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
        formatTransUnitForTranslationMode(
          languageFunctionsSettings.translationMode,
          newTransUnit
        );
        detectInvalidValues(newTransUnit, languageFunctionsSettings);
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
        ((isNullOrUndefined(tu.target.translationToken) &&
          isNullOrUndefined(tu.target.state)) ||
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

function formatTransUnitForTranslationMode(
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
      if (isNullOrUndefined(transUnit.target.translationToken)) {
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
  if (isNullOrUndefined(transUnit.target.state)) {
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
}

export async function formatCurrentXlfFileForDts(
  fileUri: vscode.Uri,
  languageFunctionsSettings: LanguageFunctionsSettings
): Promise<void> {
  const gXlfUri = await WorkspaceFunctions.getGXlfFile(fileUri);
  const original = path.basename(gXlfUri.fsPath);
  if (gXlfUri.fsPath === fileUri.fsPath) {
    throw new Error("You cannot run this function on the g.xlf file.");
  }
  const xliff = Xliff.fromFileSync(fileUri.fsPath);
  xliff.original = original;
  xliff.transunit.forEach((tu) =>
    formatTransUnitForTranslationMode(TranslationMode.dts, tu)
  );
  xliff.toFileSync(
    fileUri.fsPath,
    languageFunctionsSettings.replaceSelfClosingXlfTags
  );
}

function getValidatedXml(fileUri: vscode.Uri): string {
  const xml = fs.readFileSync(fileUri.fsPath, "utf8");

  const re = new RegExp(invalidXmlSearchExpression, "g");
  const result = re.exec(xml);
  if (result) {
    const matchIndex = result.index;
    const t = result[0].length;
    DocumentFunctions.openTextFileWithSelection(fileUri, matchIndex, t);
    throw new Error(`The xml in ${path.basename(fileUri.fsPath)} is invalid.`);
  }
  return xml;
}

export async function createSuggestionMaps(
  languageFunctionsSettings: LanguageFunctionsSettings,
  matchXlfFileUri?: vscode.Uri
): Promise<Map<string, Map<string, string[]>[]>> {
  const languageCodes = await existingTargetLanguageCodes();
  const suggestionMaps: Map<string, Map<string, string[]>[]> = new Map();
  if (isNullOrUndefined(languageCodes)) {
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
  const workspaceFolderPath = WorkspaceFunctions.getWorkspaceFolder().uri
    .fsPath;
  languageFunctionsSettings.translationSuggestionPaths.forEach(
    (relFolderPath) => {
      const xlfFolderPath = path.join(workspaceFolderPath, relFolderPath);
      fs.readdirSync(xlfFolderPath)
        .filter((item) => item.endsWith(".xlf") && !item.endsWith("g.xlf"))
        .forEach((fileName) => {
          const filePath = path.join(xlfFolderPath, fileName);
          addXliffToSuggestionMap(languageCodes, suggestionMaps, filePath);
        });
    }
  );

  // Manually selected match file
  if (!isNullOrUndefined(matchXlfFileUri)) {
    const matchFilePath = matchXlfFileUri ? matchXlfFileUri.fsPath : "";
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

export function matchTranslationsFromTranslationMaps(
  xlfDocument: Xliff,
  suggestionsMaps: Map<string, Map<string, string[]>[]>,
  languageFunctionsSettings: LanguageFunctionsSettings
): number {
  let numberOfMatchedTranslations = 0;
  const maps = suggestionsMaps.get(xlfDocument.targetLanguage.toLowerCase());
  if (isNullOrUndefined(maps)) {
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
        if (!isNullOrUndefined(match)) {
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
  if (!isNullOrUndefined(baseAppTranslationMap)) {
    numberOfMatches = matchTranslationsFromTranslationMap(
      xlfDoc,
      baseAppTranslationMap,
      languageFunctionsSettings
    );
  }
  return numberOfMatches;
}

async function getBaseAppTranslationMap(
  targetLanguage: string
): Promise<Map<string, string[]> | undefined> {
  const targetFilename = targetLanguage.toLocaleLowerCase().concat(".json");
  let localTransFiles = localBaseAppTranslationFiles();
  if (!localTransFiles.has(targetFilename)) {
    await baseAppTranslationFiles.getBlobs([targetFilename]);
    localTransFiles = localBaseAppTranslationFiles();
  }
  const baseAppJsonPath = localTransFiles.get(targetFilename);
  if (!isNullOrUndefined(baseAppJsonPath)) {
    const baseAppTranslationMap: Map<string, string[]> = new Map(
      Object.entries(JSON.parse(readFileSync(baseAppJsonPath, "utf8")))
    );
    return baseAppTranslationMap;
  }
  return;
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

export async function getCurrentXlfData(): Promise<XliffIdToken[]> {
  const { transUnit } = getFocusedTransUnit();

  return transUnit.getXliffIdTokenArray();
}

export function getFocusedTransUnit(): {
  xliffDoc: Xliff;
  transUnit: TransUnit;
} {
  if (undefined === vscode.window.activeTextEditor) {
    throw new Error("No active Text Editor");
  }
  const currDoc = vscode.window.activeTextEditor.document;
  if (path.extname(currDoc.uri.fsPath) !== ".xlf") {
    throw new Error("The current document is not an .xlf file");
  }

  const activeLineNo = vscode.window.activeTextEditor.selection.active.line;
  const result = getTransUnitID(activeLineNo, currDoc);
  const xliffDoc = Xliff.fromFileSync(currDoc.uri.fsPath);
  const transUnit = xliffDoc.getTransUnitById(result.id);
  if (isNullOrUndefined(transUnit)) {
    throw new Error(
      `Could not find Translation Unit ${result.id} in ${path.basename(
        currDoc.uri.fsPath
      )}`
    );
  }
  return { xliffDoc, transUnit };
}

function getTransUnitID(
  activeLineNo: number,
  doc: vscode.TextDocument
): { lineNo: number; id: string } {
  let textLine: string;
  let count = 0;
  do {
    textLine = doc.getText(
      new vscode.Range(
        new vscode.Position(activeLineNo - count, 0),
        new vscode.Position(activeLineNo - count, 5000)
      )
    );
    count += 1;
  } while (
    getTransUnitLineType(textLine) !== TransUnitElementType.transUnit &&
    count <= getTransUnitElementMaxLines()
  );
  if (count > getTransUnitElementMaxLines()) {
    throw new Error("Not inside a trans-unit element");
  }
  const result = textLine.match(/\s*<trans-unit id="([^"]*)"/i);
  if (null === result) {
    throw new Error(`Could not identify the trans-unit id ('${textLine})`);
  }
  return { lineNo: activeLineNo - count + 1, id: result[1] };
}

function getTransUnitLineType(textLine: string): TransUnitElementType {
  if (null !== textLine.match(/\s*<trans-unit id=.*/i)) {
    return TransUnitElementType.transUnit;
  }
  if (null !== textLine.match(/\s*<source\/?>.*/i)) {
    return TransUnitElementType.source;
  }
  if (null !== textLine.match(/\s*<target.*\/?>.*/i)) {
    return TransUnitElementType.target;
  }
  if (
    null !==
    textLine.match(
      /\s*<note from="Developer" annotates="general" priority="2".*/i
    )
  ) {
    return TransUnitElementType.developerNote;
  }
  if (
    null !==
    textLine.match(
      /\s*<note from="Xliff Generator" annotates="general" priority="3">(.*)<\/note>.*/i
    )
  ) {
    return TransUnitElementType.descriptionNote;
  }
  if (
    null !==
    textLine.match(
      /\s*<note from="NAB AL Tool [^"]*" annotates="general" priority="\d">(.*)<\/note>.*/i
    )
  ) {
    return TransUnitElementType.customNote;
  }
  if (null !== textLine.match(/\s*<\/trans-unit>.*/i)) {
    return TransUnitElementType.transUnitEnd;
  }
  throw new Error("Not inside a trans-unit element");
}

function getTransUnitElementMaxLines(): number {
  return 7; // Must be increased if we add new note types
}
export enum TransUnitElementType {
  transUnit,
  source,
  target,
  developerNote,
  descriptionNote,
  transUnitEnd,
  customNote,
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logOutput(...optionalParams: any[]): void {
  if (Settings.getConfigSettings()[Setting.consoleLogOutput]) {
    logger.logOutput(optionalParams.join(" "));
  }
}

/**
 * @description returns an array of existing target languages
 * @returnsType {string[]}
 */
export async function existingTargetLanguageCodes(): Promise<
  string[] | undefined
> {
  const langXlfFiles = await WorkspaceFunctions.getLangXlfFiles();
  const languages: string[] = [];
  for (const langFile of langXlfFiles) {
    const xlf = Xliff.fromFileSync(langFile.fsPath);
    languages.push(xlf.targetLanguage.toLowerCase());
  }

  return languages;
}

export function removeAllCustomNotes(xlfDocument: Xliff): boolean {
  let notesRemoved = false;
  if (xlfDocument.customNotesOfTypeExists(CustomNoteType.refreshXlfHint)) {
    xlfDocument.removeAllCustomNotesOfType(CustomNoteType.refreshXlfHint);
    notesRemoved = true;
  }
  return notesRemoved;
}

export async function revealTransUnitTarget(
  transUnitId: string
): Promise<boolean> {
  if (!vscode.window.activeTextEditor) {
    return false;
  }
  const langFiles = await WorkspaceFunctions.getLangXlfFiles(
    vscode.window.activeTextEditor.document.uri
  );
  if (langFiles.length === 1) {
    const langContent = fs.readFileSync(langFiles[0].fsPath, "utf8");
    const transUnitIdRegExp = new RegExp(`"${transUnitId}"`);
    const result = transUnitIdRegExp.exec(langContent);
    if (!isNull(result)) {
      const matchIndex = result.index;
      const targetRegExp = new RegExp(`(<target[^>]*>)([^>]*)(</target>)`);
      const restString = langContent.substring(matchIndex);
      const targetResult = targetRegExp.exec(restString);
      if (!isNull(targetResult)) {
        await DocumentFunctions.openTextFileWithSelection(
          langFiles[0],
          targetResult.index + matchIndex + targetResult[1].length,
          targetResult[2].length
        );
        return true;
      }
    }
  }
  return false;
}

export enum RefreshXlfHint {
  newCopiedSource = "New translation. Target copied from source.",
  modifiedSource = "Source has been modified.",
  new = "New translation.",
  suggestion = "Suggested translation inserted.",
}

export class RefreshResult {
  numberOfAddedTransUnitElements = 0;
  numberOfUpdatedNotes = 0;
  numberOfUpdatedMaxWidths = 0;
  numberOfUpdatedSources = 0;
  numberOfRemovedTransUnits = 0;
  numberOfRemovedNotes = 0;
  numberOfCheckedFiles = 0;
  numberOfSuggestionsAdded = 0;
  fileName?: string;
}

function removeCustomNotesFromFile(
  xlfUri: vscode.Uri,
  replaceSelfClosingXlfTags: boolean
): void {
  const xlfDocument = Xliff.fromFileSync(xlfUri.fsPath);
  if (xlfDocument.translationTokensExists()) {
    return;
  }
  if (removeAllCustomNotes(xlfDocument)) {
    console.log("Removed custom notes.");
    xlfDocument.toFileAsync(xlfUri.fsPath, replaceSelfClosingXlfTags);
  }
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

export async function zipXlfFiles(dtsWorkFolderPath: string): Promise<void> {
  const gXlfFileUri = await WorkspaceFunctions.getGXlfFile();
  const langXlfFileUri = await WorkspaceFunctions.getLangXlfFiles();
  const filePath = gXlfFileUri.fsPath;
  createFolderIfNotExist(dtsWorkFolderPath);
  createXlfZipFile(filePath, dtsWorkFolderPath);
  langXlfFileUri.forEach((file) => {
    createXlfZipFile(file.fsPath, dtsWorkFolderPath);
  });
}

function createXlfZipFile(filePath: string, dtsWorkFolderPath: string): void {
  const zip = new AdmZip();
  zip.addLocalFile(filePath);
  const zipFilePath = path.join(
    dtsWorkFolderPath,
    `${path.basename(filePath, ".xlf")}.zip`
  );
  if (fs.existsSync(zipFilePath)) {
    fs.unlinkSync(zipFilePath);
  }
  zip.writeZip(zipFilePath);
}

export function importDtsTranslatedFile(
  filePath: string,
  langXliffArr: Xliff[],
  languageFunctionsSettings: LanguageFunctionsSettings
): void {
  const zip = new AdmZip(filePath);
  const zipEntries = zip
    .getEntries()
    .filter((entry) => entry.name.endsWith(".xlf"));
  const source = Xliff.fromString(zip.readAsText(zipEntries[0], "utf8"));
  const target = langXliffArr.filter(
    (x) => x.targetLanguage === source.targetLanguage
  )[0];
  if (isNullOrUndefined(target)) {
    throw new Error(
      `There are no xlf file with target-language "${
        source.targetLanguage
      }" in the translation folder (${WorkspaceFunctions.getTranslationFolderPath()}).`
    );
  }
  importTranslatedFileIntoTargetXliff(
    source,
    target,
    languageFunctionsSettings
  );
  target.toFileSync(target._path, false);
}

export function importTranslatedFileIntoTargetXliff(
  source: Xliff,
  target: Xliff,
  languageFunctionsSettings: LanguageFunctionsSettings
): void {
  if (languageFunctionsSettings.translationMode !== TranslationMode.dts) {
    throw new Error(
      "The setting NAB.UseDTS is not active, this function cannot be executed."
    );
  }
  source.transunit.forEach((sourceTransUnit) => {
    let targetTransUnit = target.getTransUnitById(sourceTransUnit.id);
    if (isNullOrUndefined(targetTransUnit)) {
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

    changeStateForExactMatch(languageFunctionsSettings, targetTransUnit);
    detectInvalidValues(targetTransUnit, languageFunctionsSettings);
  });
}

function changeStateForExactMatch(
  languageFunctionsSettings: LanguageFunctionsSettings,
  targetTransUnit: TransUnit
): void {
  if (
    !isNullOrUndefined(languageFunctionsSettings.exactMatchState) &&
    isExactMatch(targetTransUnit.target.stateQualifier)
  ) {
    targetTransUnit.target.state = languageFunctionsSettings.exactMatchState;
    targetTransUnit.target.stateQualifier = undefined;
  }
}

function isTranslatedState(state: TargetState | undefined | null): boolean {
  if (isNullOrUndefined(state)) {
    return false;
  }
  return [
    TargetState.translated,
    TargetState.signedOff,
    TargetState.final,
  ].includes(state);
}
function isExactMatch(stateQualifier: string | undefined): boolean {
  if (isNullOrUndefined(stateQualifier)) {
    return false;
  }
  return [StateQualifier.exactMatch, StateQualifier.msExactMatch].includes(
    stateQualifier as StateQualifier
  );
}
function detectInvalidValues(
  tu: TransUnit,
  languageFunctionsSettings: LanguageFunctionsSettings
): void {
  if (
    !languageFunctionsSettings.detectInvalidValuesEnabled ||
    (tu.target.textContent === "" && tu.needsReview(languageFunctionsSettings))
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
