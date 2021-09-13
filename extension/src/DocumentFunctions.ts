import * as vscode from "vscode";
import * as ALParser from "./ALObject/ALParser";
import { XliffIdToken } from "./ALObject/XliffIdToken";
import { AppManifest, Settings } from "./Settings/Settings";
import { getAlObjectsFromCurrentWorkspace } from "./WorkspaceFunctions";

export async function openTextFileWithSelection(
  documentFilePath: string,
  selectionStart: number,
  selectionLength: number
): Promise<void> {
  const textEditor = await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument(documentFilePath)
  );

  textEditor.selection = new vscode.Selection(
    textEditor.document.positionAt(selectionStart),
    textEditor.document.positionAt(selectionStart + selectionLength)
  );
  textEditor.revealRange(
    textEditor.selection,
    vscode.TextEditorRevealType.InCenterIfOutsideViewport
  );
}
export async function openTextFileWithSelectionOnLineNo(
  path: string,
  lineNo: number
): Promise<void> {
  const textEditor = await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument(path)
  );
  const lineText = textEditor.document.getText(
    new vscode.Range(lineNo, 0, lineNo, 1000)
  );
  textEditor.selection = new vscode.Selection(
    lineNo,
    lineText.length - lineText.trimLeft().length,
    lineNo,
    1000
  );
  textEditor.revealRange(
    textEditor.selection,
    vscode.TextEditorRevealType.InCenter
  );
}

export function documentLineEnding(document: vscode.TextDocument): string {
  return eolToLineEnding(document.eol);
}

export function eolToLineEnding(eol: vscode.EndOfLine): string {
  if (eol === vscode.EndOfLine.CRLF) {
    return "\r\n";
  }
  return "\n";
}

export async function openAlFileFromXliffTokens(
  settings: Settings,
  appManifest: AppManifest,
  tokens: XliffIdToken[]
): Promise<void> {
  const alObjects = await getAlObjectsFromCurrentWorkspace(
    settings,
    appManifest,
    false
  );
  const obj = alObjects.filter(
    (x) =>
      x.objectType.toLowerCase() === tokens[0].type.toLowerCase() &&
      x.objectName.toLowerCase() === tokens[0].name.toLowerCase()
  )[0];
  if (!obj) {
    throw new Error(
      `Could not find any object matching '${XliffIdToken.getXliffIdWithNames(
        tokens
      )}'`
    );
  }
  // found our object, load complete object from file
  obj.endLineIndex = ALParser.parseCode(obj, obj.startLineIndex + 1, 0);

  const xliffToSearchFor = XliffIdToken.getXliffId(tokens).toLowerCase();
  const mlObjects = obj.getAllMultiLanguageObjects({
    onlyForTranslation: true,
  });
  const mlObject = mlObjects.filter(
    (x) => x.xliffId().toLowerCase() === xliffToSearchFor
  );
  if (mlObject.length !== 1) {
    throw new Error(
      `No code line found in file '${
        obj.objectFileName
      }' matching '${XliffIdToken.getXliffIdWithNames(tokens)}'`
    );
  }
  openTextFileWithSelectionOnLineNo(
    obj.objectFileName,
    mlObject[0].startLineIndex
  );
}
