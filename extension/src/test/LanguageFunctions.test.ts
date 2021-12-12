import * as assert from "assert";
import * as path from "path";
import * as fs from "fs";
import * as xmldom from "@xmldom/xmldom";
import * as ALObjectTestLibrary from "./ALObjectTestLibrary";
import * as LanguageFunctions from "../LanguageFunctions";
import { LanguageFunctionsSettings } from "../Settings/LanguageFunctionsSettings";
import {
  CustomNoteType,
  Note,
  SizeUnit,
  TargetState,
  TranslationToken,
  TransUnit,
  Xliff,
} from "../Xliff/XLIFFDocument";
import * as ALParser from "../ALObject/ALParser";
import { ALCodeLine } from "../ALObject/ALCodeLine";
import { RefreshXlfHint, TranslationMode } from "../Enums";
import * as SettingsLoader from "../Settings/SettingsLoader";
import { random } from "lodash";
import { workspace } from "vscode";
import { RefreshResult } from "../RefreshResult";
import * as XliffFunctions from "../XliffFunctions";

const xmlns = "urn:oasis:names:tc:xliff:document:1.2";
const testResourcesPath = "../../src/test/resources/";
const dom = xmldom.DOMParser;
const gXlfPath: string = path.resolve(
  __dirname,
  testResourcesPath,
  "NAB_AL_Tools.g.xlf"
);
const gXlfDom = new dom().parseFromString(fs.readFileSync(gXlfPath, "UTF8"));
const testFiles = [
  // 'Base Application.sv-SE.xlf',
  "NAB_AL_Tools.da-DK.xlf",
  "NAB_AL_Tools.sv-SE.xlf",
];
const langFilesUri: string[] = [];
testFiles.forEach((f) => {
  const fromPath = path.resolve(__dirname, testResourcesPath, f);
  const toPath = path.resolve(__dirname, testResourcesPath, "temp", f);
  fs.copyFileSync(fromPath, toPath);
  langFilesUri.push(toPath);
});

const WORKFLOW = process.env.GITHUB_ACTION; // Only run in GitHub Workflow

suite("DTS Import Tests", function () {
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

suite("ALObject TransUnit Tests", function () {
  test("Refresh xlf - Detect Invalid Targets - NabTags", function () {
    const translationMode = TranslationMode.nabTags;

    const sortedXliff = refreshXlfOptionCaptions(translationMode, false);
    assert.strictEqual(
      sortedXliff.toString(false),
      `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target>[NAB: REVIEW],första,andra,tredje</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Source has been modified.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Type - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816496 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target>[NAB: REVIEW]första,andra,tredje</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">source and target has different number of option captions.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target>[NAB: REVIEW] ,första,andra,tredje</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Option no. 0 of source is "", but the same option in target is " ". Empty Options must be empty in both source and target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable2 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 56816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,,third</source>
          <target>[NAB: REVIEW],första,andra,tredje</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Option no. 2 of source is "", but the same option in target is "andra". Empty Options must be empty in both source and target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable3 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 5688856 - Field 187834404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>asdf @1@@@@@@@@@@@@ asd asdf asdf @2@@@@@@@@@@@@@@ asd adf asdf</source>
          <target>[NAB: REVIEW]asdf @1@@@@@@@@@@@@ asd asdf asdf @ 2@@@@@@@@@@@@@@ asd adf asdf</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">The placeholder "@2@@@@@@@@@@@@@@" was found in source, but not in target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable4 - Field Name - NamedType DialogMsg</note>
        </trans-unit>
        <trans-unit id="Table 56888556 - Field 187834404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>asdf @1@@@@@@@@@@@@ asd asdf asdf #2############## asd adf asdf</source>
          <target>[NAB: REVIEW]asdf @1@@@@@@@@@@@@ asd asdf asdf # 2############## asd adf asdf</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">The placeholder "#2##############" was found in source, but not in target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable5 - Field Name - NamedType DialogMsg</note>
        </trans-unit>
        <trans-unit id="Table 563816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,2nd,third</source>
          <target>[NAB: REVIEW],första,,tredje</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Option no. 2 of source is "2nd", but the same option in target is "". Empty Options must be empty in both source and target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 123816456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <target>[NAB: REVIEW]Felmeddelande %1, %2 %1%3% 4%1 asdf %1</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">The placeholder "%4" was found in source, but not in target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123416456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <target>[NAB: REVIEW]Felmeddelande %1, %2 %1%3%4 asdf %1</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">The placeholder "%1" was found in source 4 times, but 3 times in target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123446456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4 asdf %1</source>
          <target>[NAB: REVIEW]Felmeddelande %1, %2 %1%3%4 %5asdf %1</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">The placeholder "%5" was found in target 1 times, but was not found in source.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable8 - Field Name - NamedType MyErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`,
      "Unexpected refreshed xlf"
    );
  });

  test("Refresh xlf - Detect Invalid Targets - DTS", function () {
    const translationMode = TranslationMode.dts;

    const sortedXliff = refreshXlfOptionCaptions(translationMode, false);
    assert.strictEqual(
      sortedXliff.toString(false),
      `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target state="needs-review-translation">,första,andra,tredje</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Source has been modified.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Type - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816496 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target state="needs-review-l10n" state-qualifier="rejected-inaccurate">första,andra,tredje</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">source and target has different number of option captions.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target state="needs-review-l10n" state-qualifier="rejected-inaccurate"> ,första,andra,tredje</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Option no. 0 of source is "", but the same option in target is " ". Empty Options must be empty in both source and target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable2 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 56816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,,third</source>
          <target state="needs-review-l10n" state-qualifier="rejected-inaccurate">,första,andra,tredje</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Option no. 2 of source is "", but the same option in target is "andra". Empty Options must be empty in both source and target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable3 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 5688856 - Field 187834404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>asdf @1@@@@@@@@@@@@ asd asdf asdf @2@@@@@@@@@@@@@@ asd adf asdf</source>
          <target state="needs-review-l10n" state-qualifier="rejected-inaccurate">asdf @1@@@@@@@@@@@@ asd asdf asdf @ 2@@@@@@@@@@@@@@ asd adf asdf</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">The placeholder "@2@@@@@@@@@@@@@@" was found in source, but not in target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable4 - Field Name - NamedType DialogMsg</note>
        </trans-unit>
        <trans-unit id="Table 56888556 - Field 187834404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>asdf @1@@@@@@@@@@@@ asd asdf asdf #2############## asd adf asdf</source>
          <target state="needs-review-l10n" state-qualifier="rejected-inaccurate">asdf @1@@@@@@@@@@@@ asd asdf asdf # 2############## asd adf asdf</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">The placeholder "#2##############" was found in source, but not in target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable5 - Field Name - NamedType DialogMsg</note>
        </trans-unit>
        <trans-unit id="Table 563816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,2nd,third</source>
          <target state="needs-review-l10n" state-qualifier="rejected-inaccurate">,första,,tredje</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Option no. 2 of source is "2nd", but the same option in target is "". Empty Options must be empty in both source and target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 123816456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <target state="needs-review-l10n" state-qualifier="rejected-inaccurate">Felmeddelande %1, %2 %1%3% 4%1 asdf %1</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">The placeholder "%4" was found in source, but not in target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123416456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <target state="needs-review-l10n" state-qualifier="rejected-inaccurate">Felmeddelande %1, %2 %1%3%4 asdf %1</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">The placeholder "%1" was found in source 4 times, but 3 times in target.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123446456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4 asdf %1</source>
          <target state="needs-review-l10n" state-qualifier="rejected-inaccurate">Felmeddelande %1, %2 %1%3%4 %5asdf %1</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">The placeholder "%5" was found in target 1 times, but was not found in source.</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable8 - Field Name - NamedType MyErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`,
      "Unexpected refreshed xlf"
    );
  });

  test("Sort as g.xlf - NAB Tags", function () {
    const translationMode = TranslationMode.nabTags;

    const sortedXliff = refreshXlfOptionCaptions(translationMode, true);
    assert.strictEqual(
      sortedXliff.toString(false),
      `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third,modified</source>
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
        <trans-unit id="Table 123816456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <target state="translated" state-qualifier="mt-suggestion">Felmeddelande %1, %2 %1%3% 4%1 asdf %1</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123416456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <target state="translated" state-qualifier="mt-suggestion">Felmeddelande %1, %2 %1%3%4 asdf %1</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123446456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4 asdf %1</source>
          <target state="translated" state-qualifier="mt-suggestion">Felmeddelande %1, %2 %1%3%4 %5asdf %1</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable8 - Field Name - NamedType MyErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`,
      "Unexpected sorted xlf"
    );
  });

  test("Sort as g.xlf - DTS", function () {
    const translationMode = TranslationMode.dts;

    const sortedXliff = refreshXlfOptionCaptions(translationMode, true);
    assert.strictEqual(
      sortedXliff.toString(false),
      `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third,modified</source>
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
        <trans-unit id="Table 123816456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <target state="translated" state-qualifier="mt-suggestion">Felmeddelande %1, %2 %1%3% 4%1 asdf %1</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123416456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <target state="translated" state-qualifier="mt-suggestion">Felmeddelande %1, %2 %1%3%4 asdf %1</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123446456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4 asdf %1</source>
          <target state="translated" state-qualifier="mt-suggestion">Felmeddelande %1, %2 %1%3%4 %5asdf %1</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable8 - Field Name - NamedType MyErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`,
      "Unexpected sorted xlf"
    );
  });

  test("replaceSelfClosingTags(xml) with html tags", function () {
    const xml = `<?xml version="1.0" encoding="utf-8"?><xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd"><file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp"><body><group id="body"><trans-unit id="Codeunit 456387620 - NamedType 2350589126" size-unit="char" translate="yes" xml:space="preserve"><source>%1%1%1&lt;hr/&gt; &lt;!-- Swedish above, English below --&gt;%1%1%1</source><note from="Developer" annotates="general" priority="2"></note><note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Codeunit - NamedType MyLabel</note></trans-unit></group></body></file></xliff>`;

    const formattedXml = Xliff.replaceSelfClosingTags(xml);
    assert.strictEqual(formattedXml, xml);
  });

  test("Match indentation increase", function () {
    assert.strictEqual(
      ALParser.matchIndentationIncreased(new ALCodeLine("  begin", 0)),
      true,
      "  begin"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(new ALCodeLine("begin", 0)),
      true,
      "begin"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(new ALCodeLine("{", 0)),
      true,
      "{"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(new ALCodeLine("{ // comment", 0)),
      true,
      "{ // comment"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("if condition then begin", 0)
      ),
      true,
      "if condition then begin"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("      begin      ", 0)
      ),
      true,
      "      begin      "
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("begin   // Comment", 0)
      ),
      true,
      "begin   // Comment"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("foreach variable in list do begin", 0)
      ),
      true,
      "foreach variable in list do begin"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(new ALCodeLine("case variable of", 0)),
      true,
      "case variable of"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("case variable of // comment", 0)
      ),
      true,
      "case variabel of // comment"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(new ALCodeLine("else begin", 0)),
      true,
      "else begin"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(new ALCodeLine("end else begin", 0)),
      true,
      "end else begin"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("end else begin // Comment", 0)
      ),
      true,
      "end else begin // Comment"
    );

    assert.strictEqual(
      ALParser.matchIndentationIncreased(new ALCodeLine(" // { ", 0)),
      false,
      " // { "
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("// if condition then begin", 0)
      ),
      false,
      "// if condition then begin"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("//      begin      ", 0)
      ),
      false,
      "//      begin      "
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("//begin   // Comment", 0)
      ),
      false,
      "//begin   // Comment"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("//  whatever else begin", 0)
      ),
      false,
      "//  whatever else begin"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("// asdf end else begin", 0)
      ),
      false,
      "// asdf end else begin"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine(
          "// if tStripePrice.Id.StartsWith(price_) then begin // TODOX: Ska vi skippa plans här, eller ta med?",
          0
        )
      ),
      false,
      "// if tStripePrice.Id.StartsWith(price_) then begin // TODOX: Ska vi skippa plans här, eller ta med?"
    );
  });

  test("Match indentation decrease", function () {
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("end", 0)),
      true,
      "end"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("end;", 0)),
      true,
      "end;"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("}", 0)),
      true,
      "}"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("end // Comment", 0)),
      true,
      "end // Comment"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("end; // Comment", 0)),
      true,
      "end; // Comment"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("}", 0)),
      true,
      "}"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("} // Comment", 0)),
      true,
      "} // Comment"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("end else", 0)),
      true,
      "end else"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(
        new ALCodeLine("end else // Comment", 0)
      ),
      true,
      "end else // Comment"
    );

    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("// end", 0)),
      false,
      "// end"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("// }", 0)),
      false,
      "// }"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("// whatever end", 0)),
      false,
      "// whatever end"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(new ALCodeLine("// whatever }", 0)),
      false,
      "// whatever } "
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(
        new ALCodeLine(
          "// if tStripePrice.Id.StartsWith(price_) then begin // TODOX: Ska vi skippa plans här, eller ta med?",
          0
        )
      ),
      false,
      "// if tStripePrice.Id.StartsWith(price_) then begin // TODOX: Ska vi skippa plans här, eller ta med?"
    );
  });

  test("Get Xliff Id from cue page", function () {
    const gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getPageWithCuesAndActions(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const transUnits = alObj.getTransUnits();
    if (null !== transUnits) {
      XliffFunctions.updateGXlf(gXlfDoc, transUnits);
      assert.strictEqual(
        gXlfDoc.toString(true, true),
        `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Page 303888787 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Activities</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page Time Sheet Activities - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 303888787 - Control 1238438181 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>New entry</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page Time Sheet Activities - Control CueGroupName - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 303888787 - Action 4155090369 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>TheCaption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page Time Sheet Activities - Action Today - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 303888787 - Control 1861040219 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Another caption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page Time Sheet Activities - Control Time Sheets - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 303888787 - Action 742001001 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Third one</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page Time Sheet Activities - Action Set Up Cues - Property Caption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`
      );
    } else {
      assert.fail("No transunits identified");
    }
  });

  test("g.Xlf update Codeunit w/ overloads", function () {
    const gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCodeunitWithOverloads(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const transUnits = alObj.getTransUnits();
    if (null !== transUnits) {
      XliffFunctions.updateGXlf(gXlfDoc, transUnits);
      assert.strictEqual(
        gXlfDoc.toString(true, true),
        `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Codeunit 2101071581 - Method 1773360666 - NamedType 1061650423" size-unit="char" translate="yes" xml:space="preserve">
          <source>Local Test Label</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Overload - Method OverloadMethod1 - NamedType LocalTestLabelTxt</note>
        </trans-unit>
        <trans-unit id="Codeunit 2101071581 - Method 1773360666 - NamedType 3520316169" size-unit="char" translate="yes" xml:space="preserve">
          <source>Local Test Label 2</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Overload - Method OverloadMethod1 - NamedType LocalTestLabel2Txt</note>
        </trans-unit>
        <trans-unit id="Codeunit 2101071581 - Method 4155238111 - NamedType 1061650423" size-unit="char" translate="yes" xml:space="preserve">
          <source>Local Test Label</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Overload - Method OverloadMethod2 - NamedType LocalTestLabelTxt</note>
        </trans-unit>
        <trans-unit id="Codeunit 2101071581 - Method 1531241278 - NamedType 1061650423" size-unit="char" translate="yes" xml:space="preserve">
          <source>Local Test Label</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Overload - Method TestMethodInTheMiddle - NamedType LocalTestLabelTxt</note>
        </trans-unit>
        <trans-unit id="Codeunit 2101071581 - Method 4155238111 - NamedType 3520316169" size-unit="char" translate="yes" xml:space="preserve">
          <source>Local Test Label 2</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Overload - Method OverloadMethod2 - NamedType LocalTestLabel2Txt</note>
        </trans-unit>
        <trans-unit id="Codeunit 2101071581 - NamedType 2688233357" size-unit="char" translate="yes" xml:space="preserve">
          <source>Global Test Label</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Overload - NamedType GlobalTestLabelTxt</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`
      );
    } else {
      assert.fail("No transunits identified");
    }
  });

  test("g.Xlf update Report", function () {
    const gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getReport(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const transUnits = alObj.getTransUnits();
    if (null !== transUnits) {
      XliffFunctions.updateGXlf(gXlfDoc, transUnits);
      assert.strictEqual(
        gXlfDoc.toString(true, true),
        `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Report 529985455 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Report</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - Property Caption</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - ReportDataItem 205381422 - Property 1806354803" size-unit="char" translate="yes" xml:space="preserve">
          <source>sdfa</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - ReportDataItem DataItemName - Property RequestFilterHeading</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - ReportColumn 967337907 - Property 2879900210" maxwidth="50" size-unit="char" translate="yes" xml:space="preserve">
          <source>Column</source>
          <note from="Developer" annotates="general" priority="2">ColumnComment</note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - ReportColumn ColumnName - Property Caption</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - ReportColumn 967337907 - Property 62802879" size-unit="char" translate="yes" xml:space="preserve">
          <source>asd,asdf</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - ReportColumn ColumnName - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - Control 4105281732 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Grp</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - Control GroupName - Property Caption</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - Control 4105281732 - Property 1968111052" size-unit="char" translate="yes" xml:space="preserve">
          <source>Instructions</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - Control GroupName - Property InstructionalText</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - Control 3731481282 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Fld</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - Control Fld - Property Caption</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - Control 3731481282 - Property 62802879" size-unit="char" translate="yes" xml:space="preserve">
          <source>1234,34,43</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - Control Fld - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - Control 3731481282 - Property 1295455071" size-unit="char" translate="yes" xml:space="preserve">
          <source>Tooltip</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - Control Fld - Property ToolTip</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - Control 3731481282 - Method 2699620902 - NamedType 1061650423" size-unit="char" translate="yes" xml:space="preserve">
          <source>Local Test Label</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - Control Fld - Method OnAssistEdit - NamedType LocalTestLabelTxt</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - Control 3731481282 - Method 2699620902 - NamedType 725422852" size-unit="char" translate="yes" xml:space="preserve">
          <source>Hello World!</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - Control Fld - Method OnAssistEdit - NamedType HelloWorldTxt</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - Action 1692444235 - Method 1377591017 - NamedType 1061650423" size-unit="char" translate="yes" xml:space="preserve">
          <source>Local Test Label</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - Action ActionName - Method OnAction - NamedType LocalTestLabelTxt</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - RequestPage 2516438534 - Method 4177352842 - NamedType 1126472184" size-unit="char" translate="yes" xml:space="preserve">
          <source>This report cannot be scheduled</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - RequestPage RequestOptionsPage - Method OnQueryClosePage - NamedType ReportCannotBeScheduledErr</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - Method 1968185403 - NamedType 1061650423" size-unit="char" translate="yes" xml:space="preserve">
          <source>Local Test Label</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - Method TestMethod - NamedType LocalTestLabelTxt</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - NamedType 2688233357" size-unit="char" translate="yes" xml:space="preserve">
          <source>Global Test Label</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - NamedType GlobalTestLabelTxt</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`
      );
    } else {
      assert.fail("No transunits identified");
    }
  });

  test("g.Xlf update XmlPort", function () {
    const gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getXmlPort(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const transUnits = alObj.getTransUnits();
    if (null !== transUnits) {
      XliffFunctions.updateGXlf(gXlfDoc, transUnits);
      assert.strictEqual(
        gXlfDoc.toString(true, true),
        `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="XmlPort 3951249077 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>The Caption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">XmlPort NAB Test XmlPort - Property Caption</note>
        </trans-unit>
        <trans-unit id="XmlPort 3951249077 - XmlPortNode 3374928249 - Method 828199545 - NamedType 1704108872" size-unit="char" translate="yes" xml:space="preserve">
          <source>ChangeLog.Type %1 not supported</source>
          <note from="Developer" annotates="general" priority="2">%1 = Type (Inserted, Modified, Deleted)</note>
          <note from="Xliff Generator" annotates="general" priority="3">XmlPort NAB Test XmlPort - XmlPortNode TypeOfChange - Method OnBeforePassVariable - NamedType ChangeLogTypeNotSupportedErr</note>
        </trans-unit>
        <trans-unit id="XmlPort 3951249077 - XmlPortNode 2961552353 - Method 257022829 - NamedType 1704108872" size-unit="char" translate="yes" xml:space="preserve">
          <source>ChangeLog.Type %1 not supported</source>
          <note from="Developer" annotates="general" priority="2">%1 = Type (Inserted, Modified, Deleted)</note>
          <note from="Xliff Generator" annotates="general" priority="3">XmlPort NAB Test XmlPort - XmlPortNode Name - Method OnBeforePassField - NamedType ChangeLogTypeNotSupportedErr</note>
        </trans-unit>
        <trans-unit id="XmlPort 3951249077 - XmlPortNode 2235475591 - Method 828199545 - NamedType 1704108872" size-unit="char" translate="yes" xml:space="preserve">
          <source>ChangeLog.Type %1 not supported</source>
          <note from="Developer" annotates="general" priority="2">%1 = Type (Inserted, Modified, Deleted)</note>
          <note from="Xliff Generator" annotates="general" priority="3">XmlPort NAB Test XmlPort - XmlPortNode TypeOfChange2 - Method OnBeforePassVariable - NamedType ChangeLogTypeNotSupportedErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`
      );
    } else {
      assert.fail("No transunits identified");
    }
  });

  test("g.Xlf update with html tags", function () {
    const gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCodeunitWithHtmlTags(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const transUnits = alObj.getTransUnits();
    if (null !== transUnits) {
      XliffFunctions.updateGXlf(gXlfDoc, transUnits);
      assert.strictEqual(
        gXlfDoc.toString(true, true),
        `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Codeunit 456387620 - NamedType 2350589126" size-unit="char" translate="yes" xml:space="preserve">
          <source>%1%1%1&lt;hr/&gt; &lt;!-- Swedish above, English below --&gt;%1%1%1</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Codeunit - NamedType MyLabel</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`
      );
    } else {
      assert.fail("No transunits identified");
    }
  });

  test("Labels with apostrophes", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCodeunitWithApostrophes(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const transUnits = alObj.getTransUnits();
    if (null !== transUnits) {
      assert.strictEqual(
        transUnits.length,
        1,
        "Unexpected number of trans-units"
      );
      assert.strictEqual(
        transUnits[0].toString(),
        `<trans-unit id="Codeunit 456387620 - NamedType 613788221" size-unit="char" translate="yes" xml:space="preserve"><source>'%1' can't be the same as '%2'</source><note from="Developer" annotates="general" priority="2">%1 = Field Caption 1, %2 = Field Caption 2</note><note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Codeunit - NamedType CantBeTheSameAsErr</note></trans-unit>`
      );
    } else {
      assert.fail("No trans-units identified");
    }
  });

  test("trans-unit with apostrophes", function () {
    const tu = new TransUnit(
      "Table 2541146604 - NamedType 613788221",
      true,
      `'%1' can't be the same as '%2'`,
      undefined,
      SizeUnit.char,
      "preserve"
    );
    assert.strictEqual(
      tu.toString(),
      `<trans-unit id="Table 2541146604 - NamedType 613788221" size-unit="char" translate="yes" xml:space="preserve"><source>'%1' can't be the same as '%2'</source></trans-unit>`
    );
  });

  test("g.Xlf update with empty string", function () {
    const gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getPageWithEmptyString(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const transUnits = alObj.getTransUnits();
    if (null !== transUnits) {
      XliffFunctions.updateGXlf(gXlfDoc, transUnits);
      assert.strictEqual(
        gXlfDoc.toString(true, true),
        `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Page 2931038265 - Control 4105281732 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source> </source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Control GroupName - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - Control 4105281732 - Property 1968111052" size-unit="char" translate="yes" xml:space="preserve">
          <source> </source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Control GroupName - Property InstructionalText</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - Control 2961552353 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source> </source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Control Name - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - Control 2961552353 - Property 1295455071" size-unit="char" translate="yes" xml:space="preserve">
          <source> </source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Control Name - Property ToolTip</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`
      );
    } else {
      assert.fail("No transunits identified");
    }
  });

  test("g.Xlf update", function () {
    const gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getTable(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const transUnits = alObj.getTransUnits();
    if (null !== transUnits) {
      XliffFunctions.updateGXlf(gXlfDoc, transUnits);
      assert.strictEqual(
        gXlfDoc.toString(true, true),
        `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>My Table Caption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>My Field Caption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064" size-unit="char" translate="yes" xml:space="preserve">
          <source>OnValidate Error</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Method OnValidate - NamedType TestOnValidateErr</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - Field 3945078064 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>My Field 2 Caption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField2 - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - Field 2443090863 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>MyFieldOption - Caption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyFieldOption - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - Field 2443090863 - Property 62802879" size-unit="char" translate="yes" xml:space="preserve">
          <source> ,asdf,erew,fieldOptionCaption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyFieldOption - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR in table</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`
      );
    } else {
      assert.fail("No transunits identified");
    }
  });

  test("Table TransUnits", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getTable(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const transUnits = alObj.getTransUnits();
    if (null !== transUnits) {
      assert.strictEqual(
        transUnits.length,
        7,
        "Unexpected number of trans units"
      );
      let expectedTransUnit =
        '<trans-unit id="Table 2328808854 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>My Field Caption</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Property Caption</note></trans-unit>';
      assert.strictEqual(transUnits[1].toString(), expectedTransUnit);
      expectedTransUnit =
        '<trans-unit id="Table 2328808854 - Field 3945078064 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>My Field 2 Caption</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField2 - Property Caption</note></trans-unit>';
      assert.strictEqual(transUnits[3].toString(), expectedTransUnit);
      expectedTransUnit =
        '<trans-unit id="Table 2328808854 - Field 2443090863 - Property 62802879" size-unit="char" translate="yes" xml:space="preserve"><source> ,asdf,erew,fieldOptionCaption</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyFieldOption - Property OptionCaption</note></trans-unit>';
      assert.strictEqual(transUnits[5].toString(), expectedTransUnit);
      expectedTransUnit =
        '<trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve"><source>This is a test ERROR in table</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note></trans-unit>';
      assert.strictEqual(transUnits[6].toString(), expectedTransUnit);
    } else {
      assert.fail("No transunits identified");
    }
  });
  test("findSourceOfCurrentTranslationUnit with custom note", async function () {
    const document = await workspace.openTextDocument(
      path.resolve(__dirname, "../../src/test/resources/customNotes.xlf")
    );
    const result: {
      lineNo: number;
      id: string;
    } = LanguageFunctions.getTransUnitID(12, document);
    assert.strictEqual(result.lineNo, 7, "TransUnit should be found");
  });
});

suite("Language Functions Tests", function () {
  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  test("findNextUntranslatedText()", async function () {
    const foundMatch = await LanguageFunctions.findNextUntranslatedText(
      settings,
      appManifest,
      false,
      false
    );
    assert.ok(foundMatch, "Expected a match");
    assert.ok(foundMatch.position > 0, "Expected position to be > 0");
    assert.ok(foundMatch.length > 0, "Expected length to be > 0");
  });

  test("revealTransUnitTarget()", async function () {
    const actualTransUnit = await LanguageFunctions.revealTransUnitTarget(
      "Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064",
      langFilesUri[1]
    );
    const expected = {
      position: 1000,
      length: 28,
    };
    assert.ok(actualTransUnit, "Expected trans-unit to be found");
    assert.ok(actualTransUnit.filePath.endsWith(testFiles[1]));
    assert.strictEqual(
      actualTransUnit.position,
      expected.position,
      "Unexpected position"
    );
    assert.strictEqual(
      actualTransUnit.length,
      expected.length,
      "Unexpected length."
    );
  });

  test("zipXlfFiles()", async function () {
    if (!WORKFLOW) {
      this.skip();
    }
    const dtsWorkFolderPath = path.join(__dirname, "temp/dts");
    await LanguageFunctions.zipXlfFiles(
      settings,
      appManifest,
      dtsWorkFolderPath
    );
    const zipFiles = fs.readdirSync(dtsWorkFolderPath, { withFileTypes: true });
    assert.strictEqual(zipFiles.length, 3, "Unexpected number of zip-files");
    const expectedFiles = [
      {
        name: "Al.da-dk.zip",
      },
      {
        name: "Al.g.zip",
      },
      {
        name: "Al.sv-se.zip",
      },
    ];
    zipFiles.forEach((z) => {
      assert.ok(
        expectedFiles.find((zip) => zip.name === z.name),
        `New file exported ${z.name}. Is this correct?`
      );
    });
  });

  test("allUntranslatedSearchParameters()", function () {
    const settings = SettingsLoader.getSettings();
    const languageFunctionSettings = new LanguageFunctionsSettings(settings);
    const expectedDefault = {
      searchStrings: [
        "\\[NAB: NOT TRANSLATED\\]",
        "\\[NAB: SUGGESTION\\]",
        "\\[NAB: REVIEW\\]",
      ],
      fileFilter: "",
    };
    assert.deepStrictEqual(
      LanguageFunctions.allUntranslatedSearchParameters(
        languageFunctionSettings
      ),
      expectedDefault,
      "Unexpected default result"
    );

    // Search only xlf files
    expectedDefault.fileFilter = "*.xlf";
    languageFunctionSettings.searchOnlyXlfFiles = true;
    assert.deepStrictEqual(
      LanguageFunctions.allUntranslatedSearchParameters(
        languageFunctionSettings
      ),
      expectedDefault,
      "Test of searchOnlyXlfFiles setting failed."
    );

    // External Translation Tool
    languageFunctionSettings.searchOnlyXlfFiles = false;
    languageFunctionSettings.useExternalTranslationTool = true;
    const expectedExternal = {
      searchStrings: [
        'state="needs-adaptation"',
        'state="needs-l10n"',
        'state="needs-review-adaptation"',
        'state="needs-review-l10n"',
        'state="needs-review-translation"',
        'state="needs-translation"',
        'state="new"',
      ],
      fileFilter: "",
    };
    assert.deepStrictEqual(
      LanguageFunctions.allUntranslatedSearchParameters(
        languageFunctionSettings
      ),
      expectedExternal,
      "Unexpected result when using external translation tool"
    );
  });

  test("findMultipleTargetsSearchParameters", function () {
    const settings = SettingsLoader.getSettings();
    const languageFunctionSettings = new LanguageFunctionsSettings(settings);
    const expected = {
      searchStrings: ["^\\s*<target>.*\\r*\\n*(\\s*<target>.*)+"],
      fileFilter: "",
    };
    assert.deepStrictEqual(
      LanguageFunctions.findMultipleTargetsSearchParameters(
        languageFunctionSettings
      ),
      expected,
      "Unexpected default result"
    );

    // External translation Tool
    languageFunctionSettings.useExternalTranslationTool = true;
    expected.fileFilter = "*.xlf";
    assert.deepStrictEqual(
      LanguageFunctions.findMultipleTargetsSearchParameters(
        languageFunctionSettings
      ),
      expected,
      "Unexpected result when using external translation tool"
    );
  });

  test("RefreshResult.isChanged()", function () {
    let refreshResult = new RefreshResult();
    assert.strictEqual(
      refreshResult.isChanged,
      false,
      "Initialized RefreshResult should not be considered changed"
    );
    refreshResult.numberOfCheckedFiles = 2;
    assert.strictEqual(
      refreshResult.isChanged,
      false,
      "RefreshResult with numberOfCheckedFiles > 0 should not be considered changed"
    );
    refreshResult.numberOfRemovedNotes = random(1, 1000, false);
    assert.strictEqual(
      refreshResult.isChanged,
      true,
      "RefreshResult should be considered changed"
    );
    refreshResult = new RefreshResult();
    refreshResult.numberOfReviewsAdded = random(1, 1000, false);
    assert.strictEqual(
      refreshResult.isChanged,
      true,
      "RefreshResult should be considered changed"
    );
  });

  test("LoadMatchXlfIntoMap()", function () {
    /*
     *   - Test with Xlf that has [NAB:* ] tokens
     *   - Assert matchMap does not contain [NAB: *] tokens
     */
    const _dom = xmldom.DOMParser;
    const matchMap = XliffFunctions.loadMatchXlfIntoMap(
      new _dom().parseFromString(ALObjectTestLibrary.getXlfHasNABTokens()),
      xmlns
    );
    assert.notStrictEqual(
      matchMap.size,
      0,
      "matchMap.size should not equal 0."
    );
    assert.strictEqual(matchMap.size, 1, "matchMap.size should equal 1.");
    assert.strictEqual(
      matchMap.get("No Token")?.values().next().value,
      "No Token"
    );
    assert.notStrictEqual(
      matchMap.get("Has Token")?.values().next().value,
      "[NAB: SUGGESTION]Has Token"
    );
  });

  test("GetXlfMatchMap()", function () {
    /*
     *   - Test with Xlf that has [NAB:* ] tokens
     *   - Assert matchMap does not contain [NAB: *] tokens
     */
    const xlfDoc: Xliff = Xliff.fromString(
      ALObjectTestLibrary.getXlfHasNABTokens()
    );
    const matchMap = XliffFunctions.getXlfMatchMap(xlfDoc);
    assert.notStrictEqual(
      matchMap.size,
      0,
      "matchMap.size should not equal 0."
    );
    assert.strictEqual(matchMap.size, 1, "matchMap.size should equal 1.");
    assert.strictEqual(
      matchMap.get("No Token")?.values().next().value,
      "No Token"
    );
    assert.notStrictEqual(
      matchMap.get("Has Token")?.values().next().value,
      "[NAB: SUGGESTION]Has Token"
    );
  });

  test("matchTranslation()", async function () {
    /*
     *   Test with Xlf that has multiple matching sources
     *   - Assert already translated targets does not receive [NAB: SUGGESTION] token.
     *   - Assert all matching sources gets suggestion in target.
     *   Test with Xlf that has [NAB: SUGGESTION] tokens
     *   - Assert matched sources has [NAB: SUGGESTION] tokens
     *   - Assert non matching sources is unchanged.
     */
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionsSettings.translationMode = TranslationMode.nabTags;

    let xlfDoc: Xliff = Xliff.fromString(
      ALObjectTestLibrary.getXlfHasMatchingSources()
    );
    let matchResult = XliffFunctions.matchTranslations(
      xlfDoc,
      languageFunctionsSettings
    );
    assert.strictEqual(
      matchResult,
      2,
      "NumberOfMatchedTranslations should equal 2"
    );
    assert.notStrictEqual(
      xlfDoc.transunit[0].targets.length,
      0,
      "No targets in trans-unit."
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Has Token",
      "Unexpected textContent"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.textContent,
      "Has Token",
      "Unexpected textConstant"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.translationToken,
      TranslationToken.suggestion,
      "Expected token [NAB: SUGGESTION]"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.textContent,
      "Has Token",
      "Unexpected textConstant 2"
    );
    assert.strictEqual(
      xlfDoc.transunit[2].target.translationToken,
      TranslationToken.suggestion,
      "Expected token [NAB: SUGGESTION] 2"
    );
    xlfDoc = Xliff.fromString(ALObjectTestLibrary.getXlfHasNABTokens());
    matchResult = XliffFunctions.matchTranslations(
      xlfDoc,
      languageFunctionsSettings
    );
    assert.strictEqual(
      matchResult,
      0,
      "NumberOfMatchedTranslations should equal 0"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Has Token",
      "Unexpected textConstant 0"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.translationToken,
      TranslationToken.suggestion,
      "Expected token [NAB: SUGGESTION] 0"
    );

    assert.notStrictEqual(
      xlfDoc.transunit[1].targets.length,
      0,
      "No targets in trans-unit."
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.textContent,
      "No Token",
      "Unexpected textContent 3"
    );
    assert.strictEqual(
      xlfDoc.transunit[1].target.translationToken,
      undefined,
      "Unexpected token 3"
    );
  });

  test("matchTranslationsFromTranslationMap()", async function () {
    /*
     *   Test with Xlf that has multiple matching sources
     *   - Assert already translated targets does not receive [NAB: SUGGESTION] token.
     *   - Assert all matching sources gets suggestion in target.
     *   Test with Xlf that has [NAB: SUGGESTION] tokens
     *   - Assert matched sources has [NAB: SUGGESTION] tokens
     *   - Assert non matching sources is unchanged.
     */
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionsSettings.translationMode = TranslationMode.nabTags;
    const xlfDoc: Xliff = Xliff.fromString(
      ALObjectTestLibrary.getXlfWithContextBasedMultipleMatchesInBaseApp()
    );
    const matchMap: Map<string, string[]> = new Map<string, string[]>();
    matchMap.set("State", ["Tillstånd", "Status", "Delstat"]);
    const matchResult = XliffFunctions.matchTranslationsFromTranslationMap(
      xlfDoc,
      matchMap,
      languageFunctionsSettings
    );
    assert.strictEqual(
      matchResult,
      3,
      "Number of matched translations should equal 3"
    );
    assert.notStrictEqual(
      xlfDoc.transunit[0].targets.length,
      0,
      "No targets in trans-unit."
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets.length,
      3,
      "Expected 3 targets."
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.textContent,
      "Tillstånd",
      "Unexpected textContent 0"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].target.translationToken,
      TranslationToken.suggestion,
      "Unexpected token 0"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets[1].textContent,
      "Status",
      "Unexpected textContent 1"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets[1].translationToken,
      TranslationToken.suggestion,
      "Unexpected token 1"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets[2].textContent,
      "Delstat",
      "Unexpected textContent 2"
    );
    assert.strictEqual(
      xlfDoc.transunit[0].targets[2].translationToken,
      TranslationToken.suggestion,
      "Unexpected token 2"
    );
  });

  test("Run __RefreshXlfFilesFromGXlf() x2", async function () {
    /**
     * Tests:
     *  - Trans-units has been inserted.
     *  - Trans-units has been removed.
     */
    const sortOnly = false;

    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    languageFunctionsSettings.translationMode = TranslationMode.nabTags;
    languageFunctionsSettings.useMatchingSetting = true;

    const refreshResult1 = await XliffFunctions._refreshXlfFilesFromGXlf({
      gXlfFilePath: gXlfPath,
      langFiles: langFilesUri,
      languageFunctionsSettings,
      sortOnly,
    });
    assert.strictEqual(
      refreshResult1.numberOfAddedTransUnitElements,
      24,
      "Unexpected NumberOfAddedTransUnitElements."
    ); // 1. trans-units has been inserted
    assert.strictEqual(
      refreshResult1.numberOfCheckedFiles,
      langFilesUri.length,
      "NumberOfCheckedFiles should equal the length of langFiles[]."
    );
    assert.strictEqual(
      refreshResult1.numberOfRemovedTransUnits,
      0,
      "NumberOfRemovedTransUnits should equal 0."
    );
    assert.strictEqual(
      refreshResult1.numberOfUpdatedMaxWidths,
      0,
      "NumberOfUpdatedMaxWidths should equal 0."
    );
    assert.strictEqual(
      refreshResult1.numberOfUpdatedNotes,
      0,
      "NumberOfUpdatedNotes should equal 0."
    );
    assert.strictEqual(
      refreshResult1.numberOfUpdatedSources,
      4,
      "Unexpected NumberOfUpdatedSources."
    ); // 2. trans-units has been removed

    // The function so nice you test it twice
    const refreshResult2 = await XliffFunctions._refreshXlfFilesFromGXlf({
      gXlfFilePath: gXlfPath,
      langFiles: langFilesUri,
      languageFunctionsSettings,
      sortOnly,
    });
    assert.strictEqual(
      refreshResult2.numberOfAddedTransUnitElements,
      0,
      "2. No new trans-units should have been inserted."
    );
    assert.strictEqual(
      refreshResult2.numberOfCheckedFiles,
      refreshResult1.numberOfCheckedFiles,
      "2. NumberOfCheckedFiles should be the same as last run."
    );
    assert.strictEqual(
      refreshResult2.numberOfRemovedTransUnits,
      0,
      "2. NumberOfRemovedTransUnits should equal 0."
    );
    assert.strictEqual(
      refreshResult2.numberOfUpdatedMaxWidths,
      0,
      "2. NumberOfUpdatedMaxWidths should equal 0."
    );
    assert.strictEqual(
      refreshResult2.numberOfUpdatedNotes,
      0,
      "2. NumberOfUpdatedNotes should equal 0."
    );
    assert.strictEqual(
      refreshResult2.numberOfUpdatedSources,
      0,
      "2. NumberOfUpdatedSources should equal 0."
    );
  });

  test("No multiple NAB-tokens in refreshed files", function () {
    assert.strictEqual(
      noMultipleNABTokensInXliff(ALObjectTestLibrary.getXlfMultipleNABTokens()),
      false,
      "Fail check for multiple [NAB: *] tokens."
    );
    langFilesUri.forEach((lf) => {
      assert.strictEqual(
        noMultipleNABTokensInXliff(fs.readFileSync(lf, "UTF8")),
        true,
        "There should never be more than 1 [NAB: * ] token in target."
      );
    });
  });

  test("Trans-units are sorted", function () {
    /**
     * Tests;
     *  - Trans-units has been sorted.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    langFilesUri.forEach((lf) => {
      transUnitsAreSorted(
        new dom().parseFromString(fs.readFileSync(lf, "UTF8"))
      );
    });
  });

  test("translate=no has been skipped", function () {
    /**
     * Tests:
     *  - Trans-units with attribute translate=no has been skipped.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Table 2328808854 - Field 1296262074 - Property 2879900210";
    langFilesUri.forEach((lf) => {
      const targetLangDom = new dom().parseFromString(
        fs.readFileSync(lf, "UTF8")
      );
      assert.strictEqual(targetLangDom.getElementById(transUnitId), null);
    });
  });

  test("Blank source", function () {
    /**
     * Tests:
     *  - Trans-units: Blank source.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Table 2328808854 - Field 3945078064 - Property 2879900210";
    langFilesUri.forEach((lf) => {
      const targetLangDom = new dom().parseFromString(
        fs.readFileSync(lf, "UTF8")
      );
      const transUnit = targetLangDom.getElementById(transUnitId);
      assert.strictEqual(
        transUnit?.getElementsByTagName("source")[0].textContent,
        transUnit?.getElementsByTagName("target")[0].textContent,
        "Unexpected behaviour with blank source element."
      );
    });
  });

  test("Targets are inserted before notes", function () {
    /**
     * Tests:
     *  - Trans-units: Targets are inserted before notes.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */

    langFilesUri.forEach((lf) => {
      const targetLangDom = new dom().parseFromString(
        fs.readFileSync(lf, "UTF8")
      );
      const targetTransUnits = targetLangDom.getElementsByTagNameNS(
        xmlns,
        "trans-unit"
      );
      for (let i = 0; i < targetTransUnits.length; i++) {
        const unitElementNames = [];
        const unitNodes = targetTransUnits[i].childNodes;
        for (let n = 0; n < unitNodes.length; n++) {
          // Could not find a reliable way to skip #text and #comments
          const node = unitNodes[n];
          if (
            node.nodeType !== node.TEXT_NODE &&
            node.nodeType !== node.COMMENT_NODE
          ) {
            unitElementNames.push(unitNodes[n].nodeName);
          }
        }
        assert.strictEqual(unitElementNames[0], "source", ``);
        assert.strictEqual(unitElementNames[1], "target");
      }
    });
  });

  test("Missing targets are inserted", function () {
    /**
     * Tests:
     *  - Trans-units with missing targets are inserted.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Table 2328808854 - Field 2443090863 - Property 2879900210";
    langFilesUri.forEach((lf) => {
      const targetLangDom = new dom().parseFromString(
        fs.readFileSync(lf, "UTF8")
      );
      const transUnit = targetLangDom.getElementById(transUnitId);
      assert.notStrictEqual(
        transUnit?.getElementsByTagName("target"),
        null,
        "Missing <target> should be inserted."
      );
      assert.strictEqual(
        transUnit
          ?.getElementsByTagName("target")[0]
          .textContent?.includes(TranslationToken.notTranslated),
        true,
        "Not translated token missing."
      );
    });
  });
  test("Change in <source> inserts review", function () {
    /**
     * Tests:
     *  - Change in <source> from g.xlf gets [NAB: Review] token.
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064";
    langFilesUri.forEach((lf) => {
      const targetLangDom = new dom().parseFromString(
        fs.readFileSync(lf, "UTF8")
      );
      const transUnit = targetLangDom.getElementById(transUnitId);
      assert.strictEqual(
        transUnit
          ?.getElementsByTagName("target")[0]
          .textContent?.includes(TranslationToken.review),
        true,
        "Change in source should insert review token."
      );
    });
  });

  test("Change in <source> inserts a custom note", function () {
    /**
     * Tests:
     *  - Change in <source> from g.xlf gets a note
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064";
    langFilesUri.forEach((lf) => {
      const targetXliff = Xliff.fromFileSync(lf);
      const transUnit = targetXliff.getTransUnitById(transUnitId);

      assert.strictEqual(
        transUnit.customNote(CustomNoteType.refreshXlfHint)?.textContent,
        RefreshXlfHint.modifiedSource,
        "Unexpected custom note"
      );
    });
  });
  test("Translated text has no custom note", function () {
    /**
     * Tests:
     *  - A translated text gets its custom note removed
     *
     * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
     */
    const transUnitId =
      "Page 2931038265 - Control 4105281732 - Property 1968111052";
    langFilesUri.forEach((lf) => {
      const targetXliff = Xliff.fromFileSync(lf);
      const transUnit = targetXliff.getTransUnitById(transUnitId);

      assert.strictEqual(
        transUnit.hasCustomNote(CustomNoteType.refreshXlfHint),
        false,
        "Should not have custom note"
      );
    });
  });

  test("Missing targets inserts custom note", function () {
    /**
     * Tests:
     *  - Trans-units with missing targets gets a note
     */
    const transUnitId =
      "Table 2328808854 - Field 2443090863 - Property 2879900210";
    langFilesUri.forEach((lf) => {
      const targetXliff = Xliff.fromFileSync(lf);
      const transUnit = targetXliff.getTransUnitById(transUnitId);

      assert.strictEqual(
        transUnit.customNote(CustomNoteType.refreshXlfHint)?.textContent,
        RefreshXlfHint.new,
        "Unexpected custom note"
      );
    });
  });

  test("existingTargetLanguages()", async function () {
    const existingTargetLanguages = await XliffFunctions.existingTargetLanguageCodes(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest()
    );
    assert.strictEqual(
      existingTargetLanguages?.length,
      2,
      "Expected 2 target languages to be found"
    );
  });

  test("findNearestWordMatch()", function () {
    const expectedPosition = 601;
    const searchResult = LanguageFunctions.findNearestWordMatch(
      ALObjectTestLibrary.getXlfHasNABTokens(),
      0,
      [
        TranslationToken.review,
        TranslationToken.notTranslated,
        TranslationToken.suggestion,
      ]
    );
    assert.strictEqual(
      searchResult.foundNode,
      true,
      "Expected word to be found"
    );
    assert.strictEqual(
      searchResult.foundAtPosition,
      expectedPosition,
      `Expected word to be found at postion ${expectedPosition}`
    );
    assert.strictEqual(
      searchResult.foundWord,
      "[NAB: SUGGESTION]",
      "Unexpected word found"
    );
  });

  test("findNearestMultipleTargets()", function () {
    const expectedPosition = 1105;
    const searchResult = LanguageFunctions.findNearestMultipleTargets(
      ALObjectTestLibrary.getXlfMultipleTargets(),
      0
    );
    assert.strictEqual(
      searchResult.foundNode,
      true,
      "Expected word to be found"
    );
    assert.strictEqual(
      searchResult.foundAtPosition,
      expectedPosition,
      `Expected word to be found at postion ${expectedPosition}`
    );
    assert.strictEqual(
      searchResult.foundWord,
      `                <target>OnValidate Error</target>
                <target>OnValidate Error</target>`
    );
  });

  test("Insert custom note if source is empty", function () {
    const gXliff = Xliff.fromString(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
    <body>    
      <group id="body">
        <trans-unit id="Table 123416456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>   </source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>      
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>   </source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Type - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816496 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source> </source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable2 - Field Name - Property OptionCaption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`);
    gXliff._path = `/whatever/${gXliff.original}.g.xlf`;

    const langXliff = Xliff.fromString(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>   </source>
          <target state="translated" state-qualifier="mt-suggestion">Translated string with empty source</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Type - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target state="translated" state-qualifier="mt-suggestion"> ,första,andra,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable2 - Field Name - Property OptionCaption</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`);
    const refreshResult = new RefreshResult();
    const languageFunctionsSettings = new LanguageFunctionsSettings(
      SettingsLoader.getSettings()
    );
    const updatedXliff = XliffFunctions.refreshSelectedXlfFileFromGXlf(
      langXliff,
      gXliff,
      languageFunctionsSettings,
      new Map(),
      refreshResult,
      false
    );
    let customNotes = updatedXliff.transunit[0].getNoteFrom(
      CustomNoteType.refreshXlfHint
    );
    customNotes =
      customNotes !== undefined ? customNotes : [new Note("", "", 0, "")];
    assert.strictEqual(
      customNotes[0].textContent,
      RefreshXlfHint.emptySource,
      "Unexpected note textContent"
    );
  });

  test("LanguageFunctionSettings DTS", function () {
    const settings = SettingsLoader.getSettings();
    settings.setDtsExactMatchToState = "test";
    settings.useDTS = true;
    const langFuncSettings = new LanguageFunctionsSettings(settings);
    assert.strictEqual(
      langFuncSettings.exactMatchState,
      "test" as TargetState,
      "Expeted (keep) as Targetstate"
    );
    assert.strictEqual(
      langFuncSettings.translationMode,
      TranslationMode.dts,
      "Expected tranlation mode to be set to DTS"
    );
  });

  test("LanguageFunctionSettings EXTERNAL", function () {
    const settings = SettingsLoader.getSettings();
    settings.useDTS = false;
    settings.useExternalTranslationTool = true;
    const langFuncSettings = new LanguageFunctionsSettings(settings);

    assert.strictEqual(
      langFuncSettings.translationMode,
      TranslationMode.external,
      "Expected tranlation mode to be set to DTS"
    );
  });

  test("RefreshResult.getReport", function () {
    const refreshResult = new RefreshResult();
    refreshResult.numberOfAddedTransUnitElements = 1;
    refreshResult.numberOfUpdatedNotes = 1;
    refreshResult.numberOfUpdatedMaxWidths = 1;
    refreshResult.numberOfUpdatedSources = 1;
    refreshResult.numberOfRemovedTransUnits = 1;
    refreshResult.numberOfRemovedNotes = 1;
    refreshResult.numberOfCheckedFiles = 1;
    refreshResult.numberOfSuggestionsAdded = 1;
    refreshResult.numberOfReviewsAdded = 1;
    refreshResult.fileName = "Test.xlf";

    assert.strictEqual(
      refreshResult.getReport(),
      `1 inserted translations, 1 updated maxwidth, 1 updated notes, 1 removed notes, 1 updated sources, 1 removed translations, 1 added suggestions in 1 XLF files`,
      "Unexpected report from RefreshResult"
    );
    refreshResult.numberOfCheckedFiles = 0;
    assert.strictEqual(
      refreshResult.getReport(),
      `1 inserted translations, 1 updated maxwidth, 1 updated notes, 1 removed notes, 1 updated sources, 1 removed translations, 1 added suggestions in Test.xlf`,
      "Expected filename in report from RefreshResult"
    );
    refreshResult.numberOfAddedTransUnitElements = 0;
    refreshResult.numberOfUpdatedNotes = 0;
    refreshResult.numberOfUpdatedMaxWidths = 0;
    refreshResult.numberOfUpdatedSources = 0;
    refreshResult.numberOfRemovedTransUnits = 0;
    refreshResult.numberOfRemovedNotes = 0;
    refreshResult.numberOfCheckedFiles = 0;
    refreshResult.numberOfSuggestionsAdded = 0;
    refreshResult.numberOfReviewsAdded = 0;
    refreshResult.fileName = undefined;
    assert.strictEqual(
      refreshResult.getReport(),
      "Nothing changed",
      "Expected 'Nothing changed'"
    );
  });
});

function refreshXlfOptionCaptions(
  translationMode: TranslationMode,
  sortOnly: boolean
): Xliff {
  const gXliff = Xliff.fromString(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Type - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816496 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable2 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 56816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,,third</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable3 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 5688856 - Field 187834404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>asdf @1@@@@@@@@@@@@ asd asdf asdf @2@@@@@@@@@@@@@@ asd adf asdf</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable4 - Field Name - NamedType DialogMsg</note>
        </trans-unit>
        <trans-unit id="Table 56888556 - Field 187834404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>asdf @1@@@@@@@@@@@@ asd asdf asdf #2############## asd adf asdf</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable5 - Field Name - NamedType DialogMsg</note>
        </trans-unit>
        <trans-unit id="Table 563816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,2nd,third</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 123816456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123416456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123446456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4 asdf %1</source>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable8 - Field Name - NamedType MyErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`);
  gXliff._path = `/whatever/${gXliff.original}.g.xlf`;

  const langXliff = Xliff.fromString(`<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp.g.xlf">
    <body>
      <group id="body">
        <trans-unit id="Table 745816496 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target state="translated" state-qualifier="mt-suggestion">första,andra,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816496 - Field 1878130204 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third,modified</source>
          <target state="translated" state-qualifier="mt-suggestion">,första,andra,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field Type - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 745816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,second,third</source>
          <target state="translated" state-qualifier="mt-suggestion"> ,första,andra,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable2 - Field Name - Property OptionCaption</note>
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
        <trans-unit id="Table 56816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,,third</source>
          <target state="translated" state-qualifier="mt-suggestion">,första,andra,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable3 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 563816456 - Field 1878123404 - Property 62802879" translate="yes" xml:space="preserve">
          <source>,first,2nd,third</source>
          <target state="translated" state-qualifier="mt-suggestion">,första,,tredje</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 123816456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <target state="translated" state-qualifier="mt-suggestion">Felmeddelande %1, %2 %1%3% 4%1 asdf %1</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123416456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4%1 asdf %1</source>
          <target state="translated" state-qualifier="mt-suggestion">Felmeddelande %1, %2 %1%3%4 asdf %1</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable6 - Field Name - NamedType MyErr</note>
        </trans-unit>
        <trans-unit id="Table 123446456 - Field 1878123404 - NamedType 62802879" translate="yes" xml:space="preserve">
          <source>Error message %1, %2 %1%3%4 asdf %1</source>
          <target state="translated" state-qualifier="mt-suggestion">Felmeddelande %1, %2 %1%3%4 %5asdf %1</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable8 - Field Name - NamedType MyErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`);
  const refreshResult = new RefreshResult();
  const languageFunctionsSettings = new LanguageFunctionsSettings(
    SettingsLoader.getSettings()
  );
  languageFunctionsSettings.translationMode = translationMode;
  const updatedXliff = XliffFunctions.refreshSelectedXlfFileFromGXlf(
    langXliff,
    gXliff,
    languageFunctionsSettings,
    new Map(),
    refreshResult,
    sortOnly
  );
  return updatedXliff;
}

function noMultipleNABTokensInXliff(xliff: string): boolean {
  const tokenRegEx = /\[NAB:/gm;
  const targetLangDom = new dom().parseFromString(xliff);
  const transUnitNodes = targetLangDom.getElementsByTagNameNS(
    xmlns,
    "trans-unit"
  );
  for (let i = 0; i < transUnitNodes.length; i++) {
    const targetElm = transUnitNodes[i].getElementsByTagName("target")[0];
    if (targetElm.textContent !== null) {
      const foundTokens = targetElm.textContent.match(tokenRegEx);
      if (foundTokens === null) {
        continue;
      }
      if (foundTokens.length > 1) {
        return false;
      }
    }
  }
  return true;
}

function transUnitsAreSorted(xlfDom: Document): void {
  const gXlfTransUnits: Element[] = [];
  const targetTransUnits = xlfDom.getElementsByTagNameNS(xmlns, "trans-unit");
  // Remove Translate = No. There must be a better way?!
  for (
    let i = 0;
    i < gXlfDom.getElementsByTagNameNS(xmlns, "trans-unit").length;
    i++
  ) {
    if (
      gXlfDom
        .getElementsByTagNameNS(xmlns, "trans-unit")
        [i].attributes.getNamedItem("translate")
        ?.nodeValue?.toLowerCase() !== "no"
    ) {
      gXlfTransUnits.push(
        gXlfDom.getElementsByTagNameNS(xmlns, "trans-unit")[i]
      );
    }
  }
  for (let i = 0; i < gXlfTransUnits.length; i++) {
    const gTU = gXlfTransUnits[i];
    const targetTU = targetTransUnits[i];
    assert.strictEqual(
      gTU.attributes.getNamedItem("id")?.nodeValue,
      targetTU.attributes.getNamedItem("id")?.nodeValue
    );
  }
}
