import * as fs from "fs";
import * as path from "path";
import { AppManifest } from "../Settings/Settings";
import {
  ALObject,
  ALPermission,
  ALPermissionSet,
} from "../ALObject/ALElementTypes";
import { ALControlType, ALObjectType } from "../ALObject/Enums";
import { XmlPermissionSet, XmlPermissionSets } from "./XmlPermissionSet";
import { alObjectTypeNumberMap } from "../ALObject/Maps";

export async function convertToPermissionSet(
  manifest: AppManifest,
  alObjects: ALObject[],
  prefix: string,
  permissionSetFilePaths: string[]
): Promise<void> {
  const maxPermissionSetNameLength = 20;
  let lastUsedId = 0;
  const createdPermissionSets: ALPermissionSet[] = [];
  const oldPermissionSets: XmlPermissionSet[] = [];
  for (const filePath of permissionSetFilePaths) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    if (!fileContent.match(/<PermissionSets>/im)) {
      throw new Error(
        "The current document is not a valid PermissionSet xml file."
      );
    }
    const folderPath = path.parse(filePath).dir;

    const xmlPermissionSets = new XmlPermissionSets(fileContent);

    for (const xmlPermissionSet of xmlPermissionSets.permissionSets) {
      let permissionSetName = (prefix + xmlPermissionSet.roleID).substr(
        0,
        maxPermissionSetNameLength
      );
      let i = 2;
      while (
        createdPermissionSets.find((x) => x.objectName === permissionSetName)
      ) {
        permissionSetName =
          permissionSetName.substr(
            0,
            permissionSetName.length - i.toString().length
          ) + i.toString();
        i++;
      }

      const newPermissionSet: ALPermissionSet = new ALPermissionSet(
        permissionSetName,
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
      createdPermissionSets.push(newPermissionSet);
      oldPermissionSets.push(xmlPermissionSet);
    }
    fs.unlinkSync(filePath);
  }
  // TODO: Loop createdPermissionSets and create upgrade codeunit with mapping from oldPermissionSets
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
