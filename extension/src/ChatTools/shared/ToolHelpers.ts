import * as path from "path";
import * as fs from "graceful-fs";
import { AppManifest } from "../../Settings/Settings";
import * as CliSettingsLoader from "../../Settings/CliSettingsLoader";
import { Settings } from "../../Settings/Settings";
import { replaceIllegalFilenameCharacters } from "../../FileFunctions";

/**
 * Extract app folder path from XLF file path.
 * XLF files are always in the Translations folder under the app folder.
 */
export function getAppFolderFromXlfPath(xlfFilePath: string): string {
  const xlfDir = path.dirname(xlfFilePath);
  const translationsDir = path.basename(xlfDir);

  if (translationsDir.toLowerCase() !== "translations") {
    throw new Error(
      `XLF file must be in a 'Translations' folder. Found: ${xlfDir}`
    );
  }

  return path.dirname(xlfDir);
}

/**
 * Get settings for an XLF file using CLI settings loader
 */
export function getSettingsForXlf(
  xlfFilePath: string,
  workspaceFilePath?: string
): Settings {
  const appFolderPath = getAppFolderFromXlfPath(xlfFilePath);
  return CliSettingsLoader.getSettings(appFolderPath, workspaceFilePath);
}

/**
 * Get app manifest from app folder path
 */
export function getAppManifestFromPath(appFolderPath: string): AppManifest {
  return CliSettingsLoader.getAppManifest(appFolderPath);
}

export function getAppManifestFromXlfPath(xlfFilePath: string): AppManifest {
  const appFolderPath = getAppFolderFromXlfPath(xlfFilePath);
  return getAppManifestFromPath(appFolderPath);
}

/**
 * Resolved app context: the manifest, settings and generated (.g.xlf) file path
 * for a single AL app, all loaded fresh from disk.
 */
export interface IResolvedAppContext {
  appFolderPath: string;
  appManifest: AppManifest;
  settings: Settings;
  gXlfFilePath: string;
}

/**
 * Compute the path to an app's generated (.g.xlf) XLF file and verify it exists.
 */
export function getGeneratedXlfFilePath(
  appFolderPath: string,
  appManifest: AppManifest
): string {
  const gXlfFilename = `${replaceIllegalFilenameCharacters(
    appManifest.name,
    ""
  )}.g.xlf`;
  const gXlfFilePath = path.join(appFolderPath, "Translations", gXlfFilename);

  if (!fs.existsSync(gXlfFilePath)) {
    throw new Error(
      `Generated XLF file not found: ${gXlfFilePath}. The app needs to be built to generate the .g.xlf file.`
    );
  }

  return gXlfFilePath;
}

/**
 * Resolve app manifest, settings and generated XLF path fresh from an app folder path.
 * Always loads from disk, independent of any previously resolved app - safe to call for
 * multiple apps in the same process (e.g. when several agents share one MCP server).
 */
export function resolveAppContextFromFolder(
  appFolderPath: string,
  workspaceFilePath?: string
): IResolvedAppContext {
  const appManifest = getAppManifestFromPath(appFolderPath);
  const settings = CliSettingsLoader.getSettings(
    appFolderPath,
    workspaceFilePath
  );
  const gXlfFilePath = getGeneratedXlfFilePath(appFolderPath, appManifest);

  return { appFolderPath, appManifest, settings, gXlfFilePath };
}

/**
 * Resolve app manifest, settings and generated XLF path fresh from a target XLF file path.
 */
export function resolveAppContextFromXlfPath(
  xlfFilePath: string,
  workspaceFilePath?: string
): IResolvedAppContext {
  const appFolderPath = getAppFolderFromXlfPath(xlfFilePath);
  return resolveAppContextFromFolder(appFolderPath, workspaceFilePath);
}
