import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as WorkspaceFunctions from "../WorkspaceFunctions";
import { AppManifest } from "../Settings/Settings";
import {
  ALObject,
  ALPermission,
  ALPermissionSet,
} from "../ALObject/ALElementTypes";
import { ALControlType, ALObjectType } from "../ALObject/Enums";
import { XmlPermissionSet, XmlPermissionSets } from "./XmlPermissionSet";
import { alObjectTypeNumberMap } from "../ALObject/Maps";
import * as SettingsLoader from "../Settings/SettingsLoader";
import { logger } from "../Logging/LogHelper";

export async function getXmlPermissionSets(
  permissionSetFilePaths: string[],
  prefix: string
): Promise<XmlPermissionSet[]> {
  const xmlPermissionSets: XmlPermissionSet[] = [];
  for (const filePath of permissionSetFilePaths) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    if (!fileContent.match(/<PermissionSets>/im)) {
      throw new Error(
        "The current document is not a valid PermissionSet xml file."
      );
    }

    const xmlPermissionSetsObj = new XmlPermissionSets(
      filePath,
      fileContent,
      prefix
    );
    for (const xmlPermissionSet of xmlPermissionSetsObj.permissionSets) {
      xmlPermissionSets.push(xmlPermissionSet);
    }
  }
  return xmlPermissionSets;
}

export async function startConversion(
  prefix: string,
  xmlPermissionSets: XmlPermissionSet[]
): Promise<void> {
  const settings = SettingsLoader.getSettings();
  const manifest = SettingsLoader.getAppManifest();
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Converting PermissionSets...",
    },
    () => {
      return new Promise<void>((resolve, reject) => {
        setTimeout(async () => {
          try {
            const alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
              settings,
              manifest,
              false,
              false,
              true
            );
            await convertToPermissionSet(
              manifest,
              alObjects,
              prefix,
              xmlPermissionSets
            );
            vscode.window.showInformationMessage(
              `PermissionSet objects created and old XML PermissionSets deleted.` // TODO: Upgrade code
            );
            // TODO: Loop createdPermissionSets and create upgrade codeunit with mapping from oldPermissionSets
            logger.log("Done: convertToPermissionSet");
            resolve();
          } catch (error) {
            logger.log("Convert to PermissionSet object failed: ", error);
            reject(error);
          }
        }, 10);
      });
    }
  );
}

export async function convertToPermissionSet(
  manifest: AppManifest,
  alObjects: ALObject[],
  prefix: string,
  xmlPermissionSets: XmlPermissionSet[]
): Promise<void> {
  let lastUsedId = 0;
  for (const xmlPermissionSet of xmlPermissionSets) {
    const folderPath = path.parse(xmlPermissionSet.filePath).dir;

    const newPermissionSet: ALPermissionSet = new ALPermissionSet(
      xmlPermissionSet.suggestedNewName,
      xmlPermissionSet.roleName,
      getFirstAvailableObjectId(
        alObjects,
        manifest,
        ALObjectType.permissionSet,
        lastUsedId
      )
    );
    lastUsedId = newPermissionSet.objectId;
    for (const permission of xmlPermissionSet.permissions) {
      const newPermission: ALPermission = new ALPermission(
        getType(permission.objectType),
        getObjectName(
          alObjects,
          getType(permission.objectType),
          permission.objectID
        ),
        getPermissions(
          permission.readPermission,
          permission.insertPermission,
          permission.modifyPermission,
          permission.deletePermission,
          permission.executePermission
        )
      );
      newPermissionSet.permissions.push(newPermission);
    }
    const newFilePath = path.join(
      folderPath,
      `${newPermissionSet.name
        .substr(prefix.length)
        .replace(/[ .-]/i, "")}.permissionset.al`
    );
    if (fs.existsSync(newFilePath)) {
      throw new Error(`File "${newFilePath}" already exists.`);
    }
    fs.writeFileSync(newFilePath, newPermissionSet.toString(), {
      encoding: "utf8",
    });
    if (fs.existsSync(xmlPermissionSet.filePath)) {
      fs.unlinkSync(xmlPermissionSet.filePath);
    }
  }
}

function getObjectName(
  alObjects: ALObject[],
  objectType: ALObjectType,
  objectID: number
): string {
  if (objectID === 0) {
    return "*";
  }
  const searchObjectType: ALObjectType =
    objectType === ALObjectType.tableData ? ALObjectType.table : objectType;
  const obj = alObjects.find(
    (x) =>
      x.type === ALControlType.object &&
      x.objectType === searchObjectType &&
      x.objectId === objectID
  );
  if (!obj) {
    throw new Error(`${searchObjectType} ${objectID} not found.`);
  }
  return obj.objectName;
}
function getFirstAvailableObjectId(
  alObjects: ALObject[],
  manifest: AppManifest,
  objectType: ALObjectType,
  lastUsedId: number
): number {
  const idRanges = manifest.idRanges.sort((a, b) => (a.from < b.from ? -1 : 1));
  for (const idRange of idRanges) {
    const startNumber =
      lastUsedId < idRange.from ? idRange.from : lastUsedId + 1;
    for (let i = startNumber; i < idRange.to; i++) {
      const obj = alObjects.find(
        (x) =>
          x.type === ALControlType.object &&
          x.objectType === objectType &&
          x.objectId === i
      );
      if (!obj) {
        return i;
      }
    }
  }

  return 50000; // Fallback if no free Id's found, let the compiler complain.
}

function getType(objectTypeText: string): ALObjectType {
  const objectTypeNumber: number = Number.parseInt(objectTypeText);
  const objectType = alObjectTypeNumberMap.get(objectTypeNumber);
  if (!objectType) {
    throw new Error(`No object type found for "${objectTypeText}"`);
  }
  return objectType;
}
function getPermissions(
  readPermission: string,
  insertPermission: string,
  modifyPermission: string,
  deletePermission: string,
  executePermission: string
): string {
  return `${getPermissionCasing("r", readPermission)}${getPermissionCasing(
    "i",
    insertPermission
  )}${getPermissionCasing("m", modifyPermission)}${getPermissionCasing(
    "d",
    deletePermission
  )}${getPermissionCasing("x", executePermission)}`;
}

function getPermissionCasing(character: string, permission: string): string {
  switch (permission) {
    case "1":
      return character.toUpperCase();
    case "2":
      return character.toLowerCase();
    default:
      return "";
  }
}
