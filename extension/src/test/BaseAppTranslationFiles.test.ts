import * as assert from "assert";
import { writeFileSync } from "fs";
import * as path from "path";
import * as BaseAppTranslationFiles from "../externalresources/BaseAppTranslationFiles";
import * as LanguageFunctions from "../LanguageFunctions";

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

    const map = await LanguageFunctions.getBaseAppTranslationMap("fr-ca");
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
    const map = await LanguageFunctions.getBaseAppTranslationMap("klingon");
    assert.strictEqual(map, undefined, "Do we support klingon now?");
  });

  test("getBaseAppTranslationMap - empty file", async function () {
    writeFileSync(
      path.resolve(__dirname, "../externalresources/en-au_broken.json"),
      ""
    );

    await assert.rejects(
      async () => {
        await LanguageFunctions.getBaseAppTranslationMap("en-au_broken");
      },
      (err) => {
        assert.strictEqual(err.name, "Error");
        assert.strictEqual(
          err.message,
          'No content in file, file was deleted: "/home/theschitz/git/GitHub/nab-al-tools/extension/out/externalresources/en-au_broken.json".'
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
        await LanguageFunctions.getBaseAppTranslationMap("en-au_broken");
      },
      (err) => {
        assert.strictEqual(err.name, "Error");
        assert.strictEqual(
          err.message,
          'Could not parse match file for "en-au_broken.json". Message: Unexpected end of JSON input. If this persists, try disabling the setting "NAB: Match Base App Translation" and log an issue at https://github.com/jwikman/nab-al-tools/issues. Deleted corrupt file at: "/home/theschitz/git/GitHub/nab-al-tools/extension/out/externalresources/en-au_broken.json".'
        );
        return true;
      }
    );
  });
});
