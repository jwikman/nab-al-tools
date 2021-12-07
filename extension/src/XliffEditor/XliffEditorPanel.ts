import * as vscode from "vscode";
import * as LanguageFunctions from "../LanguageFunctions";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import {
  CustomNoteType,
  StateQualifier,
  Target,
  TargetState,
  TranslationToken,
  TransUnit,
  Xliff,
} from "../Xliff/XLIFFDocument";
import * as html from "./HTML";
import * as SettingsLoader from "../Settings/SettingsLoader";
import { TranslationMode } from "../Enums";

/**
 * Manages XliffEditor webview panels
 */
export class XliffEditorPanel {
  /**
   * Track the currently panel. Only allow a single panel to exist at a time.
   */
  public static currentPanel: XliffEditorPanel | undefined;
  public static readonly viewType = "xliffEditor";
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private readonly _resourceRoot: vscode.Uri;
  private _xlfDocument: Xliff;
  private _currentXlfDocument: Xliff;
  private totalTransUnitCount: number;
  private state: EditorState;
  private languageFunctionsSettings = new LanguageFunctionsSettings(
    SettingsLoader.getSettings()
  );

  public static async createOrShow(
    extensionUri: vscode.Uri,
    xlfDoc: Xliff
  ): Promise<void> {
    if (xlfDoc._path.endsWith(".g.xlf")) {
      throw new Error("Opening .g.xlf with Xliff Editor is not supported.");
    }
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
      "Xliff Editor",
      column || vscode.ViewColumn.One,
      {
        // Enable javascript in the webview
        enableScripts: true,

        // And restrict the webview to only loading content from our extension's `XliffEditor` frontend directory.
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "frontend", "XliffEditor"),
        ],
      }
    );

    XliffEditorPanel.currentPanel = new XliffEditorPanel(
      panel,
      extensionUri,
      xlfDoc
    );
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    xlfDoc: Xliff
  ) {
    this._panel = panel;
    this._resourceRoot = vscode.Uri.joinPath(
      extensionUri,
      "frontend",
      "XliffEditor"
    );
    this.totalTransUnitCount = xlfDoc.transunit.length;
    this._xlfDocument = xlfDoc;
    this._currentXlfDocument = xlfDoc;
    this.state = { filter: FilterType.all };
    // Set the webview's initial html content
    this._recreateWebview();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this._panel.onDidChangeViewState(
      () => {
        if (this._panel.visible) {
          this._xlfDocument = Xliff.fromFileSync(this._xlfDocument._path);
          this.totalTransUnitCount = this._xlfDocument.transunit.length;
          this._recreateWebview();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
          case "reload":
            this._xlfDocument = Xliff.fromFileSync(this._xlfDocument._path);
            this._recreateWebview();
            vscode.window.showInformationMessage("File reloaded from disk.");
            return;
          case "update":
            this.updateXliffDocument(message);
            return;
          case "filter":
            this.state.filter = message.text as FilterType;
            this._recreateWebview();
            return;
          case "complete": {
            const translationMode = this.languageFunctionsSettings
              .translationMode;
            this.handleCompleteChanged(
              message.transunitId,
              message.checked,
              translationMode
            );
            // console.log(message.text);
            return;
          }
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

  private handleCompleteChanged(
    transUnitId: string,
    checked: boolean,
    translationMode: TranslationMode
  ): void {
    const unit = this._xlfDocument.getTransUnitById(transUnitId);
    if (checked) {
      unit.target.translationToken = undefined;
      unit.removeCustomNote(CustomNoteType.refreshXlfHint);
      switch (translationMode) {
        case TranslationMode.external:
          unit.target.state = TargetState.translated;
          unit.target.stateQualifier = undefined;
          break;
        case TranslationMode.dts:
          unit.target.stateQualifier = undefined;
          switch (this.state.filter) {
            case FilterType.all:
            case FilterType.differentlyTranslated:
            case FilterType.exactMatch:
            case FilterType.review:
              unit.target.state = TargetState.translated;
              break;
            case FilterType.stateTranslated:
              unit.target.state = TargetState.signedOff;
              break;
            case FilterType.stateSignedOff:
              unit.target.state = TargetState.final;
              break;
            default:
              throw new Error(
                `FilterType '${this.state.filter}' not supported.`
              );
          }
          break;
      }
    } else {
      if (unit.target.textContent === "") {
        switch (translationMode) {
          case TranslationMode.external:
            unit.target.state = TargetState.needsTranslation;
            unit.target.stateQualifier = StateQualifier.rejectedInaccurate;
            break;
          case TranslationMode.dts:
            unit.target.state = TargetState.needsTranslation;
            unit.target.stateQualifier = StateQualifier.rejectedInaccurate;
            unit.target.translationToken = TranslationToken.notTranslated;
            break;
          default:
            unit.target.translationToken = TranslationToken.notTranslated;
            break;
        }
        unit.insertCustomNote(
          CustomNoteType.refreshXlfHint,
          "Manually set as not translated"
        );
      } else {
        switch (translationMode) {
          case TranslationMode.external:
            unit.target.state = TargetState.needsReviewTranslation;
            unit.target.stateQualifier = StateQualifier.rejectedInaccurate;
            unit.insertCustomNote(
              CustomNoteType.refreshXlfHint,
              "Manually set as review"
            );
            break;
          case TranslationMode.dts:
            unit.target.state = TargetState.needsReviewTranslation;
            unit.target.stateQualifier = StateQualifier.rejectedInaccurate;
            unit.insertCustomNote(
              CustomNoteType.refreshXlfHint,
              "Manually set as review"
            );
            unit.target.translationToken = undefined;
            break;
          default:
            unit.target.translationToken = TranslationToken.review;
            unit.insertCustomNote(
              CustomNoteType.refreshXlfHint,
              "Manually set as review"
            );
            break;
        }
      }
    }
    const updatedTransUnits: UpdatedTransUnits[] = [];
    updatedTransUnits.push({
      id: transUnitId,
      noteText: getNotesHtml(
        unit,
        this.languageFunctionsSettings.translationMode
      ),
    });
    this.updateWebview(updatedTransUnits);
    this.saveToFile();
  }

  public isActiveTab(): boolean {
    return this._panel.active;
  }

  private saveToFile(): void {
    this._xlfDocument.toFileAsync(this._xlfDocument._path);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private updateXliffDocument(message: any): void {
    console.log(message.text);
    const updatedTransUnits: UpdatedTransUnits[] = [];
    const targetUnit = this._xlfDocument.getTransUnitById(message.transunitId);
    const oldTargetValue = this._xlfDocument.getTransUnitById(
      message.transunitId
    ).target.textContent;
    this._xlfDocument.getTransUnitById(message.transunitId).target.textContent =
      message.targetText;
    if (message.targetText === "") {
      this._xlfDocument.getTransUnitById(
        message.transunitId
      ).target.translationToken = TranslationToken.notTranslated;
      this._xlfDocument
        .getTransUnitById(message.transunitId)
        .insertCustomNote(
          CustomNoteType.refreshXlfHint,
          "Translation removed with Xliff Editor"
        );
    } else {
      this._xlfDocument.getTransUnitById(
        message.transunitId
      ).target.translationToken = undefined;
      this._xlfDocument
        .getTransUnitById(message.transunitId)
        .insertCustomNote(
          CustomNoteType.refreshXlfHint,
          "Translated with Xliff Editor"
        );
    }
    updatedTransUnits.push({
      id: message.transunitId,
      noteText: getNotesHtml(
        targetUnit,
        this.languageFunctionsSettings.translationMode
      ),
    });
    const transUnitsForSuggestion = this._xlfDocument.transunit.filter(
      (a) =>
        a.source === targetUnit.source &&
        a.id !== targetUnit.id &&
        !a.identicalTargetExists(message.targetText) &&
        ((a.target.translationToken === TranslationToken.suggestion &&
          a.target.textContent === oldTargetValue) ||
          a.target.translationToken === TranslationToken.notTranslated)
    );
    transUnitsForSuggestion.forEach((unit) => {
      const suggestion = new Target(message.targetText);
      suggestion.translationToken = TranslationToken.suggestion;
      unit.target = suggestion;
      unit.insertCustomNote(
        CustomNoteType.refreshXlfHint,
        `Suggestion added from '${message.transunitId}'`
      );
      updatedTransUnits.push({
        id: unit.id,
        targetText: suggestion.textContent,
        noteText: getNotesHtml(
          unit,
          this.languageFunctionsSettings.translationMode
        ),
      });
    });
    this.saveToFile();
    if (updatedTransUnits.length > 0) {
      console.log("Updated with suggestions");
      this.updateWebview(updatedTransUnits);
    }
  }

  private updateWebview(updatedTransUnits: UpdatedTransUnits[]): void {
    this._panel.webview.postMessage({
      command: "update",
      data: updatedTransUnits,
    });
  }

  public static getFilteredXliff(
    xlfDocument: Xliff,
    filter: FilterType,
    languageFunctionsSettings: LanguageFunctionsSettings
  ): Xliff {
    if (
      xlfDocument.transunit.filter((u) => u.targets.length === 0).length !== 0
    ) {
      throw new Error(
        `Xlf file contains trans-units without targets and cannot be opened in Xliff Editor. Run "NAB: Refresh XLF files from g.xlf" and try again.`
      );
    }
    const filteredXlf = new Xliff(
      xlfDocument.datatype,
      xlfDocument.sourceLanguage,
      xlfDocument.targetLanguage,
      xlfDocument.original
    );
    const _checkTargetState = checkTargetState(languageFunctionsSettings);
    filteredXlf._path = xlfDocument._path;
    switch (filter) {
      case FilterType.differentlyTranslated:
        filteredXlf.transunit = xlfDocument.differentlyTranslatedTransUnits();
        filteredXlf.transunit.sort((a, b) =>
          a.source > b.source ? 1 : b.source > a.source ? -1 : 0
        );
        break;
      case FilterType.stateTranslated:
        filteredXlf.transunit = xlfDocument.transunit.filter(
          (u) => u.target.state === TargetState.translated
        );
        break;
      case FilterType.stateSignedOff:
        filteredXlf.transunit = xlfDocument.transunit.filter(
          (u) => u.target.state === TargetState.signedOff
        );
        break;
      case FilterType.exactMatch:
        filteredXlf.transunit = xlfDocument.transunit.filter(
          (u) =>
            u.target.stateQualifier === StateQualifier.exactMatch ||
            u.target.stateQualifier === StateQualifier.msExactMatch
        );
        break;
      case FilterType.review:
        filteredXlf.transunit = xlfDocument.transunit.filter((u) =>
          u.needsReview(_checkTargetState)
        );
        break;
      case FilterType.all:
        filteredXlf.transunit = xlfDocument.transunit;
        break;
      default:
        throw new Error(`Unsupported FilterType '${filter}'`);
    }
    return filteredXlf;
  }

  public dispose(): void {
    XliffEditorPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
    vscode.window
      .showInformationMessage(
        "Do you want to refresh XLF files from g.xlf?",
        ...["Yes", "No"]
      )
      .then((answer) => {
        if (answer === "Yes") {
          runRefreshXlfFilesFromGXlf();
        }
      });
  }

  private _recreateWebview(): void {
    this._currentXlfDocument = XliffEditorPanel.getFilteredXliff(
      this._xlfDocument,
      this.state.filter,
      this.languageFunctionsSettings
    );
    this._panel.title = `${SettingsLoader.getAppManifest().name}.${
      this._currentXlfDocument.targetLanguage
    } (beta)`;
    this._panel.webview.html = this._getHtmlForWebview(
      this._panel.webview,
      this._currentXlfDocument
    );
  }

  private _getHtmlForWebview(webview: vscode.Webview, xlfDoc: Xliff): string {
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
                ${this.xlfTable(xlfDoc)}
                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
    return webviewHTML;
  }

  xlfTable(xlfDoc: Xliff): string {
    const menu = html.div(
      { class: "sticky" },
      html.table({}, [
        {
          content: html.button(
            { id: "btn-reload", title: "Reload file" },
            "&#8635 Reload"
          ),
          a: undefined,
        },
        { content: dropdownMenu(this.languageFunctionsSettings), a: undefined },
        {
          content: `Showing ${xlfDoc.transunit.length} of ${
            this.totalTransUnitCount
          } translation units.${html.br()}Filter: ${this.state.filter}`,
          a: undefined,
        },
      ])
    );
    let table = menu;
    table += "<table>";
    table += html.tableHeader([
      "Source",
      "Target",
      getCompleteHeader(
        this.state.filter,
        this.languageFunctionsSettings.translationMode
      ),
      "Notes",
    ]);
    table += "<tbody>";
    xlfDoc.transunit.forEach((transunit) => {
      const columns: html.HTMLTag[] = [
        {
          content: html.div({ id: `${transunit.id}-source` }, transunit.source),
          a: undefined,
        },
        {
          content: html.textArea(
            { id: transunit.id, type: "text" },
            transunit.target.textContent
          ),
          a: { class: "target-cell" },
        },
        {
          content: html.checkbox({
            id: `${transunit.id}-complete`,
            checked: getCheckedState(
              transunit,
              this.state.filter,
              this.languageFunctionsSettings
            ),
            class: "complete-checkbox",
          }),
          a: { align: "center" },
        },
        {
          content: html.div(
            { class: "transunit-notes", id: `${transunit.id}-notes` },
            getNotesHtml(
              transunit,
              this.languageFunctionsSettings.translationMode
            )
          ),
          a: undefined,
        },
      ];
      table += html.tr({ id: `${transunit.id}-row` }, columns);
    });
    table += "</tbody></table>";
    return table;
  }
}
function getCompleteHeader(
  filter: FilterType,
  translationMode: TranslationMode
): string {
  if (translationMode !== TranslationMode.dts) {
    return "Complete";
  }
  switch (filter) {
    case FilterType.stateTranslated:
      return "signed-off";
    case FilterType.stateSignedOff:
      return "final";
    default:
      return "Translated";
  }
}
function getCheckedState(
  transunit: TransUnit,
  filter: FilterType,
  languageFunctionsSettings: LanguageFunctionsSettings
): boolean {
  switch (languageFunctionsSettings.translationMode) {
    case TranslationMode.dts:
      switch (filter) {
        case FilterType.stateTranslated:
          return transunit.target.state === TargetState.signedOff;
        case FilterType.stateSignedOff:
          return transunit.target.state === TargetState.final;
        default:
          return !transunit.needsReview(
            checkTargetState(languageFunctionsSettings)
          );
      }
    default:
      return !transunit.needsReview(
        checkTargetState(languageFunctionsSettings)
      );
  }
}
function checkTargetState(
  languageFunctionsSettings: LanguageFunctionsSettings
): boolean {
  return [TranslationMode.external, TranslationMode.dts].includes(
    languageFunctionsSettings.translationMode
  );
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

function getNotesHtml(
  transunit: TransUnit,
  translationMode: TranslationMode
): string {
  let content = "";
  switch (translationMode) {
    case TranslationMode.external:
    case TranslationMode.dts:
      if (transunit.targetState !== TargetState.translated) {
        content += `${transunit.targetState}`;
        if (transunit.targetStateQualifier !== "") {
          content += ` - ${transunit.targetStateQualifier}`;
        }
        content += html.br(2);
      }
      break;
  }
  if (
    transunit.target.translationToken &&
    transunit.target.translationToken !== TranslationToken.suggestion
  ) {
    // Since all suggestions are listed we don't want to add an extra line just for the suggestion token.
    content += `${transunit.target.translationToken}${html.br(2)}`;
  }
  if (transunit.targets.length > 1) {
    transunit.targets.slice(1).forEach((target) => {
      content += `${target.translationToken} ${target.textContent}${html.br()}`;
    });
  }
  transunit.notes?.forEach((note) => {
    if (note.textContent !== "") {
      content += `${note.textContent.replace("-", html.br(2))}${html.br(2)}`;
    }
  });

  return content;
}

function dropdownMenu(
  languageFunctionsSettings: LanguageFunctionsSettings
): string {
  let dropdownContent = `
    <a href="#">${html.button(
      { id: "btn-filter-clear", class: "filter-btn" },
      "Show all"
    )}</a>
    <a href="#">${html.button(
      { id: "btn-filter-review", class: "filter-btn" },
      "Show translations in need of review"
    )}</a>
    <a href="#">${html.button(
      { id: "btn-filter-differently-translated", class: "filter-btn" },
      "Show differently translated"
    )}</a>`;
  if (languageFunctionsSettings.translationMode !== TranslationMode.nabTags) {
    dropdownContent += `
        <a href="#">${html.button(
          { id: "btn-filter-translated-state", class: "filter-btn" },
          'Show state "translated"'
        )}</a>
        <a href="#">${html.button(
          { id: "btn-filter-signed-off-state", class: "filter-btn" },
          'Show state "signed-off"'
        )}</a>
        <a href="#">${html.button(
          { id: "btn-filter-exact-match", class: "filter-btn" },
          'Show "Exact Match"'
        )}</a>
        `;
  }
  return `<div class="dropdown">
    ${html.button({ class: "dropbtn" }, "&#8801 Filter")}
  <div class="dropdown-content"> ${dropdownContent}
  </div>
</div> `;
}

function runRefreshXlfFilesFromGXlf(): void {
  LanguageFunctions.refreshXlfFilesFromGXlf({
    settings: SettingsLoader.getSettings(),
    appManifest: SettingsLoader.getAppManifest(),
    sortOnly: false,
    matchXlfFileUri: undefined,
    languageFunctionsSettings: new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    ),
  }).then((result) => {
    vscode.window.showInformationMessage(result.getReport());
  });
  return;
}

interface EditorState {
  filter: FilterType;
}
interface UpdatedTransUnits {
  id: string;
  targetText?: string;
  noteText: string;
}

enum FilterType {
  all = "all",
  review = "review",
  differentlyTranslated = "differently-translated",
  stateTranslated = "translated-state",
  stateSignedOff = "signed-off-state",
  exactMatch = "exact-match",
}
