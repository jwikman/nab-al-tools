import * as assert from "assert";
import { TranslationMode } from "../../Enums";
import { RefreshResult } from "../../RefreshResult";
import { LanguageFunctionsSettings } from "../../Settings/LanguageFunctionsSettings";
import * as SettingsLoader from "../../Settings/SettingsLoader";
import {
  TargetState,
  TranslationToken,
  Xliff,
} from "../../Xliff/XLIFFDocument";
import * as XliffFunctions from "../../XliffFunctions";

suite(
  "#469 NAB: REVIEW tag is always added to target when source is empty when Refresh XLF files",
  function () {
    test("Regression test - TargetState", function () {
      const settings = SettingsLoader.getSettings();
      const lfSettings = new LanguageFunctionsSettings(settings);
      const gXlf = Xliff.fromString(gXlfXml());
      const refreshResult = new RefreshResult();
      lfSettings.translationMode = TranslationMode.external;
      lfSettings.preferLockedTranslations = true;
      const langXlf = XliffFunctions.refreshSelectedXlfFileFromGXlf(
        Xliff.fromString(langXlfXml()),
        gXlf,
        lfSettings,
        new Map<string, Map<string, string[]>[]>(),
        refreshResult,
        false,
        settings
      );
      assert.strictEqual(
        langXlf.transunit.length,
        2,
        "Unexpected number of trans-units."
      );
      assert.strictEqual(
        refreshResult.numberOfUpdatedNotes,
        0,
        "Unexpected number of updated notes."
      );
      assert.strictEqual(
        refreshResult.numberOfUpdatedMaxWidths,
        0,
        "Unexpected number of updated max-widths"
      );
      assert.strictEqual(
        refreshResult.numberOfUpdatedSources,
        0,
        "Unexpected number of updated sources."
      );
      assert.strictEqual(
        refreshResult.numberOfRemovedTransUnits,
        0,
        "Unexpected number of removed trans-units"
      );
      assert.strictEqual(
        refreshResult.numberOfRemovedNotes,
        0,
        "Unexpected number of removed notes"
      );
      assert.strictEqual(
        refreshResult.numberOfCheckedFiles,
        0,
        "Unexpected number of checked files."
      );
      assert.strictEqual(
        refreshResult.numberOfSuggestionsAdded,
        0,
        "Did not expect suggestion to be added."
      );
      assert.strictEqual(
        refreshResult.numberOfAddedTransUnitElements,
        0,
        "Unexpected number of trans-units added."
      );
      assert.strictEqual(
        refreshResult.numberOfReviewsAdded,
        2,
        "Unexpected number of reviews added."
      );

      // TransUnit 0
      assert.strictEqual(
        langXlf.transunit[0].target.state,
        TargetState.needsReviewTranslation
      );

      // TransUnit 1
      assert.strictEqual(
        langXlf.transunit[1].target.state,
        TargetState.needsReviewTranslation
      );

      // Round 2
      langXlf.transunit[0].target.state = TargetState.translated;
      langXlf.transunit[1].target.state = TargetState.translated;
      const refreshResult2 = new RefreshResult();
      const langXlf2 = XliffFunctions.refreshSelectedXlfFileFromGXlf(
        langXlf,
        gXlf,
        lfSettings,
        new Map<string, Map<string, string[]>[]>(),
        refreshResult2,
        false,
        settings
      );
      assert.strictEqual(
        langXlf2.transunit.length,
        2,
        "#2 Unexpected number of trans-units."
      );
      assert.strictEqual(
        refreshResult2.numberOfUpdatedNotes,
        0,
        "#2 Unexpected number of updated notes."
      );
      assert.strictEqual(
        refreshResult2.numberOfUpdatedMaxWidths,
        0,
        "#2 Unexpected number of updated max-widths"
      );
      assert.strictEqual(
        refreshResult2.numberOfUpdatedSources,
        0,
        "#2 Unexpected number of updated sources."
      );
      assert.strictEqual(
        refreshResult2.numberOfRemovedTransUnits,
        0,
        "#2 Unexpected number of removed trans-units"
      );
      assert.strictEqual(
        refreshResult2.numberOfRemovedNotes,
        0,
        "#2 Unexpected number of removed notes"
      );
      assert.strictEqual(
        refreshResult2.numberOfCheckedFiles,
        0,
        "#2 Unexpected number of checked files."
      );
      assert.strictEqual(
        refreshResult2.numberOfSuggestionsAdded,
        0,
        "#2 Did not expect suggestion to be added."
      );
      assert.strictEqual(
        refreshResult2.numberOfAddedTransUnitElements,
        0,
        "#2 Unexpected number of added trans-unit elements."
      );
      assert.strictEqual(
        refreshResult2.numberOfReviewsAdded,
        2,
        "#2 Unexpected number of reviews added."
      );

      // TransUnit 0
      assert.strictEqual(
        langXlf2.transunit[0].target.state,
        TargetState.needsReviewTranslation
      );
      assert.strictEqual(
        langXlf2.transunit[0].target.translationToken,
        undefined
      );

      // TransUnit 1
      assert.strictEqual(
        langXlf2.transunit[1].target.state,
        TargetState.needsReviewTranslation
      );
      assert.strictEqual(
        langXlf2.transunit[1].target.translationToken,
        undefined
      );
    });
    test("Regression test - TranslationTokens", function () {
      const settings = SettingsLoader.getSettings();
      const lfSettings = new LanguageFunctionsSettings(settings);
      const gXlf = Xliff.fromString(gXlfXml());
      const refreshResult = new RefreshResult();
      lfSettings.translationMode = TranslationMode.nabTags;
      lfSettings.preferLockedTranslations = true;
      const langXlf = XliffFunctions.refreshSelectedXlfFileFromGXlf(
        Xliff.fromString(langXlfXml()),
        gXlf,
        lfSettings,
        new Map<string, Map<string, string[]>[]>(),
        refreshResult,
        false,
        settings
      );
      assert.strictEqual(
        langXlf.transunit.length,
        2,
        "Unexpected number of trans-units."
      );
      assert.strictEqual(
        refreshResult.numberOfUpdatedNotes,
        0,
        "Unexpected number of updated notes."
      );
      assert.strictEqual(
        refreshResult.numberOfUpdatedMaxWidths,
        0,
        "Unexpected number of updated max-widths"
      );
      assert.strictEqual(
        refreshResult.numberOfUpdatedSources,
        0,
        "Unexpected number of updated sources."
      );
      assert.strictEqual(
        refreshResult.numberOfRemovedTransUnits,
        0,
        "Unexpected number of removed trans-units"
      );
      assert.strictEqual(
        refreshResult.numberOfRemovedNotes,
        0,
        "Unexpected number of removed notes"
      );
      assert.strictEqual(
        refreshResult.numberOfCheckedFiles,
        0,
        "Unexpected number of checked files."
      );
      assert.strictEqual(
        refreshResult.numberOfSuggestionsAdded,
        0,
        "Did not expect suggestion to be added."
      );
      assert.strictEqual(
        refreshResult.numberOfAddedTransUnitElements,
        0,
        "Unexpected number of trans-units added."
      );
      assert.strictEqual(
        refreshResult.numberOfReviewsAdded,
        2,
        "Unexpected number of reviews added."
      );

      // TransUnit 0
      assert.strictEqual(
        langXlf.transunit[0].target.translationToken,
        TranslationToken.review
      );

      // TransUnit 1
      assert.strictEqual(
        langXlf.transunit[1].target.translationToken,
        TranslationToken.review
      );

      // Round 2
      langXlf.transunit[0].target.state = TargetState.translated;
      langXlf.transunit[1].target.state = TargetState.translated;
      const refreshResult2 = new RefreshResult();
      const langXlf2 = XliffFunctions.refreshSelectedXlfFileFromGXlf(
        langXlf,
        gXlf,
        lfSettings,
        new Map<string, Map<string, string[]>[]>(),
        refreshResult2,
        false,
        settings
      );
      assert.strictEqual(
        langXlf2.transunit.length,
        2,
        "#2 Unexpected number of trans-units."
      );
      assert.strictEqual(
        refreshResult2.numberOfUpdatedNotes,
        0,
        "#2 Unexpected number of updated notes."
      );
      assert.strictEqual(
        refreshResult2.numberOfUpdatedMaxWidths,
        0,
        "#2 Unexpected number of updated max-widths"
      );
      assert.strictEqual(
        refreshResult2.numberOfUpdatedSources,
        0,
        "#2 Unexpected number of updated sources."
      );
      assert.strictEqual(
        refreshResult2.numberOfRemovedTransUnits,
        0,
        "#2 Unexpected number of removed trans-units"
      );
      assert.strictEqual(
        refreshResult2.numberOfRemovedNotes,
        0,
        "#2 Unexpected number of removed notes"
      );
      assert.strictEqual(
        refreshResult2.numberOfCheckedFiles,
        0,
        "#2 Unexpected number of checked files."
      );
      assert.strictEqual(
        refreshResult2.numberOfSuggestionsAdded,
        0,
        "#2 Did not expect suggestion to be added."
      );
      assert.strictEqual(
        refreshResult2.numberOfAddedTransUnitElements,
        0,
        "#2 Unexpected number of added trans-unit elements."
      );
      assert.strictEqual(
        refreshResult2.numberOfReviewsAdded,
        0,
        "#2 Unexpected number of reviews added."
      );

      // TransUnit 0
      assert.strictEqual(
        langXlf2.transunit[0].target.translationToken,
        TranslationToken.review
      );

      // TransUnit 1
      assert.strictEqual(
        langXlf2.transunit[1].target.translationToken,
        TranslationToken.review
      );
    });
  }
);

function gXlfXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1365275863 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source> </source>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table Empty - Field MyField - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 3620873738 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source></source>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB NABX The Deprecated Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

function langXlfXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 1365275863 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source> </source>
          <target> </target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table Empty - Field MyField - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 3620873738 - Property 2879900210" maxwidth="23" size-unit="char" translate="yes" xml:space="preserve">
          <source></source>
          <target></target>
          <note from="Developer" annotates="general" priority="2">TableComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB NABX The Deprecated Table - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}
