import * as path from "path";
import * as fs from "fs";
import * as assert from "assert";
import * as FileFunctions from "../FileFunctions";
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
    assert.strictEqual(filePaths.length, 2, "Unexpected number of files");
    const xmlPermissionSets = await PermissionSetFunctions.getXmlPermissionSets(
      filePaths,
      ""
    );
    assert.strictEqual(
      xmlPermissionSets.length,
      2,
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
      "Unexpected number of permissions"
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
        deletePermission: Permission.none,
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
      "Al 2",
      "Unexpected roleName 1"
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
    PermissionSetFunctions.validateData(xmlPermissionSets);
    await PermissionSetFunctions.startConversion(
      prefix,
      xmlPermissionSets,
      SettingsLoader.getWorkspaceFolderPath()
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
