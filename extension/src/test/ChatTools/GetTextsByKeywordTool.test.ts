import * as assert from "assert";
import * as path from "path";
// fs not required here
import {
  getTextsByKeywordCore,
  ITranslatedTextWithState,
} from "../../ChatTools/shared/XliffToolsCore";

const sampleXlf = path.resolve(
  __dirname,
  "../../../src/test/resources/NAB_AL_Tools.sv-SE.xlf"
);

suite("getTextsByKeywordCore", function () {
  test("substring match (case-insensitive) returns matching units", function () {
    const result = getTextsByKeywordCore(
      sampleXlf,
      0,
      0,
      "this is a test",
      false,
      false
    );
    const data = result.data as ITranslatedTextWithState[];
    assert.ok(Array.isArray(data), "Expected result data to be an array");
    // Expect at least two units from sample that contain 'This is a test'
    assert.ok(
      data.length >= 2,
      `Expected at least 2 matches, got ${data.length}`
    );
    const ids = data.map((d) => d.id);
    assert.ok(
      ids.some((id) => id.includes("NamedType")),
      "Expected some id containing NamedType"
    );
  });

  test("case-sensitive match respects caseSensitive flag", function () {
    const resultInsensitive = getTextsByKeywordCore(
      sampleXlf,
      0,
      0,
      "This is a test",
      false,
      false
    );
    const resultSensitive = getTextsByKeywordCore(
      sampleXlf,
      0,
      0,
      "This is a test",
      true,
      false
    );
    // Both should match since the source text has capitalized 'This'
    assert.ok(
      resultInsensitive.data.length >= 2,
      "Expected insensitive match to find items"
    );
    assert.ok(
      resultSensitive.data.length >= 2,
      "Expected sensitive match to find items"
    );

    // Now search for lower-case 'this is a test' with caseSensitive=true -> should find none
    const resultLowerCaseSensitive = getTextsByKeywordCore(
      sampleXlf,
      0,
      0,
      "this is a test",
      true,
      false
    );
    assert.strictEqual(
      resultLowerCaseSensitive.data.length,
      0,
      "Expected no matches for case-sensitive lower-case search"
    );
  });

  test("regex match works and invalid regex throws", function () {
    const result = getTextsByKeywordCore(
      sampleXlf,
      0,
      0,
      "This.*test",
      false,
      true
    );
    const data = result.data as ITranslatedTextWithState[];
    assert.ok(data.length >= 2, "Expected regex to match multiple items");

    // Invalid regex
    assert.throws(() =>
      getTextsByKeywordCore(sampleXlf, 0, 0, "[unclosed", false, true)
    );
  });

  test("limit=0 returns all matches and pagination works", function () {
    const all = getTextsByKeywordCore(sampleXlf, 0, 0, "This", false, false);
    const page = getTextsByKeywordCore(sampleXlf, 1, 2, "This", false, false);
    const allData = all.data as ITranslatedTextWithState[];
    const pageData = page.data as ITranslatedTextWithState[];
    assert.ok(allData.length >= 2, "Expected at least 2 matches in total");
    // pageData should be at most 2 items
    assert.ok(pageData.length <= 2, "Expected page size <= 2");
  });
});
