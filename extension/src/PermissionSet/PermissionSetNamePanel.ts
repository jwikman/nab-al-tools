import * as vscode from "vscode";
import * as html from "../XliffEditor/HTML";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as PermissionSetFunctions from "./PermissionSetFunctions";
import { XmlPermissionSet } from "./XmlPermissionSet";
import { logger } from "../Logging/LogHelper";

const MAX_PERMISSION_SET_NAME_LENGTH = 20;
const MAX_PERMISSION_SET_CAPTION_LENGTH = 30;
/**
 * Manages PermissionSetNameEditor webview panels
 */
export class PermissionSetNameEditorPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: PermissionSetNameEditorPanel | undefined;
  public static readonly viewType = "permissionSetNameEditor";
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private readonly _resourceRoot: vscode.Uri;
  private _xmlPermissionSets: XmlPermissionSet[];
  private _prefix: string;

  public static async createOrShow(
    extensionUri: vscode.Uri,
    xmlPermissionSets: XmlPermissionSet[],
    prefix: string
  ): Promise<void> {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (PermissionSetNameEditorPanel.currentPanel) {
      PermissionSetNameEditorPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      PermissionSetNameEditorPanel.viewType,
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

    PermissionSetNameEditorPanel.currentPanel = new PermissionSetNameEditorPanel(
      panel,
      extensionUri,
      xmlPermissionSets,
      prefix
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    xmlPermissionSets: XmlPermissionSet[],
    prefix: string
  ) {
    this._panel = panel;
    this._resourceRoot = vscode.Uri.joinPath(
      extensionUri,
      "frontend",
      "PermissionSetNameEditor"
    );
    this._xmlPermissionSets = xmlPermissionSets;
    this._prefix = prefix;
    // Set the webview's initial html content
    this._recreateWebview();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
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
          case "update-name":
            this.updatePermissionSet(true, message);
            return;
          case "update-caption":
            this.updatePermissionSet(false, message);
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
      this.validateData();
    } catch (error) {
      vscode.window.showErrorMessage(`${error}`, { modal: true });
      return;
    }
    this._panel.dispose();
    try {
      await PermissionSetFunctions.startConversion(
        this._prefix,
        this._xmlPermissionSets
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `"Convert to PermissionSet object" failed with error: ${error}`
      );
    }
  }

  private validateData(): void {
    // PermissionSet names not empty
    let nameTest = this._xmlPermissionSets.find(
      (x) => x.suggestedNewName === ""
    );
    if (nameTest) {
      throw new Error(
        `The PermissionSet "${nameTest.roleID}" has an empty name.`
      );
    }

    // PermissionSet names max length
    nameTest = this._xmlPermissionSets.find(
      (x) => x.suggestedNewName.length > MAX_PERMISSION_SET_NAME_LENGTH
    );
    if (nameTest) {
      throw new Error(
        `The PermissionSet name "${nameTest.suggestedNewName}" has more characters (${nameTest.suggestedNewName.length}) than the allowed length of ${MAX_PERMISSION_SET_NAME_LENGTH}.`
      );
    }

    // The PermissionSet names must be unique
    for (const xmlPermissionSet of this._xmlPermissionSets) {
      nameTest = this._xmlPermissionSets.find(
        (x) =>
          x.roleID !== xmlPermissionSet.roleID &&
          x.suggestedNewName === xmlPermissionSet.suggestedNewName
      );
      if (nameTest) {
        throw new Error(
          `The PermissionSet name "${nameTest.suggestedNewName}" is used more than once.`
        );
      }
    }

    // PermissionSet names not containing illegal characters
    nameTest = this._xmlPermissionSets.find((x) =>
      x.suggestedNewName.match(/[\n\r\t"]+/)
    );
    if (nameTest) {
      throw new Error(
        `The PermissionSet name "${nameTest.suggestedNewName}" has some illegal characters.`
      );
    }

    // PermissionSet captions not empty
    let captionTest = this._xmlPermissionSets.find((x) => x.roleName === "");
    if (captionTest) {
      throw new Error(
        `The PermissionSet "${captionTest.roleID}" has an empty caption.`
      );
    }
    // PermissionSet captions not too long
    captionTest = this._xmlPermissionSets.find(
      (x) => x.roleName.length > MAX_PERMISSION_SET_CAPTION_LENGTH
    );
    if (captionTest) {
      throw new Error(
        `The PermissionSet name "${captionTest.roleName}" has more characters (${captionTest.roleName.length}) than the allowed length of ${MAX_PERMISSION_SET_CAPTION_LENGTH}.`
      );
    }
    // PermissionSet names not containing illegal characters
    captionTest = this._xmlPermissionSets.find((x) =>
      x.roleName.match(/[\n\r\t']+/)
    );
    if (captionTest) {
      throw new Error(
        `The PermissionSet caption "${captionTest.roleName}" has some illegal characters.`
      );
    }
  }

  public isActiveTab(): boolean {
    return this._panel.active;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private updatePermissionSet(updateName: boolean, message: any): void {
    logger.log(message.text);
    const xmlPermissionSet = this._xmlPermissionSets.find(
      (x) => x.roleID === message.roleID
    );
    if (xmlPermissionSet) {
      if (updateName) {
        xmlPermissionSet.suggestedNewName = message.newValue;
      } else {
        xmlPermissionSet.roleName = message.newValue;
      }
    }
  }

  public dispose(): void {
    PermissionSetNameEditorPanel.currentPanel = undefined;

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
      this._xmlPermissionSets
    );
  }

  private _getHtmlForWebview(
    webview: vscode.Webview,
    xmlPermissionSets: XmlPermissionSet[]
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
                ${this.permissionSetsTable(xmlPermissionSets)}
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    return webviewHTML;
  }

  permissionSetsTable(xmlPermissionSets: XmlPermissionSet[]): string {
    let table = "<table>";
    table += html.tableHeader(["RoleID", "Object Name", "Object Caption"]);
    table += "<tbody>";
    xmlPermissionSets.forEach((xmlPermissionSet) => {
      const columns: html.HTMLTag[] = [
        {
          content: html.div(
            { id: `${xmlPermissionSet.roleID}-ID` },
            xmlPermissionSet.roleID
          ),
          a: undefined,
        },
        {
          content: html.textArea(
            { id: `${xmlPermissionSet.roleID}-name`, type: "text" },
            xmlPermissionSet.suggestedNewName
          ),
          a: { class: "target-cell" },
        },
        {
          content: html.textArea(
            { id: `${xmlPermissionSet.roleID}-caption`, type: "text" },
            xmlPermissionSet.roleName
          ),
          a: { class: "target-cell" },
        },
      ];
      table += html.tr({ id: `${xmlPermissionSet.roleID}` }, columns);
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
            { id: "btn-ok", title: "Convert PermissionSets" },
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
