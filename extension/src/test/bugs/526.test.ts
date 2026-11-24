import * as assert from "assert";
import { RefreshResult } from "../../RefreshResult";
import { LanguageFunctionsSettings } from "../../Settings/LanguageFunctionsSettings";
import * as SettingsLoader from "../../Settings/SettingsLoader";
import { Xliff } from "../../Xliff/XLIFFDocument";
import * as XliffFunctions from "../../XliffFunctions";

suite(
  "#526 NAB only suggests translations for language comments with additional info",
  function () {
    test("Translation in comment should be picked up when source changes", function () {
      const settings = SettingsLoader.getSettings();
      settings.languageCodesInComments = [
        { languageTag: "de-DE", threeLetterAbbreviation: "DEU" },
      ];
      const lfSettings = new LanguageFunctionsSettings(settings);

      // Initial state: label with old source and old translation comment
      const initialLangXlf = Xliff.fromString(initialLangXlfXml());
      const initialGXlf = Xliff.fromString(initialGXlfXml());

      const initialRefreshResult = new RefreshResult();
      const refreshedInitialLangXlf = XliffFunctions.refreshSelectedXlfFileFromGXlf(
        initialLangXlf,
        initialGXlf,
        lfSettings,
        new Map<string, Map<string, string[]>[]>(),
        initialRefreshResult,
        false,
        settings
      );

      // Verify initial state is correct
      assert.strictEqual(
        refreshedInitialLangXlf.transunit.length,
        1,
        "Initial: Expected 1 trans-unit"
      );
      assert.strictEqual(
        refreshedInitialLangXlf.transunit[0].target.textContent,
        "Die %1 muss 3 Ziffern enthalten.",
        "Initial: Translation should be picked up from comment"
      );

      // Now simulate source and translation comment change
      const updatedGXlf = Xliff.fromString(updatedGXlfXml());
      const updatedLangXlf = Xliff.fromString(
        refreshedInitialLangXlf.toString()
      );

      const updateRefreshResult = new RefreshResult();
      const refreshedUpdatedLangXlf = XliffFunctions.refreshSelectedXlfFileFromGXlf(
        updatedLangXlf,
        updatedGXlf,
        lfSettings,
        new Map<string, Map<string, string[]>[]>(),
        updateRefreshResult,
        false,
        settings
      );

      // Verify the updated translation is picked up
      assert.strictEqual(
        refreshedUpdatedLangXlf.transunit.length,
        1,
        "Updated: Expected 1 trans-unit"
      );
      assert.strictEqual(
        refreshedUpdatedLangXlf.transunit[0].target.textContent,
        "Die %1 muss 4 Ziffern enthalten.",
        "Updated: Translation should be updated from the new comment"
      );
      assert.strictEqual(
        updateRefreshResult.numberOfUpdatedSources,
        1,
        "Source should be updated"
      );

      // Verify the developer note no longer contains the translation comment
      const developerNote = refreshedUpdatedLangXlf.transunit[0].developerNoteContent();
      assert.strictEqual(
        developerNote.includes('DEU="'),
        false,
        "Developer note should not contain the translation comment after it's been applied"
      );
    });

    test("Translation in comment should be picked up for new trans-unit", function () {
      const settings = SettingsLoader.getSettings();
      settings.languageCodesInComments = [
        { languageTag: "de-DE", threeLetterAbbreviation: "DEU" },
      ];
      const lfSettings = new LanguageFunctionsSettings(settings);

      const gXlf = Xliff.fromString(newTransUnitGXlfXml());
      const langXlf = Xliff.fromString(emptyLangXlfXml());

      const refreshResult = new RefreshResult();
      const refreshedLangXlf = XliffFunctions.refreshSelectedXlfFileFromGXlf(
        langXlf,
        gXlf,
        lfSettings,
        new Map<string, Map<string, string[]>[]>(),
        refreshResult,
        false,
        settings
      );

      // Verify the translation is picked up for the new trans-unit
      assert.strictEqual(
        refreshedLangXlf.transunit.length,
        1,
        "Expected 1 trans-unit"
      );
      assert.strictEqual(
        refreshedLangXlf.transunit[0].target.textContent,
        "Neues Label mit Übersetzung",
        "Translation should be picked up from comment for new trans-unit"
      );

      // Verify the developer note no longer contains the translation comment
      const developerNote = refreshedLangXlf.transunit[0].developerNoteContent();
      assert.strictEqual(
        developerNote.includes('DEU="'),
        false,
        "Developer note should not contain the translation comment after it's been applied"
      );
    });

    test("Multiple runs should not cause unnecessary changes", function () {
      const settings = SettingsLoader.getSettings();
      settings.languageCodesInComments = [
        { languageTag: "de-DE", threeLetterAbbreviation: "DEU" },
      ];
      const lfSettings = new LanguageFunctionsSettings(settings);

      const gXlf = Xliff.fromString(updatedGXlfXml());
      const langXlf = Xliff.fromString(emptyLangXlfXml());

      // First run
      const refreshResult1 = new RefreshResult();
      const refreshedLangXlf1 = XliffFunctions.refreshSelectedXlfFileFromGXlf(
        langXlf,
        gXlf,
        lfSettings,
        new Map<string, Map<string, string[]>[]>(),
        refreshResult1,
        false,
        settings
      );

      // Second run - should not cause changes
      const refreshResult2 = new RefreshResult();
      const refreshedLangXlf2 = XliffFunctions.refreshSelectedXlfFileFromGXlf(
        Xliff.fromString(refreshedLangXlf1.toString()),
        Xliff.fromString(gXlf.toString()),
        lfSettings,
        new Map<string, Map<string, string[]>[]>(),
        refreshResult2,
        false,
        settings
      );

      assert.strictEqual(
        refreshResult2.numberOfUpdatedSources,
        0,
        "Second run: No sources should be updated"
      );
      assert.strictEqual(
        refreshResult2.numberOfUpdatedNotes,
        0,
        "Second run: No notes should be updated"
      );
      assert.strictEqual(
        refreshedLangXlf2.transunit[0].target.textContent,
        "Die %1 muss 4 Ziffern enthalten.",
        "Second run: Translation should remain the same"
      );

      // Third run - verify stability
      const refreshResult3 = new RefreshResult();
      const refreshedLangXlf3 = XliffFunctions.refreshSelectedXlfFileFromGXlf(
        Xliff.fromString(refreshedLangXlf2.toString()),
        Xliff.fromString(gXlf.toString()),
        lfSettings,
        new Map<string, Map<string, string[]>[]>(),
        refreshResult3,
        false,
        settings
      );

      assert.strictEqual(
        refreshResult3.numberOfUpdatedSources,
        0,
        "Third run: No sources should be updated"
      );
      assert.strictEqual(
        refreshResult3.numberOfUpdatedNotes,
        0,
        "Third run: No notes should be updated"
      );
      assert.strictEqual(
        refreshedLangXlf3.transunit[0].target.textContent,
        "Die %1 muss 4 Ziffern enthalten.",
        "Third run: Translation should remain the same"
      );
    });
  }
);

// Helper functions to create test XLIFF files

function initialGXlfXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="TestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Label 1234567890" size-unit="char" translate="yes" xml:space="preserve">
          <source>The %1 must have 3 Digits.</source>
          <note from="Developer" annotates="general" priority="2">DEU="Die %1 muss 3 Ziffern enthalten."</note>
          <note from="Xliff Generator" annotates="general" priority="3">Label MustHaveThreeDigitsErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

function initialLangXlfXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="de-DE" original="TestApp.g.xlf">
    <body>
      <group id="body">
      </group>
    </body>
  </file>
</xliff>`;
}

function updatedGXlfXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="TestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Label 1234567890" size-unit="char" translate="yes" xml:space="preserve">
          <source>The %1 must have 4 Digits.</source>
          <note from="Developer" annotates="general" priority="2">DEU="Die %1 muss 4 Ziffern enthalten."</note>
          <note from="Xliff Generator" annotates="general" priority="3">Label MustHaveThreeDigitsErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

function newTransUnitGXlfXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="TestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Label 9876543210" size-unit="char" translate="yes" xml:space="preserve">
          <source>New label with translation</source>
          <note from="Developer" annotates="general" priority="2">DEU="Neues Label mit Übersetzung"</note>
          <note from="Xliff Generator" annotates="general" priority="3">Label NewLabelErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

function emptyLangXlfXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="de-DE" original="TestApp.g.xlf">
    <body>
      <group id="body">
      </group>
    </body>
  </file>
</xliff>`;
}
