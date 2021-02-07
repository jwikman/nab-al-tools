import { isNullOrUndefined } from 'util';
import * as vscode from 'vscode';
import { alAppName } from '../WorkspaceFunctions';
import { CustomNoteType, Target, TranslationToken, TransUnit, Xliff } from '../XLIFFDocument';
import * as html from './HTML';

/**
 * Manages XliffEditor webview panels
 */
export class XliffEditorPanel {
    /**
     * Track the currently panel. Only allow a single panel to exist at a time.
     */
    public static currentPanel: XliffEditorPanel | undefined;
    public static readonly viewType = 'xliffEditor';
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];
    private readonly _resourceRoot: vscode.Uri;
    private _xlfDocument: Xliff;
    private _currentXlfDocument: Xliff | undefined = undefined;
    private totalTransUnitCount: number;
    private state: EditorState;

    public static async createOrShow(extensionUri: vscode.Uri, xlfDoc: Xliff) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (XliffEditorPanel.currentPanel) {
            XliffEditorPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            XliffEditorPanel.viewType,
            'Xliff Editor',
            column || vscode.ViewColumn.One,
            {
                // Enable javascript in the webview
                enableScripts: true,

                // And restrict the webview to only loading content from our extension's `XliffEditor` frontend directory.
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'frontend', 'XliffEditor')]
            }
        );

        XliffEditorPanel.currentPanel = new XliffEditorPanel(panel, extensionUri, xlfDoc);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, xlfDoc: Xliff) {
        XliffEditorPanel.currentPanel = new XliffEditorPanel(panel, extensionUri, xlfDoc);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, xlfDoc: Xliff) {
        this._panel = panel;
        this._resourceRoot = vscode.Uri.joinPath(extensionUri, 'frontend', 'XliffEditor');
        this.totalTransUnitCount = xlfDoc.transunit.length;
        this._xlfDocument = xlfDoc;
        this.state = { filter: "all" };
        // Set the webview's initial html content
        this._update(this._xlfDocument);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            _ => {
                if (this._panel.visible) {
                    if (isNullOrUndefined(this._currentXlfDocument)) {
                        this._update(this._xlfDocument);
                    } else if (this._currentXlfDocument.transunit.length > 1) {
                        this._update(this._currentXlfDocument);
                    } else {
                        this._update(this._xlfDocument);
                    }
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case "alert":
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case "reload":
                        if (!isNullOrUndefined(this._currentXlfDocument)) {
                            this._xlfDocument = Xliff.fromFileSync(this._currentXlfDocument?._path);
                            this._update(this._xlfDocument);
                            vscode.window.showInformationMessage("File reloaded from disk.");
                        } else {
                            vscode.window.showErrorMessage("Could not reload file");
                        }
                        return;
                    case "update":
                        let suggestedTranslations: { id?: string, targetText: string }[] = [];
                        vscode.window.showInformationMessage(message.text);
                        let targetUnit = this._xlfDocument.getTransUnitById(message.transunitId);
                        this._xlfDocument.getTransUnitById(message.transunitId).targets[0].textContent = message.targetText;
                        this._xlfDocument.getTransUnitById(message.transunitId).targets[0].translationToken = undefined;
                        this._xlfDocument.getTransUnitById(message.transunitId).insertCustomNote(CustomNoteType.RefreshXlfHint, "Translated with Xliff Editor");
                        this._xlfDocument.transunit.filter(a => (a.source === targetUnit.source) && !a.identicalTargetExists(message.targetText) && (a.id !== targetUnit.id) /*&& a.hasCustomNote(CustomNoteType.RefreshXlfHint)*/).forEach(unit => {
                            let suggestion = new Target(message.targetText);
                            suggestion.translationToken = TranslationToken.Suggestion;
                            if (unit.targets.length === 1 && (unit.targets[0].textContent === "")) {
                                unit.targets[0] = suggestion;
                                suggestedTranslations.push({ id: unit.id, targetText: suggestion.textContent });
                            }
                        });
                        this._xlfDocument.toFileSync(this._xlfDocument._path);
                        if (suggestedTranslations.length > 0) {
                            this._panel.webview.postMessage({ command: "suggestions", suggestions: suggestedTranslations });
                            vscode.window.showInformationMessage("Updated with suggestions");
                            this._update(this._xlfDocument);
                        }
                        return;
                    case "filter":
                        this.state.filter = message.text;
                        this._update(this._xlfDocument);
                        return;
                    case "complete":
                        if (message.checked) {
                            this._xlfDocument.getTransUnitById(message.transunitId).targets[0].translationToken = undefined;
                            this._xlfDocument.getTransUnitById(message.transunitId).removeCustomNote(CustomNoteType.RefreshXlfHint);
                        } else {
                            this._xlfDocument.getTransUnitById(message.transunitId).targets[0].translationToken = TranslationToken.Review;
                            this._xlfDocument.getTransUnitById(message.transunitId).insertCustomNote(CustomNoteType.RefreshXlfHint, "Manually set as review");
                        }
                        vscode.window.showInformationMessage(message.text);
                        this._xlfDocument.toFileSync(this._xlfDocument._path);
                        return;
                    default:
                        vscode.window.showInformationMessage(`Unknown command: ${message.command}`);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public static applyFilter(xlfDocument: Xliff): Xliff {
        let filteredXlf = new Xliff(
            xlfDocument.datatype,
            xlfDocument.sourceLanguage,
            xlfDocument.targetLanguage,
            xlfDocument.original
        );
        filteredXlf._path = xlfDocument._path;
        filteredXlf.transunit = xlfDocument.transunit.filter(u => (u.targets[0].translationToken !== undefined) || (u.hasCustomNote(CustomNoteType.RefreshXlfHint)));
        return filteredXlf;
    }

    public dispose() {
        XliffEditorPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update(xlfDoc: Xliff) {
        this._currentXlfDocument = xlfDoc;
        const webview = this._panel.webview;
        if (this.state.filter === "review") {
            this._updateForFile(webview, XliffEditorPanel.applyFilter(this._currentXlfDocument));
        } else {
            this._updateForFile(webview, xlfDoc);
        }
        return;
    }

    private _updateForFile(webview: vscode.Webview, xlfDoc: Xliff) {
        this._panel.title = `${alAppName()}.${xlfDoc.targetLanguage} (beta)`;
        this._panel.webview.html = this._getHtmlForWebview(webview, xlfDoc);
    }

    private _getHtmlForWebview(webview: vscode.Webview, xlfDoc: Xliff) {
        // And the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._resourceRoot, 'main.js'));

        // Uri to load styles into webview
        const stylesResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._resourceRoot, 'reset.css'));
        const stylesMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._resourceRoot, 'vscode.css'));

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();
        const webviewHTML = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <!--
                    Use a content security policy to only allow loading images from https or from our extension directory,
                    and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${stylesResetUri}" rel="stylesheet">
                <link href="${stylesMainUri}" rel="stylesheet">
            </head>
            <body>
                ${this.xlfTable(xlfDoc)}
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
        return webviewHTML;
    }

    xlfTable(xlfDoc: Xliff): string {
        let menu = html.div({ class: "sticky" }, html.table({}, [
            html.button({ id: "btn-reload", title: "Reload file" }, "&#8635 Reload"),
            html.button({ id: "btn-filter-clear" }, "Show all"),
            html.button({ id: "btn-filter-review" }, "Show translations in need of review"),
            `Showing ${xlfDoc.transunit.length} of ${this.totalTransUnitCount} translation units`
        ]));
        let table = menu;
        table += '<table>';
        table += html.tableHeader(['Source', /*'Copy Source',*/ 'Target', 'Complete', 'Notes']);
        table += '<tbody>';
        xlfDoc.transunit.forEach(transunit => {
            let hasTranslationToken = isNullOrUndefined(transunit.targets[0].translationToken) ? false : true;
            let hasCustomNote = transunit.hasCustomNote(CustomNoteType.RefreshXlfHint);
            let columns = [
                html.div({ id: `${transunit.id}-source`, }, transunit.source),
                // html.button({ id: `${transunit.id}-copy-source`, class: "btn-cpy-src" }, "&#8614"), // TODO: Maybe add back in at a later date
                html.textArea({ id: transunit.id, type: "text" }, transunit.targets[0].textContent),// TODO: Use targets[0]? How to handle multiple targets in editor?
                html.checkbox({ id: `${transunit.id}-complete`, checked: !hasTranslationToken && !hasCustomNote, class: "complete-checkbox" }),
                html.div({ class: "transunit-notes", id: `${transunit.id}-notes` }, getNotesHtml(transunit)),
            ];
            table += html.tr({ id: transunit.id }, columns);
        });
        table += '</tbody></table>';
        return table;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function getNotesHtml(transunit: TransUnit): string {
    let content = '';
    if (transunit.targets[0].translationToken) {
        content += `${transunit.targets[0].translationToken}${html.br(2)}`;
    }
    transunit.notes?.forEach(note => {
        if (note.textContent !== "") {
            content += `${note.textContent.replace("-", html.br(2))}${html.br(2)}`;
        }
    });
    return content;
}

interface EditorState {
    position?: string;
    filter?: string;
}