import * as assert from "assert";
import { TranslationMode } from "../Enums";
import {
  TargetState,
  TranslationToken,
  TransUnit,
} from "../Xliff/XLIFFDocument";
import * as XliffFunctions from "../XliffFunctions";

suite("XliffFunctions Tests", function () {
  test("formatTransUnitForTranslationMode - DTS", function () {
    // DTS
    const tu = getTransUnit(TranslationToken.notTranslated);
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
    const tu = getTransUnit(TranslationToken.notTranslated);
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
    let tu = getTransUnit(undefined, TargetState.new);
    XliffFunctions.formatTransUnitForTranslationMode(translationMode, tu);
    assert.strictEqual(tu.target.state, undefined);
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(
      tu.target.translationToken,
      TranslationToken.notTranslated
    );

    tu = getTransUnit(undefined, TargetState.needsReviewTranslation);
    XliffFunctions.formatTransUnitForTranslationMode(translationMode, tu);
    assert.strictEqual(tu.target.state, undefined);
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(tu.target.translationToken, TranslationToken.review);

    // Test default case of inner switch
    tu = getTransUnit(undefined, TargetState.final);
    XliffFunctions.formatTransUnitForTranslationMode(translationMode, tu);
    assert.strictEqual(tu.target.state, undefined);
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(tu.target.translationToken, undefined);
  });
});

function getTransUnit(
  translationToken: TranslationToken | undefined,
  targetState: TargetState | undefined = undefined
): TransUnit {
  const tu = TransUnit.fromString(getTransUnitXml());
  tu.target.state = targetState;
  tu.target.translationToken = translationToken;
  return tu;
}

function getTransUnitXml(): string {
  return `<trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
    <source>This is a test ERROR in table</source>
    <target state="New">This is a test ERROR in table</target>
    <note from="Developer" annotates="general" priority="2" />
    <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
  </trans-unit>`;
}
