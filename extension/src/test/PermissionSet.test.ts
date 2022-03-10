import * as path from "path";
import * as assert from "assert";
import { getXmlPermissionSets } from "../PermissionSet/PermissionSetFunctions";

import { getPermissionSetFiles } from "../WorkspaceFunctions";

const rootPath = path.resolve(
  __dirname,
  "../../src/test/resources/permissionset"
);

suite("PermissionSet", function () {
  test("Parse PermissionSet XML Files", async function () {
    const filePaths = getPermissionSetFiles(rootPath);
    assert.strictEqual(filePaths.length, 2, "Unexpected number of files");
    const xmlPermissionSets = await getXmlPermissionSets(filePaths, "");
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
});
