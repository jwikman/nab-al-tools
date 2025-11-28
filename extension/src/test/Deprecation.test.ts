import * as assert from "assert";
import { DeprecatedFeature } from "../Deprecation";

suite("Deprecation Tests", function () {
  test("DeprecatedFeature enum values", function () {
    // Verify the enum values are correctly defined
    assert.strictEqual(
      DeprecatedFeature.dtsFormatCurrentXlf,
      "FormatCurrentXlfFileForDTS",
      "dtsFormatCurrentXlf should have correct value"
    );
    assert.strictEqual(
      DeprecatedFeature.dtsOpen,
      "OpenDTS",
      "dtsOpen should have correct value"
    );
    assert.strictEqual(
      DeprecatedFeature.dtsImportTranslations,
      "ImportDtsTranslations",
      "dtsImportTranslations should have correct value"
    );
  });

  test("All DTS features have enum values", function () {
    // Ensure all expected DTS deprecated features exist
    const expectedFeatures = [
      "dtsFormatCurrentXlf",
      "dtsOpen",
      "dtsImportTranslations",
    ];
    const enumKeys = Object.keys(DeprecatedFeature).filter((key) =>
      isNaN(Number(key))
    );

    expectedFeatures.forEach((feature) => {
      assert.ok(
        enumKeys.includes(feature),
        `DeprecatedFeature should include ${feature}`
      );
    });
  });
});
