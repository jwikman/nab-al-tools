export class Settings {
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
  public tooltipDocsIgnorePageExtensionIds: string[] = [];
  public tooltipDocsIgnorePageIds: string[] = [];
  public tooltipDocsFilePath = "ToolTips.md";
  public generateTooltipDocsWithExternalDocs = true;
  public generateDeprecatedFeaturesPageWithExternalDocs = true;
  public ignoreTransUnitInGeneratedDocumentation: string[] = [];
  public docsRootPath = "docs";
  public createTocFilesForDocs = true;
  public includeTablesAndFieldsInDocs = false;
  public createInfoFileForDocs = true;
  public createUidForDocs = true;
  public removeObjectNamePrefixFromDocs = "";
  public docsIgnorePaths: string[] = ["**\\TestApp\\**"];
  public signingCertificateName = "";
  public signingTimeStampServer = "http://timestamp.digicert.com";
  public signToolPath =
    "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.16299.0\\x86\\signtool.exe";
  public powerShellWithDocker = false; // TODO: REMOVE?
  public consoleLogOutput = false;
  public xliffCSVExportPath = "";
  public xliffCSVImportTargetState = "translated";
  public loadSymbols = true;

  constructor() {
    // All properties has default values
  }
}

export class AppManifest {
  public id: string;
  public name: string;
  public publisher: string;
  public version: string;

  constructor(id: string, name: string, publisher: string, version: string) {
    this.id = id;
    this.name = name;
    this.publisher = publisher;
    this.version = version;
  }
}

export class LaunchSettings {
  public server: string;
  public serverInstance: string;

  constructor(server: string, serverInstance: string) {
    this.server = server;
    this.serverInstance = serverInstance;
  }
}
