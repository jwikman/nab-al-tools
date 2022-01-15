import * as vscode from "vscode";
import { ALObject } from "./ALObject/ALElementTypes";
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
): Promise<vscode.Location> {
  const document = await vscode.workspace.openTextDocument(path);
  const lineText = document.getText(new vscode.Range(lineNo, 0, lineNo, 1000));
  const selection = new vscode.Selection(
    lineNo,
    lineText.length - lineText.trimLeft().length,
    lineNo,
    1000
  );
  const textEditor = await vscode.window.showTextDocument(document);
  textEditor.selection = selection;
  textEditor.revealRange(
    textEditor.selection,
    vscode.TextEditorRevealType.InCenter
  );
  return new vscode.Location(document.uri, selection);
}

export async function openAlFileFromXliffTokens(
  settings: Settings,
  appManifest: AppManifest,
  tokens: XliffIdToken[]
): Promise<vscode.Location> {
  const alObjects = await getAlObjectsFromCurrentWorkspace(
    settings,
    appManifest,
    false
  );
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
  // found our object, load complete object from file
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
  } else {
    // No multi language object found, search for it's parents controls instead
    const xliffIdWithNames = XliffIdToken.getXliffIdWithNames(tokens);
    codeLineIndex = findParentControlLineIndex(tokens, obj, xliffIdWithNames);
  }
  return openTextFileWithSelectionOnLineNo(obj.objectFileName, codeLineIndex);
}

function findParentControlLineIndex(
  tokens: XliffIdToken[],
  obj: ALObject,
  xliffIdWithNames: string
): number {
  tokens.pop();
  if (tokens.length === 0) {
    throw new Error(
      `No code line found in file '${obj.objectFileName}' matching '${xliffIdWithNames}'`
    );
  }
  const xliffToSearchFor = XliffIdToken.getXliffId(tokens).toLowerCase();
  const controls = obj.getAllControls();
  const control = controls.find(
    (x) =>
      XliffIdToken.getXliffId(x.xliffIdTokenArray()).toLowerCase() ===
      xliffToSearchFor
  );

  return control
    ? control.startLineIndex
    : findParentControlLineIndex(tokens, obj, xliffIdWithNames);
}
