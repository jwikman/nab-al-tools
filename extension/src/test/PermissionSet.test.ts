import * as path from "path";
import * as fs from "graceful-fs";
import * as assert from "assert";
import * as FileFunctions from "../FileFunctions";
import * as WorkspaceFunctions from "../WorkspaceFunctions";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as PermissionSetFunctions from "../PermissionSet/PermissionSetFunctions";
import { getPermissionSetFiles } from "../WorkspaceFunctions";
import { ALObjectType } from "../ALObject/Enums";
import { Permission } from "../PermissionSet/XmlPermissionSet";

const testOrgFiles = path.resolve(
  __dirname,
  "../../src/test/resources/permissionset"
);
const testFilesPath = path.resolve(
  __dirname,
  "../../src/test/resources/temp/permissionset"
);

suite("PermissionSet", function () {
  if (fs.existsSync(testFilesPath)) {
    FileFunctions.deleteFolderRecursive(testFilesPath);
  }

  FileFunctions.copyFolderSync(testOrgFiles, testFilesPath);

  test("Parse PermissionSet XML Files", async function () {
    const filePaths = getPermissionSetFiles(testFilesPath);
    assert.strictEqual(filePaths.length, 3, "Unexpected number of files");
    const xmlPermissionSets = await PermissionSetFunctions.getXmlPermissionSets(
      filePaths,
      ""
    );
    assert.strictEqual(
      xmlPermissionSets.length,
      3,
      "Unexpected number of permission sets"
    );
    assert.strictEqual(
      xmlPermissionSets[0].roleID,
      "AL",
      "Unexpected roleId 0"
    );
    assert.strictEqual(
      xmlPermissionSets[0].roleName,
      "Al",
      "Unexpected roleName 0"
    );
    assert.strictEqual(
      xmlPermissionSets[0].permissions.length,
      26,
      "Unexpected number of permissions [0]"
    );
    assert.deepStrictEqual(
      xmlPermissionSets[0].permissions[0],
      {
        objectType: ALObjectType.tableData,
        objectID: 50002,
        readPermission: Permission.yes,
        insertPermission: Permission.yes,
        modifyPermission: Permission.yes,
        deletePermission: Permission.yes,
        executePermission: Permission.none,
      },
      "Unexpected permission[0]"
    );
    assert.deepStrictEqual(
      xmlPermissionSets[0].permissions[1],
      {
        objectType: ALObjectType.table,
        objectID: 50002,
        readPermission: Permission.none,
        insertPermission: Permission.none,
        modifyPermission: Permission.none,
        deletePermission: Permission.indirect,
        executePermission: Permission.yes,
      },
      "Unexpected permission[1]"
    );
    assert.deepStrictEqual(
      xmlPermissionSets[0].permissions[2],
      {
        objectType: ALObjectType.tableData,
        objectID: 50003,
        readPermission: Permission.yes,
        insertPermission: Permission.indirect,
        modifyPermission: Permission.yes,
        deletePermission: Permission.yes,
        executePermission: Permission.none,
      },
      "Unexpected permission[2]"
    );
    assert.deepStrictEqual(
      xmlPermissionSets[0].permissions[3],
      {
        objectType: ALObjectType.system,
        objectID: 3510,
        readPermission: Permission.none,
        insertPermission: Permission.none,
        modifyPermission: Permission.none,
        deletePermission: Permission.none,
        executePermission: Permission.yes,
      },
      "Unexpected permission[3]"
    );
    assert.deepStrictEqual(
      xmlPermissionSets[0].permissions[4],
      {
        objectType: ALObjectType.query,
        objectID: 50001,
        readPermission: Permission.none,
        insertPermission: Permission.none,
        modifyPermission: Permission.none,
        deletePermission: Permission.none,
        executePermission: Permission.yes,
      },
      "Unexpected permission[4]"
    );
    assert.deepStrictEqual(
      xmlPermissionSets[0].permissions[5],
      {
        objectType: ALObjectType.page,
        objectID: 50007,
        readPermission: Permission.none,
        insertPermission: Permission.none,
        modifyPermission: Permission.none,
        deletePermission: Permission.none,
        executePermission: Permission.yes,
      },
      "Unexpected permission[5]"
    );
    assert.deepStrictEqual(
      xmlPermissionSets[0].permissions[6],
      {
        objectType: ALObjectType.codeunit,
        objectID: 50002,
        readPermission: Permission.none,
        insertPermission: Permission.none,
        modifyPermission: Permission.none,
        deletePermission: Permission.none,
        executePermission: Permission.yes,
      },
      "Unexpected permission[6]"
    );

    assert.strictEqual(
      xmlPermissionSets[1].roleID,
      "AL-2",
      "Unexpected roleId 1"
    );
    assert.strictEqual(
      xmlPermissionSets[1].roleName,
      "",
      "Unexpected roleName 1"
    );

    assert.strictEqual(
      xmlPermissionSets[2].roleID,
      "AL-TENANT",
      "Unexpected roleId 0"
    );
    assert.strictEqual(
      xmlPermissionSets[2].roleName,
      "TenantPermissions",
      "Unexpected roleName 0"
    );
    assert.strictEqual(
      xmlPermissionSets[2].permissions.length,
      6,
      "Unexpected number of permissions [2]"
    );
    assert.deepStrictEqual(
      xmlPermissionSets[2].permissions[0],
      {
        objectType: ALObjectType.tableData,
        objectID: 50003,
        readPermission: Permission.yes,
        insertPermission: Permission.indirect,
        modifyPermission: Permission.yes,
        deletePermission: Permission.yes,
        executePermission: Permission.none,
      },
      "Unexpected permission[2][0]"
    );
  });

  test("Get Objects from Symbols", async function () {
    this.timeout(3000);
    const workspaceFolderPath = SettingsLoader.getWorkspaceFolderPath();
    const settings = SettingsLoader.getSettingsForFolder(workspaceFolderPath);
    const manifest = SettingsLoader.getAppManifestForFolder(
      workspaceFolderPath
    );
    const alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
      settings,
      manifest,
      false,
      false,
      true
    );
    assert.strictEqual(
      PermissionSetFunctions.getObjectName(alObjects, ALObjectType.report, 2),
      "General Journal - Test",
      "Unexpected object name for Report 2"
    );
  });
  test("Convert XML PermissionSet", async function () {
    this.timeout(3000);

    const filePaths = getPermissionSetFiles(testFilesPath);
    const prefix = "NAB ";
    const xmlPermissionSets = await PermissionSetFunctions.getXmlPermissionSets(
      filePaths,
      prefix
    );
    xmlPermissionSets[1].roleName = "A Name";
    PermissionSetFunctions.validateData(xmlPermissionSets);

    const workspaceFolderPath = SettingsLoader.getWorkspaceFolderPath();
    const settings = SettingsLoader.getSettingsForFolder(workspaceFolderPath);
    const manifest = SettingsLoader.getAppManifestForFolder(
      workspaceFolderPath
    );
    await PermissionSetFunctions.runConversion(
      settings,
      manifest,
      prefix,
      xmlPermissionSets
    );

    const upgradeFilePath = path.join(
      testFilesPath,
      "PermissionSetUpgrade.Codeunit.al"
    );
    assert.strictEqual(
      fs.existsSync(upgradeFilePath),
      true,
      "Upgrade codeunit file not found"
    );
  });
});
