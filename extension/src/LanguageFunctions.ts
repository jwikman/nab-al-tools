import * as AdmZip from "adm-zip";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as WorkspaceFunctions from "./WorkspaceFunctions";
import * as DocumentFunctions from "./DocumentFunctions";
import * as escapeStringRegexp from "escape-string-regexp";
import {
  CustomNoteType,
  TargetState,
  targetStateActionNeededAttributes,
  TranslationToken,
  TransUnit,
  Xliff,
} from "./Xliff/XLIFFDocument";

import { createFolderIfNotExist } from "./Common";
import { AppManifest, Settings } from "./Settings/Settings";
import { TranslationMode, TransUnitElementType } from "./Enums";
import { LanguageFunctionsSettings } from "./Settings/LanguageFunctionsSettings";
import * as XliffFunctions from "./XliffFunctions";
import { XliffIdToken } from "./ALObject/XliffIdToken";

export async function findNextUnTranslatedText(
  settings: Settings,
  appManifest: AppManifest,
  searchCurrentDocument: boolean,
  replaceSelfClosingXlfTags: boolean,
  lowerThanTargetState?: TargetState
): Promise<boolean> {
  let filesToSearch: string[] = [];
  let startOffset = 0;
  if (searchCurrentDocument) {
    if (vscode.window.activeTextEditor === undefined) {
      return false;
    }
    await vscode.window.activeTextEditor.document.save();
    filesToSearch.push(vscode.window.activeTextEditor.document.uri.fsPath);
    startOffset = vscode.window.activeTextEditor.document.offsetAt(
      vscode.window.activeTextEditor.selection.active
    );
  } else {
    await vscode.workspace.saveAll();
    filesToSearch = WorkspaceFunctions.getLangXlfFiles(settings, appManifest);
    if (vscode.window.activeTextEditor !== undefined) {
      //To avoid get stuck on the first file in the array we shift it.
      if (
        vscode.window.activeTextEditor.document.uri.fsPath === filesToSearch[0]
      ) {
        const first: string = filesToSearch[0];
        filesToSearch.push(first);
        filesToSearch.shift();
      }
    }
  }

  for (let i = 0; i < filesToSearch.length; i++) {
    const xlfPath = filesToSearch[i];
    const fileContents = fs.readFileSync(xlfPath, "utf8");
    let searchFor: Array<string> = [];
    searchFor = searchFor.concat(Object.values(TranslationToken)); // NAB: tokens
    searchFor = searchFor.concat(
      targetStateActionNeededAttributes(lowerThanTargetState)
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
            xlfPath,
            lineStartPos + matches.index + 1,
            matches[0].length - 1
          );
          fallBack = false;
        }
      }
      if (fallBack) {
        await DocumentFunctions.openTextFileWithSelection(
          xlfPath,
          searchResult.foundAtPosition,
          searchResult.foundWord.length
        );
      }

      return true;
    }

    removeCustomNotesFromFile(xlfPath, replaceSelfClosingXlfTags);
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
      const lineEnding = DocumentFunctions.eolToLineEnding(
        vscode.window.activeTextEditor.document.eol
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

export function allUntranslatedSearchParameters(
  languageFunctionsSettings: LanguageFunctionsSettings
): FileSearchParameters {
  return {
    searchStrings: languageFunctionsSettings.useExternalTranslationTool
      ? targetStateActionNeededAttributes()
      : Object.values(TranslationToken).map((t) => {
          return escapeStringRegexp(t);
        }),
    fileFilter: languageFunctionsSettings.searchOnlyXlfFiles ? "*.xlf" : "",
  };
}

export function findMultipleTargetsSearchParameters(
  languageFunctionsSettings: LanguageFunctionsSettings
): FileSearchParameters {
  return {
    searchStrings: ["^\\s*<target>.*\\r*\\n*(\\s*<target>.*)+"],
    fileFilter: languageFunctionsSettings.useExternalTranslationTool
      ? "*.xlf"
      : "",
  };
}

export async function formatCurrentXlfFileForDts(
  settings: Settings,
  appManifest: AppManifest,
  filePath: string,
  languageFunctionsSettings: LanguageFunctionsSettings
): Promise<void> {
  const gXlfPath = WorkspaceFunctions.getGXlfFilePath(settings, appManifest);
  const original = path.basename(gXlfPath);
  if (gXlfPath === filePath) {
    throw new Error("You cannot run this function on the g.xlf file.");
  }
  const xliff = Xliff.fromFileSync(filePath);
  xliff.original = original;
  xliff.transunit.forEach((tu) =>
    XliffFunctions.formatTransUnitForTranslationMode(TranslationMode.dts, tu)
  );
  xliff.toFileSync(
    filePath,
    languageFunctionsSettings.replaceSelfClosingXlfTags
  );
}

export async function zipXlfFiles(
  settings: Settings,
  appManifest: AppManifest,
  dtsWorkFolderPath: string
): Promise<void> {
  const gXlfFilePath = WorkspaceFunctions.getGXlfFilePath(
    settings,
    appManifest
  );
  const langXlfFileUri = WorkspaceFunctions.getLangXlfFiles(
    settings,
    appManifest
  );
  createFolderIfNotExist(dtsWorkFolderPath);
  createXlfZipFile(gXlfFilePath, dtsWorkFolderPath);
  langXlfFileUri.forEach((filePath) => {
    createXlfZipFile(filePath, dtsWorkFolderPath);
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
  settings: Settings,
  filePath: string,
  langXliffArr: Xliff[],
  languageFunctionsSettings: LanguageFunctionsSettings
): void {
  const zip = new AdmZip(filePath);
  const zipEntries = zip
    .getEntries()
    .filter((entry) => entry.name.endsWith(".xlf"));
  const source = Xliff.fromString(zip.readAsText(zipEntries[0], "utf8"));
  const target = langXliffArr.find(
    (x) => x.targetLanguage === source.targetLanguage
  );
  if (target === undefined) {
    throw new Error(
      `There are no xlf file with target-language "${source.targetLanguage}" in the translation folder (${settings.translationFolderPath}).`
    );
  }
  XliffFunctions.importTranslatedFileIntoTargetXliff(
    source,
    target,
    languageFunctionsSettings,
    settings.translationFolderPath
  );
  target.toFileSync(target._path, false);
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
      /\s*<note from="[^"]*" annotates="general" priority="\d">(.*)<\/note>.*/i
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
  return 6;
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
  if (transUnit === undefined) {
    throw new Error(
      `Could not find Translation Unit ${result.id} in ${path.basename(
        currDoc.uri.fsPath
      )}`
    );
  }
  return { xliffDoc, transUnit };
}

export function getTransUnitID(
  activeLineNo: number,
  doc: vscode.TextDocument
): { lineNo: number; id: string } {
  let textLine: string;
  let count = 0;
  let customNoteCount = 0;
  let transUnitElementType: TransUnitElementType;
  do {
    textLine = doc.getText(
      new vscode.Range(
        new vscode.Position(activeLineNo - count, 0),
        new vscode.Position(activeLineNo - count, 5000)
      )
    );
    count += 1;
    transUnitElementType = getTransUnitLineType(textLine);
    if (transUnitElementType === TransUnitElementType.customNote) {
      customNoteCount += 1;
    }
    if (count - customNoteCount > getTransUnitElementMaxLines()) {
      throw new Error("Not inside a trans-unit element");
    }
  } while (transUnitElementType !== TransUnitElementType.transUnit);
  const result = textLine.match(/\s*<trans-unit id="([^"]*)"/i);
  if (null === result) {
    throw new Error(`Could not identify the trans-unit id ('${textLine})`);
  }
  return { lineNo: activeLineNo - count + 1, id: result[1] };
}

function removeAllCustomNotes(xlfDocument: Xliff): boolean {
  let notesRemoved = false;
  if (xlfDocument.customNotesOfTypeExists(CustomNoteType.refreshXlfHint)) {
    xlfDocument.removeAllCustomNotesOfType(CustomNoteType.refreshXlfHint);
    notesRemoved = true;
  }
  return notesRemoved;
}

export async function revealTransUnitTarget(
  settings: Settings,
  appManifest: AppManifest,
  transUnitId: string
): Promise<boolean> {
  if (!vscode.window.activeTextEditor) {
    return false;
  }
  const langFiles = WorkspaceFunctions.getLangXlfFiles(settings, appManifest);
  if (langFiles.length === 1) {
    const langContent = fs.readFileSync(langFiles[0], "utf8");
    const transUnitIdRegExp = new RegExp(`"${transUnitId}"`);
    const result = transUnitIdRegExp.exec(langContent);
    if (result !== null) {
      const matchIndex = result.index;
      const targetRegExp = new RegExp(`(<target[^>]*>)([^>]*)(</target>)`);
      const restString = langContent.substring(matchIndex);
      const targetResult = targetRegExp.exec(restString);
      if (targetResult !== null) {
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

function removeCustomNotesFromFile(
  xlfPath: string,
  replaceSelfClosingXlfTags: boolean
): void {
  const xlfDocument = Xliff.fromFileSync(xlfPath);
  if (xlfDocument.translationTokensExists()) {
    return;
  }
  if (removeAllCustomNotes(xlfDocument)) {
    console.log("Removed custom notes.");
    xlfDocument.toFileAsync(xlfPath, replaceSelfClosingXlfTags);
  }
}
interface FileSearchParameters {
  searchStrings: string[];
  fileFilter: string;
}
