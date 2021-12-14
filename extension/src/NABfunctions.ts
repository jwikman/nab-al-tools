import * as vscode from "vscode";
import * as LanguageFunctions from "./LanguageFunctions";
import * as VSCodeFunctions from "./VSCodeFunctions";
import * as WorkspaceFunctions from "./WorkspaceFunctions";
import * as ToolTipsDocumentation from "./ToolTipsDocumentation";
import * as ToolTipsFunctions from "./ToolTipsFunctions";
import * as Documentation from "./Documentation";
import * as DebugTests from "./DebugTests";
import * as ALParser from "./ALObject/ALParser";
import * as path from "path";
import * as PowerShellFunctions from "./PowerShellFunctions";
import * as DocumentFunctions from "./DocumentFunctions";
import * as FileFunctions from "./FileFunctions";
import * as XliffCache from "./Xliff/XliffCache";
import { IOpenXliffIdParam } from "./Types";
import { TargetState, Xliff } from "./Xliff/XLIFFDocument";
import { baseAppTranslationFiles } from "./externalresources/BaseAppTranslationFiles";
import { XliffEditorPanel } from "./XliffEditor/XliffEditorPanel";
import * as fs from "fs";
import {
  CSVExportFilter,
  CSVHeader,
  exportXliffCSV,
} from "./CSV/ExportXliffCSV";
import { importXliffCSV } from "./CSV/ImportXliffCSV";
import { isArray } from "lodash";
import * as SettingsLoader from "./Settings/SettingsLoader";
import { TranslationMode } from "./Enums";
import { LanguageFunctionsSettings } from "./Settings/LanguageFunctionsSettings";
import { RefreshResult } from "./RefreshResult";
import * as XliffFunctions from "./XliffFunctions";
import { InvalidXmlError } from "./Error";
import { TextDocumentMatch } from "./Types";
// import { OutputLogger as out } from './Logging';

export async function refreshXlfFilesFromGXlf(
  suppressMessage = false
): Promise<void> {
  console.log("Running: RefreshXlfFilesFromGXlf");
  let refreshResult: RefreshResult;
  try {
    if (XliffEditorPanel.currentPanel?.isActiveTab()) {
      throw new Error(
        `Close Xliff Editor before running "NAB: Refresh Xlf files from g.xlf"`
      );
    }
    refreshResult = await refreshXlfFilesFromGXlfWithSettings();
  } catch (error) {
    handleInvalidXmlError(error);
    showErrorAndLog("Refresh files from g.xlf", error as Error);
    return;
  }
  const showMessage = suppressMessage ? refreshResult.isChanged : true;
  if (showMessage) {
    vscode.window.showInformationMessage(getRefreshXlfMessage(refreshResult));
  }
  console.log("Done: RefreshXlfFilesFromGXlf");
}

export async function formatCurrentXlfFileForDts(): Promise<void> {
  console.log("Running: FormatCurrentXlfFileForDTS");
  const languageFunctionsSettings = new LanguageFunctionsSettings(
    SettingsLoader.getSettings()
  );

  try {
    if (languageFunctionsSettings.translationMode !== TranslationMode.dts) {
      throw new Error(
        "The setting NAB.UseDTS is not active, this function cannot be executed."
      );
    }
    if (vscode.window.activeTextEditor) {
      if (
        path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !==
        ".xlf"
      ) {
        throw new Error("The current document is not an .xlf file");
      }
      if (vscode.window.activeTextEditor.document.isDirty) {
        await vscode.window.activeTextEditor.document.save();
      }
      await LanguageFunctions.formatCurrentXlfFileForDts(
        SettingsLoader.getSettings(),
        SettingsLoader.getAppManifest(),
        vscode.window.activeTextEditor.document.uri.fsPath,
        languageFunctionsSettings
      );
    }
  } catch (error) {
    showErrorAndLog("Format current XLF file for DTS", error as Error);
    return;
  }

  console.log("Done: FormatCurrentXlfFileForDTS");
}

export async function sortXlfFiles(): Promise<void> {
  console.log("Running: SortXlfFiles");
  try {
    const result = await refreshXlfFilesFromGXlfWithSettings({
      sortOnly: true,
    });
    vscode.window.showInformationMessage(
      `XLF files sorted as g.xlf.${
        result.numberOfRemovedTransUnits === 0
          ? ""
          : ` ${result.numberOfRemovedTransUnits} translation units removed (did not exist in g.xlf).`
      }`
    );
  } catch (error) {
    handleInvalidXmlError(error);
    showErrorAndLog("Sort XLF files", error as Error);
    return;
  }

  console.log("Done: SortXlfFiles");
}

export async function matchFromXlfFile(): Promise<void> {
  console.log("Running: MatchFromXlfFile");
  let showMessage = false;
  let refreshResult;

  try {
    const matchXlfFileUris = await vscode.window.showOpenDialog({
      filters: { "xliff files": ["xlf"], "all files": ["*"] },
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: "Select xlf file to use for matching",
    });
    if (matchXlfFileUris) {
      refreshResult = await refreshXlfFilesFromGXlfWithSettings({
        sortOnly: false,
        matchXlfFilePath: matchXlfFileUris[0].fsPath,
      });
      showMessage = true;
    }
  } catch (error) {
    handleInvalidXmlError(error);
    showErrorAndLog("Match from XLF file", error as Error);
    return;
  }
  if (showMessage && refreshResult) {
    vscode.window.showInformationMessage(getRefreshXlfMessage(refreshResult));
  }

  console.log("Done: MatchFromXlfFile");
}

export async function copySourceToTarget(): Promise<void> {
  console.log("Running: CopySourceToTarget");
  try {
    if (!(await LanguageFunctions.copySourceToTarget())) {
      vscode.window.showErrorMessage("Not in a xlf file on a <target> line.");
    }
  } catch (error) {
    showErrorAndLog("Copy source to target", error as Error);
    return;
  }
  console.log("Done: CopySourceToTarget");
}

export async function setTranslationUnitToTranslated(): Promise<void> {
  console.log("Running: SetTranslationUnitToTranslated");
  await setTranslationUnitState(TargetState.translated);
  console.log("Done: SetTranslationUnitToTranslated");
}
export async function setTranslationUnitToSignedOff(): Promise<void> {
  console.log("Running: SetTranslationUnitToSignedOff");
  await setTranslationUnitState(TargetState.signedOff);
  console.log("Done: SetTranslationUnitToSignedOff");
}
export async function setTranslationUnitToFinal(): Promise<void> {
  console.log("Running: SetTranslationUnitToFinal");
  await setTranslationUnitState(TargetState.final);
  console.log("Done: SetTranslationUnitToFinal");
}

export async function findNextUntranslatedText(
  lowerThanTargetState?: TargetState
): Promise<void> {
  console.log("Running: FindNextUntranslatedText");

  let nextUntranslated: TextDocumentMatch | undefined;
  try {
    const settings = SettingsLoader.getSettings();
    const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
    // Search active text editor first
    if (vscode.window.activeTextEditor) {
      if (vscode.window.activeTextEditor.document.uri.fsPath.endsWith(".xlf")) {
        nextUntranslated = await LanguageFunctions.findNextUntranslatedText(
          settings,
          SettingsLoader.getAppManifest(),
          true,
          languageFunctionsSettings.replaceSelfClosingXlfTags,
          lowerThanTargetState
        );
      }
    }
    // Search any xlf file
    if (!nextUntranslated) {
      nextUntranslated = await LanguageFunctions.findNextUntranslatedText(
        settings,
        SettingsLoader.getAppManifest(),
        false,
        languageFunctionsSettings.replaceSelfClosingXlfTags,
        lowerThanTargetState
      );
    }
    // Run refresh from g.xlf then search again.
    if (
      nextUntranslated === undefined &&
      languageFunctionsSettings.refreshXlfAfterFindNextUntranslated
    ) {
      await refreshXlfFilesFromGXlf(true);
      nextUntranslated = await LanguageFunctions.findNextUntranslatedText(
        settings,
        SettingsLoader.getAppManifest(),
        false,
        languageFunctionsSettings.replaceSelfClosingXlfTags,
        lowerThanTargetState
      );
    }
    if (nextUntranslated) {
      DocumentFunctions.openTextFileWithSelection(
        nextUntranslated.filePath,
        nextUntranslated.position,
        nextUntranslated.length
      );
    }
  } catch (error) {
    showErrorAndLog("Find next untranslated", error as Error);
    return;
  }
  if (!nextUntranslated) {
    vscode.window.showInformationMessage(`No more untranslated texts found.`);
  }
  console.log("Done: FindNextUntranslatedText");
}

export async function findAllUntranslatedText(): Promise<void> {
  console.log("Running: FindAllUntranslatedText");
  try {
    const searchParams = LanguageFunctions.allUntranslatedSearchParameters(
      new LanguageFunctionsSettings(SettingsLoader.getSettings())
    );
    await VSCodeFunctions.findTextInFiles(
      searchParams.searchStrings.join("|"),
      true,
      searchParams.fileFilter
    );
  } catch (error) {
    showErrorAndLog("Find all untranslated", error as Error);
    return;
  }

  console.log("Done: FindAllUntranslatedText");
}

export async function findMultipleTargets(): Promise<void> {
  console.log("Running: FindMultipleTargets");
  try {
    const searchParams = LanguageFunctions.findMultipleTargetsSearchParameters(
      new LanguageFunctionsSettings(SettingsLoader.getSettings())
    );
    await VSCodeFunctions.findTextInFiles(
      searchParams.searchStrings.join(""),
      true,
      searchParams.fileFilter
    );
  } catch (error) {
    showErrorAndLog("Find multiple targets", error as Error);
    return;
  }
  console.log("Done: FindMultipleTargets");
}

export async function findTranslatedTexts(): Promise<void> {
  console.log("Running: FindTranslatedTexts");
  try {
    if (vscode.window.activeTextEditor) {
      if (
        path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !==
        ".al"
      ) {
        throw new Error("The current document is not an al file");
      }
      const navObj = ALParser.getALObjectFromText(
        vscode.window.activeTextEditor.document.getText(),
        true,
        vscode.window.activeTextEditor.document.uri.fsPath
      );
      if (!navObj) {
        throw new Error(
          `The file ${vscode.window.activeTextEditor.document.uri.fsPath} does not seem to be an AL Object`
        );
      }
      const mlObjects = navObj.getAllMultiLanguageObjects({
        onlyForTranslation: true,
      });
      const selectedLineNo =
        vscode.window.activeTextEditor.selection.start.line;
      const selectedMlObject = mlObjects?.filter(
        (x) => x.startLineIndex === selectedLineNo
      );
      if (selectedMlObject.length !== 1) {
        throw new Error(
          "This line does not contain any translated property or label."
        );
      }
      const transUnitId = selectedMlObject[0].xliffId();

      let foundTarget: TextDocumentMatch | undefined;
      try {
        const langFiles = WorkspaceFunctions.getLangXlfFiles(
          SettingsLoader.getSettings(),
          SettingsLoader.getAppManifest()
        );
        if (langFiles.length === 1) {
          foundTarget = await LanguageFunctions.revealTransUnitTarget(
            transUnitId,
            langFiles[0]
          );
          if (foundTarget) {
            DocumentFunctions.openTextFileWithSelection(
              foundTarget.filePath,
              foundTarget.position,
              foundTarget.length
            );
          }
        }
      } catch (error) {
        // When target file is large (50MB+) then this error occurs:
        // cannot open file:///.../BaseApp/Translations/Base%20Application.cs-CZ.xlf. Detail: Files above 50MB cannot be synchronized with extensions.
        vscode.window.showWarningMessage((error as Error).message);
      }

      if (!foundTarget) {
        const fileFilter = SettingsLoader.getSettings().searchOnlyXlfFiles
          ? "*.xlf"
          : "";
        await VSCodeFunctions.findTextInFiles(transUnitId, false, fileFilter);
      }
    }
  } catch (error) {
    showErrorAndLog("Find translated texts", error as Error);
    return;
  }
  console.log("Done: FindTranslatedTexts");
}

export async function findSourceOfCurrentTranslationUnit(): Promise<void> {
  console.log("Running: FindSourceOfCurrentTranslationUnit");
  try {
    if (vscode.window.activeTextEditor) {
      if (
        path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !==
        ".xlf"
      ) {
        throw new Error("The current document is not an .xlf file");
      }
      const tokens = await LanguageFunctions.getCurrentXlfData();
      await DocumentFunctions.openAlFileFromXliffTokens(
        SettingsLoader.getSettings(),
        SettingsLoader.getAppManifest(),
        tokens
      );
    }
  } catch (error) {
    showErrorAndLog("Find source of current Translation Unit", error as Error);
    return;
  }
  console.log("Done: FindSourceOfCurrentTranslationUnit");
}

export async function uninstallDependencies(): Promise<void> {
  console.log("Running: UninstallDependencies");
  let appName;
  try {
    appName = await PowerShellFunctions.uninstallDependenciesPS(
      SettingsLoader.getAppManifest(),
      SettingsLoader.getLaunchSettings()
    );
  } catch (error) {
    showErrorAndLog("Uninstall dependencies", error as Error);
    return;
  }
  vscode.window.showInformationMessage(
    `All apps that depends on ${appName} are uninstalled and unpublished`
  );
  console.log("Done: UninstallDependencies");
}

export async function signAppFile(): Promise<void> {
  console.log("Running: SignAppFile");
  let signedAppFileName;
  try {
    signedAppFileName = await PowerShellFunctions.signAppFilePS(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
  } catch (error) {
    showErrorAndLog("Sign app file", error as Error);
    return;
  }
  vscode.window.showInformationMessage(
    `App file "${signedAppFileName}" is now signed`
  );
  console.log("Done: SignAppFile");
}

export async function deployAndRunTestTool(noDebug: boolean): Promise<void> {
  console.log("Running: DeployAndRunTestTool");
  try {
    const d = new DebugTests.DebugTests();
    await d.startTests(
      SettingsLoader.getAppManifest(),
      SettingsLoader.getLaunchSettings(),
      noDebug
    );
  } catch (error) {
    showErrorAndLog("Deploy and run test tool", error as Error);
    return;
  }
  console.log("Done: DeployAndRunTestTool");
}

function getRefreshXlfMessage(changes: RefreshResult): string {
  let msg = "";
  if (changes.numberOfAddedTransUnitElements > 0) {
    msg += `${changes.numberOfAddedTransUnitElements} inserted translations, `;
  }
  if (changes.numberOfUpdatedMaxWidths > 0) {
    msg += `${changes.numberOfUpdatedMaxWidths} updated maxwidth, `;
  }
  if (changes.numberOfUpdatedNotes > 0) {
    msg += `${changes.numberOfUpdatedNotes} updated notes, `;
  }
  if (changes.numberOfRemovedNotes > 0) {
    msg += `${changes.numberOfRemovedNotes} removed notes, `;
  }
  if (changes.numberOfUpdatedSources > 0) {
    msg += `${changes.numberOfUpdatedSources} updated sources, `;
  }
  if (changes.numberOfRemovedTransUnits > 0) {
    msg += `${changes.numberOfRemovedTransUnits} removed translations, `;
  }
  if (changes.numberOfSuggestionsAdded) {
    if (changes.numberOfSuggestionsAdded > 0) {
      msg += `${changes.numberOfSuggestionsAdded} added suggestions, `;
    }
  }
  if (changes.numberOfReviewsAdded > 0) {
    msg += `${changes.numberOfReviewsAdded} targets marked as in need of review, `;
  }
  if (msg !== "") {
    msg = msg.substr(0, msg.length - 2); // Remove trailing ,
  } else {
    msg = "Nothing changed";
  }
  if (changes.numberOfCheckedFiles) {
    msg += ` in ${changes.numberOfCheckedFiles} XLF files`;
  } else if (changes.fileName) {
    msg += ` in ${changes.fileName}`;
  }

  return msg;
}

export async function suggestToolTips(): Promise<void> {
  console.log("Running: SuggestToolTips");
  try {
    await ToolTipsFunctions.suggestToolTips(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
  } catch (error) {
    showErrorAndLog("Suggest ToolTips", error as Error);
    return;
  }

  console.log("Done: SuggestToolTips");
}

export async function showSuggestedToolTip(): Promise<void> {
  console.log("Running: ShowSuggestedToolTip");
  try {
    await ToolTipsFunctions.showSuggestedToolTip(false);
  } catch (error) {
    showErrorAndLog("Show suggested ToolTips", error as Error);
    return;
  }

  console.log("Done: ShowSuggestedToolTip");
}

export async function generateToolTipDocumentation(): Promise<void> {
  console.log("Running: GenerateToolTipDocumentation");
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating ToolTip Documentation...",
      },
      () => {
        return new Promise<void>((resolve) => {
          setTimeout(async () => {
            await ToolTipsDocumentation.generateToolTipDocumentation(
              SettingsLoader.getSettings(),
              SettingsLoader.getAppManifest()
            );
            vscode.window.showInformationMessage(
              `ToolTip documentation (re)created from al files.`
            );
            resolve();
          }, 10);
        });
      }
    );
  } catch (error) {
    showErrorAndLog("Generate ToolTip documentation", error as Error);
    return;
  }

  console.log("Done: GenerateToolTipDocumentation");
}
export async function generateExternalDocumentation(): Promise<void> {
  console.log("Running: GenerateExternalDocumentation");
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating External Documentation...",
      },
      () => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            Documentation.generateExternalDocumentation(
              SettingsLoader.getSettings(),
              SettingsLoader.getAppManifest()
            ).then(() => {
              vscode.window.showInformationMessage(
                `Documentation (re)created from al files.`
              );
              resolve();
            });
          }, 10);
        });
      }
    );
  } catch (error) {
    showErrorAndLog("Generate external documentation", error as Error);
    return;
  }

  console.log("Done: GenerateExternalDocumentation");
}

function showErrorAndLog(action: string, error: Error): void {
  const errMsg = `${action} failed with error: ${error.message}`;
  vscode.window.showErrorMessage(errMsg);
  console.log(`Error: ${error.message}`);
  console.log(`Stack trace: ${error.stack}`);
}

export async function matchTranslations(): Promise<void> {
  console.log("Running: MatchTranslations");
  const languageFunctionsSettings = new LanguageFunctionsSettings(
    SettingsLoader.getSettings()
  );
  try {
    const langXlfFiles = WorkspaceFunctions.getLangXlfFiles(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    console.log("Matching translations for:", langXlfFiles.toString());
    langXlfFiles.forEach((xlfPath) => {
      const xlfDoc = Xliff.fromFileSync(xlfPath, "UTF8");
      const matchResult = XliffFunctions.matchTranslations(
        xlfDoc,
        languageFunctionsSettings
      );
      if (matchResult > 0) {
        xlfDoc.toFileSync(
          xlfPath,
          languageFunctionsSettings.replaceSelfClosingXlfTags,
          languageFunctionsSettings.formatXml,
          "UTF8"
        );
      }
      vscode.window.showInformationMessage(
        `Found ${matchResult} matches in ${xlfPath.replace(/^.*[\\/]/, "")}.`
      );
    });
  } catch (error) {
    vscode.window.showErrorMessage((error as Error).message);
    return;
  }
  console.log("Done: MatchTranslations");
}

export async function editXliffDocument(
  extensionUri: vscode.Uri,
  xlfUri?: vscode.Uri
): Promise<void> {
  if (xlfUri === undefined) {
    xlfUri = vscode.window.activeTextEditor?.document.uri;
  }

  try {
    if (!xlfUri?.fsPath.endsWith(".xlf")) {
      throw new Error("Can only open .xlf-files");
    }
    const xlfDoc = Xliff.fromFileSync(xlfUri.fsPath);
    xlfDoc._path = xlfUri.fsPath;
    await XliffEditorPanel.createOrShow(extensionUri, xlfDoc);
  } catch (error) {
    vscode.window.showErrorMessage((error as Error).message);
    return;
  }
}

export async function downloadBaseAppTranslationFiles(): Promise<void> {
  console.log("Running: downloadBaseAppTranslationFiles");
  const targetLanguageCodes = XliffFunctions.existingTargetLanguageCodes(
    SettingsLoader.getSettings(),
    SettingsLoader.getAppManifest()
  );
  try {
    const result = await baseAppTranslationFiles.getBlobs(targetLanguageCodes);
    let informationMessage = `Successfully downloaded ${result.succeded.length} translation file(s).`;
    informationMessage +=
      result.failed.length > 0
        ? ` Failed to download ${
            result.failed.length
          } file(s): ${result.failed.join(",")}.`
        : "";
    vscode.window.showInformationMessage(informationMessage);
  } catch (error) {
    showErrorAndLog(
      "Download of Base Application translation files",
      error as Error
    );
  }
  console.log("Done: downloadBaseAppTranslationFiles");
}

export async function matchTranslationsFromBaseApplication(): Promise<void> {
  console.log("Running: matchTranslationsFromBaseApplication");
  const languageFunctionsSettings = new LanguageFunctionsSettings(
    SettingsLoader.getSettings()
  );
  const formatXml = true;
  try {
    const refreshResult = await refreshXlfFilesFromGXlfWithSettings();
    const msg = getRefreshXlfMessage(refreshResult);
    vscode.window.showInformationMessage(msg);

    const langXlfFiles = WorkspaceFunctions.getLangXlfFiles(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    langXlfFiles.forEach(async (xlfPath) => {
      const xlfDoc = Xliff.fromFileSync(xlfPath);
      const numberOfMatches = await XliffFunctions.matchTranslationsFromBaseApp(
        xlfDoc,
        languageFunctionsSettings
      );
      if (numberOfMatches > 0) {
        xlfDoc.toFileSync(
          xlfPath,
          languageFunctionsSettings.replaceSelfClosingXlfTags,
          formatXml
        );
      }
      vscode.window.showInformationMessage(
        `Added ${numberOfMatches} suggestions from Base Application in ${vscode.Uri.file(
          xlfPath
        ).path.replace(/^.*[\\/]/, "")}.`
      );
    });
  } catch (error) {
    handleInvalidXmlError(error);
    vscode.window.showErrorMessage((error as Error).message);
    return;
  }
  console.log("Done: matchTranslationsFromBaseApplication");
}

export async function updateGXlf(): Promise<void> {
  console.log("Running: Update g.xlf");
  try {
    const refreshResult = await XliffFunctions.updateGXlfFromAlFiles(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    const msg1 = getRefreshXlfMessage(refreshResult);
    vscode.window.showInformationMessage(msg1);
  } catch (error) {
    showErrorAndLog("Update g.xlf", error as Error);
    return;
  }

  console.log("Done: Update g.xlf");
}

export async function updateAllXlfFiles(): Promise<void> {
  console.log("Running: Update all XLF files");
  let refreshResult;
  try {
    refreshResult = await XliffFunctions.updateGXlfFromAlFiles(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    const msg1 = getRefreshXlfMessage(refreshResult);
    vscode.window.showInformationMessage(msg1);
    refreshResult = await refreshXlfFilesFromGXlfWithSettings();
    const msg2 = getRefreshXlfMessage(refreshResult);
    vscode.window.showInformationMessage(msg2);
  } catch (error) {
    handleInvalidXmlError(error);
    showErrorAndLog("Update all XLF files", error as Error);
    return;
  }

  console.log("Done: Update all XLF files");
}

export async function createNewTargetXlf(): Promise<void> {
  console.log("Running: createNewTargetXlf");
  const targetLanguage: string | undefined = await getUserInput({
    placeHolder: "Language code e.g sv-SE",
  });
  const selectedMatchBaseApp = await getQuickPickResult(["Yes", "No"], {
    canPickMany: false,
    placeHolder: "Match translations from BaseApp?",
  });
  if (targetLanguage === undefined || targetLanguage.length === 0) {
    throw new Error("No target language was set.");
  }
  try {
    const appManifest = SettingsLoader.getAppManifest();
    const settings = SettingsLoader.getSettings();

    const appName = appManifest.name;
    const gXlfPath = WorkspaceFunctions.getGXlfFilePath(settings, appManifest);
    const matchBaseAppTranslation =
      undefined === selectedMatchBaseApp
        ? false
        : selectedMatchBaseApp.join("").toLowerCase() === "yes";
    const targetXlfFilename = `${appName}.${targetLanguage}.xlf`;
    const targetXlfFilepath = path.join(
      settings.translationFolderPath,
      targetXlfFilename
    );
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    if (fs.existsSync(targetXlfFilepath)) {
      throw new Error(`File already exists: '${targetXlfFilepath}'`);
    }

    console.log(
      `Creating new target xlf for language: ${targetLanguage}.\nMatch translations from BaseApp: ${matchBaseAppTranslation}.\nSaving file to path: ${targetXlfFilepath}`
    );
    const targetXlfDoc = Xliff.fromFileSync(gXlfPath);
    targetXlfDoc.targetLanguage = targetLanguage;
    if (matchBaseAppTranslation) {
      const numberOfMatches = await XliffFunctions.matchTranslationsFromBaseApp(
        targetXlfDoc,
        languageFunctionsSettings
      );
      vscode.window.showInformationMessage(
        `Added ${numberOfMatches} suggestions from Base Application in ${targetXlfFilename}.`
      );
    }

    targetXlfDoc.toFileSync(
      targetXlfFilepath,
      languageFunctionsSettings.replaceSelfClosingXlfTags
    );
    await XliffFunctions.refreshXlfFilesFromGXlf({
      settings: settings,
      appManifest: appManifest,
      matchXlfFilePath: vscode.Uri.file(targetXlfFilepath).fsPath,
      languageFunctionsSettings,
    });
    vscode.window.showTextDocument(vscode.Uri.file(targetXlfFilepath));
  } catch (error) {
    vscode.window.showErrorMessage((error as Error).message);
  }
  console.log("Done: createNewTargetXlf");
}

async function getUserInput(
  options?: vscode.InputBoxOptions
): Promise<string | undefined> {
  let input: string | undefined;
  await vscode.window.showInputBox(options).then((result) => {
    input = result;
  });
  return input;
}

async function getQuickPickResult(
  items: string[],
  options: vscode.QuickPickOptions
): Promise<string[] | undefined> {
  let input;
  await vscode.window.showQuickPick(items, options).then((result) => {
    input = result;
  });
  if (input !== undefined && !isArray(input)) {
    input = [input];
  }
  return input;
}

export async function exportTranslationsCSV(
  options = {
    selectColumns: false,
    selectFilter: false,
  }
): Promise<void> {
  console.log("Running: exportTranslationsCSV");
  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
  const translationFilePaths = WorkspaceFunctions.getLangXlfFiles(
    settings,
    appManifest
  );
  const exportFiles = await getQuickPickResult(translationFilePaths, {
    canPickMany: true,
    placeHolder: "Select translation files to export...",
  });
  if (exportFiles === undefined || exportFiles.length === 0) {
    showErrorAndLog(
      "Export translations csv",
      new Error("No files were selected for export")
    );
    return;
  }
  const exportOptions: IExportOptions = {
    columns: [],
    filter: CSVExportFilter.all,
    checkTargetState: [TranslationMode.external, TranslationMode.dts].includes(
      languageFunctionsSettings.translationMode
    ),
  };

  if (options.selectColumns) {
    // If user escapes column quick pick we assign an empty array to export default columns with filter
    exportOptions.columns =
      ((await getQuickPickResult(Object.values(CSVHeader).slice(3), {
        canPickMany: true,
        title:
          "Select columns to export (Id, Source & Target are always exported)",
      })) as CSVHeader[]) ?? [];
  }
  if (options.selectFilter) {
    const selectedFilter = await getQuickPickResult(
      Object.values(CSVExportFilter),
      {
        canPickMany: false,
        title: "Select a filter (All is default)",
      }
    );
    if (selectedFilter === undefined) {
      showErrorAndLog(
        "Export translations csv",
        new Error("No filter was selected.")
      );
      return;
    }
    exportOptions.filter = selectedFilter[0] as CSVExportFilter;
  }

  try {
    let exportPath = SettingsLoader.getSettings().xliffCSVExportPath;
    if (exportPath.length === 0) {
      exportPath = settings.translationFolderPath;
    }
    const alAppName = appManifest.name;
    exportFiles.forEach((f) => {
      const xlf = Xliff.fromFileSync(f);
      const csvName = `${alAppName}.${xlf.targetLanguage}`;
      exportXliffCSV(
        exportPath,
        csvName,
        xlf,
        options.selectColumns && options.selectFilter
          ? exportOptions
          : undefined
      );
    });
    vscode.window.showInformationMessage(`CSV file(s) exported.`);
  } catch (error) {
    showErrorAndLog("Export translations csv", error as Error);
  }
  console.log("Done: exportTranslationsCSV");
}

export async function importTranslationCSV(): Promise<void> {
  console.log("Running: importTranslationCSV");
  try {
    const settings = SettingsLoader.getSettings();
    const xliffCSVImportTargetState: string =
      settings.xliffCSVImportTargetState;
    const translationFilePaths = WorkspaceFunctions.getLangXlfFiles(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    const pickedFile = await getQuickPickResult(translationFilePaths, {
      canPickMany: false,
      placeHolder: "Select xlf file to update",
    });
    const updateXlfFilePath = isArray(pickedFile) ? pickedFile[0] : pickedFile;
    if (updateXlfFilePath === undefined) {
      throw new Error("No file selected for update");
    }
    const importCSV = await vscode.window.showOpenDialog({
      filters: { "csv files": ["csv"], "all files": ["*"] },
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: "Select csv file to import",
    });
    if (importCSV === undefined) {
      throw new Error("No file selected for import");
    }
    const xlf = Xliff.fromFileSync(updateXlfFilePath);
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );

    const updatedTransUnits = importXliffCSV(
      xlf,
      importCSV[0].fsPath,
      [TranslationMode.external, TranslationMode.dts].includes(
        languageFunctionsSettings.translationMode
      ),
      xliffCSVImportTargetState
    );
    if (updatedTransUnits > 0) {
      xlf.toFileSync(
        updateXlfFilePath,
        languageFunctionsSettings.replaceSelfClosingXlfTags
      );
    }
    vscode.window.showInformationMessage(
      `${updatedTransUnits} trans-units updated in ${
        path.parse(updateXlfFilePath).base
      }`
    );
  } catch (error) {
    showErrorAndLog("Import translations csv", error as Error);
  }

  console.log("Done: importTranslationCSV");
}

export async function addXmlCommentTag(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  tag: string
): Promise<void> {
  if (textEditor.selection.isEmpty) {
    const selectionLineNumber = textEditor.selection.start.line;
    const selectionCharNumber = textEditor.selection.start.character;
    const textToInsert = `<${tag}></${tag}>`;
    await edit.insert(textEditor.selection.start, textToInsert); // This line warns about a unnecessary 'await', but it needs to be there. Otherwise the textEditor.selection below will never be able to select a position within the inserted text.

    const selectAtCharPos = selectionCharNumber + `<${tag}>`.length;
    textEditor.selection = new vscode.Selection(
      selectionLineNumber,
      selectAtCharPos,
      selectionLineNumber,
      selectAtCharPos
    );
    return;
  }
  const selectedRange: vscode.Range = new vscode.Range(
    textEditor.selection.start,
    textEditor.selection.end
  );
  const selectedText = textEditor.document.getText(selectedRange);
  edit.replace(textEditor.selection, `<${tag}>${selectedText}</${tag}>`);
}

async function refreshXlfFilesFromGXlfWithSettings({
  sortOnly,
  matchXlfFilePath,
}: {
  sortOnly?: boolean;
  matchXlfFilePath?: string;
} = {}): Promise<RefreshResult> {
  return await XliffFunctions.refreshXlfFilesFromGXlf({
    settings: SettingsLoader.getSettings(),
    appManifest: SettingsLoader.getAppManifest(),
    sortOnly,
    matchXlfFilePath,
    languageFunctionsSettings: new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    ),
  });
}

async function setTranslationUnitState(
  newTargetState: TargetState
): Promise<void> {
  try {
    if (vscode.window.activeTextEditor) {
      if (
        path.extname(vscode.window.activeTextEditor.document.uri.fsPath) !==
        ".xlf"
      ) {
        throw new Error("The current document is not an .xlf file");
      }
      if (vscode.window.activeTextEditor.document.isDirty) {
        await vscode.window.activeTextEditor.document.save();
      }
      const { xliffDoc, transUnit } = LanguageFunctions.getFocusedTransUnit();
      const xlfContent = XliffFunctions.setTranslationUnitTranslated(
        xliffDoc,
        transUnit,
        newTargetState,
        new LanguageFunctionsSettings(SettingsLoader.getSettings())
      );
      const currDocument = vscode.window.activeTextEditor.document;
      await vscode.window.activeTextEditor.edit((editBuilder) => {
        const fullDocumentRange = new vscode.Range(
          0,
          0,
          currDocument.lineCount - 1,
          currDocument.lineAt(currDocument.lineCount - 1).text.length
        );
        editBuilder.replace(fullDocumentRange, xlfContent); // A bit choppy in UI since it's the full file. Can later be refactored to only update the TransUnit
      });
      findNextUntranslatedText(newTargetState);
    }
  } catch (error) {
    showErrorAndLog("Set translation unit state", error as Error);
  }
}

export function openDTS(): void {
  const dtsProjectId = SettingsLoader.getSettings().dtsProjectId;
  let url = "https://lcs.dynamics.com/v2";
  if (dtsProjectId !== "") {
    url = `https://support.lcs.dynamics.com/RegFTranslationRequestProject/Index/${dtsProjectId}`;
  }
  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  const xlfFiles = [
    WorkspaceFunctions.getGXlfFilePath(settings, appManifest),
    ...WorkspaceFunctions.getLangXlfFiles(settings, appManifest),
  ];
  FileFunctions.zipFiles(xlfFiles, settings.dtsWorkFolderPath);
  vscode.env.openExternal(vscode.Uri.parse(url));
}

export async function importDtsTranslations(): Promise<void> {
  console.log("Running: importDtsTranslations");
  try {
    const settings = SettingsLoader.getSettings();
    const languageFunctionsSettings = new LanguageFunctionsSettings(settings);

    if (languageFunctionsSettings.translationMode !== TranslationMode.dts) {
      throw new Error(
        "The setting NAB.UseDTS is not active, this function cannot be executed."
      );
    }

    const translationXliffArray = WorkspaceFunctions.getLangXlfFiles(
      settings,
      SettingsLoader.getAppManifest()
    ).map((xlfFilePath) => {
      return Xliff.fromFileSync(xlfFilePath);
    });
    const outputFilePaths = WorkspaceFunctions.getDtsOutputFiles(settings);
    const pickedFiles = await getQuickPickResult(outputFilePaths, {
      canPickMany: true,
      placeHolder: "Select the DTS output files to import",
    });
    if (pickedFiles === undefined) {
      return;
    }
    pickedFiles?.forEach((file) =>
      LanguageFunctions.importDtsTranslatedFile(
        settings,
        file,
        translationXliffArray,
        languageFunctionsSettings
      )
    );
    refreshXlfFilesFromGXlfWithSettings({ sortOnly: true });
    vscode.window.showInformationMessage(
      `${pickedFiles.length} xlf files updated.`
    );
  } catch (error) {
    handleInvalidXmlError(error);
    vscode.window.showErrorMessage((error as Error).message);
  }

  console.log("Done: importDtsTranslations");
}

interface IExportOptions {
  columns: CSVHeader[];
  filter: CSVExportFilter;
  checkTargetState: boolean;
}

async function handleInvalidXmlError(error: unknown): Promise<void> {
  if (!(error instanceof InvalidXmlError)) {
    return;
  }
  await DocumentFunctions.openTextFileWithSelection(
    error.path,
    error.index,
    error.length
  );
}

export function getHoverText(
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.MarkdownString[] {
  if (!SettingsLoader.getSettings().enableTranslationsOnHover) {
    return [];
  }

  const returnValues = [];
  const selectedLineNo = position.line;

  const navObj = ALParser.getALObjectFromText(document.getText(), true);
  if (!navObj) {
    console.log(`Could not parse file ${document.fileName} as an al object`);
    return [];
  }
  const mlObjects = navObj.getAllMultiLanguageObjects({
    onlyForTranslation: true,
  });
  const selectedMlObject = mlObjects?.filter(
    (x) => x.startLineIndex === selectedLineNo
  );
  if (selectedMlObject.length !== 1) {
    return []; // Not anything to translate on current line
  }
  const transUnitId = selectedMlObject[0].xliffId();

  const langFilePaths = WorkspaceFunctions.getLangXlfFiles(
    SettingsLoader.getSettings(),
    SettingsLoader.getAppManifest()
  );

  const markdownString = new vscode.MarkdownString();
  for (const langFilePath of langFilePaths) {
    const xliffDoc = XliffCache.getXliffDocumentFromCache(langFilePath);
    const transUnit = xliffDoc.getTransUnitById(transUnitId);
    if (transUnit) {
      if (markdownString.value.length === 0) {
        markdownString.appendMarkdown(
          "| Language&nbsp;&nbsp; | Translation |\n"
        );
        markdownString.appendMarkdown("| :---- | :---- |\n");
      }
      const paramsObj: IOpenXliffIdParam = {
        languageCode: xliffDoc.targetLanguage,
        transUnitId: transUnitId,
      };
      const params = encodeURIComponent(JSON.stringify(paramsObj));
      markdownString.appendMarkdown(
        `| [${xliffDoc.targetLanguage}](command:nab.openXliffId?${params} "Navigate to translation") | `
      );
      markdownString.appendText(transUnit.target.textContent); // as Text since it needs to be escaped
      markdownString.appendMarkdown(" |");
    }
  }

  if (markdownString.value.length === 0) {
    markdownString.appendMarkdown("_No translations found_\n");
  }
  markdownString.isTrusted = true;
  returnValues.push(markdownString);
  return returnValues;
}

export function openXliffId(params: IOpenXliffIdParam): void {
  const langFilePaths = WorkspaceFunctions.getLangXlfFiles(
    SettingsLoader.getSettings(),
    SettingsLoader.getAppManifest()
  );

  for (const langFilePath of langFilePaths) {
    const langXliff = XliffCache.getXliffDocumentFromCache(langFilePath);
    if (langXliff.targetLanguage === params.languageCode) {
      const foundTarget = LanguageFunctions.revealTransUnitTarget(
        params.transUnitId,
        langFilePath
      );
      if (foundTarget) {
        DocumentFunctions.openTextFileWithSelection(
          foundTarget.filePath,
          foundTarget.position,
          foundTarget.length
        );
      }
      return;
    }
  }
}

export function onDidChangeTextDocument(
  event: vscode.TextDocumentChangeEvent
): void {
  if (event.document.isDirty) {
    return;
  }
  if (event.document.uri.scheme !== "file") {
    return;
  }
  if (!event.document.uri.path.endsWith(".xlf")) {
    return;
  }
  if (event.document.uri.path.endsWith(".g.xlf")) {
    return;
  }
  if (!SettingsLoader.getSettings().enableTranslationsOnHover) {
    return;
  }

  setTimeout(() => {
    if (event.document.isDirty) {
      console.log("Document got dirty");
      return;
    }
    XliffCache.updateXliffDocumentInCache(
      event.document.uri.fsPath,
      event.document.getText()
    );
  }, 1);
}
