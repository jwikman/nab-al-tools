import * as xmldom from "@xmldom/xmldom";

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
      const permissionsNodeList = permissionSetNode.getElementsByTagName(
        "Permission"
      );
      for (let i = 0; i < permissionsNodeList.length; i++) {
        const permissionsNode = permissionsNodeList[i];
        const objectType = permissionsNode.getElementsByTagName("ObjectType")[0]
          .childNodes[0].nodeValue;

        const objectId = permissionsNode.getElementsByTagName("ObjectID")[0]
          .childNodes[0].nodeValue;
        const readPermission =
          permissionsNode.getElementsByTagName("ReadPermission")[0]
            .childNodes[0].nodeValue ?? "";
        const insertPermission =
          permissionsNode.getElementsByTagName("InsertPermission")[0]
            .childNodes[0].nodeValue ?? "";
        const modifyPermission =
          permissionsNode.getElementsByTagName("ModifyPermission")[0]
            .childNodes[0].nodeValue ?? "";
        const deletePermission =
          permissionsNode.getElementsByTagName("DeletePermission")[0]
            .childNodes[0].nodeValue ?? "";
        const executePermission =
          permissionsNode.getElementsByTagName("ExecutePermission")[0]
            .childNodes[0].nodeValue ?? "";
        if (
          permissionsNode
            .getElementsByTagName("SecurityFilter")[0]
            .hasChildNodes()
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
          objectType: objectType,
          objectID: Number.parseInt(objectId),
          readPermission: readPermission,
          insertPermission: insertPermission,
          modifyPermission: modifyPermission,
          deletePermission: deletePermission,
          executePermission: executePermission,
        };
        permissionSet.permissions.push(permission);
      }
      this.permissionSets.push(permissionSet);
    }
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
  objectType: string;
  objectID: number;
  readPermission: string;
  insertPermission: string;
  modifyPermission: string;
  deletePermission: string;
  executePermission: string;
}
