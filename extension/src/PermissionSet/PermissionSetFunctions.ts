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
import {
  Permission,
  XmlPermissionSet,
  XmlPermissionSets,
} from "./XmlPermissionSet";
import * as SettingsLoader from "../Settings/SettingsLoader";
import { logger } from "../Logging/LogHelper";

const MAX_PERMISSION_SET_NAME_LENGTH = 20;
const MAX_PERMISSION_SET_CAPTION_LENGTH = 30;

export async function getXmlPermissionSets(
  permissionSetFilePaths: string[],
  prefix: string
): Promise<XmlPermissionSet[]> {
  const xmlPermissionSets: XmlPermissionSet[] = [];
  for (const filePath of permissionSetFilePaths) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    if (!fileContent.match(/<PermissionSets/im)) {
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
  xmlPermissionSets: XmlPermissionSet[],
  workspaceFolderPath: string
): Promise<void> {
  const settings = SettingsLoader.getSettingsForFolder(workspaceFolderPath);
  const manifest = SettingsLoader.getAppManifestForFolder(workspaceFolderPath);
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
            const results = await convertToPermissionSet(
              manifest,
              alObjects,
              prefix,
              xmlPermissionSets
            );
            const upgradeFilePath = createUpgradeCodeunit(
              xmlPermissionSets,
              prefix,
              manifest,
              alObjects,
              results.folderPath
            );
            results.filePaths.push(upgradeFilePath);
            for (const filePath of results.filePaths) {
              const openedTextDoc = await vscode.workspace.openTextDocument(
                filePath
              );

              await vscode.window.showTextDocument(openedTextDoc, {
                preserveFocus: filePath !== upgradeFilePath,
                preview: false,
              });
            }
            vscode.window.showInformationMessage(
              `PermissionSet objects created, old XML PermissionSets deleted and an upgrade codeunit created.`
            );
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

async function convertToPermissionSet(
  manifest: AppManifest,
  alObjects: ALObject[],
  prefix: string,
  xmlPermissionSets: XmlPermissionSet[]
): Promise<{ folderPath: string; filePaths: string[] }> {
  let lastUsedId = 0;
  let lastFolderPath = "";
  const createdFilePaths: string[] = [];
  for (const xmlPermissionSet of xmlPermissionSets) {
    const folderPath = path.parse(xmlPermissionSet.filePath).dir;
    lastFolderPath = folderPath;
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
        permission.objectType,
        getObjectName(alObjects, permission.objectType, permission.objectID),
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
        .replace(/[ .-]/i, "")}.PermissionSet.al`
    );
    if (fs.existsSync(newFilePath)) {
      throw new Error(`File "${newFilePath}" already exists.`);
    }
    fs.writeFileSync(newFilePath, newPermissionSet.toString(), {
      encoding: "utf8",
    });
    createdFilePaths.push(newFilePath);
  }
  for (const xmlPermissionSet of xmlPermissionSets) {
    if (fs.existsSync(xmlPermissionSet.filePath)) {
      fs.unlinkSync(xmlPermissionSet.filePath);
    }
  }
  return { folderPath: lastFolderPath, filePaths: createdFilePaths };
}

export function validateData(xmlPermissionSets: XmlPermissionSet[]): void {
  // PermissionSet names not empty
  let nameTest = xmlPermissionSets.find((x) => x.suggestedNewName === "");
  if (nameTest) {
    throw new Error(
      `The PermissionSet "${nameTest.roleID}" has an empty name.`
    );
  }

  // PermissionSet names max length
  nameTest = xmlPermissionSets.find(
    (x) => x.suggestedNewName.length > MAX_PERMISSION_SET_NAME_LENGTH
  );
  if (nameTest) {
    throw new Error(
      `The PermissionSet name "${nameTest.suggestedNewName}" has more characters (${nameTest.suggestedNewName.length}) than the allowed length of ${MAX_PERMISSION_SET_NAME_LENGTH}.`
    );
  }

  // The PermissionSet names must be unique
  for (const xmlPermissionSet of xmlPermissionSets) {
    nameTest = xmlPermissionSets.find(
      (x) =>
        x.roleID !== xmlPermissionSet.roleID &&
        x.suggestedNewName === xmlPermissionSet.suggestedNewName
    );
    if (nameTest) {
      throw new Error(
        `The PermissionSet name "${nameTest.suggestedNewName}" is used more than once.`
      );
    }
  }

  // PermissionSet names not containing illegal characters
  nameTest = xmlPermissionSets.find((x) =>
    x.suggestedNewName.match(/[\n\r\t"]+/)
  );
  if (nameTest) {
    throw new Error(
      `The PermissionSet name "${nameTest.suggestedNewName}" has some illegal characters.`
    );
  }

  // PermissionSet captions not empty
  let captionTest = xmlPermissionSets.find((x) => x.roleName === "");
  if (captionTest) {
    throw new Error(
      `The PermissionSet "${captionTest.roleID}" has an empty caption.`
    );
  }
  // PermissionSet captions not too long
  captionTest = xmlPermissionSets.find(
    (x) => x.roleName.length > MAX_PERMISSION_SET_CAPTION_LENGTH
  );
  if (captionTest) {
    throw new Error(
      `The PermissionSet name "${captionTest.roleName}" has more characters (${captionTest.roleName.length}) than the allowed length of ${MAX_PERMISSION_SET_CAPTION_LENGTH}.`
    );
  }
  // PermissionSet names not containing illegal characters
  captionTest = xmlPermissionSets.find((x) => x.roleName.match(/[\n\r\t']+/));
  if (captionTest) {
    throw new Error(
      `The PermissionSet caption "${captionTest.roleName}" has some illegal characters.`
    );
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

function getPermissions(
  readPermission: Permission,
  insertPermission: Permission,
  modifyPermission: Permission,
  deletePermission: Permission,
  executePermission: Permission
): string {
  return `${getPermissionCasing("r", readPermission)}${getPermissionCasing(
    "i",
    insertPermission
  )}${getPermissionCasing("m", modifyPermission)}${getPermissionCasing(
    "d",
    deletePermission
  )}${getPermissionCasing("x", executePermission)}`;
}

function getPermissionCasing(
  character: string,
  permission: Permission
): string {
  switch (permission) {
    case Permission.yes:
      return character.toUpperCase();
    case Permission.indirect:
      return character.toLowerCase();
    default:
      return "";
  }
}
function createUpgradeCodeunit(
  xmlPermissionSets: XmlPermissionSet[],
  prefix: string,
  manifest: AppManifest,
  alObjects: ALObject[],
  folderPath: string
): string {
  const objectId = getFirstAvailableObjectId(
    alObjects,
    manifest,
    ALObjectType.codeunit,
    0
  );
  const objectName = `${prefix}PermissionSet Upgrade`;
  const filePath = path.join(folderPath, "PermissionSetUpgrade.Codeunit.al");
  const code = `codeunit ${objectId} "${objectName}"
{
    Access = Internal;
    Subtype = Upgrade;

    trigger OnUpgradePerDatabase()
    begin
        if GetDataVersion() <= Version.Create('${manifest.version}') then
            UpgradePermissionSets();
    end;

    local procedure UpgradePermissionSets()
    begin
        ${xmlPermissionSets
          .map(
            (x) =>
              `UpgradePermissionSet('${x.roleID}', '${x.suggestedNewName}');`
          )
          .join("\r\n        ")}
    end;

    local procedure UpgradePermissionSet(OldPermissionSetCode: Code[20]; NewPermissionSetCode: Code[20])
    var
        NewAccessControl: Record "Access Control";
        OldAccessControl: Record "Access Control";
        TempAccessControl: Record "Access Control" temporary;
        NewUserGroupPermissionSet: Record "User Group Permission Set";
        OldUserGroupPermissionSet: Record "User Group Permission Set";
        TempUserGroupPermissionSet: Record "User Group Permission Set" temporary;
        AppId: Guid;
        CurrentAppInfo: ModuleInfo;
    begin
        NavApp.GetCurrentModuleInfo(CurrentAppInfo);
        AppId := CurrentAppInfo.Id();

        OldUserGroupPermissionSet.SetRange("App ID", AppId);
        OldUserGroupPermissionSet.SetRange(Scope, OldUserGroupPermissionSet.Scope::Tenant);
        OldUserGroupPermissionSet.SetRange("Role ID", OldPermissionSetCode);
        if OldUserGroupPermissionSet.FindSet() then begin
            repeat
                TempUserGroupPermissionSet := OldUserGroupPermissionSet;
                TempUserGroupPermissionSet.Insert();
            until OldUserGroupPermissionSet.Next() = 0;
            TempUserGroupPermissionSet.FindSet();
            repeat
                OldUserGroupPermissionSet := TempUserGroupPermissionSet;
                OldUserGroupPermissionSet.Find();
                if NewUserGroupPermissionSet.Get(OldUserGroupPermissionSet."User Group Code", NewPermissionSetCode, NewUserGroupPermissionSet.Scope::System, AppId) then
                    OldUserGroupPermissionSet.Delete()
                else
                    OldUserGroupPermissionSet.Rename(OldUserGroupPermissionSet."User Group Code", NewPermissionSetCode, NewUserGroupPermissionSet.Scope::System, AppId);
            until TempUserGroupPermissionSet.Next() = 0;
        end;

        OldAccessControl.SetRange("App ID", AppId);
        OldAccessControl.SetRange(Scope, OldAccessControl.Scope::Tenant);
        OldAccessControl.SetRange("Role ID", OldPermissionSetCode);
        if OldAccessControl.FindSet() then begin
            repeat
                TempAccessControl := OldAccessControl;
                TempAccessControl.Insert();
            until OldAccessControl.Next() = 0;
            TempAccessControl.FindSet();
            repeat
                OldAccessControl := TempAccessControl;
                OldAccessControl.Find();
                if NewAccessControl.Get(OldAccessControl."User Security ID", NewPermissionSetCode, OldAccessControl."Company Name", NewAccessControl.Scope::System, AppId) then
                    OldAccessControl.Delete()
                else
                    OldAccessControl.Rename(OldAccessControl."User Security ID", NewPermissionSetCode, OldAccessControl."Company Name", NewAccessControl.Scope::System, AppId);
            until TempAccessControl.Next() = 0;
        end;
    end;

    local procedure GetDataVersion(): Version
    var
        ModInfo: ModuleInfo;
    begin
        NavApp.GetCurrentModuleInfo(ModInfo);
        exit(ModInfo.DataVersion());
    end;
}`;
  fs.writeFileSync(filePath, code, { encoding: "utf8" });
  return filePath;
}
