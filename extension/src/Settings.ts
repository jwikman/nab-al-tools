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
    DetectInvalidTargets,
    UseDTS,
    DTSProjectId,
    SetDtsExactMatchToState,
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

const WORKSPACEKEY: string = 'NAB';
export class Settings {

    private static config: vscode.WorkspaceConfiguration;
    private static settingCollection: { [name: number]: any } = {};

    // private static getSetting(key: string) {
    //     if (!this.config.has(key)) {
    //         return null;
    //     } else {
    //         return this.config.get(key);
    //     }
    // }

    private static _getConfigSettings(resourceUri?: vscode.Uri): void {
        this.config = vscode.workspace.getConfiguration(WORKSPACEKEY, WorkspaceFiles.getWorkspaceFolder(resourceUri).uri);
        this.settingCollection[Setting.ConfigSignToolPath] = this.config.get('SignToolPath') + '';
        this.settingCollection[Setting.ConfigSigningCertificateName] = this.config.get('SigningCertificateName') + '';
        this.settingCollection[Setting.ConfigSigningTimeStampServer] = this.config.get('SigningTimeStampServer') + '';
        this.settingCollection[Setting.ConfigPowerShellWithDocker] = this.config.get('PowerShellWithDocker');
        this.settingCollection[Setting.ShowXlfHighlights] = this.config.get('ShowXlfHighlights');
        this.settingCollection[Setting.XlfHighlightsDecoration] = this.config.get('XlfHighlightsDecoration');
        this.settingCollection[Setting.UseExternalTranslationTool] = this.config.get('UseExternalTranslationTool');
        this.settingCollection[Setting.DetectInvalidTargets] = this.config.get('DetectInvalidTargets');
        this.settingCollection[Setting.UseDTS] = this.config.get('UseDTS');
        this.settingCollection[Setting.DTSProjectId] = this.config.get('DTS ProjectId');
        this.settingCollection[Setting.SetDtsExactMatchToState] = this.config.get('Set DTS Exact Match To State');
        this.settingCollection[Setting.ReplaceSelfClosingXlfTags] = this.config.get('ReplaceSelfClosingXlfTags');
        this.settingCollection[Setting.SearchOnlyXlfFiles] = this.config.get('SearchOnlyXlfFiles');
        this.settingCollection[Setting.MatchTranslation] = this.config.get('MatchTranslation');
        this.settingCollection[Setting.MatchBaseAppTranslation] = this.config.get('MatchBaseAppTranslation');
        this.settingCollection[Setting.TranslationSuggestionPaths] = this.config.get('TranslationSuggestionPaths');
        this.settingCollection[Setting.ConsoleLogOutput] = this.config.get('ConsoleLogOutput');
        this.settingCollection[Setting.LoadSymbols] = this.config.get('LoadSymbols');
        this.settingCollection[Setting.TooltipDocsIgnorePageExtensionIds] = this.config.get('TooltipDocsIgnorePageExtensionIds');
        this.settingCollection[Setting.TooltipDocsIgnorePageIds] = this.config.get('TooltipDocsIgnorePageIds');
        this.settingCollection[Setting.TooltipDocsFilePath] = this.config.get('TooltipDocsFilePath');
        this.settingCollection[Setting.GenerateTooltipDocsWithExternalDocs] = this.config.get('GenerateTooltipDocsWithExternalDocs');
        this.settingCollection[Setting.GenerateDeprecatedFeaturesPageWithExternalDocs] = this.config.get('GenerateDeprecatedFeaturesPageWithExternalDocs');
        this.settingCollection[Setting.IgnoreTransUnitInGeneratedDocumentation] = this.config.get('IgnoreTransUnitInGeneratedDocumentation');
        this.settingCollection[Setting.DocsRootPath] = this.config.get('DocsRootPath');
        this.settingCollection[Setting.RemoveObjectNamePrefixFromDocs] = this.config.get('RemoveObjectNamePrefixFromDocs');
        this.settingCollection[Setting.DocsIgnorePaths] = this.config.get('DocsIgnorePaths');
        this.settingCollection[Setting.CreateTocFilesForDocs] = this.config.get('CreateTocFilesForDocs');
        this.settingCollection[Setting.IncludeTablesAndFieldsInDocs] = this.config.get('IncludeTablesAndFieldsInDocs');
        this.settingCollection[Setting.CreateInfoFileForDocs] = this.config.get('CreateInfoFileForDocs');
        this.settingCollection[Setting.CreateUidForDocs] = this.config.get('CreateUidForDocs');
        this.settingCollection[Setting.XliffCSVExportPath] = this.config.get('Xliff CSV Export Path');
        this.settingCollection[Setting.XliffCSVImportTargetState] = this.config.get('Xliff CSV Import Target State');
    }

    private static _getAppSettings(resourceUri?: vscode.Uri): void {
        let appSettingsFolder: string;
        appSettingsFolder = WorkspaceFiles.getWorkspaceFolder(resourceUri).uri.fsPath;

        let appSettings = require(join(appSettingsFolder, "app.json"));
        this.settingCollection[Setting.AppId] = appSettings.id;
        this.settingCollection[Setting.AppName] = appSettings.name;
        this.settingCollection[Setting.AppVersion] = appSettings.version;
        this.settingCollection[Setting.AppPublisher] = appSettings.publisher;
    }

    private static _getLaunchSettings(resourceUri?: vscode.Uri): void {
        let vscodeSettingsFolder: string = join(WorkspaceFiles.getWorkspaceFolder(resourceUri).uri.fsPath, '.vscode');
        let launchSettings = require(join(vscodeSettingsFolder, "launch.json"));
        this.settingCollection[Setting.LaunchServer] = launchSettings.configurations[0].server;
        this.settingCollection[Setting.LaunchServerInstance] = launchSettings.configurations[0].serverInstance;
    }

    public static getAllSettings(resourceUri: vscode.Uri): {
        [name: number]: any;
    } {
        this._getConfigSettings(resourceUri);
        this._getAppSettings(resourceUri);
        this._getLaunchSettings(resourceUri);

        return this.settingCollection;
    }

    public static getAppSettings(resourceUri?: vscode.Uri): {
        [name: number]: any;
    } {
        this._getAppSettings(resourceUri);

        return this.settingCollection;
    }

    public static getLaunchSettings(resourceUri?: vscode.Uri): {
        [name: number]: any;
    } {
        this._getLaunchSettings(resourceUri);

        return this.settingCollection;
    }

    public static getConfigSettings(resourceUri?: vscode.Uri): {
        [name: number]: any;
    } {
        this._getConfigSettings(resourceUri);

        return this.settingCollection;
    }

    public static updateSetting(key: string, newvalue: any): void {
        this.config.update(key, newvalue);
    }
}