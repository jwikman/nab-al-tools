import * as path from "path";
import * as fs from "fs";
import * as assert from "assert";
import * as FileFunctions from "../FileFunctions";
import * as PermissionSetFunctions from "../PermissionSet/PermissionSetFunctions";

import { getPermissionSetFiles } from "../WorkspaceFunctions";

const testOrgFiles = path.resolve(
  __dirname,
  "../../src/test/resources/permissionset"
);
const testFilesPath = path.resolve(
  __dirname,
  "../../src/test/resources/temp/permissionset"
);

suite.only("PermissionSet", function () {
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
      22,
      "Unexpected number of permissions"
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

  test.only("Convert XML PermissionSet", async function () {
    const filePaths = getPermissionSetFiles(testFilesPath);
    const prefix = "NAB ";
    const xmlPermissionSets = await PermissionSetFunctions.getXmlPermissionSets(
      filePaths,
      prefix
    );
    PermissionSetFunctions.validateData(xmlPermissionSets);
    await PermissionSetFunctions.startConversion(prefix, xmlPermissionSets);
    const upgradeFilePath = path.join(
      testFilesPath,
      "PermissionSetUpgrade.Codeunit.al_"
    );
    assert.strictEqual(
      fs.existsSync(upgradeFilePath),
      true,
      "Upgrade codeunit file not found"
    );
  });
});
