import * as vscode from 'vscode';
import * as fs from 'fs';

export async function openTextFileWithSelection(DocumentUri: vscode.Uri, SelectionStart: number, SelectionLength: number) {

    let textEditor = await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(DocumentUri));

    textEditor.selection = new vscode.Selection(textEditor.document.positionAt(SelectionStart), textEditor.document.positionAt(SelectionStart + SelectionLength));
    await textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.Default);
}
export async function openTextFileWithSelectionOnLineNo(path : string, lineNo: number) {

    let textEditor = await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(path));
    let lineText = textEditor.document.getText(new vscode.Range(lineNo,0,lineNo,1000));
    textEditor.selection = new vscode.Selection(lineNo,lineText.length-lineText.trimLeft().length,lineNo,1000);
    await textEditor.revealRange(textEditor.selection, vscode.TextEditorRevealType.InCenter);
}

export async function searchTextFile(DocumentUri: vscode.Uri, StartPosition: number, SearchFor: string): Promise<{ foundNode: boolean; foundAtPosition: number }> {
    const fileContent: string = fs.readFileSync(DocumentUri.fsPath, "utf8");
    let foundOffset = fileContent.indexOf(SearchFor, StartPosition);

    return { foundNode: (foundOffset >= 0), foundAtPosition: foundOffset };
}
