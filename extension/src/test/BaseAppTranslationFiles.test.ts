import * as assert from "assert";
import * as BaseAppTranslationFiles from "../externalresources/BaseAppTranslationFiles";

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
});
