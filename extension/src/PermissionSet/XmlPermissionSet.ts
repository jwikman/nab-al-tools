import * as xmldom from "@xmldom/xmldom";
import { ALObjectType } from "../ALObject/Enums";
import { alObjectTypeMap, alObjectTypeNumberMap } from "../ALObject/Maps";

export class XmlPermissionSets {
  permissionSets: XmlPermissionSet[] = [];
  filePath: string;
  constructor(filePath: string, xml: string, prefix: string) {
    this.filePath = filePath;
    const dom = xmldom.DOMParser;
    const permissionsDom = new dom().parseFromString(xml);
    const permissionSetsNode = permissionsDom.getElementsByTagName(
      "PermissionSets"
    )[0];
    const permissionSetNodeList = permissionSetsNode.getElementsByTagName(
      "PermissionSet"
    );
    for (let index = 0; index < permissionSetNodeList.length; index++) {
      const permissionSetNode = permissionSetNodeList[index];
      const roleId = permissionSetNode.getAttribute("RoleID");
      if (!roleId) {
        throw new Error("PermissionSet is missing the RoleID attribute");
      }
      const roleName = permissionSetNode.getAttribute("RoleName");
      const permissionSet: XmlPermissionSet = {
        roleID: roleId,
        roleName: roleName ?? "",
        permissions: [],
        filePath: filePath,
        suggestedNewName: prefix + roleId,
      };
      let permissionsNodeList = permissionSetNode.getElementsByTagName(
        "Permission"
      );
      if (permissionsNodeList.length === 0) {
        permissionsNodeList = permissionSetNode.getElementsByTagName(
          "TenantPermission"
        );
      }
      for (let i = 0; i < permissionsNodeList.length; i++) {
        const permissionsNode = permissionsNodeList[i];
        const objectType = XmlPermissionSets.getPermissionValue(
          permissionsNode,
          "ObjectType"
        );
        const objectId = XmlPermissionSets.getPermissionValue(
          permissionsNode,
          "ObjectID"
        );
        const readPermission = XmlPermissionSets.getPermissionValue(
          permissionsNode,
          "ReadPermission"
        );
        const insertPermission = XmlPermissionSets.getPermissionValue(
          permissionsNode,
          "InsertPermission"
        );
        const modifyPermission = XmlPermissionSets.getPermissionValue(
          permissionsNode,
          "ModifyPermission"
        );
        const deletePermission = XmlPermissionSets.getPermissionValue(
          permissionsNode,
          "DeletePermission"
        );
        const executePermission = XmlPermissionSets.getPermissionValue(
          permissionsNode,
          "ExecutePermission"
        );
        const securityFilter = permissionsNode.getElementsByTagName(
          "SecurityFilter"
        );
        if (
          securityFilter &&
          securityFilter[0] &&
          securityFilter[0].hasChildNodes()
        ) {
          throw new Error(
            `PermissionSet ${permissionSet.roleID} har defined some SecurityFilter, which is unsupported by this function`
          );
        }
        if (!objectType || objectType === "") {
          throw new Error(
            `A permission with empty ObjectType found in PermissionSet ${permissionSet.roleID}`
          );
        }
        if (!objectId || objectId === "") {
          throw new Error(
            `A permission with empty ObjectID found in PermissionSet ${permissionSet.roleID}`
          );
        }
        const permission: XmlPermission = {
          objectType: this.getALObjectType(objectType),
          objectID: Number.parseInt(objectId),
          readPermission: XmlPermissionSets.stringToPermission(readPermission),
          insertPermission: XmlPermissionSets.stringToPermission(
            insertPermission
          ),
          modifyPermission: XmlPermissionSets.stringToPermission(
            modifyPermission
          ),
          deletePermission: XmlPermissionSets.stringToPermission(
            deletePermission
          ),
          executePermission: XmlPermissionSets.stringToPermission(
            executePermission
          ),
        };
        permissionSet.permissions.push(permission);
      }
      this.permissionSets.push(permissionSet);
    }
  }

  static getPermissionValue(
    permissionsNode: Element,
    permission: string
  ): string {
    const node = permissionsNode.getElementsByTagName(permission);
    if (!node || !node[0] || !node[0].childNodes || !node[0].childNodes[0]) {
      return "";
    }
    return node[0].childNodes[0].nodeValue ?? "";
  }

  static stringToPermission(permissionString: string): Permission {
    switch (permissionString.toLocaleLowerCase()) {
      case "0":
      case "":
        return Permission.none;
      case "1":
      case "yes":
        return Permission.yes;
      case "2":
      case "indirect":
        return Permission.indirect;
      default:
        throw new Error(`Unexpected permission value: ${permissionString}`);
    }
  }

  private getALObjectType(objectTypeText: string): ALObjectType {
    const alObjectType = alObjectTypeMap.get(
      objectTypeText.replace(" ", "").toLowerCase()
    );
    if (alObjectType) {
      return alObjectType;
    }
    const objectTypeNumber: number = Number.parseInt(objectTypeText);
    const objectType = alObjectTypeNumberMap.get(objectTypeNumber);
    if (!objectType) {
      throw new Error(`No object type found for "${objectTypeText}"`);
    }
    return objectType;
  }
}

export interface XmlPermissionSet {
  permissions: XmlPermission[];
  roleID: string;
  roleName: string;
  filePath: string;
  suggestedNewName: string;
}

export interface XmlPermission {
  objectType: ALObjectType;
  objectID: number;
  readPermission: Permission;
  insertPermission: Permission;
  modifyPermission: Permission;
  deletePermission: Permission;
  executePermission: Permission;
}

export enum Permission {
  none = 0,
  yes = 1,
  indirect = 2,
}
