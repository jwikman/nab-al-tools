import * as assert from "assert";
import { TranslationMode } from "../Enums";
import {
  SizeUnit,
  Target,
  TargetState,
  TranslationToken,
  TransUnit,
} from "../Xliff/XLIFFDocument";
import * as XliffFunctions from "../XliffFunctions";

suite("XliffFunctions Tests", function () {
  test("formatTransUnitForTranslationMode - DTS", function () {
    // DTS
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

  test("formatTransUnitForTranslationMode - External", function () {
    // External
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

  test("formatTransUnitForTranslationMode - NAB Tags (default case)", function () {
    // NAB Tags
    const translationMode = TranslationMode.nabTags;
    let tu = getTransUnit(TargetState.new);
    XliffFunctions.formatTransUnitForTranslationMode(translationMode, tu);
    assert.strictEqual(tu.target.state, undefined);
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(
      tu.target.translationToken,
      TranslationToken.notTranslated
    );

    tu = getTransUnit(TargetState.needsReviewTranslation);
    XliffFunctions.formatTransUnitForTranslationMode(translationMode, tu);
    assert.strictEqual(tu.target.state, undefined);
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(tu.target.translationToken, TranslationToken.review);

    // Test default case of inner switch
    tu = getTransUnit(TargetState.final);
    XliffFunctions.formatTransUnitForTranslationMode(translationMode, tu);
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
