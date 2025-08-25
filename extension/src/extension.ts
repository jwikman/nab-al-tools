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
import * as Telemetry from "./Telemetry/Telemetry";
import { setLogger } from "./Logging/LogHelper";
import { OutputLogger } from "./Logging/OutputLogger";
import * as PowerShellFunctions from "./PowerShellFunctions";
import { userIdFile, userIdStateKey } from "./constants";
import { Settings } from "./Settings/Settings";
import { GetTextsToTranslateTool } from "./ChatTools/GetTextsToTranslateTool";
import { GetTranslatedTextsMapTool } from "./ChatTools/GetTranslatedTextsMapTool";
import { SaveTranslatedTextsTool } from "./ChatTools/SaveTranslatedTextsTool";
import { RefreshXlfTool } from "./ChatTools/RefreshXlfTool";
import { GetTranslatedTextsByStateTool } from "./ChatTools/GetTranslatedTextsByStateTool";
import { mcpServerId } from "./mcp/server";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  const settings = SettingsLoader.getSettings();
  if (vscode.env.isTelemetryEnabled) {
    startTelemetry(context, settings);
  }
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
    vscode.commands.registerCommand("nab.createCrossLanguageXlf", () => {
      NABfunctions.createCrossLanguageXlf();
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
    vscode.commands.registerCommand("nab.importTranslationsById", () => {
      NABfunctions.importTranslationsById();
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
    vscode.commands.registerCommand("nab.reportIssue", () =>
      NABfunctions.reportIssue()
    ),
    vscode.commands.registerCommand("nab.CopilotInlineChat", () =>
      NABfunctions.startCopilotInlineChat()
    ),
    vscode.commands.registerCommand("nab.showMcpServerInfo", () => {
      showMcpServerInfo(context);
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

  registerChatTools(context);
  //context.subscriptions.push(disposable);
  try {
    NABfunctions.runTaskItems();
  } catch (_) {
    // do nothing
  }
}

function registerChatTools(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.lm.registerTool("getTextsToTranslate", new GetTextsToTranslateTool())
  );
  context.subscriptions.push(
    vscode.lm.registerTool(
      "getTranslatedTextsMap",
      new GetTranslatedTextsMapTool()
    )
  );
  context.subscriptions.push(
    vscode.lm.registerTool(
      "getTranslatedTextsByState",
      new GetTranslatedTextsByStateTool()
    )
  );
  context.subscriptions.push(
    vscode.lm.registerTool("saveTranslatedTexts", new SaveTranslatedTextsTool())
  );
  context.subscriptions.push(
    vscode.lm.registerTool("refreshXlf", new RefreshXlfTool())
  );
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

/**
 * Shows information about the NAB AL Tools MCP Server
 */
function showMcpServerInfo(context: vscode.ExtensionContext): void {
  const serverPath = vscode.Uri.joinPath(
    context.extensionUri,
    "dist",
    "mcp",
    "server.js"
  ).fsPath;

  const infoMessage = `
**NAB AL Tools MCP Server**

The NAB AL Tools extension includes a Model Context Protocol (MCP) server that provides advanced translation management tools for AL development. This MCP server can be useful when running outside of VSCode, eg. in pipelines, GitHub Copilot Agent Sessions, etc.

**Server Location:**
\`${serverPath}\`

**Available Tools:**
• nab-al-tools-mcp-refreshXlf - Refresh XLF files from generated XLF
• nab-al-tools-mcp-getTextsToTranslate - Get untranslated texts from XLF files
• nab-al-tools-mcp-getTranslatedTextsMap - Get existing translations as a map
• nab-al-tools-mcp-getTranslatedTextsByState - Get translations filtered by state
• nab-al-tools-mcp-saveTranslatedTexts - Save new translations to XLF files

**Usage with MCP Clients:**
To use this server with MCP-compatible clients (like Claude Desktop), add this configuration:

\`\`\`json
{
  "mcpServers": {
    "${mcpServerId}": {
      "command": "node",
      "args": ["${serverPath}"]
    }
  }
}
\`\`\`

**Testing the Server:**
You can test the server directly by running:
\`node "${serverPath}"\`

For more information, see the MCP_SERVER.md documentation in the extension folder.
  `.trim();

  vscode.window
    .showInformationMessage(
      "NAB AL Tools MCP Server Information",
      { modal: true, detail: infoMessage },
      "Copy Server Path",
      "Open Documentation"
    )
    .then((selection) => {
      if (selection === "Copy Server Path") {
        vscode.env.clipboard.writeText(serverPath);
        vscode.window.showInformationMessage(
          "Server path copied to clipboard!"
        );
      } else if (selection === "Open Documentation") {
        const docPath = vscode.Uri.joinPath(
          context.extensionUri,
          "MCP_SERVER.md"
        );
        vscode.commands.executeCommand("vscode.open", docPath);
      }
    });
}
