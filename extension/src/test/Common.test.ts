import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import * as Common from "../Common";

suite("Common", function () {
  const parentPath = path.resolve(__dirname, "common-test");
  const newPath = path.resolve(parentPath, "new/path/", Common.formatDate());
  const invalidPathChars = `/?<>\\:*|."`;

  test("convertLinefeedToBr", function () {
    assert.strictEqual(
      Common.convertLinefeedToBR("\n\n\n"),
      "<br><br><br>",
      "Unexpected string returned"
    );
  });

  test("formatToday", function () {
    assert.deepStrictEqual(
      Common.formatDate().length,
      10,
      "Badly formatted date returned"
    );

    const d = new Date("2001-1-1");
    assert.strictEqual(
      Common.formatDate(d),
      "2001-01-01",
      "Incorrect date string returned"
    );
  });

  test("createFolderIfNotExist", function () {
    Common.createFolderIfNotExist(newPath);
    assert.strictEqual(
      fs.existsSync(newPath),
      true,
      "Could not find created folder."
    );

    // Test error code path
    if (process.platform === "win32") {
      // Linux: pretty much allows any character in a path.
      // MacOS: We're currently not running test on MacOS.
      let errorMsg = "";
      try {
        Common.createFolderIfNotExist(newPath + invalidPathChars);
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
    Common.deleteFolderRecursive(parentPath);
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
});
