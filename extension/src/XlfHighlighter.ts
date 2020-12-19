import * as vscode from 'vscode';
import { TranslationToken } from './XLIFFDocument';
import * as Common from './Common';

// TODO: settings to enable/disable + decoration
const decorationType = vscode.window.createTextEditorDecorationType({
    borderWidth: '1px',
    borderRadius: '0px',
    borderStyle: 'dotted',
    overviewRulerLane: vscode.OverviewRulerLane.Center,
    light: {
        // this color will be used in light color themes
        overviewRulerColor: 'orange',
        borderColor: 'orange',
        backgroundColor: 'rgba(200, 200, 100, 0.50)'
    },
    dark: {
        // this color will be used in dark color themes
        overviewRulerColor: 'yellow',
        borderColor: 'yellow',
        backgroundColor: 'rgba(200, 200, 100, 0.10)'

    }
});

export const translationTokenSearchExpression = `${Common.escapeRegex(TranslationToken.NotTranslated)}|${Common.escapeRegex(TranslationToken.Review)}|${Common.escapeRegex(TranslationToken.Suggestion)}|${Common.escapeRegex('[NAB:')}`;

export class XlfHighlighter {
    timeout: NodeJS.Timer | undefined;

    constructor() {
        if (vscode.window.activeTextEditor) {
            this.queueHighlightDocument(vscode.window.activeTextEditor.document);
        }
    }
    public onDidChangeTextDocument(e: vscode.TextDocumentChangeEvent) {
        this.queueHighlightDocument(e.document);
    }
    public onDidChangeActiveTextEditor(editor: vscode.TextEditor | undefined) {
        if (!editor) {
            return;
        }
        this.queueHighlightDocument(editor.document);
    }
    queueHighlightDocument(document: vscode.TextDocument) {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        if (!isXlfFileOpen(document)) {
            return;
        }
        this.timeout = setTimeout(() => this.highlightDocument(document), 100);
    }
    public highlightDocument(document: vscode.TextDocument) {
        if (!isXlfFileOpen(document)) {
            return;
        }
        if (!vscode.window.activeTextEditor) {
            return;
        }
        let ranges = getHighlightRanges(document, translationTokenSearchExpression);

        vscode.window.activeTextEditor.setDecorations(decorationType, ranges);
    }

}

export function getHighlightRanges(document: vscode.TextDocument, searchExpression: string) {
    let matchRanges: vscode.Range[] = [];

    const content = document.getText();

    var re = new RegExp(searchExpression, 'g');

    let result;
    while ((result = re.exec(content)) !== null) {
        let matchIndex = result.index;
        let t = result[0].length;
        let startPoint = document.positionAt(matchIndex);
        let endPoint = document.positionAt(matchIndex + t);
        matchRanges.push(new vscode.Range(startPoint, endPoint));
    }
    return matchRanges;
}

function isXlfFileOpen(document: vscode.TextDocument) {
    if (!vscode.window.activeTextEditor) {
        return false;
    }
    if (!document) {
        return false;
    }
    if (vscode.window.activeTextEditor.document !== document) {
        return false;
    }
    return document.fileName.endsWith('xlf');

}