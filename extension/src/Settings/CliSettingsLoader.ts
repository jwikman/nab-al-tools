import { join } from "path";
import * as path from "path";
import * as fs from "fs";
import {
  AppManifest,
  LaunchSettings,
  Settings,
  IAppManifest,
  ILaunchFile,
  IAppSourceCopSettings,
  IExtensionPackage,
} from "./Settings";
import { WorkspaceFile } from "./WorkspaceFile";
import { settingsMap } from "./SettingsMap";
import { loadJson } from "../FileFunctions";
import { ApplicationManifestError } from "../Error";

export function getSettings(
  workspaceFolderPath: string,
  workspaceFilePath: string | undefined
): Settings {
  const settings = new Settings(workspaceFolderPath); // Loads all default values

  if (workspaceFilePath !== undefined) {
    const workspaceFileJson = loadJson(workspaceFilePath) as WorkspaceFile;
    settingsMap.forEach((propertyName, settingName) => {
      const configuredValue = workspaceFileJson.settings[settingName];
      if (configuredValue !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (settings as any)[propertyName] = configuredValue;
      }
    });
  }

  // if .vscode/settings.json exists -> use settings to override workspace settings
  const vscodeSettingsFolder: string = getVscodeFolderPath(workspaceFolderPath);
  const filePath = join(vscodeSettingsFolder, "settings.json");
  if (fs.existsSync(filePath)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const settingsFileJson = loadJson(filePath) as Record<string, any>;
    settingsMap.forEach((propertyName, settingName) => {
      const configuredValue = settingsFileJson[settingName];
      if (configuredValue !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (settings as any)[propertyName] = configuredValue;
      }
    });
  }

  return settings;
}

export function getLaunchSettings(workspaceFolderPath: string): LaunchSettings {
  const vscodeSettingsFolder: string = getVscodeFolderPath(workspaceFolderPath);
  const filePath = join(vscodeSettingsFolder, "launch.json");

  const launchSettingsJson = loadJson(filePath) as ILaunchFile;

  const launchSettings = new LaunchSettings(
    launchSettingsJson.configurations[0].server,
    launchSettingsJson.configurations[0].serverInstance
  );

  return launchSettings;
}

export function getAppSourceCopSettings(
  workspaceFolderPath: string
): IAppSourceCopSettings {
  const filePath = join(workspaceFolderPath, "AppSourceCop.json");

  let appSourceCopSettings = {} as IAppSourceCopSettings;
  if (fs.existsSync(filePath)) {
    appSourceCopSettings = loadJson(filePath) as IAppSourceCopSettings;
  }
  if (!appSourceCopSettings.mandatoryAffixes) {
    appSourceCopSettings.mandatoryAffixes = [];
  }

  return appSourceCopSettings;
}

export function getAppManifest(workspaceFolderPath: string): AppManifest {
  const filePath = join(workspaceFolderPath, "app.json");
  try {
    const appSettings = loadJson(filePath) as IAppManifest;

    const appManifest = new AppManifest(workspaceFolderPath, appSettings);

    return appManifest;
  } catch (error) {
    throw new ApplicationManifestError(
      `The app.json file "${filePath}" is either missing or invalid.`
    );
  }
}

function getVscodeFolderPath(workspaceFolderPath: string): string {
  return join(workspaceFolderPath, ".vscode");
}

export function getExtensionPackage(): IExtensionPackage {
  let filePath = path.resolve(__dirname, "..", "package.json");
  if (!fs.existsSync(filePath)) {
    // Debugging, with another file structure because of not using webpack
    filePath = path.resolve(__dirname, "..", "..", "package.json");
  }

  const extensionPackage = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  ) as IExtensionPackage;
  return extensionPackage;
}
