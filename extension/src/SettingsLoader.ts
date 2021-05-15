import { join } from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import { AppManifest, LaunchSettings, Settings } from "./Settings";

export function getConfiguredSettings(workspaceFolderPath: string): Settings {
  const workspaceKey = "NAB";
  const config = vscode.workspace.getConfiguration(
    workspaceKey,
    vscode.Uri.file(workspaceFolderPath)
  );
  const settings = new Settings();

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

export function getLaunchSettings(workspaceFolderPath: string): LaunchSettings {
  const vscodeSettingsFolder: string = join(workspaceFolderPath, ".vscode");

  const launchSettingsJson = JSON.parse(
    fs.readFileSync(join(vscodeSettingsFolder, "launch.json"), "utf8")
  );

  const launchSettings = new LaunchSettings(
    launchSettingsJson.configurations[0].server,
    launchSettingsJson.configurations[0].serverInstance
  );

  return launchSettings;
}
export function getAppManifest(workspaceFolderPath: string): AppManifest {
  const appSettings = JSON.parse(
    fs.readFileSync(join(workspaceFolderPath, "app.json"), "utf8")
  );

  const appManifest = new AppManifest(
    appSettings.id,
    appSettings.name,
    appSettings.publisher,
    appSettings.version
  );

  return appManifest;
}

function getConfigValue<T>(configValue: T | undefined, defaultValue: T): T {
  if (configValue === undefined) {
    return defaultValue;
  }
  return configValue;
}
