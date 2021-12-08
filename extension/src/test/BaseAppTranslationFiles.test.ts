import * as assert from "assert";
import { writeFileSync } from "fs";
import * as path from "path";
import * as BaseAppTranslationFiles from "../externalresources/BaseAppTranslationFiles";
import * as XliffFunctions from "../XliffFunctions";

suite("Base App Translation Files Tests", function () {
  const TIMEOUT = 360000; // Take some time to download blobs on Ubuntu... and windows!
  const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow

  test("BaseAppTranslationFiles.getBlobs()", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(TIMEOUT);
    const result = await BaseAppTranslationFiles.baseAppTranslationFiles.getBlobs(); // Gets all the blobs, and I mean aaaall of them.
    assert.deepStrictEqual(
      result.succeded.length,
      25,
      "Unexpected number of files downloaded"
    );
    assert.deepStrictEqual(
      result.failed.length,
      0,
      "Unexpected number of downloads failed"
    );
  });

  test("localTranslationFiles", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(TIMEOUT);

    const result = await BaseAppTranslationFiles.baseAppTranslationFiles.getBlobs(
      ["sv-se"]
    );
    const localTranslationFiles = BaseAppTranslationFiles.localBaseAppTranslationFiles();
    assert.deepStrictEqual(
      result.succeded.length,
      1,
      "Unexpected number of files downloaded"
    );
    assert.deepStrictEqual(
      result.failed.length,
      0,
      "Unexpected number of downloads failed"
    );
    assert.deepStrictEqual(
      localTranslationFiles === undefined || localTranslationFiles === null,
      false,
      "map should not be null or undefined"
    );
    assert.notDeepStrictEqual(
      localTranslationFiles.size,
      0,
      "Unexpected Map size"
    );
  });

  test("Workflow - LanguageFunctions.getBaseAppTranslationMap()", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(TIMEOUT);

    const map = await XliffFunctions.getBaseAppTranslationMap("fr-ca");
    assert.notDeepStrictEqual(
      map,
      undefined,
      "Expected map should not be undefined"
    );
    if (map !== undefined) {
      assert.deepStrictEqual(
        map?.size > 0,
        true,
        "Expected map size to be >0."
      );
    }
  });

  test("getBaseAppTranslationMap - Bad language code", async function () {
    const map = await XliffFunctions.getBaseAppTranslationMap("klingon");
    assert.strictEqual(map, undefined, "Do we support klingon now?");
  });

  test("getBaseAppTranslationMap - empty file", async function () {
    writeFileSync(
      path.resolve(__dirname, "../externalresources/en-au_broken.json"),
      ""
    );

    await assert.rejects(
      async () => {
        await XliffFunctions.getBaseAppTranslationMap("en-au_broken");
      },
      (err) => {
        assert.strictEqual(err.name, "Error");
        assert.strictEqual(
          err.message.match(
            /No content in file, file was deleted: ".*en-au_broken.json"\./
          ).length,
          1,
          "Unexpected error message."
        );
        return true;
      }
    );
  });

  test("getBaseAppTranslationMap - corrupt file", async function () {
    writeFileSync(
      path.resolve(__dirname, "../externalresources/en-au_broken.json"),
      '{ "broken": "json"'
    );

    await assert.rejects(
      async () => {
        await XliffFunctions.getBaseAppTranslationMap("en-au_broken");
      },
      (err) => {
        assert.strictEqual(err.name, "Error");
        assert.strictEqual(
          err.message.match(
            /Could not parse match file for "en-au_broken\.json"\. Message: Unexpected end of JSON input\..*/
          ).length,
          1,
          `Unexpected error message: ${err.message}`
        );
        return true;
      }
    );
  });
});
