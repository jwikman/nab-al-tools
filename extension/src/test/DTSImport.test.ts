import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import { CustomNoteType, TargetState, Xliff } from "../Xliff/XLIFFDocument";
import { TranslationMode } from "../Enums";
import * as SettingsLoader from "../Settings/SettingsLoader";
import * as XliffFunctions from "../XliffFunctions";

const testResourcesPath = "../../src/test/resources/";

const testFiles = [
  // 'Base Application.sv-SE.xlf',
  "NAB_AL_Tools.da-DK.xlf",
  "NAB_AL_Tools.sv-SE.xlf",
];

suite("DTS Import Tests", function () {
  const langFilesUri: string[] = [];
  testFiles.forEach((f) => {
    const fromPath = path.resolve(__dirname, testResourcesPath, f);
    const toPath = path.resolve(__dirname, testResourcesPath, "temp", f);
    fs.copyFileSync(fromPath, toPath);
    langFilesUri.push(toPath);
  });

  const sourceXliff = Xliff.fromString(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target state="translated" state-qualifier="mt-suggestion">,första,andra,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Type - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816496 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target state="translated" state-qualifier="mt-suggestion">första,andra,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target state="translated" state-qualifier="mt-suggestion"> ,första,andra,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable2 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 56816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,,third</source>
          <target state="translated" state-qualifier="mt-suggestion">,första,andra,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable3 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 5688856 - Field 187834404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>asdf @1@@@@@@@@@@@@ asd asdf asdf @2@@@@@@@@@@@@@@ asd adf asdf</source>
          <target state="translated" state-qualifier="mt-suggestion">asdf @1@@@@@@@@@@@@ asd asdf asdf @ 2@@@@@@@@@@@@@@ asd adf asdf</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable4 - Field Name - NamedType DialogMsg</note>
        </trans-unit>
        <trans-unit id="Table 56888556 - Field 187834404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>asdf @1@@@@@@@@@@@@ asd asdf asdf #2############## asd adf asdf</source>
          <target state="translated" state-qualifier="mt-suggestion">asdf @1@@@@@@@@@@@@ asd asdf asdf # 2############## asd adf asdf</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable5 - Field Name - NamedType DialogMsg</note>
        </trans-unit>
        <trans-unit id="Table 563816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,2nd,third</source>
          <target state="translated" state-qualifier="mt-suggestion">,första,,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 563814666 - Field 1878123503 - Property 62806969" translate="yes" xml:space="preserve">
          <source>Contract</source>
          <target state="translated" state-qualifier="mt-suggestion">Kontrakt</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - Property OptionCaption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`);
  const targetXliff = Xliff.fromString(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp.g.xlf">
    <body>
      <group id="body">
      </group>
    </body>
  </file>
</xliff>`);
  const settings = SettingsLoader.getSettings();
  const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
  languageFunctionsSettings.translationMode = TranslationMode.dts;
  test("Import Translation - Invalid translations", function () {
    XliffFunctions.importTranslatedFileIntoTargetXliff(
      sourceXliff,
      targetXliff,
      languageFunctionsSettings,
      settings.translationFolderPath
    ); // Only DTS is supported
    assert.strictEqual(
      targetXliff.transunit.length,
      8,
      "Unexpected number of trans units"
    );
    assert.strictEqual(
      targetXliff.transunit[0].hasCustomNote(CustomNoteType.refreshXlfHint),
      false,
      "Unexpected custom note"
    );
    assert.strictEqual(
      targetXliff.transunit[1].target.state,
      TargetState.needsReviewL10n,
      "Unexpected state 1"
    );
    assert.strictEqual(
      targetXliff.transunit[1].customNoteContent(CustomNoteType.refreshXlfHint),
      "source and target has different number of option captions.",
      "Unexpected custom note 1"
    );
    assert.strictEqual(
      targetXliff.transunit[2].target.state,
      TargetState.needsReviewL10n,
      "Unexpected state 2"
    );
    assert.strictEqual(
      targetXliff.transunit[2].customNoteContent(CustomNoteType.refreshXlfHint),
      'Option no. 0 of source is "", but the same option in target is " ". Empty Options must be empty in both source and target.',
      "Unexpected custom note 2"
    );
    assert.strictEqual(
      targetXliff.transunit[3].target.state,
      TargetState.needsReviewL10n,
      "Unexpected state 3"
    );
    assert.strictEqual(
      targetXliff.transunit[3].customNoteContent(CustomNoteType.refreshXlfHint),
      'Option no. 2 of source is "", but the same option in target is "andra". Empty Options must be empty in both source and target.',
      "Unexpected custom note 3"
    );
    assert.strictEqual(
      targetXliff.transunit[4].target.state,
      TargetState.needsReviewL10n,
      "Unexpected state 4"
    );
    assert.strictEqual(
      targetXliff.transunit[4].customNoteContent(CustomNoteType.refreshXlfHint),
      'The placeholder "@2@@@@@@@@@@@@@@" was found in source, but not in target.',
      "Unexpected custom note 4"
    );
    assert.strictEqual(
      targetXliff.transunit[5].target.state,
      TargetState.needsReviewL10n,
      "Unexpected state 5"
    );
    assert.strictEqual(
      targetXliff.transunit[5].customNoteContent(CustomNoteType.refreshXlfHint),
      'The placeholder "#2##############" was found in source, but not in target.',
      "Unexpected custom note 5"
    );
    assert.strictEqual(
      targetXliff.transunit[6].target.state,
      TargetState.needsReviewL10n,
      "Unexpected state 6"
    );
    assert.strictEqual(
      targetXliff.transunit[6].customNoteContent(CustomNoteType.refreshXlfHint),
      'Option no. 2 of source is "2nd", but the same option in target is "". Empty Options must be empty in both source and target.',
      "Unexpected custom note 6"
    );
  });
  test("Import Translation - Dictionary translations", function () {
    settings.useDictionaryInDTSImport = true;
    XliffFunctions.importTranslatedFileIntoTargetXliff(
      sourceXliff,
      targetXliff,
      languageFunctionsSettings,
      settings.translationFolderPath
    );
    assert.strictEqual(
      targetXliff.transunit[7].target.textContent,
      "Avtal",
      "Expected dictionary substitution of target"
    );
  });
});
