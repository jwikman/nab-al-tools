import * as vscode from 'vscode';
import * as fs from 'fs';

export async function openTextFileWithSelection(documentUri: vscode.Uri, selectionStart: number, selectionLength: number): Promise<void> {

    const textEditor = await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(documentUri));

    textEditor.selection = new vscode.Selection(textEditor.document.positionAt(selectionStart), textEditor.document.positionAt(selectionStart + selectionLength));
    await textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
}
export async function openTextFileWithSelectionOnLineNo(path: string, lineNo: number): Promise<void> {

    const textEditor = await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(path));
    const lineText = textEditor.document.getText(new vscode.Range(lineNo, 0, lineNo, 1000));
    textEditor.selection = new vscode.Selection(lineNo, lineText.length - lineText.trimLeft().length, lineNo, 1000);
    await textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.InCenter);
}

export async function searchTextFile(documentUri: vscode.Uri, startPosition: number, searchFor: string): Promise<{ foundNode: boolean; foundAtPosition: number }> {
    const fileContent: string = fs.readFileSync(documentUri.fsPath, "utf8");
    const foundOffset = fileContent.indexOf(searchFor, startPosition);

    return { foundNode: (foundOffset >= 0), foundAtPosition: foundOffset };
}

export function documentLineEnding(document: vscode.TextDocument): string {
    return eolToLineEnding(document.eol);
}

export function eolToLineEnding(eol: vscode.EndOfLine): string {
    if (eol === vscode.EndOfLine.CRLF) {
        return '\r\n';
    }
    return '\n';
}

export function getEOL(source: string): vscode.EndOfLine {
    const temp = source.indexOf('\n');
    if (source[temp - 1] === '\r') {
        return vscode.EndOfLine.CRLF;
    }
    return vscode.EndOfLine.LF;
}