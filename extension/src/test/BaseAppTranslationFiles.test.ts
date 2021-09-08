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
    console.log("result", result);
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

  test("Always - LanguageFunctions.getBaseAppTranslationMap()", async function () {
    // Only test of getBaseAppTranslationMap that should always run.
    const map = await LanguageFunctions.getBaseAppTranslationMap(
      "not-a-lang-code"
    );
    assert.deepStrictEqual(map, undefined, "Expected map to be undefined");
  });

  test("Workflow - LanguageFunctions.getBaseAppTranslationMap()", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    this.timeout(TIMEOUT);

    let map = await LanguageFunctions.getBaseAppTranslationMap("fr-ca");
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
    // Non existing language code
    map = await LanguageFunctions.getBaseAppTranslationMap("klingon");
    assert.deepStrictEqual(map, undefined, "Expected map to be undefined");

    // Empty file test
    const reEmptyFileError = new RegExp(
      /No content in file, file was deleted: .*/gm
    );
    writeFileSync(
      path.resolve(__dirname, "../externalresources/en-au_broken.json"),
      ""
    );

    map = undefined;
    let emptyErrorMsg = "";
    try {
      map = await LanguageFunctions.getBaseAppTranslationMap("en-au_broken");
    } catch (e) {
      emptyErrorMsg = (e as Error).message;
    }
    assert.deepStrictEqual(map, undefined, "Expected map to be undefined");
    assert.deepStrictEqual(
      emptyErrorMsg.match(reEmptyFileError)?.length,
      1,
      "Unexpected error message for empty file."
    );

    // Corrupt file test
    const reCorruptFile = new RegExp(
      /Could not parse match file for "en-au_broken\.json"\. Message: Unexpected end of JSON input\..*/gm
    );
    writeFileSync(
      path.resolve(__dirname, "../externalresources/en-au_broken.json"),
      '{ "broken": "json"'
    );

    map = undefined;
    let corruptErrorMsg = "";
    try {
      map = await LanguageFunctions.getBaseAppTranslationMap("en-au_broken");
    } catch (e) {
      corruptErrorMsg = (e as Error).message;
    }
    assert.deepStrictEqual(map, undefined, "Expected map to be undefined");

    assert.deepStrictEqual(
      corruptErrorMsg.match(reCorruptFile)?.length,
      1,
      "Unexpected error message for corrupt file."
    );
  });
});
