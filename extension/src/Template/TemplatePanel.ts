import * as vscode from "vscode";
import * as html from "../XliffEditor/HTML";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as Telemetry from "../Telemetry";
import * as TemplateFunctions from "./TemplateFunctions";
import * as fs from "fs";
import { IMapping, ITemplateSettings } from "./TemplateTypes";
import { logger } from "../Logging/LogHelper";

/**
 * Manages PermissionSetNameEditor webview panels
 */
export class TemplateEditorPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: TemplateEditorPanel | undefined;
  public static readonly viewType = "templateEditorPanel";
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private readonly _resourceRoot: vscode.Uri;
  private templateSettingsPath: string;
  private templateSettings: ITemplateSettings;

  public static async createOrShow(
    extensionUri: vscode.Uri,
    templateSettingsPath: string
  ): Promise<void> {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (TemplateEditorPanel.currentPanel) {
      TemplateEditorPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      TemplateEditorPanel.viewType,
      "PermissionSet names",
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `PermissionSetNameEditor` frontend directory.
        localResourceRoots: [
          vscode.Uri.joinPath(
            extensionUri,
            "frontend",
            "PermissionSetNameEditor"
          ),
        ],
      }
    );

    TemplateEditorPanel.currentPanel = new TemplateEditorPanel(
      panel,
      extensionUri,
      templateSettingsPath
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    templateSettingsPath: string
  ) {
    this.templateSettingsPath = templateSettingsPath;
    if (!fs.existsSync(this.templateSettingsPath)) {
      throw new Error(
        `Template Settings file "${this.templateSettingsPath}" is not found`
      );
    }
    this.templateSettings = JSON.parse(
      fs.readFileSync(this.templateSettingsPath, "utf8")
    ) as ITemplateSettings;

    TemplateFunctions.setDefaults(this.templateSettings);

    this._panel = panel;
    this._resourceRoot = vscode.Uri.joinPath(
      extensionUri,
      "frontend",
      "TemplateEditor"
    );
    // Set the webview's initial html content
    this._recreateWebview();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "cancel":
            this._panel.dispose();
            return;
          case "ok":
            this.handleOk();
            return;
          case "update":
            this.updateMapping(message);
            return;
          default:
            vscode.window.showInformationMessage(
              `Unknown command: ${message.command}`
            );
            return;
        }
      },
      null,
      this._disposables
    );
  }

  async handleOk(): Promise<void> {
    try {
      // PermissionSetFunctions.validateData(this._xmlPermissionSets); // TODO: implement
    } catch (error) {
      vscode.window.showErrorMessage(`${error}`, { modal: true });
      return;
    }
    this._panel.dispose();
    try {
      // await PermissionSetFunctions.startConversion( // TODO: implement
      //   this._prefix,
      //   this._xmlPermissionSets
      // );
    } catch (error) {
      vscode.window.showErrorMessage(
        `"Convert from template" failed with error: ${error}`
      );
      Telemetry.trackException(error);
    }
  }

  public isActiveTab(): boolean {
    return this._panel.active;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private updateMapping(message: any): void {
    logger.log(message.text);
    const mapping = this.templateSettings.mappings.find(
      (x) => x.id === message.roleID
    );
    if (mapping) {
      mapping.value = message.newValue;
    }
  }

  public dispose(): void {
    TemplateEditorPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _recreateWebview(): void {
    this._panel.title = `${
      SettingsLoader.getAppManifest().name
    } - PermissionSets`;
    this._panel.webview.html = this._getHtmlForWebview(
      this._panel.webview,
      this.templateSettings.mappings
    );
  }

  private _getHtmlForWebview(
    webview: vscode.Webview,
    mappings: IMapping[]
  ): string {
    // And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._resourceRoot, "main.js")
    );

    // Uri to load styles into webview
    const stylesResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._resourceRoot, "reset.css")
    );
    const stylesMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._resourceRoot, "vscode.css")
    );

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
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${
                  webview.cspSource
                }; img-src ${
      webview.cspSource
    } https:; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${stylesResetUri}" rel="stylesheet">
                <link href="${stylesMainUri}" rel="stylesheet">
            </head>
            <body>
                ${this.mappingTable(mappings)}
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    return webviewHTML;
  }

  mappingTable(mappings: IMapping[]): string {
    let table = "<table>";
    table += html.tableHeader(["Description", "Example", "Value"]);
    table += "<tbody>";
    mappings.forEach((mapping) => {
      const columns: html.HTMLTag[] = [
        {
          content: html.div(
            { id: `${mapping.id}-Description` },
            mapping.description
          ),
          a: undefined,
        },
        {
          content: html.textArea(
            { id: `${mapping.id}-example`, type: "text" },
            mapping.example
          ),
          a: undefined,
        },
        {
          content: html.textArea(
            { id: `${mapping.id}-value`, type: "text" },
            mapping.value ?? ""
          ),
          a: { class: "target-cell" },
        },
      ];
      table += html.tr({ id: `${mapping.id}` }, columns);
    });
    table += "</tbody></table>";
    const menu = html.div(
      { class: "sticky" },
      html.table({}, [
        {
          content: html.button({ id: "btn-cancel", title: "Cancel" }, "Cancel"),
          a: undefined,
        },
        {
          content: html.button(
            { id: "btn-ok", title: "Convert from Template" },
            "OK"
          ),
          a: undefined,
        },
      ])
    );
    table += menu;
    return table;
  }
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
