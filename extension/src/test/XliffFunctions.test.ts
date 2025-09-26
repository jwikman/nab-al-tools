import * as assert from "assert";
import { TranslationMode } from "../Enums";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import { RefreshResult } from "../RefreshResult";
import * as SettingsLoader from "../Settings/SettingsLoader";
import {
  CustomNoteType,
  SizeUnit,
  Target,
  TargetState,
  TranslationToken,
  TransUnit,
  Xliff,
} from "../Xliff/XLIFFDocument";
import * as XliffFunctions from "../XliffFunctions";

suite("XliffFunctions Tests", function () {
  const settings = SettingsLoader.getSettings();

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
    this.timeout(10000);
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
    this.timeout(5000);

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

  test("matchTranslationsFromBaseApp()", async function () {
    const settings = SettingsLoader.getSettings();
    const languageFunctionSettings = new LanguageFunctionsSettings(settings);
    const xlf = Xliff.fromString(tinyXliffXml());
    const numberOfMatches = await XliffFunctions.matchTranslationsFromBaseApp(
      xlf,
      languageFunctionSettings
    );
    assert.strictEqual(numberOfMatches, 2, "Unexpected number of matches");
    assert.strictEqual(
      xlf.transunit[0].target.translationToken,
      "[NAB: SUGGESTION]",
      "Expected suggestion translation token."
    );
    assert.strictEqual(
      xlf.transunit[0].targets.length,
      2,
      "Unexpected number of targets"
    );
    assert.strictEqual(
      xlf.transunit[0].target.textContent,
      "Delstat",
      "Unexpexted target text content."
    );
    assert.strictEqual(
      xlf.transunit[0].targets[1].textContent,
      "Tillstånd",
      "Unexpexted target text content."
    );
    assert.strictEqual(
      xlf.transunit[1].targets.length,
      1,
      "Unexpexted number of targets."
    );
    assert.strictEqual(
      xlf.transunit[1].target.textContent,
      "asdf",
      "Unexpexted target text content."
    );
  });

  test("setTranslationUnitTranslated(): External", function () {
    const languageFunctionSettings = new LanguageFunctionsSettings(settings);
    languageFunctionSettings.translationMode = TranslationMode.external;
    const xlf = Xliff.fromString(tinyXliffXml());
    const transUnit = getTransUnit(TargetState.needsAdaptation);
    const transUnitId = transUnit.id;
    transUnit.insertCustomNote(CustomNoteType.refreshXlfHint, "Test");
    transUnit.target.translationToken = TranslationToken.notTranslated;
    xlf.transunit.push(transUnit);
    XliffFunctions.setTranslationUnitTranslated(
      xlf,
      xlf.getTransUnitById(transUnitId),
      TargetState.final,
      languageFunctionSettings
    );
    const actual = xlf.getTransUnitById(transUnitId);
    assert.strictEqual(
      actual.target.translationToken,
      undefined,
      "Target should not have a translation token."
    );
    assert.strictEqual(
      actual.target.state,
      TargetState.final,
      "Unexpected Target State"
    );
    assert.strictEqual(
      actual.target.stateQualifier,
      undefined,
      "Expected stateQualifier to be undefined."
    );
    assert.strictEqual(
      actual.hasCustomNote(CustomNoteType.refreshXlfHint),
      false,
      "Expected custom note to be removed."
    );
  });

  test("setTranslationUnitTranslated(): DTS", function () {
    const languageFunctionSettings = new LanguageFunctionsSettings(settings);
    languageFunctionSettings.translationMode = TranslationMode.dts;
    const xlf = Xliff.fromString(tinyXliffXml());
    const transUnit = getTransUnit(TargetState.needsAdaptation);
    const transUnitId = transUnit.id;
    transUnit.insertCustomNote(CustomNoteType.refreshXlfHint, "Test");
    transUnit.target.translationToken = TranslationToken.notTranslated;
    xlf.transunit.push(transUnit);
    XliffFunctions.setTranslationUnitTranslated(
      xlf,
      xlf.getTransUnitById(transUnitId),
      TargetState.final,
      languageFunctionSettings
    );
    const actual = xlf.getTransUnitById(transUnitId);
    assert.strictEqual(
      actual.target.translationToken,
      undefined,
      "Target should not have a translation token."
    );
    assert.strictEqual(
      actual.target.state,
      TargetState.final,
      "Unexpected Target State"
    );
    assert.strictEqual(
      actual.target.stateQualifier,
      undefined,
      "Expected stateQualifier to be undefined."
    );
    assert.strictEqual(
      actual.hasCustomNote(CustomNoteType.refreshXlfHint),
      false,
      "Expected custom note to be removed."
    );
  });

  test("setTranslationUnitTranslated(): default", function () {
    const languageFunctionSettings = new LanguageFunctionsSettings(settings);
    languageFunctionSettings.translationMode = TranslationMode.nabTags;
    const xlf = Xliff.fromString(tinyXliffXml());
    const transUnit = getTransUnit();
    const transUnitId = transUnit.id;
    transUnit.insertCustomNote(CustomNoteType.refreshXlfHint, "Test");
    transUnit.target.translationToken = TranslationToken.notTranslated;
    xlf.transunit.push(transUnit);
    XliffFunctions.setTranslationUnitTranslated(
      xlf,
      xlf.getTransUnitById(transUnitId),
      TargetState.final,
      languageFunctionSettings
    );
    const actual = xlf.getTransUnitById(transUnitId);
    assert.strictEqual(
      actual.target.translationToken,
      undefined,
      "Target should not have a translation token."
    );
    assert.strictEqual(actual.target.state, undefined);
    assert.strictEqual(
      actual.hasCustomNote(CustomNoteType.refreshXlfHint),
      false,
      "Expected custom note to be removed."
    );
  });

  test("refreshSelectedXlfFileFromGXlf(): PreserveOriginalAttribute setting", function () {
    // Test default behavior (preserveOriginalAttribute = false)
    const settings1 = SettingsLoader.getSettings();
    settings1.preserveOriginalAttribute = false;
    const languageFunctionSettings1 = new LanguageFunctionsSettings(settings1);

    const gXliff = Xliff.fromString(gXliffXml());
    gXliff._path = "/test/MyApp.g.xlf";
    const langXliff = Xliff.fromString(langXliffXml());

    const result1 = XliffFunctions.refreshSelectedXlfFileFromGXlf(
      langXliff,
      gXliff,
      languageFunctionSettings1,
      new Map(),
      new RefreshResult(),
      false,
      settings1
    );

    assert.strictEqual(
      result1.original,
      "MyApp.g.xlf",
      "Expected original to include .g.xlf when preserveOriginalAttribute is false"
    );

    // Test new behavior (preserveOriginalAttribute = true)
    const settings2 = SettingsLoader.getSettings();
    settings2.preserveOriginalAttribute = true;
    const languageFunctionSettings2 = new LanguageFunctionsSettings(settings2);

    const result2 = XliffFunctions.refreshSelectedXlfFileFromGXlf(
      langXliff,
      gXliff,
      languageFunctionSettings2,
      new Map(),
      new RefreshResult(),
      false,
      settings2
    );

    assert.strictEqual(
      result2.original,
      "MyApp",
      "Expected original to match source when preserveOriginalAttribute is true"
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

function tinyXliffXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 596208023 - Field 440443472 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field</source>
          <target>asdf</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field Test Field - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

function gXliffXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="MyApp">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

function langXliffXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="MyApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source>State</source>
          <target>Tillstånd</target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}
