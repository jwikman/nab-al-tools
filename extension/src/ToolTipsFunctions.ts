import * as fs from "fs";
import * as vscode from "vscode";
import * as path from "path";
import { ALObject, ALControl } from "./ALObject/ALElementTypes";
import * as ALParser from "./ALObject/ALParser";
import * as WorkspaceFunctions from "./WorkspaceFunctions";
import { ALControlType, ALObjectType } from "./ALObject/Enums";
import { ALPageControl } from "./ALObject/ALPageControl";
import { AppManifest, Settings } from "./Settings";

export async function showSuggestedToolTip(
  startFromBeginning: boolean
): Promise<boolean> {
  if (vscode.window.activeTextEditor === undefined) {
    return false;
  }

  if (vscode.window.activeTextEditor) {
    if (
      path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== ".al"
    ) {
      throw new Error("The current document is not an al file");
    }
    const sourceObjText = vscode.window.activeTextEditor.document.getText();
    const sourceArr = sourceObjText.split(/\n/);
    const startLineNo: number =
      startFromBeginning === true
        ? 0
        : vscode.window.activeTextEditor.selection.active.line + 1;
    let wrapSearch = startLineNo > 0;
    for (let i = startLineNo; i < sourceArr.length; i++) {
      const line = sourceArr[i];
      const matchResult = line.match(
        /^(?<prefix>\s*\/\/ ToolTip = '(?<specifies>Specifies the )?)(?<text>.*)';/
      );
      if (matchResult) {
        if (!matchResult.groups) {
          return false;
        }
        const textEditor = vscode.window.activeTextEditor;
        let offset = 0;
        if (matchResult.groups["specifies"]) {
          offset = 4;
        }
        textEditor.selection = new vscode.Selection(
          i,
          matchResult.groups["prefix"].length - offset,
          i,
          matchResult.groups["prefix"].length +
            matchResult.groups["text"].length
        );
        textEditor.revealRange(
          textEditor.selection,
          vscode.TextEditorRevealType.InCenter
        );
        return true;
      }
      if (wrapSearch && i === sourceArr.length - 1) {
        wrapSearch = false;
        i = 0;
      }
      if (!wrapSearch && startLineNo > 0 && i >= startLineNo) {
        return false;
      }
    }
  }
  return false;
}

export async function suggestToolTips(
  settings: Settings,
  appManifest: AppManifest
): Promise<void> {
  if (vscode.window.activeTextEditor === undefined) {
    return;
  }

  if (vscode.window.activeTextEditor) {
    if (
      path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !== ".al"
    ) {
      throw new Error("The current document is not an .al file");
    }
    const document = vscode.window.activeTextEditor.document;
    const sourceObjText = document.getText();
    const alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
      settings,
      appManifest,
      true,
      false,
      true
    );
    const alObj = ALParser.getALObjectFromText(
      sourceObjText,
      true,
      vscode.window.activeTextEditor.document.uri.fsPath,
      alObjects
    );
    if (!alObj) {
      throw new Error("The current document is not an AL object");
    }
    if (
      ![ALObjectType.page, ALObjectType.pageExtension].includes(
        alObj.objectType
      )
    ) {
      throw new Error("The current document is not a Page object");
    }
    const newObjectText = addSuggestedTooltips(alObj);
    fs.writeFileSync(
      vscode.window.activeTextEditor.document.uri.fsPath,
      newObjectText,
      "utf8"
    );
    showSuggestedToolTip(false);
  }
}
export function addSuggestedTooltips(alObject: ALObject): string {
  const pageFieldsNoToolTips = alObject
    .getAllControls()
    .filter(
      (x) =>
        x.type === ALControlType.pageField &&
        !x.toolTip &&
        !x.toolTipCommentedOut
    ) as ALPageControl[];
  pageFieldsNoToolTips.forEach((field) => {
    const toolTip = getToolTipFromOtherPages(field);
    if (toolTip) {
      field.toolTip = toolTip;
    } else {
      let toolTipName = field.caption;
      if (toolTipName === "") {
        if (!field.value.match(/\(|\)/)) {
          toolTipName = field.value;
        } else {
          toolTipName = field.name;
        }
      }
      toolTipName = toolTipName.trim().toLowerCase();
      toolTipName = formatFieldCaption(toolTipName);

      field.toolTip = `Specifies the ${toolTipName}`;
    }
  });
  const pageActionsNoToolTips = alObject
    .getAllControls()
    .filter(
      (x) =>
        x.type === ALControlType.action && !x.toolTip && !x.toolTipCommentedOut
    );
  pageActionsNoToolTips.forEach((action) => {
    const toolTip = getToolTipFromOtherPages(action);
    if (toolTip) {
      action.toolTip = toolTip;
    } else {
      let toolTipName = action.caption;
      if (toolTipName === "") {
        toolTipName = action.name;
      }
      toolTipName = toolTipName.trim();
      toolTipName = formatFieldCaption(toolTipName);
      action.toolTip = `${toolTipName}`;
    }
  });
  return alObject.toString();

  function getToolTipFromOtherPages(control: ALControl): string | undefined {
    let toolTip;
    const pageObjects = alObject.alObjects?.filter(
      (obj) =>
        obj.sourceTable === alObject.sourceTable &&
        [ALObjectType.page, ALObjectType.pageExtension].includes(
          obj.objectType
        ) &&
        !(
          obj.objectType === alObject.objectType &&
          obj.objectId === alObject.objectId
        )
    );
    if (pageObjects && pageObjects?.length > 0) {
      let fieldsWithSameName: ALControl[] = [];
      pageObjects.forEach((page) => {
        const allControls = page.getAllControls();
        const controls = allControls.filter(
          (y) => y.isIdentical(control) && y.toolTip !== ""
        );
        fieldsWithSameName = fieldsWithSameName.concat(controls);
      });
      if (fieldsWithSameName.length > 0) {
        toolTip = fieldsWithSameName[0].toolTip;
      }
    }
    return toolTip;
  }
}

function formatFieldCaption(caption: string): string {
  return caption.startsWith('"')
    ? caption.slice(1, caption.length - 1)
    : caption;
}
