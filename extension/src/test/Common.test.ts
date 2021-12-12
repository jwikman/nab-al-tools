import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import * as Common from "../Common";

suite("Common", function () {
  const parentPath = path.resolve(__dirname, "common-test");
  const newPath = path.resolve(parentPath, "new/path/", Common.formatDate());

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
