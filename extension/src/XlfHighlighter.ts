import * as vscode from "vscode";
import {
  translationTokenSearchExpression,
  invalidXmlSearchExpression,
} from "./constants";
import { Settings, Setting } from "./OldSettings";

const xlfHighlightsDecoration = Settings.getConfigSettings()[
  Setting.xlfHighlightsDecoration
];

const decorationType = vscode.window.createTextEditorDecorationType(
  xlfHighlightsDecoration
);

const showXlfHighlights = Settings.getConfigSettings()[
  Setting.showXlfHighlights
];

export class XlfHighlighter {
  timeout: NodeJS.Timer | undefined;

  constructor() {
    if (vscode.window.activeTextEditor) {
      this.queueHighlightDocument(vscode.window.activeTextEditor.document);
    }
  }
  public onDidChangeTextDocument(e: vscode.TextDocumentChangeEvent): void {
    this.queueHighlightDocument(e.document);
  }
  public onDidChangeActiveTextEditor(
    editor: vscode.TextEditor | undefined
  ): void {
    if (!editor) {
      return;
    }
    this.queueHighlightDocument(editor.document);
  }

  queueHighlightDocument(document: vscode.TextDocument): void {
    if (!showXlfHighlights) {
      return;
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    if (!isXlfFileOpen(document)) {
      return;
    }
    this.timeout = setTimeout(() => this.highlightDocument(document), 100);
  }
  public highlightDocument(document: vscode.TextDocument): void {
    if (!showXlfHighlights) {
      return;
    }
    if (!isXlfFileOpen(document)) {
      return;
    }
    if (!vscode.window.activeTextEditor) {
      return;
    }
    let matchRanges: vscode.Range[] = [];
    matchRanges = getHighlightRanges(
      document,
      translationTokenSearchExpression,
      matchRanges
    );
    matchRanges = getHighlightRanges(
      document,
      invalidXmlSearchExpression,
      matchRanges
    );

    vscode.window.activeTextEditor.setDecorations(decorationType, matchRanges);
  }
}

export function getHighlightRanges(
  document: vscode.TextDocument,
  searchExpression: string,
  matchRanges: vscode.Range[]
): vscode.Range[] {
  const content = document.getText();

  const re = new RegExp(searchExpression, "g");

  let result;
  while ((result = re.exec(content)) !== null) {
    const matchIndex = result.index;
    const t = result[0].length;
    const startPoint = document.positionAt(matchIndex);
    const endPoint = document.positionAt(matchIndex + t);
    matchRanges.push(new vscode.Range(startPoint, endPoint));
  }
  return matchRanges;
}

function isXlfFileOpen(document: vscode.TextDocument): boolean {
  if (!vscode.window.activeTextEditor) {
    return false;
  }
  if (!document) {
    return false;
  }
  if (vscode.window.activeTextEditor.document !== document) {
    return false;
  }
  return document.fileName.endsWith("xlf");
}
