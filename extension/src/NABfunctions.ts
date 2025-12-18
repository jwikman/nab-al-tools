import * as vscode from "vscode";
import * as LanguageFunctions from "./LanguageFunctions";
import * as WorkspaceFunctions from "./WorkspaceFunctions";
import * as ToolTipsDocumentation from "./ToolTipsDocumentation";
import * as ToolTipsFunctions from "./ToolTipsFunctions";
import * as Documentation from "./Documentation";
import * as DebugTests from "./DebugTests";
import * as ALParser from "./ALObject/ALParser";
import * as path from "path";
import * as DocumentFunctions from "./DocumentFunctions";
import * as FileFunctions from "./FileFunctions";
import * as RenumberObjects from "./RenumberObjects";
import { xliffCache } from "./Xliff/XLIFFCache";
import * as Telemetry from "./Telemetry/Telemetry";
import * as PermissionSetFunctions from "./PermissionSet/PermissionSetFunctions";
import { IOpenXliffIdParam } from "./Types";
import { TargetState, Xliff } from "./Xliff/XLIFFDocument";
import { baseAppTranslationFiles } from "./externalresources/BaseAppTranslationFiles";
import { XliffEditorPanel } from "./XliffEditor/XliffEditorPanel";
import * as fs from "graceful-fs";
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
import {
  ApplicationManifestError,
  InvalidJsonError,
  InvalidXmlError,
  NoLanguageFilesError,
} from "./Error";
import { TextDocumentMatch } from "./Types";
import { logger } from "./Logging/LogHelper";
import { PermissionSetNameEditorPanel } from "./PermissionSet/PermissionSetNamePanel";
import { TemplateEditorPanel } from "./Template/TemplatePanel";
import {
  showErrorAndLog,
  showMessage,
  findTextInFiles,
} from "./VSCodeFunctions";
import { TaskRunner } from "./Template/TaskRunner";
import { ALPermission, ALPermissionSet } from "./ALObject/ALElementTypes";
import { ALObjectType, ALPropertyType, ALTableType } from "./ALObject/Enums";

export async function refreshXlfFilesFromGXlf(
  suppressMessage = false
): Promise<void> {
  logger.log("Running: RefreshXlfFilesFromGXlf");
  Telemetry.trackEvent("refreshXlfFilesFromGXlf");
  let refreshResult: RefreshResult;
  try {
    if (XliffEditorPanel.currentPanel?.isActiveTab()) {
      throw new Error(
        `Close Xliff Editor before running "NAB: Refresh Xlf files from g.xlf"`
      );
    }
    refreshResult = await refreshXlfFilesFromGXlfWithSettings();
  } catch (error) {
    handleInvalidXmlError(error as Error);
    showErrorAndLog("Refresh files from g.xlf", error as Error);
    return;
  }
  const showMessage = suppressMessage ? refreshResult.isChanged : true;
  if (showMessage) {
    vscode.window.showInformationMessage(refreshResult.getReport());
  }
  logger.log("Done: RefreshXlfFilesFromGXlf");
}

export async function sortXlfFiles(): Promise<void> {
  logger.log("Running: SortXlfFiles");
  Telemetry.trackEvent("sortXlfFiles");
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
    handleInvalidXmlError(error as Error);
    showErrorAndLog("Sort XLF files", error as Error);
    return;
  }

  logger.log("Done: SortXlfFiles");
}

export async function matchFromXlfFile(): Promise<void> {
  logger.log("Running: MatchFromXlfFile");
  Telemetry.trackEvent("matchFromXlfFile");
  let showMessage = false;
  let refreshResult;

  try {
    const matchXlfFileUris = await vscode.window.showOpenDialog({
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
    handleInvalidXmlError(error as Error);
    showErrorAndLog("Match from XLF file", error as Error);
    return;
  }
  if (showMessage && refreshResult) {
    vscode.window.showInformationMessage(refreshResult.getReport());
  }

  logger.log("Done: MatchFromXlfFile");
}

export async function copySourceToTarget(): Promise<void> {
  logger.log("Running: CopySourceToTarget");
  Telemetry.trackEvent("copySourceToTarget");
  try {
    if (!activeTextEditorIsXlf()) {
      throw new Error("Not in an XLF file on a <target> line.");
    }
    if (vscode.window.activeTextEditor) {
      const editor = vscode.window.activeTextEditor;
      // in an xlf file
      await vscode.window.activeTextEditor.document.save();
      const docText = vscode.window.activeTextEditor.document.getText();
      const lineEnding =
        vscode.window.activeTextEditor.document.eol === vscode.EndOfLine.CRLF
          ? "\r\n"
          : "\n";

      const docArray = docText.split(lineEnding);
      if (
        docArray[vscode.window.activeTextEditor.selection.active.line].match(
          /<target.*>.*<\/target>/i
        )
      ) {
        // on a target line
        const sourceLine = docArray[
          vscode.window.activeTextEditor.selection.active.line - 1
        ].match(/<source>(.*)<\/source>/i);
        if (sourceLine) {
          // source line just above
          const newLineText = `          <target>${sourceLine[1]}</target>`;
          await editor.edit((editBuilder) => {
            const targetLineRange = new vscode.Range(
              editor.selection.active.line,
              0,
              editor.selection.active.line,
              docArray[editor.selection.active.line].length
            );
            editBuilder.replace(targetLineRange, newLineText);
          });
          editor.selection = new vscode.Selection(
            editor.selection.active.line,
            18,
            editor.selection.active.line,
            18 + sourceLine[1].length
          );
        }
      }
    }
  } catch (error) {
    showErrorAndLog("Copy source to target", error as Error);
    return;
  }
  logger.log("Done: CopySourceToTarget");
}

export async function copyAllSourceToTarget(): Promise<void> {
  logger.log("Running: CopyAllSourceToTarget");
  Telemetry.trackEvent("copyAllSourceToTarget");
  try {
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    const response = await getQuickPickResult(["Yes", "No"], {
      canPickMany: false,
      ignoreFocusOut: true,
      title: "Mark updated targets for review?",
    });
    if (!response) {
      return;
    }
    const setAsReview = response[0].toLowerCase() === "yes";
    if (
      vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.document.uri.fsPath.endsWith("xlf")
    ) {
      // in an xlf file
      const filePath = vscode.window.activeTextEditor.document.uri.fsPath;
      await vscode.window.activeTextEditor.document.save();
      const xliffDoc = Xliff.fromFileSync(filePath);
      LanguageFunctions.copyAllSourceToTarget(
        xliffDoc,
        languageFunctionsSettings,
        setAsReview
      );
      xliffDoc.toFileAsync(
        filePath,
        languageFunctionsSettings.replaceSelfClosingXlfTags,
        true,
        languageFunctionsSettings.searchReplaceBeforeSaveXliff
      );
    } else {
      vscode.window.showErrorMessage("Not in an xlf file.");
    }
  } catch (error) {
    showErrorAndLog("Copy all source to target", error as Error);
    return;
  }
  logger.log("Done: CopyAllSourceToTarget");
}

export async function setTranslationUnitToTranslated(): Promise<void> {
  logger.log("Running: SetTranslationUnitToTranslated");
  Telemetry.trackEvent("setTranslationUnitToTranslated");
  await setTranslationUnitState(TargetState.translated);
  logger.log("Done: SetTranslationUnitToTranslated");
}
export async function setTranslationUnitToSignedOff(): Promise<void> {
  logger.log("Running: SetTranslationUnitToSignedOff");
  Telemetry.trackEvent("setTranslationUnitToSignedOff");
  await setTranslationUnitState(TargetState.signedOff);
  logger.log("Done: SetTranslationUnitToSignedOff");
}
export async function setTranslationUnitToFinal(): Promise<void> {
  logger.log("Running: SetTranslationUnitToFinal");
  Telemetry.trackEvent("setTranslationUnitToFinal");
  await setTranslationUnitState(TargetState.final);
  logger.log("Done: SetTranslationUnitToFinal");
}

export async function findNextUntranslatedText(
  lowerThanTargetState?: TargetState
): Promise<void> {
  logger.log("Running: FindNextUntranslatedText");
  Telemetry.trackEvent("findNextUntranslatedText");

  let nextUntranslated: TextDocumentMatch | undefined;
  try {
    const settings = SettingsLoader.getSettings();
    const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
    const langXlfFiles: string[] = appendActiveDocument(
      WorkspaceFunctions.getLangXlfFiles(
        settings,
        SettingsLoader.getAppManifest()
      )
    );
    // Search active text editor first
    if (vscode.window.activeTextEditor) {
      if (vscode.window.activeTextEditor.document.uri.fsPath.endsWith(".xlf")) {
        await vscode.window.activeTextEditor.document.save();
        const startOffset = vscode.window.activeTextEditor.document.offsetAt(
          vscode.window.activeTextEditor.selection.active
        );
        nextUntranslated = await LanguageFunctions.findNextUntranslatedText(
          [vscode.window.activeTextEditor.document.uri.fsPath],
          languageFunctionsSettings.replaceSelfClosingXlfTags,
          startOffset,
          languageFunctionsSettings.searchReplaceBeforeSaveXliff,
          lowerThanTargetState
        );
      }
    }
    // Search any xlf file
    if (!nextUntranslated) {
      await vscode.workspace.saveAll();
      nextUntranslated = await LanguageFunctions.findNextUntranslatedText(
        langXlfFiles,
        languageFunctionsSettings.replaceSelfClosingXlfTags,
        0,
        languageFunctionsSettings.searchReplaceBeforeSaveXliff,
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
        langXlfFiles,
        languageFunctionsSettings.replaceSelfClosingXlfTags,
        0,
        languageFunctionsSettings.searchReplaceBeforeSaveXliff,
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
  logger.log("Done: FindNextUntranslatedText");
}

export async function findAllUntranslatedText(): Promise<void> {
  logger.log("Running: FindAllUntranslatedText");
  Telemetry.trackEvent("findAllUntranslatedText");
  try {
    const searchParams = LanguageFunctions.allUntranslatedSearchParameters(
      new LanguageFunctionsSettings(SettingsLoader.getSettings())
    );
    await findTextInFiles(
      searchParams.searchStrings.join("|"),
      true,
      searchParams.fileFilter
    );
  } catch (error) {
    showErrorAndLog("Find all untranslated", error as Error);
    return;
  }

  logger.log("Done: FindAllUntranslatedText");
}

export async function findMultipleTargets(): Promise<void> {
  logger.log("Running: FindMultipleTargets");
  Telemetry.trackEvent("findMultipleTargets");
  try {
    const searchParams = LanguageFunctions.findMultipleTargetsSearchParameters(
      new LanguageFunctionsSettings(SettingsLoader.getSettings())
    );
    await findTextInFiles(
      searchParams.searchStrings.join(""),
      true,
      searchParams.fileFilter
    );
  } catch (error) {
    showErrorAndLog("Find multiple targets", error as Error);
    return;
  }
  logger.log("Done: FindMultipleTargets");
}

export async function findTranslatedTexts(): Promise<void> {
  logger.log("Running: FindTranslatedTexts");
  Telemetry.trackEvent("findTranslatedTexts");
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
        await findTextInFiles(transUnitId, false, fileFilter);
      }
    }
  } catch (error) {
    showErrorAndLog("Find translated texts", error as Error);
    return;
  }
  logger.log("Done: FindTranslatedTexts");
}

export async function findSourceOfCurrentTranslationUnit(): Promise<void> {
  logger.log("Running: FindSourceOfCurrentTranslationUnit");
  Telemetry.trackEvent("findSourceOfCurrentTranslationUnit");
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
  logger.log("Done: FindSourceOfCurrentTranslationUnit");
}

export async function deployAndRunTestTool(noDebug: boolean): Promise<void> {
  logger.log("Running: DeployAndRunTestTool");
  Telemetry.trackEvent("deployAndRunTestTool");
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
  logger.log("Done: DeployAndRunTestTool");
}

export async function suggestToolTips(): Promise<void> {
  logger.log("Running: SuggestToolTips");
  Telemetry.trackEvent("suggestToolTips");
  try {
    await ToolTipsFunctions.suggestToolTips(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
  } catch (error) {
    showErrorAndLog("Suggest ToolTips", error as Error);
    return;
  }

  logger.log("Done: SuggestToolTips");
}

export async function showSuggestedToolTip(): Promise<void> {
  logger.log("Running: ShowSuggestedToolTip");
  Telemetry.trackEvent("showSuggestedToolTip");
  try {
    await ToolTipsFunctions.showSuggestedToolTip(false);
  } catch (error) {
    showErrorAndLog("Show suggested ToolTips", error as Error);
    return;
  }

  logger.log("Done: ShowSuggestedToolTip");
}

export async function generateToolTipDocumentation(): Promise<void> {
  logger.log("Running: GenerateToolTipDocumentation");
  Telemetry.trackEvent("generateToolTipDocumentation");
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating ToolTip Documentation...",
      },
      () => {
        return new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            ToolTipsDocumentation.generateToolTipDocumentation(
              SettingsLoader.getSettings(),
              SettingsLoader.getAppManifest()
            )
              .then(() => {
                vscode.window.showInformationMessage(
                  `ToolTip documentation (re)created from al files.`
                );
                resolve();
              })
              .catch((err) => {
                reject(err);
              });
          }, 10);
        });
      }
    );
  } catch (error) {
    showErrorAndLog("Generate ToolTip documentation", error as Error);
    return;
  }

  logger.log("Done: GenerateToolTipDocumentation");
}
export async function generateExternalDocumentation(): Promise<void> {
  logger.log("Running: GenerateExternalDocumentation");
  Telemetry.trackEvent("generateExternalDocumentation");
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating External Documentation...",
      },
      () => {
        return new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            Documentation.generateExternalDocumentation(
              SettingsLoader.getSettings(),
              SettingsLoader.getAppManifest()
            )
              .then(() => {
                vscode.window.showInformationMessage(
                  `Documentation (re)created from al files.`
                );
                resolve();
              })
              .catch((err) => {
                reject(err);
              });
          }, 10);
        });
      }
    );
  } catch (error) {
    showErrorAndLog("Generate external documentation", error as Error);
    return;
  }

  logger.log("Done: GenerateExternalDocumentation");
}

export async function matchTranslations(): Promise<void> {
  logger.log("Running: MatchTranslations");
  Telemetry.trackEvent("matchTranslations");
  const languageFunctionsSettings = new LanguageFunctionsSettings(
    SettingsLoader.getSettings()
  );
  try {
    const langXlfFiles = WorkspaceFunctions.getLangXlfFiles(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    logger.log(`Matching translations for: ${langXlfFiles.toString()}`);
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
          languageFunctionsSettings.searchReplaceBeforeSaveXliff,
          "UTF8"
        );
      }
      vscode.window.showInformationMessage(
        `Found ${matchResult} matches in ${xlfPath.replace(/^.*[\\/]/, "")}.`
      );
    });
  } catch (error) {
    Telemetry.trackException(error as Error);
    vscode.window.showErrorMessage((error as Error).message);
    return;
  }
  logger.log("Done: MatchTranslations");
}

export async function editXliffDocument(
  extensionUri: vscode.Uri,
  xlfUri?: vscode.Uri
): Promise<void> {
  if (xlfUri === undefined) {
    xlfUri = vscode.window.activeTextEditor?.document.uri;
  }
  Telemetry.trackEvent("editXliffDocument");

  try {
    if (!xlfUri?.fsPath.endsWith(".xlf")) {
      throw new Error("Can only open .xlf-files");
    }
    const xlfDoc = Xliff.fromFileSync(xlfUri.fsPath);
    xlfDoc._path = xlfUri.fsPath;
    await XliffEditorPanel.createOrShow(extensionUri, xlfDoc);
  } catch (error) {
    Telemetry.trackException(error as Error);
    vscode.window.showErrorMessage((error as Error).message);
    return;
  }
}

export async function downloadBaseAppTranslationFiles(): Promise<void> {
  logger.log("Running: downloadBaseAppTranslationFiles");
  Telemetry.trackEvent("downloadBaseAppTranslationFiles");
  const targetLanguageCodes = XliffFunctions.existingTargetLanguageCodes(
    SettingsLoader.getSettings(),
    SettingsLoader.getAppManifest()
  );
  try {
    const result = await baseAppTranslationFiles.getBlobs(targetLanguageCodes);
    let informationMessage = `Successfully downloaded ${result.succeeded.length} translation file(s).`;
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
  logger.log("Done: downloadBaseAppTranslationFiles");
}

export async function matchTranslationsFromBaseApplication(): Promise<void> {
  logger.log("Running: matchTranslationsFromBaseApplication");
  Telemetry.trackEvent("matchTranslationsFromBaseApplication");
  const languageFunctionsSettings = new LanguageFunctionsSettings(
    SettingsLoader.getSettings()
  );
  const formatXml = true;
  try {
    const refreshResult = await refreshXlfFilesFromGXlfWithSettings();
    vscode.window.showInformationMessage(refreshResult.getReport());

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
          formatXml,
          languageFunctionsSettings.searchReplaceBeforeSaveXliff
        );
      }
      vscode.window.showInformationMessage(
        `Added ${numberOfMatches} suggestions from Base Application in ${vscode.Uri.file(
          xlfPath
        ).path.replace(/^.*[\\/]/, "")}.`
      );
    });
  } catch (error) {
    handleInvalidXmlError(error as Error);
    vscode.window.showErrorMessage((error as Error).message);
    return;
  }
  logger.log("Done: matchTranslationsFromBaseApplication");
}

export async function updateGXlf(): Promise<void> {
  logger.log("Running: Update g.xlf");
  Telemetry.trackEvent("updateGXlf");
  try {
    await vscode.workspace.saveAll();
    const refreshResult = await XliffFunctions.updateGXlfFromAlFiles(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    vscode.window.showInformationMessage(refreshResult.getReport());
  } catch (error) {
    showErrorAndLog("Update g.xlf", error as Error);
    return;
  }

  logger.log("Done: Update g.xlf");
}

export async function updateAllXlfFiles(): Promise<void> {
  logger.log("Running: Update all XLF files");
  Telemetry.trackEvent("updateAllXlfFiles");
  let refreshResult;
  try {
    await vscode.workspace.saveAll();
    refreshResult = await XliffFunctions.updateGXlfFromAlFiles(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    vscode.window.showInformationMessage(refreshResult.getReport());
    refreshResult = await refreshXlfFilesFromGXlfWithSettings();
    vscode.window.showInformationMessage(refreshResult.getReport());
  } catch (error) {
    handleInvalidXmlError(error as Error);
    showErrorAndLog("Update all XLF files", error as Error);
    return;
  }

  logger.log("Done: Update all XLF files");
}

export async function createNewTargetXlf(): Promise<void> {
  logger.log("Running: createNewTargetXlf");
  Telemetry.trackEvent("createNewTargetXlf");
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
    const gXlfPath = WorkspaceFunctions.getGXlfFilePath(settings, appManifest);
    const matchBaseAppTranslation =
      undefined === selectedMatchBaseApp
        ? false
        : selectedMatchBaseApp.join("").toLowerCase() === "yes";

    const {
      numberOfMatches,
      targetXlfFilename,
      targetXlfFilepath,
    } = await XliffFunctions.createTargetXlfFile(
      settings,
      gXlfPath,
      targetLanguage,
      matchBaseAppTranslation,
      appManifest
    );

    if (matchBaseAppTranslation) {
      vscode.window.showInformationMessage(
        `Added ${numberOfMatches} suggestions from Base Application in ${targetXlfFilename}.`
      );
    }
    vscode.window.showTextDocument(vscode.Uri.file(targetXlfFilepath));
  } catch (error) {
    Telemetry.trackException(error as Error);
    vscode.window.showErrorMessage((error as Error).message);
  }
  logger.log("Done: createNewTargetXlf");
}

export async function createCrossLanguageXlf(): Promise<void> {
  logger.log("Running: createCrossLanguageXlf");
  Telemetry.trackEvent("createCrossLanguageXlf");

  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
  const translationFilePaths = WorkspaceFunctions.getLangXlfFiles(
    settings,
    appManifest
  );

  const sourceFile = (
    await getQuickPickResult(translationFilePaths, {
      canPickMany: false,
      placeHolder: "Select translation files to use as source...",
    })
  )?.[0];
  if (sourceFile === undefined || sourceFile.length === 0) {
    showErrorAndLog(
      "Create cross language xlf",
      new Error("No files were selected as source")
    );
    return;
  }
  const targetFile = (
    await getQuickPickResult(translationFilePaths, {
      canPickMany: false,
      placeHolder: "Select translation files to use as target...",
    })
  )?.[0];
  if (targetFile === undefined || targetFile.length === 0) {
    showErrorAndLog(
      "Create cross language xlf",
      new Error("No files were selected as target")
    );
    return;
  }
  try {
    const targetXlfDoc = Xliff.fromFileSync(targetFile);
    const sourceXlfDoc = Xliff.fromFileSync(sourceFile);
    const newXlfDoc = new Xliff(
      "xml",
      sourceXlfDoc.targetLanguage,
      targetXlfDoc.targetLanguage,
      sourceXlfDoc.original
    );

    const newXlfFilename = `${appManifest.name}.${newXlfDoc.sourceLanguage}.${newXlfDoc.targetLanguage}.xlf`;
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating XLF file...",
      },
      () => {
        return new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            XliffFunctions.createCrossLanguageXlfFromFiles(
              settings,
              sourceXlfDoc,
              targetXlfDoc,
              newXlfDoc
            )
              .then(() => {
                vscode.window.showInformationMessage(
                  `The new XLF file is generated as ${newXlfFilename}.`
                );
                resolve();
              })
              .catch((err) => {
                reject(err);
              });
          }, 10);
        });
      }
    );

    const newXlfFilepath = path.join(
      settings.translationFolderPath,
      newXlfFilename
    );
    if (fs.existsSync(newXlfFilepath)) {
      fs.unlinkSync(newXlfFilepath);
    }
    fs.writeFileSync(
      newXlfFilepath,
      newXlfDoc.toString(
        languageFunctionsSettings.replaceSelfClosingXlfTags,
        languageFunctionsSettings.formatXml,
        languageFunctionsSettings.searchReplaceBeforeSaveXliff
      ),
      {
        encoding: "utf8",
      }
    );
    vscode.workspace
      .openTextDocument(newXlfFilepath)
      .then((doc) => vscode.window.showTextDocument(doc));
  } catch (error) {
    Telemetry.trackException(error as Error);
    vscode.window.showErrorMessage((error as Error).message);
  }
  logger.log("Done: createCrossLanguageXlf");
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

export async function getQuickPickResult(
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
async function getConfirmation(message: string): Promise<boolean> {
  const response = await vscode.window.showInformationMessage(
    message,
    ...["Yes", "No"]
  );
  return response?.toLocaleLowerCase() === "yes";
}

export async function exportTranslationsCSV(
  options = {
    selectColumns: false,
    selectFilter: false,
  }
): Promise<void> {
  logger.log("Running: exportTranslationsCSV");
  Telemetry.trackEvent("exportTranslationsCSV");
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
    checkTargetState:
      languageFunctionsSettings.translationMode ===
      TranslationMode.targetStates,
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
  logger.log("Done: exportTranslationsCSV");
}

export async function importTranslationCSV(): Promise<void> {
  logger.log("Running: importTranslationCSV");
  Telemetry.trackEvent("importTranslationCSV");
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
      // eslint-disable-next-line @typescript-eslint/naming-convention
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
      languageFunctionsSettings.translationMode ===
        TranslationMode.targetStates,
      xliffCSVImportTargetState,
      languageFunctionsSettings.ignoreMissingTransUnitsOnImport,
      languageFunctionsSettings.importTranslationWithDifferentSource
    );
    if (updatedTransUnits > 0) {
      xlf.toFileSync(
        updateXlfFilePath,
        languageFunctionsSettings.replaceSelfClosingXlfTags,
        true,
        languageFunctionsSettings.searchReplaceBeforeSaveXliff
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

  logger.log("Done: importTranslationCSV");
}

export async function importTranslationsById(): Promise<void> {
  logger.log("Running: importTranslationsById");
  Telemetry.trackEvent("importTranslationsById");
  try {
    const translationFilePaths = WorkspaceFunctions.getLangXlfFiles(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    const pickedFile = await getQuickPickResult(translationFilePaths, {
      canPickMany: false,
      placeHolder: "Select xlf file to update",
    });
    const targetXlfFilePath = isArray(pickedFile) ? pickedFile[0] : pickedFile;
    if (targetXlfFilePath === undefined) {
      throw new Error("No file selected for update");
    }
    const importXlfFile = await vscode.window.showOpenDialog({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      filters: { "xlf files": ["xlf"], "all files": ["*"] },
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      openLabel: "Select XLF file to import",
      title: "Select XLF file to import",
    });
    if (importXlfFile === undefined) {
      throw new Error("No file selected for import");
    }
    const importXlfFilePath = importXlfFile[0].fsPath;
    if (!fs.existsSync(importXlfFilePath)) {
      throw new Error(`File does not exist: ${importXlfFilePath}`);
    }
    const targetXlf = Xliff.fromFileSync(targetXlfFilePath);
    const importXlf = Xliff.fromFileSync(importXlfFilePath);
    if (
      targetXlf.targetLanguage.split("-")[0] !==
      importXlf.targetLanguage.split("-")[0]
    ) {
      // Only check language code, not dialect
      throw new Error(
        `Target language of the import file (${importXlf.targetLanguage}) does not match the target language of the selected xlf file (${targetXlf.targetLanguage}).`
      );
    }

    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );

    let updatedTransUnits = 0;
    importXlf.transunit.forEach((importTransUnit) => {
      if (!importTransUnit.needsAction(true)) {
        // Only include translation units that are not marked for review
        const targetTransUnit = targetXlf.getTransUnitById(importTransUnit.id);
        if (targetTransUnit) {
          if (
            targetTransUnit.target.textContent !==
            importTransUnit.target.textContent
          ) {
            targetTransUnit.target = importTransUnit.target;
            updatedTransUnits++;
          }
        }
      }
    });
    if (updatedTransUnits > 0) {
      targetXlf.toFileSync(
        targetXlfFilePath,
        languageFunctionsSettings.replaceSelfClosingXlfTags,
        true,
        languageFunctionsSettings.searchReplaceBeforeSaveXliff
      );
    }
    vscode.window.showInformationMessage(
      `${updatedTransUnits} trans-units updated in ${
        path.parse(targetXlfFilePath).base
      }`
    );
  } catch (error) {
    showErrorAndLog("Import translations by Id", error as Error);
  }

  logger.log("Done: importTranslationsById");
}

export async function addXmlCommentTag(
  textEditor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  tag: string
): Promise<void> {
  Telemetry.trackEvent("addXmlCommentTag", { tag: tag });
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

interface IExportOptions {
  columns: CSVHeader[];
  filter: CSVExportFilter;
  checkTargetState: boolean;
}

async function handleInvalidXmlError(
  error: Error,
  prompt = false
): Promise<void> {
  logger.error(error.message);
  if (!(error instanceof InvalidXmlError)) {
    Telemetry.trackException(error as Error);
    return;
  }
  Telemetry.trackException(error as InvalidXmlError);
  const action = `Open ${path.basename(error.path)} at error`;
  let answer;
  if (prompt) {
    answer = await vscode.window.showErrorMessage(
      `The xlf file ${path.basename(error.path)} has invalid xml.`,
      { modal: false },
      action
    );
  }
  if (!prompt || answer === action) {
    await DocumentFunctions.openTextFileWithSelection(
      error.path,
      error.index,
      error.length
    );
  }
}

export function getHoverText(
  document: vscode.TextDocument,
  position: vscode.Position
): vscode.MarkdownString[] {
  const settings = SettingsLoader.getSettings();
  if (!settings.enableTranslationsOnHover) {
    return [];
  }

  const returnValues = [];
  const selectedLineNo = position.line;

  const navObj = ALParser.getALObjectFromText(document.getText(), true);
  if (!navObj) {
    logger.error(`Could not parse file ${document.fileName} as an al object`);
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
  try {
    const langFilePaths = WorkspaceFunctions.getLangXlfFiles(
      settings,
      SettingsLoader.getAppManifest()
    );

    const tableContentMarkdown = new vscode.MarkdownString();
    for (const langFilePath of langFilePaths) {
      const xliffDoc = xliffCache.get(langFilePath);
      const transUnit = xliffDoc.getTransUnitById(transUnitId);
      if (transUnit) {
        const paramsObj: IOpenXliffIdParam = {
          languageCode: xliffDoc.targetLanguage,
          transUnitId: transUnitId,
        };
        const params = encodeURIComponent(JSON.stringify(paramsObj));
        tableContentMarkdown.appendMarkdown(
          `| [${xliffDoc.targetLanguage}](command:nab.openXliffId?${params} "Navigate to translation") | `
        );
        tableContentMarkdown.appendText(transUnit.target.textContent); // as Text since it needs to be escaped
        tableContentMarkdown.appendMarkdown(" |\n");
      }
    }

    const markdownString = new vscode.MarkdownString(
      `<div align="right"><span style="color:#888;">NAB AL Tools</span></div><hr/>\n\n`
    );
    if (tableContentMarkdown.value.length === 0) {
      markdownString.appendMarkdown("_No translations found_\n");
    } else {
      markdownString.appendMarkdown("| Language&nbsp;&nbsp; | Translation |\n");
      markdownString.appendMarkdown("| :---- | :---- |\n");
      markdownString.appendMarkdown(
        tableContentMarkdown.value.replace(/&nbsp;/g, " ")
      );
      // Telemetry.trackEvent("getHoverText"); // Skip until we implement sampling, only 1 out of 100 needs to be counted
    }
    markdownString.isTrusted = true;
    markdownString.supportHtml = true;
    returnValues.push(markdownString);
  } catch (error) {
    if (error instanceof InvalidXmlError) {
      handleInvalidXmlError(error, true);
    } else if (error instanceof InvalidJsonError) {
      Telemetry.trackException(error as InvalidJsonError);
    } else if (
      error instanceof NoLanguageFilesError ||
      error instanceof ApplicationManifestError
    ) {
      // Do nothing, a quite common issue :)
    } else {
      Telemetry.trackException(error as Error);
    }
    const markdownString = new vscode.MarkdownString();
    markdownString.appendMarkdown(
      "_something went wrong_\n\nThere was an issue when reading the xlf or app.json files. Please check that the xlf files exists in the Translations folder, that they have a valid format and that app.json is valid."
    );
    returnValues.push(markdownString);
  }
  return returnValues;
}

export function openXliffId(params: IOpenXliffIdParam): void {
  Telemetry.trackEvent("openXliffId", { languageCode: params.languageCode });
  const langFilePaths = WorkspaceFunctions.getLangXlfFiles(
    SettingsLoader.getSettings(),
    SettingsLoader.getAppManifest()
  );

  for (const langFilePath of langFilePaths) {
    const langXliff = xliffCache.get(langFilePath);
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

  setTimeout(() => {
    if (event.document.isDirty) {
      // logger.log("Document got dirty");
      return;
    }
    try {
      xliffCache.update(event.document.uri.fsPath, event.document.getText());
    } catch (error) {
      if (error instanceof InvalidXmlError) {
        handleInvalidXmlError(error, true);
        return;
      }
      throw error;
    }
  }, 1);
}

export async function convertToPermissionSet(
  extensionUri: vscode.Uri
): Promise<void> {
  logger.log("Running: convertToPermissionSet");
  Telemetry.trackEvent("convertToPermissionSet");
  try {
    const settings = SettingsLoader.getSettings();
    const defaultPrefix = getDefaultPrefix();
    const permissionSetFilePaths = WorkspaceFunctions.getPermissionSetFiles(
      settings.workspaceFolderPath
    );
    if (permissionSetFilePaths.length === 0) {
      throw new Error("No XmlPermissionSets found.");
    }
    const prefix = await getUserInput({
      prompt: "Prefix for new objects? (including any trailing spaces)",
      title: "Object Prefix",
      value: defaultPrefix,
    });
    if (prefix === undefined) {
      return;
    }

    const xmlPermissionSets = await PermissionSetFunctions.getXmlPermissionSets(
      permissionSetFilePaths,
      prefix
    );
    await PermissionSetNameEditorPanel.createOrShow(
      extensionUri,
      xmlPermissionSets,
      prefix,
      settings.workspaceFolderPath
    );
  } catch (error) {
    showErrorAndLog("Convert to PermissionSet object", error as Error);
  }
}

function getDefaultPrefix(): string {
  const appSourceCopSettings = SettingsLoader.getAppSourceCopSettings();
  let defaultPrefix =
    appSourceCopSettings.mandatoryAffixes.length > 0
      ? appSourceCopSettings.mandatoryAffixes[0].trim() + " "
      : "";
  if (!defaultPrefix && appSourceCopSettings.mandatoryPrefix) {
    defaultPrefix = appSourceCopSettings.mandatoryPrefix;
  }
  return defaultPrefix;
}

function appendActiveDocument(filesToSearch: string[]): string[] {
  if (vscode.window.activeTextEditor !== undefined) {
    //To avoid get stuck on the first file in the array we shift it.
    if (
      vscode.window.activeTextEditor.document.uri.fsPath === filesToSearch[0]
    ) {
      filesToSearch.push(filesToSearch[0]);
      filesToSearch.shift();
    }
  }
  return filesToSearch;
}

export async function createProjectFromTemplate(
  extensionUri: vscode.Uri
): Promise<void> {
  logger.log("Running: createProjectFromTemplate");
  Telemetry.trackEvent("createProjectFromTemplate");
  try {
    const workspaceFolderPath = SettingsLoader.getWorkspaceFolderPath();
    const templateSettingsFilePath = path.join(
      workspaceFolderPath,
      "al.template.json"
    );
    if (!fs.existsSync(templateSettingsFilePath)) {
      throw new Error(
        `This function should only be run when converting a template project to a new AL project. Do not use this on an existing AL project, since it will probably mess up your project. (The template settings file "${templateSettingsFilePath}" was not found)`
      );
    }
    await TemplateEditorPanel.createOrShow(
      extensionUri,
      templateSettingsFilePath,
      workspaceFolderPath,
      async (workspaceFilePath) => {
        if (workspaceFilePath !== "") {
          if (fs.existsSync(workspaceFilePath)) {
            logger.log("Open workspace file: ", workspaceFilePath);
            const uri = vscode.Uri.file(workspaceFilePath);
            await vscode.commands.executeCommand("vscode.openFolder", uri);
          }
        }
        logger.log("Done: createProjectFromTemplate");
      }
    );
  } catch (error) {
    showErrorAndLog("Convert from Template", error as Error);
  }
}

export async function renumberALObjects(): Promise<void> {
  logger.log("Running: renumberALObjects");
  Telemetry.trackEvent("renumberALObjects");
  try {
    const workspaceFolderPath = SettingsLoader.getWorkspaceFolderPath();
    if (
      !(await getConfirmation(
        `Renumber all AL objects in the folder "${workspaceFolderPath}" according to the object ID Range in app.json?`
      ))
    ) {
      return;
    }
    const numberOfChangedObjects = RenumberObjects.renumberObjectsInFolder(
      workspaceFolderPath
    );
    vscode.window.showInformationMessage(
      `${numberOfChangedObjects} AL objects are renumbered.`
    );
    logger.log("Done: renumberALObjects");
  } catch (error) {
    showErrorAndLog("Renumber AL objects", error as Error);
  }
}

function activeTextEditorIsXlf(): boolean {
  return (
    vscode.window.activeTextEditor !== undefined &&
    vscode.window.activeTextEditor.document.uri.fsPath.endsWith("xlf")
  );
}

export async function runTaskItems(): Promise<void> {
  const workspaceFileFolderPath = SettingsLoader.getWorkspaceFileFolderPath();
  const taskRunner = TaskRunner.importTaskRunnerItems(workspaceFileFolderPath);
  const foundTasks = taskRunner.taskList.length;
  if (foundTasks < 1) {
    return;
  }
  logger.log(`Running: runTaskItems with ${foundTasks} task items.`);
  Telemetry.trackEvent("runTaskItems");
  showMessage(
    `Found ${foundTasks} remaining tasks. Do you want to run them now?`,
    true
  ).then((runTasks) => {
    if (runTasks) {
      taskRunner.executeAll().catch((error) => {
        showErrorAndLog("runTaskItems", error as Error);
      });
    } else {
      showMessage(`Delete remaining ${foundTasks} tasks?`, true).then(
        (unlink) => {
          if (!unlink) {
            return;
          }
          taskRunner.taskList.forEach((task) =>
            taskRunner.deleteTaskFile(task)
          );
        }
      );
    }
  });
  logger.log("Done: runTaskItems");
}

export async function createPermissionSetForAllObjects(): Promise<void> {
  logger.log("Running: createPermissionSetForAllObjects");
  Telemetry.trackEvent("createPermissionSetForAllObjects");
  try {
    const appManifest = SettingsLoader.getAppManifest();
    const settings = SettingsLoader.getSettings();
    const filePath = path.join(
      settings.sourceFolderPath,
      `All.PermissionSet.al`
    );
    if (fs.existsSync(filePath)) {
      throw new Error(`File ${filePath} already exists.`);
    }
    const allObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
      settings,
      appManifest,
      true,
      false,
      false
    );
    const firstNumber = appManifest.idRanges[0].from ?? 50000;
    const prefix = getDefaultPrefix();
    const permissionSet = new ALPermissionSet(
      `${prefix}All`,
      "All permissions",
      firstNumber
    );
    allObjects
      .filter(
        (obj) =>
          [
            ALObjectType.codeunit,
            ALObjectType.page,
            ALObjectType.query,
            ALObjectType.report,
            ALObjectType.table,
            ALObjectType.xmlPort,
          ].includes(obj.objectType) && !obj.isObsolete()
      )
      .forEach((obj) => {
        if (
          obj.objectType === ALObjectType.table &&
          obj.getProperty(ALPropertyType.tableType, ALTableType.normal) ===
            ALTableType.normal
        ) {
          permissionSet.permissions.push(
            new ALPermission(ALObjectType.tableData, obj.objectName, "RIMD")
          );
        }
        permissionSet.permissions.push(
          new ALPermission(obj.objectType, obj.objectName, "X")
        );
      });
    FileFunctions.createFolderIfNotExist(settings.sourceFolderPath);
    fs.writeFileSync(filePath, permissionSet.toString(), { encoding: "utf8" });
    vscode.workspace
      .openTextDocument(filePath)
      .then((doc) => vscode.window.showTextDocument(doc));
    logger.log("Done: createPermissionSetForAllObjects");
  } catch (error) {
    showErrorAndLog("Create PermissionSet for all objects", error as Error);
  }
}

export function reportIssue(): void {
  vscode.commands.executeCommand("workbench.action.openIssueReporter", {
    extensionId: "nabsolutions.nab-al-tools",
    issueBody: issueTemplate(),
  });
}

function issueTemplate(): string {
  return `**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Additional context**
Add any other context about the problem here.

- Does it happen all the time?
- Did it used to work?
`;
}
export async function startCopilotInlineChat(): Promise<void> {
  const settings = SettingsLoader.getSettings();
  if (settings.copilotChatPrompts.length === 0) {
    vscode.window.showInformationMessage(
      'No prompts defined in the settings. Specify your custom prompts in the setting "NAB.CopilotChatPrompts."'
    );
    return;
  }
  const promptDescriptions = settings.copilotChatPrompts.map(
    (p) => p.description
  );
  const promptDescription = await getQuickPickResult(promptDescriptions, {
    canPickMany: false,
    placeHolder: "Select prompt to use...",
  });
  if (promptDescription === undefined) {
    return;
  }
  const selectedPrompt = settings.copilotChatPrompts.find(
    (p) => p.description === promptDescription[0]
  )?.prompt;
  vscode.commands.executeCommand("vscode.editorChat.start", {
    message: selectedPrompt,
  });
}
