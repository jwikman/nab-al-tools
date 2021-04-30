import * as vscode from 'vscode';
import { join } from 'path';
import * as WorkspaceFiles from './WorkspaceFunctions';

export enum Setting {
    AppId,
    AppName,
    AppVersion,
    AppPublisher,
    LaunchServer,
    LaunchServerInstance,
    ConfigSigningCertificateName,
    ConfigSigningTimeStampServer,
    ConfigSignToolPath,
    ConfigPowerShellWithDocker,
    ShowXlfHighlights,
    XlfHighlightsDecoration,
    UseExternalTranslationTool,
    ReplaceSelfClosingXlfTags,
    SearchOnlyXlfFiles,
    MatchTranslation,
    MatchBaseAppTranslation,
    TranslationSuggestionPaths,
    ConsoleLogOutput,
    LoadSymbols,
    TooltipDocsIgnorePageExtensionIds,
    TooltipDocsIgnorePageIds,
    TooltipDocsFilePath,
    IgnoreTransUnitInGeneratedDocumentation,
    GenerateTooltipDocsWithExternalDocs,
    GenerateDeprecatedFeaturesPageWithExternalDocs,
    RemoveObjectNamePrefixFromDocs,
    DocsIgnorePaths,
    DocsRootPath,
    CreateTocFilesForDocs,
    IncludeTablesAndFieldsInDocs,
    CreateInfoFileForDocs,
    CreateUidForDocs,
    XliffCSVExportPath,
    XliffCSVImportTargetState
}

export class Settings {

    private static config: vscode.WorkspaceConfiguration;
    private static SettingCollection: { [name: number]: any } = {};
    private static WORKSPACEKEY: string = 'NAB';

    // private static getSetting(key: string) {
    //     if (!this.config.has(key)) {
    //         return null;
    //     } else {
    //         return this.config.get(key);
    //     }
    // }

    private static _getConfigSettings(ResourceUri?: vscode.Uri) {
        this.config = vscode.workspace.getConfiguration(this.WORKSPACEKEY, WorkspaceFiles.getWorkspaceFolder(ResourceUri).uri);
        this.SettingCollection[Setting.ConfigSignToolPath] = this.config.get('SignToolPath') + '';
        this.SettingCollection[Setting.ConfigSigningCertificateName] = this.config.get('SigningCertificateName') + '';
        this.SettingCollection[Setting.ConfigSigningTimeStampServer] = this.config.get('SigningTimeStampServer') + '';
        this.SettingCollection[Setting.ConfigPowerShellWithDocker] = this.config.get('PowerShellWithDocker');
        this.SettingCollection[Setting.ShowXlfHighlights] = this.config.get('ShowXlfHighlights');
        this.SettingCollection[Setting.XlfHighlightsDecoration] = this.config.get('XlfHighlightsDecoration');
        this.SettingCollection[Setting.UseExternalTranslationTool] = this.config.get('UseExternalTranslationTool');
        this.SettingCollection[Setting.ReplaceSelfClosingXlfTags] = this.config.get('ReplaceSelfClosingXlfTags');
        this.SettingCollection[Setting.SearchOnlyXlfFiles] = this.config.get('SearchOnlyXlfFiles');
        this.SettingCollection[Setting.MatchTranslation] = this.config.get('MatchTranslation');
        this.SettingCollection[Setting.MatchBaseAppTranslation] = this.config.get('MatchBaseAppTranslation');
        this.SettingCollection[Setting.TranslationSuggestionPaths] = this.config.get('TranslationSuggestionPaths');
        this.SettingCollection[Setting.ConsoleLogOutput] = this.config.get('ConsoleLogOutput');
        this.SettingCollection[Setting.LoadSymbols] = this.config.get('LoadSymbols');
        this.SettingCollection[Setting.TooltipDocsIgnorePageExtensionIds] = this.config.get('TooltipDocsIgnorePageExtensionIds');
        this.SettingCollection[Setting.TooltipDocsIgnorePageIds] = this.config.get('TooltipDocsIgnorePageIds');
        this.SettingCollection[Setting.TooltipDocsFilePath] = this.config.get('TooltipDocsFilePath');
        this.SettingCollection[Setting.GenerateTooltipDocsWithExternalDocs] = this.config.get('GenerateTooltipDocsWithExternalDocs');
        this.SettingCollection[Setting.GenerateDeprecatedFeaturesPageWithExternalDocs] = this.config.get('GenerateDeprecatedFeaturesPageWithExternalDocs');
        this.SettingCollection[Setting.IgnoreTransUnitInGeneratedDocumentation] = this.config.get('IgnoreTransUnitInGeneratedDocumentation');
        this.SettingCollection[Setting.DocsRootPath] = this.config.get('DocsRootPath');
        this.SettingCollection[Setting.RemoveObjectNamePrefixFromDocs] = this.config.get('RemoveObjectNamePrefixFromDocs');
        this.SettingCollection[Setting.DocsIgnorePaths] = this.config.get('DocsIgnorePaths');
        this.SettingCollection[Setting.CreateTocFilesForDocs] = this.config.get('CreateTocFilesForDocs');
        this.SettingCollection[Setting.IncludeTablesAndFieldsInDocs] = this.config.get('IncludeTablesAndFieldsInDocs');
        this.SettingCollection[Setting.CreateInfoFileForDocs] = this.config.get('CreateInfoFileForDocs');
        this.SettingCollection[Setting.CreateUidForDocs] = this.config.get('CreateUidForDocs');
        this.SettingCollection[Setting.XliffCSVExportPath] = this.config.get('Xliff CSV Export Path');
        this.SettingCollection[Setting.XliffCSVImportTargetState] = this.config.get('Xliff CSV Import Target State');
    }

    private static _getAppSettings(ResourceUri?: vscode.Uri) {
        let appSettingsFolder: string;
        appSettingsFolder = WorkspaceFiles.getWorkspaceFolder(ResourceUri).uri.fsPath;

        let appSettings = require(join(appSettingsFolder, "app.json"));
        this.SettingCollection[Setting.AppId] = appSettings.id;
        this.SettingCollection[Setting.AppName] = appSettings.name;
        this.SettingCollection[Setting.AppVersion] = appSettings.version;
        this.SettingCollection[Setting.AppPublisher] = appSettings.publisher;
    }

    private static _getLaunchSettings(ResourceUri?: vscode.Uri) {
        let vscodeSettingsFolder: string = join(WorkspaceFiles.getWorkspaceFolder(ResourceUri).uri.fsPath, '.vscode');
        let launchSettings = require(join(vscodeSettingsFolder, "launch.json"));
        this.SettingCollection[Setting.LaunchServer] = launchSettings.configurations[0].server;
        this.SettingCollection[Setting.LaunchServerInstance] = launchSettings.configurations[0].serverInstance;
    }

    public static getAllSettings(ResourceUri: vscode.Uri) {
        this._getConfigSettings(ResourceUri);
        this._getAppSettings(ResourceUri);
        this._getLaunchSettings(ResourceUri);

        return this.SettingCollection;
    }

    public static getAppSettings(ResourceUri?: vscode.Uri) {
        this._getAppSettings(ResourceUri);

        return this.SettingCollection;
    }

    public static getLaunchSettings(ResourceUri?: vscode.Uri) {
        this._getLaunchSettings(ResourceUri);

        return this.SettingCollection;
    }

    public static getConfigSettings(ResourceUri?: vscode.Uri) {
        this._getConfigSettings(ResourceUri);

        return this.SettingCollection;
    }

    public static updateSetting(key: string, newvalue: any) {
        this.config.update(key, newvalue);
    }
}