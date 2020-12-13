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
    ConfigSignToolPath,
    ConfigPowerShellWithDocker,
    UseExternalTranslationTool,
    ReplaceSelfClosingXlfTags,
    SearchOnlyXlfFiles,
    MatchTranslation,
    MatchBaseAppTranslation,
    ConsoleLogOutput,
    TooltipDocsIgnorePageExtensionIds,
    TooltipDocsIgnorePageIds
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
        this.SettingCollection[Setting.ConfigPowerShellWithDocker] = this.config.get('PowerShellWithDocker') ? this.config.get('PowerShellWithDocker') : false;
        this.SettingCollection[Setting.UseExternalTranslationTool] = this.config.get('UseExternalTranslationTool') ? this.config.get('UseExternalTranslationTool') : false;
        this.SettingCollection[Setting.ReplaceSelfClosingXlfTags] = this.config.get('ReplaceSelfClosingXlfTags');
        this.SettingCollection[Setting.SearchOnlyXlfFiles] = this.config.get('SearchOnlyXlfFiles');
        this.SettingCollection[Setting.MatchTranslation] = this.config.get('MatchTranslation');
        this.SettingCollection[Setting.MatchBaseAppTranslation] = this.config.get('MatchBaseAppTranslation');
        this.SettingCollection[Setting.ConsoleLogOutput] = this.config.get('ConsoleLogOutput');
        this.SettingCollection[Setting.TooltipDocsIgnorePageExtensionIds] = this.config.get('TooltipDocsIgnorePageExtensionIds');
        this.SettingCollection[Setting.TooltipDocsIgnorePageIds] = this.config.get('TooltipDocsIgnorePageIds');
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