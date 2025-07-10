import * as path from "path";
import * as assert from "assert";
import * as SymbolReferenceReader from "../SymbolReference/SymbolReferenceReader";
import { ALControlType, ALObjectType } from "../ALObject/Enums";
import { ALTableField } from "../ALObject/ALTableField";
import { AppPackage } from "../SymbolReference/types/AppPackage";

const testResourcesPath = "../../src/test/resources/.alpackages";

const baseAppPath = path.resolve(
  __dirname,
  testResourcesPath,
  "Microsoft_Base Application_18.0.23013.23320.app"
);
const testAppPath = path.resolve(
  __dirname,
  testResourcesPath,
  "Default publisher_Al_1.0.0.0.app"
);

suite("Symbol Parsing", function () {
  test("TestApp", function () {
    const appPackage = SymbolReferenceReader.getObjectsFromAppFile(testAppPath);
    assert.deepStrictEqual(appPackage.manifest?.App[0]._attributes.Name, "Al");
    assert.deepStrictEqual(
      appPackage.packageId,
      "3af0cee6-88bb-4539-835d-60115121a0c5",
      "unexpected packageId"
    );
    if (appPackage.objects) {
      assert.deepStrictEqual(
        appPackage.objects.length,
        10,
        "unexpected number of objects"
      );
      assert.deepStrictEqual(
        appPackage.objects[0].name,
        "NAB Test Table",
        "unexpected table name"
      );
    } else {
      assert.fail("No objects found");
    }
  });
  test("BaseApp Package", function () {
    this.timeout(10000);
    const appPackage = AppPackage.fromFile(baseAppPath, false);
    assert.deepEqual(
      appPackage.manifest?.App[0]._attributes.Name,
      "Base Application"
    );
    assert.deepEqual(
      appPackage.packageId,
      "9ffe35d4-3d02-498d-903e-65c48acd46f5",
      "unexpected packageId"
    );
  });
  test("BaseApp with objects", function () {
    this.timeout(10000);
    testBaseApp();
  });
  test("BaseApp with objects from cache", function () {
    // Cached by previous test
    testBaseApp();
  });
});

function testBaseApp(): void {
  const appPackage = SymbolReferenceReader.getObjectsFromAppFile(baseAppPath);
  assert.deepEqual(
    appPackage.manifest?.App[0]._attributes.Name,
    "Base Application"
  );
  assert.deepEqual(
    appPackage.packageId,
    "9ffe35d4-3d02-498d-903e-65c48acd46f5",
    "unexpected packageId"
  );
  if (appPackage.objects) {
    assert.deepEqual(
      appPackage.objects.length,
      6307,
      "unexpected number of objects"
    );
    assert.deepEqual(
      appPackage.objects[0].name,
      "AAD Application",
      "unexpected table name"
    );
    const fields = appPackage.objects[0].getAllControls(
      ALControlType.tableField
    ) as ALTableField[];
    assert.deepEqual(fields[0].id, 1, "unexpected field id");
    assert.deepEqual(fields[0].name, "Client Id", "unexpected field name");
    assert.deepEqual(
      fields[0].caption,
      "Client Id",
      "unexpected field caption"
    );
    assert.deepEqual(
      fields[0].dataType.toString(),
      "Guid",
      "unexpected field dataType"
    );
    const objects = appPackage.objects;
    const obj = objects.find(
      (x) =>
        x.type === ALControlType.object &&
        x.objectId === 2 &&
        x.objectType === ALObjectType.report
    );
    assert.ok(obj, "Report 2 not found in BaseApp objects");
  } else {
    assert.fail("No objects found");
  }
}
