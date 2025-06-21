import * as assert from "assert";
import { RefreshXlfHint } from "../../Enums";
import { RefreshResult } from "../../RefreshResult";
import { LanguageFunctionsSettings } from "../../Settings/LanguageFunctionsSettings";
import * as SettingsLoader from "../../Settings/SettingsLoader";
import { TranslationToken, Xliff } from "../../Xliff/XLIFFDocument";
import * as XliffFunctions from "../../XliffFunctions";

suite(
  "#333 After translation statistics show changes although no changes have been made",
  function () {
    test("Regression test", function () {
      const settings = SettingsLoader.getSettings();
      const lfSettings = new LanguageFunctionsSettings(settings);
      const gXlf = Xliff.fromString(gXlfXml());
      const refreshResult = new RefreshResult();
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
        4,
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
        3,
        "Unexpected number of trans-units added."
      );
      assert.strictEqual(
        refreshResult.numberOfReviewsAdded,
        4,
        "Unexpected number of reviews added."
      );

      const nabFrom = "NAB AL Tool Refresh Xlf";
      // TransUnit 0
      assert.strictEqual(
        langXlf.transunit[0].target.translationToken,
        TranslationToken.review
      );
      assert.strictEqual(langXlf.transunit[0].notes.length, 3);
      assert.strictEqual(langXlf.transunit[0].notes[0].from, nabFrom);
      assert.strictEqual(
        langXlf.transunit[0].notes[0].textContent,
        RefreshXlfHint.emptySource
      );
      assert.strictEqual(
        langXlf.transunit[0].notes[1].textContent,
        "TableComment"
      );
      assert.strictEqual(langXlf.transunit[0].notes[1].from, "Developer");
      assert.strictEqual(
        langXlf.transunit[0].notes[2].textContent,
        "Table Empty - Field MyField - Property Caption"
      );
      assert.strictEqual(langXlf.transunit[0].notes[2].from, "Xliff Generator");

      // TransUnit 1
      assert.strictEqual(
        langXlf.transunit[1].target.translationToken,
        TranslationToken.review
      );
      assert.strictEqual(langXlf.transunit[1].notes.length, 3);
      assert.strictEqual(langXlf.transunit[1].notes[0].from, nabFrom);
      assert.strictEqual(
        langXlf.transunit[1].notes[0].textContent,
        RefreshXlfHint.emptySource
      );
      assert.strictEqual(
        langXlf.transunit[1].notes[1].textContent,
        "TableComment"
      );
      assert.strictEqual(langXlf.transunit[1].notes[1].from, "Developer");
      assert.strictEqual(
        langXlf.transunit[1].notes[2].textContent,
        "Table NAB NABX The Deprecated Table - Property Caption"
      );
      assert.strictEqual(langXlf.transunit[1].notes[2].from, "Xliff Generator");

      // TransUnit 2
      assert.strictEqual(
        langXlf.transunit[2].target.translationToken,
        TranslationToken.review
      );
      assert.strictEqual(langXlf.transunit[2].notes.length, 3);
      assert.strictEqual(langXlf.transunit[2].notes[0].from, nabFrom);
      assert.strictEqual(
        langXlf.transunit[2].notes[0].textContent,
        RefreshXlfHint.emptySource
      );
      assert.strictEqual(langXlf.transunit[2].notes[1].from, "Developer");
      assert.strictEqual(langXlf.transunit[2].notes[1].textContent, "");
      assert.strictEqual(langXlf.transunit[2].notes[2].from, "Xliff Generator");
      assert.strictEqual(
        langXlf.transunit[2].notes[2].textContent,
        "Table The Table - Method OnInsert - NamedType LocalTestLabelTxt"
      );

      // TransUnit 3
      assert.strictEqual(
        langXlf.transunit[3].target.translationToken,
        TranslationToken.notTranslated
      );
      assert.strictEqual(langXlf.transunit[3].notes.length, 3);
      assert.strictEqual(langXlf.transunit[3].notes[0].from, nabFrom);
      assert.strictEqual(
        langXlf.transunit[3].notes[0].textContent,
        RefreshXlfHint.new
      );
      assert.strictEqual(langXlf.transunit[3].notes[1].from, "Developer");
      assert.strictEqual(langXlf.transunit[3].notes[1].textContent, "");
      assert.strictEqual(langXlf.transunit[3].notes[2].from, "Xliff Generator");
      assert.strictEqual(
        langXlf.transunit[3].notes[2].textContent,
        "Table INXS - Method NewSensation - NamedType MichaelHutchence"
      );

      // Round 2
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
        4,
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
        4,
        "#2 Unexpected number of reviews added."
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
        <trans-unit id="Table 3620873738 - Method 2451657066 - NamedType 1061650423" size-unit="char" translate="yes" xml:space="preserve">
          <source> </source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table The Table - Method OnInsert - NamedType LocalTestLabelTxt</note>
        </trans-unit>
        <trans-unit id="Table 3620873666 - Method 2451657666 - NamedType 1061650666" size-unit="char" translate="yes" xml:space="preserve">
          <source>It's a new translation!</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table INXS - Method NewSensation - NamedType MichaelHutchence</note>
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
      </group>
    </body>
  </file>
</xliff>`;
}
