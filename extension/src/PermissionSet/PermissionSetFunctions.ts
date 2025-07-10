import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as WorkspaceFunctions from "../WorkspaceFunctions";
import { AppManifest, Settings } from "../Settings/Settings";
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
            await runConversion(settings, manifest, prefix, xmlPermissionSets);
            vscode.window.showInformationMessage(
              `PermissionSet objects created, old XML PermissionSets deleted and an upgrade codeunit created.`
            );
            logger.log("Done: convertToPermissionSet");
            resolve();
          } catch (error) {
            logger.log(
              "Convert to PermissionSet object failed: ",
              error as string
            );
            reject(error);
          }
        }, 10);
      });
    }
  );
}

export async function runConversion(
  settings: Settings,
  manifest: AppManifest,
  prefix: string,
  xmlPermissionSets: XmlPermissionSet[]
): Promise<void> {
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
    const openedTextDoc = await vscode.workspace.openTextDocument(filePath);

    await vscode.window.showTextDocument(openedTextDoc, {
      preserveFocus: filePath !== upgradeFilePath,
      preview: false,
    });
  }
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

export function getObjectName(
  alObjects: ALObject[],
  objectType: ALObjectType,
  objectID: number
): string {
  if (objectID === 0) {
    return "*";
  }
  if (objectType === ALObjectType.system) {
    const permission = systemPermissionsMap.get(objectID);
    if (permission) {
      return permission;
    }
    throw new Error(
      `System permission ${objectID} is not supported. Please register an issue on https://github.com/jwikman/nab-al-tools/.`
    );
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

const systemPermissionsMap = new Map<number, string>([
  [1310, "File, Import, Binary"],
  [1320, "File, Import, Text"],
  [1330, "File, Export, Binary"],
  [1340, "File, Export, Text"],
  [1350, "Run table"],
  [1530, "File, Database, Test"],
  [1540, "Allow Action Export Report Dat"],
  [1550, "File, Database, Delete"],
  [1570, "File, Database, Information"],
  [1580, "File, Database, Options"],
  [1610, "Create a new company"],
  [1630, "Rename an existing company"],
  [1640, "Delete a company"],
  [1650, "Force Unlock"],
  [2510, "Edit, Find"],
  [2520, "Edit, Replace"],
  [3220, "View, Table Filter"],
  [3230, "View, FlowFilter"],
  [3410, "View, Sort"],
  [3510, "View, Design"],
  [5210, "Tools, Object Designer"],
  [5310, "Tools, Debugger"],
  [5315, "Tools, Code Coverage"],
  [5320, "Tools, Client Monitor"],
  [5330, "Tools, Zoom"],
  [5410, "Export Data to Data File"],
  [5420, "Import Data from Data File"],
  [5510, "Tools, Clear Old Versions"],
  [5620, "Tools, Renumber"],
  [5630, "Tools, Cross Reference"],
  [5710, "Tools, Translate"],
  [5810, "Tools, Security, Roles"],
  [5820, "Tools, Security, DB Logins"],
  [5821, "Tools, Security, Win. Logins"],
  [5830, "Tools, Security, Password"],
  [5910, "Tools, License Information"],
  [6110, "Allow Action Export To Excel"],
  [6300, "Per-database License"],
  [9010, "Design, Table, Basic"],
  [9015, "Design, Table, Advanced"],
  [9020, "Design, Page, Basic"],
  [9025, "Design, Page, Advanced"],
  [9030, "Design, Report, Basic"],
  [9035, "Design, Report, Advanced"],
  [9040, "Design, Dataport, Basic"],
  [9045, "Design, Dataport, Advanced"],
  [9050, "Design, Codeunit, Basic"],
  [9055, "Design, Codeunit, Advanced"],
  [9060, "Design, XMLport, Basic"],
  [9065, "Design, XMLport, Advanced"],
  [9070, "Design, MenuSuite, Basic"],
  [9075, "Design, MenuSuite, Advanced"],
  [9090, "Design, Query, Basic"],
  [9095, "Design, Query, Advanced"],
  [9100, "Microsoft Dynamics NAV Server"],
  [9500, "TestPartner Integration"],
  [9600, "SmartList Designer API"],
  [9605, "SmartList Designer Preview"],
  [9610, "SmartList Management"],
  [9615, "SmartList Import/Export"],
  [9620, "Snapshot debugging"],
]);
