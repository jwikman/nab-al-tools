import * as path from "path";

// When a new setting is added:
//  1. Add the setting in package.json, with default value
//  2. Add the corresponding property on the Settings class below, with the same default value as in package.json
//  3. Add the mapping between the setting and the new property name in SettingsMap.ts
export class Settings {
  public workspaceFolderPath: string;
  public matchTranslation = true;
  public matchBaseAppTranslation = true;
  public translationSuggestionPaths: string[] = [];
  public showXlfHighlights = true;
  public xlfHighlightsDecoration = {
    borderWidth: "1px",
    borderRadius: "0px",
    borderStyle: "dotted",
    overviewRulerLane: 2,
    light: {
      overviewRulerColor: "orange",
      borderColor: "orange",
      backgroundColor: "rgba(200, 200, 100, 0.50)",
    },
    dark: {
      overviewRulerColor: "yellow",
      borderColor: "yellow",
      backgroundColor: "rgba(200, 200, 100, 0.10)",
    },
  };
  public useExternalTranslationTool = false;
  public detectInvalidTargets = true;
  public useDTS = false;
  public dtsProjectId = "";
  public setDtsExactMatchToState = "(keep)";
  public replaceSelfClosingXlfTags = true;
  public searchOnlyXlfFiles = false;
  public tooltipDocsIgnorePageExtensionIds: number[] = [];
  public tooltipDocsIgnorePageIds: number[] = [];
  public tooltipDocsFilePath = "ToolTips.md";
  public generateTooltipDocsWithExternalDocs = true;
  public generateDeprecatedFeaturesPageWithExternalDocs = true;
  public ignoreTransUnitInGeneratedDocumentation: string[] = [];
  public docsRootPath = "docs";
  public createTocFilesForDocs = true;
  public documentationOutputIndexFile = false;
  public documentationOutputIndexFilePath = "./index.md";
  public documentationOutputIndexFileDepth = 2;
  public documentationYamlTitleEnabled = true;
  public documentationYamlTitlePrefix = "";
  public documentationYamlTitleSuffix = " | {appName}";
  public includeTablesAndFieldsInDocs = true;
  public createInfoFileForDocs = true;
  public createUidForDocs = true;
  public removeObjectNamePrefixFromDocs = "";
  public docsIgnorePaths: string[] = ["**\\TestApp\\**"];
  public signingCertificateName = "";
  public signingTimeStampServer = "http://timestamp.digicert.com";
  public signToolPath =
    "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.16299.0\\x86\\signtool.exe";
  public consoleLogOutput = false;
  public xliffCSVExportPath = "";
  public xliffCSVImportTargetState = "translated";
  public loadSymbols = true;
  public refreshXlfAfterFindNextUntranslated = true;
  public enableTranslationsOnHover = true;
  public enableTelemetry = true;
  public enableTroubleshootingCommands = true;
  public useDictionaryInDTSImport = true;
  public enableXliffCache = true;
  public preferLockedTranslations = true;
  public translationFilenamePattern = "*.xlf";
  // Other extension's settings:
  public packageCachePath = undefined;

  constructor(workspaceFolderPath: string) {
    this.workspaceFolderPath = workspaceFolderPath;
  }

  public get translationFolderPath(): string {
    return path.join(this.workspaceFolderPath, "Translations");
  }
  public get sourceFolderPath(): string {
    return path.join(this.workspaceFolderPath, "src");
  }

  public get dtsWorkFolderPath(): string {
    return path.join(this.workspaceFolderPath, ".dts");
  }
}

export interface IAppManifest {
  id: string;
  name: string;
  publisher: string;
  version: string;
  idRanges: IDRange[];
}
export class AppManifest implements IAppManifest {
  public workspaceFolderPath: string;
  public id: string;
  public name: string;
  public publisher: string;
  public version: string;
  public idRanges: IDRange[] = [];

  constructor(workspaceFolderPath: string, appManifest: IAppManifest) {
    this.workspaceFolderPath = workspaceFolderPath;
    this.id = appManifest.id;
    this.name = appManifest.name;
    this.publisher = appManifest.publisher;
    this.version = appManifest.version;
    this.idRanges = appManifest.idRanges;
  }
}

export interface IDRange {
  from: number;
  to: number;
}

export interface ILaunchFile {
  configurations: ILaunchConfiguration[];
}
interface ILaunchConfiguration {
  server: string;
  serverInstance: string;
}

export class LaunchSettings {
  public server: string;
  public serverInstance: string;

  constructor(server: string, serverInstance: string) {
    this.server = server;
    this.serverInstance = serverInstance;
  }
}

export interface IAppSourceCopSettings {
  mandatoryAffixes: string[];
  mandatoryPrefix: string;
}

export interface IExtensionPackage {
  displayName: string;
  version: string;
}
