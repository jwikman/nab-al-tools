import * as vscode from 'vscode';
import { join } from 'path';
import * as WorkspaceFiles from './WorkspaceFunctions';

export enum Setting {
    appId,
    appName,
    appVersion,
    appPublisher,
    launchServer,
    launchServerInstance,
    configSigningCertificateName,
    configSigningTimeStampServer,
    configSignToolPath,
    configPowerShellWithDocker,
    showXlfHighlights,
    xlfHighlightsDecoration,
    useExternalTranslationTool,
    detectInvalidTargets,
    useDTS,
    dtsProjectId,
    setDtsExactMatchToState,
    replaceSelfClosingXlfTags,
    searchOnlyXlfFiles,
    matchTranslation,
    matchBaseAppTranslation,
    translationSuggestionPaths,
    consoleLogOutput,
    loadSymbols,
    tooltipDocsIgnorePageExtensionIds,
    tooltipDocsIgnorePageIds,
    tooltipDocsFilePath,
    ignoreTransUnitInGeneratedDocumentation,
    generateTooltipDocsWithExternalDocs,
    generateDeprecatedFeaturesPageWithExternalDocs,
    removeObjectNamePrefixFromDocs,
    docsIgnorePaths,
    docsRootPath,
    createTocFilesForDocs,
    includeTablesAndFieldsInDocs,
    createInfoFileForDocs,
    createUidForDocs,
    xliffCSVExportPath,
    xliffCSVImportTargetState
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
        this.settingCollection[Setting.configSignToolPath] = this.config.get('SignToolPath') + '';
        this.settingCollection[Setting.configSigningCertificateName] = this.config.get('SigningCertificateName') + '';
        this.settingCollection[Setting.configSigningTimeStampServer] = this.config.get('SigningTimeStampServer') + '';
        this.settingCollection[Setting.configPowerShellWithDocker] = this.config.get('PowerShellWithDocker');
        this.settingCollection[Setting.showXlfHighlights] = this.config.get('ShowXlfHighlights');
        this.settingCollection[Setting.xlfHighlightsDecoration] = this.config.get('XlfHighlightsDecoration');
        this.settingCollection[Setting.useExternalTranslationTool] = this.config.get('UseExternalTranslationTool');
        this.settingCollection[Setting.detectInvalidTargets] = this.config.get('DetectInvalidTargets');
        this.settingCollection[Setting.useDTS] = this.config.get('UseDTS');
        this.settingCollection[Setting.dtsProjectId] = this.config.get('DTS ProjectId');
        this.settingCollection[Setting.setDtsExactMatchToState] = this.config.get('Set DTS Exact Match To State');
        this.settingCollection[Setting.replaceSelfClosingXlfTags] = this.config.get('ReplaceSelfClosingXlfTags');
        this.settingCollection[Setting.searchOnlyXlfFiles] = this.config.get('SearchOnlyXlfFiles');
        this.settingCollection[Setting.matchTranslation] = this.config.get('MatchTranslation');
        this.settingCollection[Setting.matchBaseAppTranslation] = this.config.get('MatchBaseAppTranslation');
        this.settingCollection[Setting.translationSuggestionPaths] = this.config.get('TranslationSuggestionPaths');
        this.settingCollection[Setting.consoleLogOutput] = this.config.get('ConsoleLogOutput');
        this.settingCollection[Setting.loadSymbols] = this.config.get('LoadSymbols');
        this.settingCollection[Setting.tooltipDocsIgnorePageExtensionIds] = this.config.get('TooltipDocsIgnorePageExtensionIds');
        this.settingCollection[Setting.tooltipDocsIgnorePageIds] = this.config.get('TooltipDocsIgnorePageIds');
        this.settingCollection[Setting.tooltipDocsFilePath] = this.config.get('TooltipDocsFilePath');
        this.settingCollection[Setting.generateTooltipDocsWithExternalDocs] = this.config.get('GenerateTooltipDocsWithExternalDocs');
        this.settingCollection[Setting.generateDeprecatedFeaturesPageWithExternalDocs] = this.config.get('GenerateDeprecatedFeaturesPageWithExternalDocs');
        this.settingCollection[Setting.ignoreTransUnitInGeneratedDocumentation] = this.config.get('IgnoreTransUnitInGeneratedDocumentation');
        this.settingCollection[Setting.docsRootPath] = this.config.get('DocsRootPath');
        this.settingCollection[Setting.removeObjectNamePrefixFromDocs] = this.config.get('RemoveObjectNamePrefixFromDocs');
        this.settingCollection[Setting.docsIgnorePaths] = this.config.get('DocsIgnorePaths');
        this.settingCollection[Setting.createTocFilesForDocs] = this.config.get('CreateTocFilesForDocs');
        this.settingCollection[Setting.includeTablesAndFieldsInDocs] = this.config.get('IncludeTablesAndFieldsInDocs');
        this.settingCollection[Setting.createInfoFileForDocs] = this.config.get('CreateInfoFileForDocs');
        this.settingCollection[Setting.createUidForDocs] = this.config.get('CreateUidForDocs');
        this.settingCollection[Setting.xliffCSVExportPath] = this.config.get('Xliff CSV Export Path');
        this.settingCollection[Setting.xliffCSVImportTargetState] = this.config.get('Xliff CSV Import Target State');
    }

    private static _getAppSettings(resourceUri?: vscode.Uri): void {
        let appSettingsFolder: string;
        appSettingsFolder = WorkspaceFiles.getWorkspaceFolder(resourceUri).uri.fsPath;

        let appSettings = require(join(appSettingsFolder, "app.json"));
        this.settingCollection[Setting.appId] = appSettings.id;
        this.settingCollection[Setting.appName] = appSettings.name;
        this.settingCollection[Setting.appVersion] = appSettings.version;
        this.settingCollection[Setting.appPublisher] = appSettings.publisher;
    }

    private static _getLaunchSettings(resourceUri?: vscode.Uri): void {
        let vscodeSettingsFolder: string = join(WorkspaceFiles.getWorkspaceFolder(resourceUri).uri.fsPath, '.vscode');
        let launchSettings = require(join(vscodeSettingsFolder, "launch.json"));
        this.settingCollection[Setting.launchServer] = launchSettings.configurations[0].server;
        this.settingCollection[Setting.launchServerInstance] = launchSettings.configurations[0].serverInstance;
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