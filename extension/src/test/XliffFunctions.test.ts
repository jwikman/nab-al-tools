import * as assert from "assert";
import { TranslationMode } from "../Enums";
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
