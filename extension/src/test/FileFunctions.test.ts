import * as AdmZip from "adm-zip";
import * as assert from "assert";
import * as FileFunctions from "../FileFunctions";
import * as path from "path";
import * as fs from "graceful-fs";
import * as Common from "../Common";
import { BinaryReader } from "../SymbolReference/BinaryReader";

const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow
suite("FileFunctions Tests", function () {
  const testResourcesPath = path.resolve(
    __dirname,
    "../../src/test/resources/"
  );
  const testAppPath = path.resolve(
    testResourcesPath,
    ".alpackages",
    "Default publisher_Al_1.0.0.0.app"
  );
  const parentPath = path.resolve(__dirname, "filefunctions-test");
  const newPath = path.resolve(parentPath, "new/path/", Common.formatDate());

  test("zipFiles()", function () {
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

    FileFunctions.zipFiles(compressFiles, exportPath);
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

  test("deleteFolderRecursive", function () {
    FileFunctions.deleteFolderRecursive(parentPath);
    assert.strictEqual(
      fs.existsSync(newPath),
      false,
      "Child path should be deleted"
    );
    assert.strictEqual(
      fs.existsSync(parentPath),
      false,
      "Parent path should be deleted."
    );
  });

  test("getZipEntryContentOrEmpty", function () {
    const fileContent = fs.readFileSync(testAppPath);
    const view = new BinaryReader(fileContent, true);
    const metadataSize = view.getUint32(4);
    const contentLength = view.getUint64(28);
    const buffer = Buffer.from(
      view.getBytes(contentLength.valueOf(), metadataSize)
    );
    const zip = new AdmZip(buffer);
    const symbolReference = FileFunctions.getZipEntryContentOrEmpty(
      zip.getEntries(),
      "SymbolReference.json"
    );
    assert.strictEqual(
      symbolReference.length,
      18680,
      "Unexpected length of symbol reference"
    );
    const nonExistingFile = FileFunctions.getZipEntryContentOrEmpty(
      zip.getEntries(),
      "nonExistingFile.json"
    );
    assert.strictEqual(nonExistingFile, "", "Expected emtpy string");
  });

  test("loadJson(): With BOM", function () {
    /**
     *  JSON.parse would fail if BOM was not stripped.
     */
    const filepath = path.resolve(testResourcesPath, "with-utf8-bom.json");
    const rawContent = fs.readFileSync(filepath, "utf8");
    const actualContent = JSON.stringify(
      FileFunctions.loadJson(filepath),
      undefined,
      2
    );
    assert.notStrictEqual(
      actualContent,
      rawContent,
      "Strings should not be equal. Test file might have been saved without BOM."
    );
    assert.strictEqual(
      actualContent.length,
      rawContent.length - 1, // BOM
      "Strings should not be equal. Test file might have been saved without BOM."
    );
  });

  test("loadJson(): InvalidJsonError", function () {
    const filepath = path.resolve(testResourcesPath, "invalid-json.json");
    const actualContent = JSON.stringify(
      FileFunctions.loadJson(filepath),
      undefined,
      4
    );
    assert.strictEqual(
      actualContent,
      '"invalid-json.json"',
      "Unexpected content. The file is still not a valid JSON file."
    );
  });
  test("loadJson(): jsonWithComments", function () {
    const filepath = path.resolve(testResourcesPath, "json-with-comments.json");
    const actualContent = JSON.stringify(
      FileFunctions.loadJson(filepath),
      undefined,
      4
    );
    assert.strictEqual(
      actualContent,
      `{
    "mySetting": true,
    "anotherSetting": 42,
    "noCommentHere": "value"
}`
    );
  });
  test("loadJson(): jsonWithTrailingCommas", function () {
    const filepath = path.resolve(
      testResourcesPath,
      "json-with-trailing-commas.json"
    );
    const actualContent = JSON.stringify(
      FileFunctions.loadJson(filepath),
      undefined,
      4
    );
    assert.strictEqual(
      actualContent,
      `{
    "mySetting": true,
    "myArray": [
        "First",
        {
            "key": "value"
        },
        {
            "key": "value2"
        }
    ],
    "anotherSetting": 42
}`
    );
  });

  test("isValidFilesystemChar", function () {
    assert.ok(FileFunctions.isValidFilesystemChar("\u009f") === false);
  });

  test("escapeGlobPattern", function () {
    // Test escaping of square brackets
    assert.strictEqual(
      FileFunctions.escapeGlobPattern("Test [ABC]"),
      "Test [[]ABC[]]",
      "Square brackets should be escaped"
    );

    // Test escaping of curly braces
    assert.strictEqual(
      FileFunctions.escapeGlobPattern("Test {ABC}"),
      "Test [{]ABC[}]",
      "Curly braces should be escaped"
    );

    // Test escaping of multiple special characters
    assert.strictEqual(
      FileFunctions.escapeGlobPattern("Test [A] {B}"),
      "Test [[]A[]] [{]B[}]",
      "Mixed brackets and braces should be escaped"
    );

    // Test no escaping needed
    assert.strictEqual(
      FileFunctions.escapeGlobPattern("Test (ABC)"),
      "Test (ABC)",
      "Parentheses should not be escaped"
    );

    // Test empty string
    assert.strictEqual(
      FileFunctions.escapeGlobPattern(""),
      "",
      "Empty string should remain empty"
    );
  });

  suite("findFiles with glob special characters (Issue #573)", function () {
    test("findFiles should find file with square brackets in name", function () {
      const pattern = "Test App [BRACKET_TEST].g.xlf";
      const files = FileFunctions.findFiles(pattern, testResourcesPath);
      assert.strictEqual(
        files.length,
        1,
        `Expected to find 1 file with pattern "${pattern}", found ${files.length}`
      );
      assert.ok(
        files[0].includes("Test App [BRACKET_TEST].g.xlf"),
        `Expected to find "Test App [BRACKET_TEST].g.xlf", found "${files[0]}"`
      );
    });

    test("findFiles should find file with curly braces in name", function () {
      const pattern = "Test App {BRACE_TEST}.g.xlf";
      const files = FileFunctions.findFiles(pattern, testResourcesPath);
      assert.strictEqual(
        files.length,
        1,
        `Expected to find 1 file with pattern "${pattern}", found ${files.length}`
      );
      assert.ok(
        files[0].includes("Test App {BRACE_TEST}.g.xlf"),
        `Expected to find "Test App {BRACE_TEST}.g.xlf", found "${files[0]}"`
      );
    });

    test("findFiles should find file with parentheses in name (regression)", function () {
      const pattern = "Test App (PAREN_TEST).g.xlf";
      const files = FileFunctions.findFiles(pattern, testResourcesPath);
      assert.strictEqual(
        files.length,
        1,
        `Expected to find 1 file with pattern "${pattern}", found ${files.length}`
      );
      assert.ok(
        files[0].includes("Test App (PAREN_TEST).g.xlf"),
        `Expected to find "Test App (PAREN_TEST).g.xlf", found "${files[0]}"`
      );
    });

    test("findFiles should find file with empty brackets in name (regression)", function () {
      const pattern = "Test App [].g.xlf";
      const files = FileFunctions.findFiles(pattern, testResourcesPath);
      assert.strictEqual(
        files.length,
        1,
        `Expected to find 1 file with pattern "${pattern}", found ${files.length}`
      );
      assert.ok(
        files[0].includes("Test App [].g.xlf"),
        `Expected to find "Test App [].g.xlf", found "${files[0]}"`
      );
    });

    test("findFiles should find file without special chars (regression)", function () {
      const pattern = "NAB_AL_Tools.g.xlf";
      const files = FileFunctions.findFiles(pattern, testResourcesPath);
      assert.strictEqual(
        files.length,
        1,
        `Expected to find 1 file with pattern "${pattern}", found ${files.length}`
      );
      assert.ok(
        files[0].includes("NAB_AL_Tools.g.xlf"),
        `Expected to find "NAB_AL_Tools.g.xlf", found "${files[0]}"`
      );
    });
  });
});
