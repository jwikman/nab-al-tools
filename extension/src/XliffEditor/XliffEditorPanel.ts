import * as vscode from 'vscode';
import { Xliff } from '../XLIFFDocument';

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
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private readonly _resourceRoot: vscode.Uri;
    private _xlfDocument: Xliff;

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

                // And restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'src', 'XliffEditor', 'media')]
            }
        );

        XliffEditorPanel.currentPanel = new XliffEditorPanel(panel, extensionUri, xlfDoc);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, xlfDoc: Xliff) {
        XliffEditorPanel.currentPanel = new XliffEditorPanel(panel, extensionUri, xlfDoc);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, xlfDoc: Xliff) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._resourceRoot = vscode.Uri.joinPath(extensionUri, 'src', 'XliffEditor', 'media');
        this._xlfDocument = xlfDoc;
        // Set the webview's initial html content
        this._update(xlfDoc);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            e => {
                if (this._panel.visible) {
                    this._update(xlfDoc);
                }
            },
            null,
            this._disposables
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'alert':
                        vscode.window.showErrorMessage(message.text);
                        return;
                    case 'update':
                        vscode.window.showInformationMessage(`Updating translation for ${message.text} `);
                        this._xlfDocument.getTransUnitById(message.transunitId).target.textContent = message.targetText;
                        this._xlfDocument.toFileSync(this._xlfDocument._path);
                        return
                }
            },
            null,
            this._disposables
        );
    }

    public doRefactor() {
        // Send a message to the webview webview.
        // You can send any JSON serializable data.
        this._panel.webview.postMessage({ command: 'refactor' });
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
        const webview = this._panel.webview;
        this._updateForFile(webview, xlfDoc);
        return;
        
    }

    private _updateForFile(webview: vscode.Webview, xlfDoc: Xliff) {
        this._panel.title = xlfDoc.targetLanguage;
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

        return `<!DOCTYPE html>
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

                <title>${xlfDoc.targetLanguage}</title>
            </head>
            <body>
                <h1 id="lines-of-code-counter">0</h1>

                ${xlfTable(xlfDoc)}
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
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

function xlfTable(xlfDoc: Xliff): string {
    /** TODO:
     * Multipla targets ska kasta fel
     * Större textboxar för source och target
     * visa notes vid focus på rad
     * Filtermöjlighet? Alla, Suggestion, NotTranslated, Review. Kasta fel om man använder 
     *      attribut istället för tokens.
     */
    let html = '<table><tbody>';
    html += '<tr><th>Source</th><th>Target</th><th>note 1</th><th>note 2</th></tr>';
    xlfDoc.transunit.forEach(transunit => {
        html += `<tr id="${transunit.id}">`;
        html += `<td>${transunit.source}</td>`;
        html += `<td><input id="${transunit.id}" type="text" value="${transunit.target.textContent}"/></td>`;
        transunit.note?.forEach(note => {
            html += `<td>${note.textContent}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody><table>'
    return html;
    
}
