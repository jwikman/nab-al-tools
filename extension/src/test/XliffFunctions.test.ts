import * as assert from "assert";
import { TranslationMode } from "../Enums";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import * as SettingsLoader from "../Settings/SettingsLoader";
import {
  SizeUnit,
  Target,
  TargetState,
  TranslationToken,
  TransUnit,
} from "../Xliff/XLIFFDocument";
import * as XliffFunctions from "../XliffFunctions";

suite("XliffFunctions Tests", function () {
  test("getGXlfDocument()", async function () {
    const settings = SettingsLoader.getSettings();
    const appManifest = SettingsLoader.getAppManifest();
    await assert.doesNotReject(async () => {
      return XliffFunctions.getGXlfDocument(settings, appManifest);
    }, "Unexpected rejection of promise");
  });

  test("formatTransUnitForTranslationMode: dts", function () {
    const tu = getTransUnit();
    tu.target.translationToken = TranslationToken.notTranslated;
    XliffFunctions.formatTransUnitForTranslationMode(TranslationMode.dts, tu);
    assert.strictEqual(
      tu.target.state,
      TargetState.needsTranslation,
      `Expected state "${TargetState.needsTranslation}".`
    );
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(tu.target.translationToken, undefined);
  });

  test("formatTransUnitForTranslationMode: external", function () {
    const tu = getTransUnit();
    tu.target.translationToken = TranslationToken.notTranslated;
    XliffFunctions.formatTransUnitForTranslationMode(
      TranslationMode.external,
      tu
    );
    assert.strictEqual(
      tu.target.state,
      TargetState.needsTranslation,
      `Expected state "${TargetState.needsTranslation}".`
    );
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(tu.target.translationToken, undefined);
  });

  test("formatTransUnitForTranslationMode: nabTags - new", function () {
    const tu = getTransUnit(TargetState.new);
    XliffFunctions.formatTransUnitForTranslationMode(
      TranslationMode.nabTags,
      tu
    );
    assert.strictEqual(tu.target.state, undefined);
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(
      tu.target.translationToken,
      TranslationToken.notTranslated
    );
  });

  test("formatTransUnitForTranslationMode: nabTags - needsReviewTranslation", function () {
    const tu = getTransUnit(TargetState.needsReviewTranslation);
    XliffFunctions.formatTransUnitForTranslationMode(
      TranslationMode.nabTags,
      tu
    );
    assert.strictEqual(tu.target.state, undefined);
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(tu.target.translationToken, TranslationToken.review);
  });

  test("formatTransUnitForTranslationMode: nabTags - Final", function () {
    // default case of inner switch
    const tu = getTransUnit(TargetState.final);
    XliffFunctions.formatTransUnitForTranslationMode(
      TranslationMode.nabTags,
      tu
    );
    assert.strictEqual(tu.target.state, undefined);
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(tu.target.translationToken, undefined);
  });

  test("createSuggestionMaps()", async function () {
    const settings = SettingsLoader.getSettings();
    const appManifest = SettingsLoader.getAppManifest();
    const languageFunctionSettings = new LanguageFunctionsSettings(settings);
    const suggestionMaps = await XliffFunctions.createSuggestionMaps(
      settings,
      appManifest,
      languageFunctionSettings
    );
    assert.ok(suggestionMaps instanceof Map);
    assert.strictEqual(suggestionMaps.size, 2, "Unexpected size of map.");
    assert.ok(suggestionMaps.has("da-dk"));
    assert.ok(suggestionMaps.has("sv-se"));
    const map = suggestionMaps.get("da-dk");
    assert.ok(map);
    assert.ok(map.length > 0, "Unexpected length of map.");
  });

  test("createSuggestionMaps(): Error", async function () {
    const settings = SettingsLoader.getSettings();
    const appManifest = SettingsLoader.getAppManifest();
    const languageFunctionSettings = new LanguageFunctionsSettings(settings);
    await assert.rejects(
      async () => {
        await XliffFunctions.createSuggestionMaps(
          settings,
          appManifest,
          languageFunctionSettings,
          ""
        );
      },
      (err) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(err.message, "No xlf selected for matching");
        return true;
      },
      "Function did not throw expected exception"
    );
  });
});

function getTransUnit(targetState?: TargetState): TransUnit {
  const transUnit = new TransUnit(
    "Table 12557645",
    true,
    "Test",
    new Target("Test"),
    SizeUnit.char,
    "preserve"
  );
  transUnit.target.state = targetState;
  return transUnit;
}
