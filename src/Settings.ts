import * as vscode from 'vscode';
import { join } from 'path';
import * as WorkspaceFiles from './WorkspaceFunctions';

export enum Setting {
    AppId,
    AppName,
    AppVersion,
    AppIdRangeFrom,
    AppIdRangeTo,
    AppPublisher,
    LaunchServer,
    LaunchServerInstance,
    ConfigSigningCertificateName,
    ConfigSignToolPath,
    ConfigPowerShellWithDocker
}

export class Settings {


    // static readonly AppName = 'name';
    // static readonly AppVersion = 'AppVersion';
    // static readonly AppIdRangeFrom = 'AppIdRangeFrom';
    // static readonly AppIdRangeTo = 'AppIdRangeTo';


    private static config: vscode.WorkspaceConfiguration;
    // private static launchconfig: vscode.WorkspaceConfiguration;

    private static SettingCollection: { [name: number]: any } = {};

    private static WORKSPACEKEY: string = 'NAB';

    // private static getSetting(key: string) {
    //     if (!this.config.has(key)) {
    //         return null;
    //     } else {
    //         return this.config.get(key);
    //     }
    // }

    private static getConfigSettings(ResourceUri?: vscode.Uri) {
        this.config = vscode.workspace.getConfiguration(this.WORKSPACEKEY, WorkspaceFiles.GetWorkspaceFolder(ResourceUri).uri);

        this.SettingCollection[Setting.ConfigSignToolPath] = this.config.get('SignToolPath') + '';
        this.SettingCollection[Setting.ConfigSigningCertificateName] = this.config.get('SigningCertificateName') + '';
        this.SettingCollection[Setting.ConfigPowerShellWithDocker] = this.config.get('PowerShellWithDocker') ? this.config.get('PowerShellWithDocker') : false;

    }

    private static getAppSettings(ResourceUri?: vscode.Uri) {
        let appSettingsFolder: string;
        appSettingsFolder = WorkspaceFiles.GetWorkspaceFolder(ResourceUri).uri.fsPath;

        let appSettings = require(join(appSettingsFolder, "app.json"));
        this.SettingCollection[Setting.AppId] = appSettings.id;
        this.SettingCollection[Setting.AppName] = appSettings.name;
        this.SettingCollection[Setting.AppVersion] = appSettings.version;
        this.SettingCollection[Setting.AppPublisher] = appSettings.publisher;
        this.SettingCollection[Setting.AppIdRangeTo] = appSettings.idRange.to;
        this.SettingCollection[Setting.AppIdRangeFrom] = appSettings.idRange.from;

    }

    private static getLaunchSettings(ResourceUri?: vscode.Uri) {
        let vscodeSettingsFolder: string = join(WorkspaceFiles.GetWorkspaceFolder(ResourceUri).uri.fsPath, '.vscode');

        let launchSettings = require(join(vscodeSettingsFolder, "launch.json"));
        this.SettingCollection[Setting.LaunchServer] = launchSettings.configurations[0].server;
        this.SettingCollection[Setting.LaunchServerInstance] = launchSettings.configurations[0].serverInstance;
    }

    public static GetAllSettings(ResourceUri: vscode.Uri) {
        this.getConfigSettings(ResourceUri);
        this.getAppSettings(ResourceUri);
        this.getLaunchSettings(ResourceUri);

        return this.SettingCollection;
    }

    public static GetAppSettings(ResourceUri?: vscode.Uri) {
        this.getAppSettings(ResourceUri);

        return this.SettingCollection;
    }

    public static GetLaunchSettings(ResourceUri?: vscode.Uri) {
        this.getLaunchSettings(ResourceUri);

        return this.SettingCollection;
    }

    public static GetConfigSettings(ResourceUri?: vscode.Uri) {
        this.getConfigSettings(ResourceUri);

        return this.SettingCollection;
    }

    public static UpdateSetting(key: string, newvalue: any) {
        this.config.update(key, newvalue);
    }

    // private static joinPaths(paths: string[]) {
    //     for (let i = 0; i < paths.length; i++) {
    //         if (!paths[i] || paths[i] === "") {
    //             return null;
    //         }
    //     }
    //     return join.apply(null, paths);
    // }
}