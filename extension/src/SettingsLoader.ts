import { join } from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import {
  AppManifest,
  LaunchSettings,
  Settings,
  IAppManifest,
  ILaunchFile,
} from "./Settings";

export function getSettings(): Settings {
  const workspaceFolderPath = getWorkspaceFolderPath();
  const workspaceKey = "NAB";
  const config = vscode.workspace.getConfiguration(
    workspaceKey,
    vscode.Uri.file(workspaceFolderPath)
  );
  const settings = new Settings(workspaceFolderPath);

  settings.signToolPath = getConfigValue(
    config.get("SignToolPath"),
    settings.signToolPath
  );
  settings.signingCertificateName = getConfigValue(
    config.get("SigningCertificateName"),
    settings.signingCertificateName
  );
  settings.signingTimeStampServer = getConfigValue(
    config.get("SigningTimeStampServer"),
    settings.signingTimeStampServer
  );
  settings.powerShellWithDocker = getConfigValue(
    config.get("PowerShellWithDocker"),
    settings.powerShellWithDocker
  );
  settings.showXlfHighlights = getConfigValue(
    config.get("ShowXlfHighlights"),
    settings.showXlfHighlights
  );
  settings.xlfHighlightsDecoration = getConfigValue(
    config.get("XlfHighlightsDecoration"),
    settings.xlfHighlightsDecoration
  );
  settings.useExternalTranslationTool = getConfigValue(
    config.get("UseExternalTranslationTool"),
    settings.useExternalTranslationTool
  );
  settings.detectInvalidTargets = getConfigValue(
    config.get("DetectInvalidTargets"),
    settings.detectInvalidTargets
  );
  settings.useDTS = getConfigValue(config.get("UseDTS"), settings.useDTS);
  settings.dtsProjectId = getConfigValue(
    config.get("DTS ProjectId"),
    settings.dtsProjectId
  );
  settings.setDtsExactMatchToState = getConfigValue(
    config.get("Exact Match To State"),
    settings.setDtsExactMatchToState
  );
  settings.replaceSelfClosingXlfTags = getConfigValue(
    config.get("ReplaceSelfClosingXlfTags"),
    settings.replaceSelfClosingXlfTags
  );
  settings.searchOnlyXlfFiles = getConfigValue(
    config.get("SearchOnlyXlfFiles"),
    settings.searchOnlyXlfFiles
  );
  settings.matchTranslation = getConfigValue(
    config.get("MatchTranslation"),
    settings.matchTranslation
  );
  settings.matchBaseAppTranslation = getConfigValue(
    config.get("MatchBaseAppTranslation"),
    settings.matchBaseAppTranslation
  );
  settings.translationSuggestionPaths = getConfigValue(
    config.get("TranslationSuggestionPaths"),
    settings.translationSuggestionPaths
  );
  settings.consoleLogOutput = getConfigValue(
    config.get("ConsoleLogOutput"),
    settings.consoleLogOutput
  );
  settings.loadSymbols = getConfigValue(
    config.get("LoadSymbols"),
    settings.loadSymbols
  );
  settings.tooltipDocsIgnorePageExtensionIds = getConfigValue(
    config.get("TooltipDocsIgnorePageExtensionIds"),
    settings.tooltipDocsIgnorePageExtensionIds
  );
  settings.tooltipDocsIgnorePageIds = getConfigValue(
    config.get("TooltipDocsIgnorePageIds"),
    settings.tooltipDocsIgnorePageIds
  );
  settings.tooltipDocsFilePath = getConfigValue(
    config.get("TooltipDocsFilePath"),
    settings.tooltipDocsFilePath
  );
  settings.generateTooltipDocsWithExternalDocs = getConfigValue(
    config.get("GenerateTooltipDocsWithExternalDocs"),
    settings.generateTooltipDocsWithExternalDocs
  );
  settings.generateDeprecatedFeaturesPageWithExternalDocs = getConfigValue(
    config.get("GenerateDeprecatedFeaturesPageWithExternalDocs"),
    settings.generateDeprecatedFeaturesPageWithExternalDocs
  );
  settings.ignoreTransUnitInGeneratedDocumentation = getConfigValue(
    config.get("IgnoreTransUnitInGeneratedDocumentation"),
    settings.ignoreTransUnitInGeneratedDocumentation
  );
  settings.docsRootPath = getConfigValue(
    config.get("DocsRootPath"),
    settings.docsRootPath
  );
  settings.removeObjectNamePrefixFromDocs = getConfigValue(
    config.get("RemoveObjectNamePrefixFromDocs"),
    settings.removeObjectNamePrefixFromDocs
  );
  settings.docsIgnorePaths = getConfigValue(
    config.get("DocsIgnorePaths"),
    settings.docsIgnorePaths
  );
  settings.createTocFilesForDocs = getConfigValue(
    config.get("CreateTocFilesForDocs"),
    settings.createTocFilesForDocs
  );
  settings.includeTablesAndFieldsInDocs = getConfigValue(
    config.get("IncludeTablesAndFieldsInDocs"),
    settings.includeTablesAndFieldsInDocs
  );
  settings.createInfoFileForDocs = getConfigValue(
    config.get("CreateInfoFileForDocs"),
    settings.createInfoFileForDocs
  );
  settings.createUidForDocs = getConfigValue(
    config.get("CreateUidForDocs"),
    settings.createUidForDocs
  );
  settings.xliffCSVExportPath = getConfigValue(
    config.get("Xliff CSV Export Path"),
    settings.xliffCSVExportPath
  );
  settings.xliffCSVImportTargetState = getConfigValue(
    config.get("CSV Import Target State"),
    settings.xliffCSVImportTargetState
  );

  return settings;
}

export function getLaunchSettings(): LaunchSettings {
  const workspaceFolderPath = getWorkspaceFolderPath();

  const vscodeSettingsFolder: string = join(workspaceFolderPath, ".vscode");
  const filePath = join(vscodeSettingsFolder, "launch.json");

  const launchSettingsJson = loadJson(filePath) as ILaunchFile;

  const launchSettings = new LaunchSettings(
    launchSettingsJson.configurations[0].server,
    launchSettingsJson.configurations[0].serverInstance
  );

  return launchSettings;
}

export function getAppManifest(): AppManifest {
  const workspaceFolderPath = getWorkspaceFolderPath();
  const filePath = join(workspaceFolderPath, "app.json");
  const appSettings = loadJson(filePath) as IAppManifest;

  const appManifest = new AppManifest(
    appSettings.id,
    appSettings.name,
    appSettings.publisher,
    appSettings.version
  );

  return appManifest;
}

function loadJson(filePath: string): unknown {
  // TODO: Handle "Json with Comments"
  let fileContent = fs.readFileSync(filePath, "utf8");
  if (fileContent.charCodeAt(0) === 0xfeff) {
    // Remove BOM
    fileContent = fileContent.substr(1);
  }
  const json = JSON.parse(fileContent);
  return json;
}

function getConfigValue<T>(configValue: T | undefined, defaultValue: T): T {
  if (configValue === undefined) {
    return defaultValue;
  }
  return configValue;
}

function getWorkspaceFolderPath(): string {
  let workspaceFolder: vscode.WorkspaceFolder | undefined;
  if (vscode.window.activeTextEditor) {
    workspaceFolder = vscode.workspace.getWorkspaceFolder(
      vscode.window.activeTextEditor.document.uri
    );
  }

  if (!workspaceFolder) {
    const realTextEditors = vscode.window.visibleTextEditors.filter(
      (x) =>
        x.document.uri.scheme !== "output" && x.document.uri.path !== "tasks"
    );
    if (realTextEditors.length > 0) {
      for (let index = 0; index < realTextEditors.length; index++) {
        const textEditor = vscode.window.visibleTextEditors[index];
        workspaceFolder = vscode.workspace.getWorkspaceFolder(
          textEditor.document.uri
        );
        if (workspaceFolder) {
          break;
        }
      }
    }
  }

  if (!workspaceFolder) {
    if (vscode.workspace.workspaceFolders) {
      workspaceFolder = vscode.workspace.workspaceFolders[0];
    }
  }
  if (!workspaceFolder) {
    throw new Error(
      "No workspace found. Please open a file within your workspace folder and try again."
    );
  }
  return workspaceFolder.uri.fsPath;
}
