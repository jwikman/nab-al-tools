// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as uuid from "uuid";
import * as NABfunctions from "./NABfunctions"; //Our own functions
import * as Troubleshooting from "./Troubleshooting"; //Our own functions
import * as DebugTests from "./DebugTests";
import * as SettingsLoader from "./Settings/SettingsLoader";
import { XlfHighlighter } from "./XlfHighlighter";
import * as Telemetry from "./Telemetry";
import { setLogger } from "./Logging/LogHelper";
import { OutputLogger } from "./Logging/OutputLogger";
import * as PowerShellFunctions from "./PowerShellFunctions";
import { userIdFile, userIdStateKey } from "./contants";
import { Settings } from "./Settings/Settings";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  const settings = SettingsLoader.getSettings();
  startTelemetry(context, settings);
  setLogger(OutputLogger.getInstance());
  const xlfHighlighter = new XlfHighlighter(settings);
  console.log("Extension nab-al-tools activated.");

  // The command has been defined in the package.json file
  // The commandId parameter must match the command field in package.json
  const commandList = [
    vscode.commands.registerCommand("nab.RefreshXlfFilesFromGXlf", () => {
      NABfunctions.refreshXlfFilesFromGXlf();
    }),
    vscode.commands.registerCommand("nab.FormatCurrentXlfFileForDTS", () => {
      NABfunctions.formatCurrentXlfFileForDts();
    }),
    vscode.commands.registerCommand("nab.OpenDTS", () => {
      NABfunctions.openDTS();
    }),
    vscode.commands.registerCommand("nab.ImportDtsTranslations", () => {
      NABfunctions.importDtsTranslations();
    }),
    vscode.commands.registerCommand("nab.FindNextUntranslatedText", () => {
      NABfunctions.findNextUntranslatedText();
    }),
    vscode.commands.registerCommand(
      "nab.SetTranslationUnitToTranslated",
      () => {
        NABfunctions.setTranslationUnitToTranslated();
      }
    ),
    vscode.commands.registerCommand("nab.SetTranslationUnitToSignedOff", () => {
      NABfunctions.setTranslationUnitToSignedOff();
    }),
    vscode.commands.registerCommand("nab.SetTranslationUnitToFinal", () => {
      NABfunctions.setTranslationUnitToFinal();
    }),
    vscode.commands.registerCommand("nab.FindAllUntranslatedText", () => {
      NABfunctions.findAllUntranslatedText();
    }),
    vscode.commands.registerCommand("nab.FindMultipleTargets", () => {
      NABfunctions.findMultipleTargets();
    }),
    vscode.commands.registerTextEditorCommand("nab.FindTranslatedTexts", () => {
      NABfunctions.findTranslatedTexts();
    }),
    vscode.commands.registerTextEditorCommand(
      "nab.FindSourceOfCurrentTranslationUnit",
      () => {
        NABfunctions.findSourceOfCurrentTranslationUnit();
      }
    ),
    vscode.commands.registerCommand("nab.DeployAndRunTestToolNoDebug", () => {
      NABfunctions.deployAndRunTestTool(true);
    }),
    vscode.commands.registerCommand("nab.DeployAndRunTestTool", () => {
      NABfunctions.deployAndRunTestTool(false);
    }),
    vscode.commands.registerCommand("nab.SortXlfFiles", () => {
      NABfunctions.sortXlfFiles();
    }),
    vscode.commands.registerCommand("nab.MatchFromXlfFile", () => {
      NABfunctions.matchFromXlfFile();
    }),
    vscode.commands.registerCommand("nab.CopySourceToTarget", () => {
      NABfunctions.copySourceToTarget();
    }),
    vscode.commands.registerCommand("nab.CopyAllSourceToTarget", () => {
      NABfunctions.copyAllSourceToTarget();
    }),
    vscode.commands.registerCommand("nab.SuggestToolTips", () => {
      NABfunctions.suggestToolTips();
    }),
    vscode.commands.registerCommand("nab.ShowSuggestedToolTip", () => {
      NABfunctions.showSuggestedToolTip();
    }),
    vscode.commands.registerCommand("nab.GenerateToolTipDocumentation", () => {
      NABfunctions.generateToolTipDocumentation();
    }),
    vscode.commands.registerCommand("nab.GenerateExternalDocumentation", () => {
      NABfunctions.generateExternalDocumentation();
    }),
    vscode.commands.registerCommand("nab.MatchTranslations", () => {
      NABfunctions.matchTranslations();
    }),
    vscode.commands.registerCommand(
      "nab.downloadBaseAppTranslationFiles",
      () => {
        NABfunctions.downloadBaseAppTranslationFiles();
      }
    ),
    vscode.commands.registerCommand(
      "nab.matchTranslationsFromBaseApplication",
      () => {
        NABfunctions.matchTranslationsFromBaseApplication();
      }
    ),
    vscode.commands.registerCommand("nab.UpdateGXlfFile", () => {
      NABfunctions.updateGXlf();
    }),
    vscode.commands.registerCommand("nab.UpdateAllXlfFiles", () => {
      NABfunctions.updateAllXlfFiles();
    }),
    vscode.commands.registerCommand("nab.editXliffDocument", (xlfUri) => {
      NABfunctions.editXliffDocument(context.extensionUri, xlfUri);
    }),
    vscode.commands.registerCommand("nab.createNewTargetXlf", () => {
      NABfunctions.createNewTargetXlf();
    }),
    vscode.commands.registerCommand("nab.exportTranslationsCSV", () => {
      NABfunctions.exportTranslationsCSV();
    }),
    vscode.commands.registerCommand(
      "nab.exportTranslationsCSVColumnSelect",
      () => {
        NABfunctions.exportTranslationsCSV({
          selectColumns: true,
          selectFilter: true,
        });
      }
    ),
    vscode.commands.registerCommand("nab.importTranslationCSV", () => {
      NABfunctions.importTranslationCSV();
    }),
    vscode.commands.registerCommand("nab.convertToPermissionSet", () => {
      NABfunctions.convertToPermissionSet(context.extensionUri);
    }),
    vscode.commands.registerCommand("nab.createProjectFromTemplate", () => {
      NABfunctions.createProjectFromTemplate(context.extensionUri);
    }),
    vscode.commands.registerCommand("nab.renumberALObjects", () => {
      NABfunctions.renumberALObjects();
    }),
    vscode.commands.registerCommand(
      "nab.createPermissionSetForAllObjects",
      () => {
        NABfunctions.createPermissionSetForAllObjects();
      }
    ),
    vscode.commands.registerTextEditorCommand(
      "nab.AddXmlCommentBold",
      (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
        NABfunctions.addXmlCommentTag(textEditor, edit, "b");
      }
    ),
    vscode.commands.registerTextEditorCommand(
      "nab.AddXmlCommentItalic",
      (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
        NABfunctions.addXmlCommentTag(textEditor, edit, "i");
      }
    ),
    vscode.commands.registerTextEditorCommand(
      "nab.AddXmlCommentCode",
      (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
        NABfunctions.addXmlCommentTag(textEditor, edit, "c");
      }
    ),
    vscode.commands.registerTextEditorCommand(
      "nab.AddXmlCommentCodeBlock",
      (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
        NABfunctions.addXmlCommentTag(textEditor, edit, "code");
      }
    ),
    vscode.commands.registerTextEditorCommand(
      "nab.AddXmlCommentPara",
      (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
        NABfunctions.addXmlCommentTag(textEditor, edit, "para");
      }
    ),

    vscode.debug.onDidStartDebugSession((debugSession) =>
      DebugTests.handleStartDebugSession(debugSession)
    ),
    vscode.debug.onDidTerminateDebugSession((debugSession) =>
      DebugTests.handleTerminateDebugSession(debugSession)
    ),
    vscode.workspace.onDidChangeTextDocument((event) => {
      xlfHighlighter.onDidChangeTextDocument(event);
      NABfunctions.onDidChangeTextDocument(event);
    }),
    vscode.window.onDidChangeActiveTextEditor((editor) =>
      xlfHighlighter.onDidChangeActiveTextEditor(editor)
    ),
    vscode.languages.registerHoverProvider(
      { scheme: "file", language: "al" },
      {
        provideHover(document, position) {
          return {
            contents: NABfunctions.getHoverText(document, position),
          };
        },
      }
    ),
    vscode.commands.registerCommand("nab.openXliffId", (params) => {
      NABfunctions.openXliffId(params);
    }),
  ];

  const troubleshootingFunctions = [
    vscode.commands.registerCommand("nab.troubleshootParseCurrentFile", () => {
      Troubleshooting.troubleshootParseCurrentFile();
    }),
    vscode.commands.registerCommand("nab.troubleshootParseAllFiles", () => {
      Troubleshooting.troubleshootParseAllFiles();
    }),
    vscode.commands.registerCommand(
      "nab.troubleshootFindTransUnitsWithoutSource",
      () => {
        Troubleshooting.troubleshootFindTransUnitsWithoutSource();
      }
    ),
  ];

  const powerShellFunctions = [
    vscode.commands.registerCommand("nab.UninstallDependencies", () => {
      PowerShellFunctions.uninstallDependencies();
    }),
    vscode.commands.registerCommand("nab.SignAppFile", () => {
      PowerShellFunctions.signAppFile();
    }),
  ];

  context.subscriptions.concat(commandList);
  context.subscriptions.concat(troubleshootingFunctions);
  context.subscriptions.concat(powerShellFunctions);
  //context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  // any need for cleaning?
}

// /**
//  * Synchronizes the anonymous user ID between a local file and global workspace state, if necessary, and then starts Telemetry.
//  * The global workspace state is preserved over vscode updates, so it is more durable than local extension file.
//  * The user ID should then be read by the language server or debug service when sending telemetry.
//  */
function startTelemetry(
  context: vscode.ExtensionContext,
  settings: Settings
): void {
  let newInstallation = false;
  let userId: string = context.globalState.get(userIdStateKey) || "";
  try {
    const path = context.asAbsolutePath(userIdFile);
    if (fs.existsSync(path)) {
      if (!userId) {
        userId = fs.readFileSync(path, "utf-8");
        context.globalState.update(userIdStateKey, userId);
      }
    } else {
      newInstallation = true;
      if (!userId) {
        userId = uuid.v4();
        context.globalState.update(userIdStateKey, userId);
      }
      fs.writeFileSync(path, userId, { encoding: "utf-8" });
    }
  } catch (e) {
    // ignore
  }
  Telemetry.startTelemetry(
    vscode.version,
    settings,
    SettingsLoader.getExtensionPackage(),
    userId,
    newInstallation
  );
}
