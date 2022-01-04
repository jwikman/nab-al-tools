import * as AdmZip from "adm-zip";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
  CustomNoteType,
  TargetState,
  targetStateActionNeededAttributes,
  TranslationToken,
  TransUnit,
  Xliff,
} from "./Xliff/XLIFFDocument";
import { escapeRegex } from "./Common";
import { Settings } from "./Settings/Settings";
import { RefreshXlfHint, TranslationMode, TransUnitElementType } from "./Enums";
import { LanguageFunctionsSettings } from "./Settings/LanguageFunctionsSettings";
import * as XliffFunctions from "./XliffFunctions";
import { XliffIdToken } from "./ALObject/XliffIdToken";
import { TextDocumentMatch } from "./Types";
import { logger } from "./Logging/LogHelper";

export async function findNextUntranslatedText(
  filesToSearch: string[],
  replaceSelfClosingXlfTags: boolean,
  startOffset = 0,
  lowerThanTargetState?: TargetState
): Promise<TextDocumentMatch | undefined> {
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
      const nextUntranslatedMatch: TextDocumentMatch = {
        filePath: "",
        position: 0,
        length: 0,
      };
      nextUntranslatedMatch.filePath = xlfPath;
      if (matches && matches.index > 0) {
        nextUntranslatedMatch.position = lineStartPos + matches.index + 1;
        nextUntranslatedMatch.length = matches[0].length - 1;
      } else {
        nextUntranslatedMatch.position = searchResult.foundAtPosition;
        nextUntranslatedMatch.length = searchResult.foundWord.length;
      }

      return nextUntranslatedMatch;
    }

    const xlfDocument = Xliff.fromFileSync(xlfPath);
    if (!xlfDocument.translationTokensExists()) {
      if (xlfDocument.customNotesOfTypeExists(CustomNoteType.refreshXlfHint)) {
        xlfDocument.removeAllCustomNotesOfType(CustomNoteType.refreshXlfHint);
        logger.log("Removed custom notes.");
        xlfDocument.toFileAsync(xlfPath, replaceSelfClosingXlfTags);
      }
    }
  }
  return;
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
      const lineEnding =
        vscode.window.activeTextEditor.document.eol === vscode.EndOfLine.CRLF
          ? "\r\n"
          : "\n";

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

export async function copyAllSourceToTarget(
  languageFunctionsSettings: LanguageFunctionsSettings,
  setAsReview: boolean
): Promise<boolean> {
  if (vscode.window.activeTextEditor) {
    if (vscode.window.activeTextEditor.document.uri.fsPath.endsWith("xlf")) {
      // in a xlf file
      const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
      await vscode.window.activeTextEditor.document.save();
      const xliffDoc = Xliff.fromFileSync(filePath);

      for (const transUnit of xliffDoc.transunit.filter(
        (x) =>
          x.target.state === TargetState.needsTranslation ||
          x.target.translationToken === TranslationToken.notTranslated ||
          x.targets.length === 0
      )) {
        transUnit.target.textContent = transUnit.source;
        if (
          languageFunctionsSettings.translationMode === TranslationMode.nabTags
        ) {
          transUnit.target.translationToken = setAsReview
            ? TranslationToken.review
            : undefined;
        } else {
          transUnit.target.state = setAsReview
            ? TargetState.needsReviewTranslation
            : TargetState.translated;
        }
        if (setAsReview) {
          transUnit.insertCustomNote(
            CustomNoteType.refreshXlfHint,
            RefreshXlfHint.newCopiedSource
          );
        } else {
          transUnit.removeCustomNote(CustomNoteType.refreshXlfHint);
        }
      }
      xliffDoc.toFileAsync(
        filePath,
        languageFunctionsSettings.replaceSelfClosingXlfTags,
        true
      );
      return true;
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
          return escapeRegex(t);
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
  filePath: string,
  gXlfPath: string,
  languageFunctionsSettings: LanguageFunctionsSettings
): Promise<void> {
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
  const transUnitElementMaxLines = 6;
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
    if (count - customNoteCount > transUnitElementMaxLines) {
      throw new Error("Not inside a trans-unit element");
    }
  } while (transUnitElementType !== TransUnitElementType.transUnit);
  const result = textLine.match(/\s*<trans-unit id="([^"]*)"/i);
  if (null === result) {
    throw new Error(`Could not identify the trans-unit id ('${textLine})`);
  }
  return { lineNo: activeLineNo - count + 1, id: result[1] };
}

export function revealTransUnitTarget(
  transUnitId: string,
  langFilePath: string
): TextDocumentMatch | undefined {
  if (!vscode.window.activeTextEditor) {
    return;
  }
  const langContent = fs.readFileSync(langFilePath, "utf8");
  const transUnitIdRegExp = new RegExp(`"${transUnitId}"`);
  const result = transUnitIdRegExp.exec(langContent);
  if (result !== null) {
    const matchIndex = result.index;
    const targetRegExp = new RegExp(`(<target[^>]*>)([^>]*)(</target>)`);
    const restString = langContent.substring(matchIndex);
    const targetResult = targetRegExp.exec(restString);
    if (targetResult !== null) {
      return {
        filePath: langFilePath,
        position: targetResult.index + matchIndex + targetResult[1].length,
        length: targetResult[2].length,
      };
    }
  }
  return;
}

interface FileSearchParameters {
  searchStrings: string[];
  fileFilter: string;
}
