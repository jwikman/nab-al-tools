import * as assert from "assert";
import * as path from "path";
import { AppPackage } from "../../SymbolReference/types/AppPackage";

suite("AppPackage", () => {
  const testResourcesPath = path.resolve(
    __dirname,
    "../../../src/test/resources"
  );
  const testAppPath = path.resolve(
    testResourcesPath,
    ".alpackages/Default publisher_Al_1.0.0.0.app"
  );
  test("AppPackage.fromFile", function () {
    const appPackage = AppPackage.fromFile(testAppPath);
    assert.strictEqual(appPackage.filePath, testAppPath);
    assert.strictEqual(appPackage.name, "Al");
    assert.strictEqual(appPackage.publisher, "Default publisher");
    assert.strictEqual(appPackage.version, "1.0.0.0");
    assert.ok(appPackage.manifest);
    assert.ok(appPackage.symbolReference);
  });

  test("AppPackage.fromFile - Error: RT Package", function () {
    const runtimePackagePath = path.resolve(
      testResourcesPath,
      ".alpackages/Default publisher_AlRuntimePackage_18.3.24557.0.app"
    );
    assert.throws(
      () => {
        AppPackage.fromFile(runtimePackagePath);
      },
      (err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(
          err.message,
          `Runtime Packages is not supported (${runtimePackagePath})`
        );
        return true;
      }
    );
  });

  test("AppPackage.fromFile - Error: not an app file", function () {
    const notAnAppFile = path.resolve(
      testResourcesPath,
      "XliffCacheTest.da-DK.xlf"
    );
    assert.throws(
      () => {
        AppPackage.fromFile(notAnAppFile);
      },
      (err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(
          err.message,
          `"${notAnAppFile}" is not a valid app file`
        );
        return true;
      }
    );
  });

  test("AppPackage.appIdentifier", function () {
    const expected = {
      valid: true,
      name: "Al",
      publisher: "Default publisher",
      version: "1.0.0.0",
    };
    const appIdentifier = AppPackage.appIdentifierFromFilename(testAppPath);
    assert.deepStrictEqual(appIdentifier, expected, "Unexpected identifier");
  });

  test("AppPackage.byteArrayToGuid", function () {
    const byteArray = [
      230,
      206,
      240,
      58,
      187,
      136,
      57,
      69,
      131,
      93,
      96,
      17,
      81,
      33,
      160,
      197,
    ];
    const guid = AppPackage.byteArrayToGuid(byteArray);
    assert.strictEqual(guid, "3af0cee6-88bb-4539-835d-60115121a0c5");
  });
});
