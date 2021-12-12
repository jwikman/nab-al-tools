import * as assert from "assert";
import * as FileFunctions from "../FileFunctions";
import * as path from "path";
import * as fs from "fs";
import * as Common from "../Common";

const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow
suite("FileFunctions Tests", function () {
  test("zipFiles()", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    const testAppTranslationsPath = path.join(
      __dirname,
      "../../..",
      "test-app/Xliff-test/Translations/"
    );
    const compressFiles: string[] = [
      path.join(testAppTranslationsPath, "Al.da-dk.xlf"),
      path.join(testAppTranslationsPath, "Al.g.xlf"),
      path.join(testAppTranslationsPath, "Al.sv-se.xlf"),
    ];
    const expectedFiles = [
      {
        name: "Al.da-dk.zip",
      },
      {
        name: "Al.g.zip",
      },
      {
        name: "Al.sv-se.zip",
      },
    ];
    const exportPath = path.join(__dirname, "temp/dts");

    await FileFunctions.zipFiles(compressFiles, exportPath);
    const zipFiles = fs.readdirSync(exportPath, { withFileTypes: true });
    assert.strictEqual(zipFiles.length, 3, "Unexpected number of zip-files");

    zipFiles.forEach((z) => {
      assert.ok(
        expectedFiles.find((zip) => zip.name === z.name),
        `New file exported ${z.name}. Is this correct?`
      );
    });
  });

  test("createFolderIfNotExist()", function () {
    const parentPath = path.resolve(__dirname, "common-test");
    const newPath = path.resolve(parentPath, "new/path/", Common.formatDate());
    const invalidPathChars = `/?<>\\:*|."`;
    assert.strictEqual(
      fs.existsSync(newPath),
      false,
      "Test folder should not exist. This could be an indication that the 'deleteFolderRecursive' test is not working."
    );
    FileFunctions.createFolderIfNotExist(newPath);
    assert.ok(fs.existsSync(newPath), "Could not find created folder.");

    // Test error code path
    if (process.platform === "win32") {
      // Linux: pretty much allows any character in a path.
      // MacOS: We're currently not running test on MacOS.
      let errorMsg = "";
      try {
        FileFunctions.createFolderIfNotExist(newPath + invalidPathChars);
      } catch (e) {
        errorMsg = (e as Error).message;
      }
      assert.strictEqual(
        errorMsg.length > 0,
        true,
        "Expected Error to be thrown"
      );
    }
  });
});
