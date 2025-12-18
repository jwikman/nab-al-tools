import * as assert from "assert";
import * as path from "path";
import * as fs from "graceful-fs";
import * as ALObjectTestLibrary from "../ALObjectTestLibrary";
import * as LanguageFunctions from "../../LanguageFunctions";
import { LanguageFunctionsSettings } from "../../Settings/LanguageFunctionsSettings";
import { SizeUnit, TransUnit, Xliff } from "../../Xliff/XLIFFDocument";
import * as ALParser from "../../ALObject/ALParser";
import { ALCodeLine } from "../../ALObject/ALCodeLine";
import { TranslationMode } from "../../Enums";
import * as SettingsLoader from "../../Settings/SettingsLoader";
import { workspace } from "vscode";
import { RefreshResult } from "../../RefreshResult";
import * as XliffFunctions from "../../XliffFunctions";
import { getAlObjectsFromCurrentWorkspace } from "../../WorkspaceFunctions";
import { getObjectFromTokens } from "../../XliffFunctions";

const testResourcesPath = "../../../src/test/resources/";

const testFiles = [
  // 'Base Application.sv-SE.xlf',
  "NAB_AL_Tools.da-DK.xlf",
  "NAB_AL_Tools.sv-SE.xlf",
];

suite("ALObject TransUnit Tests", function () {
  const langFilesUri: string[] = [];
  testFiles.forEach((f) => {
    const fromPath = path.resolve(__dirname, testResourcesPath, f);
    const toPath = path.resolve(__dirname, testResourcesPath, "temp", f);
    fs.copyFileSync(fromPath, toPath);
    langFilesUri.push(toPath);
  });
  test("XLF to AL Check", async function () {
    const testAppPath = path.join(__dirname, "../../../../test-app/Xliff-test");
    const gXlfFilePath = path.join(testAppPath, "Translations/Al.g.xlf");
    const settings = SettingsLoader.getSettings();
    const appManifest = SettingsLoader.getAppManifest();
    const alObjects = await getAlObjectsFromCurrentWorkspace(
      settings,
      appManifest,
      true
    );
    const gXlf = Xliff.fromFileSync(gXlfFilePath);
    let success = true;
    gXlf.transunit
      .filter(
        (x) =>
          x.id !== "Table 2794708188 - Field 1845925095 - Property 2879900210" // Does not have any caption, deliberately
      )
      .forEach((tu) => {
        try {
          const obj = getObjectFromTokens(alObjects, tu.getXliffIdTokenArray());
          const mlObjects = obj.getAllMultiLanguageObjects({
            onlyForTranslation: true,
          });
          const mlObject = mlObjects.find(
            (x) => x.xliffId().toLowerCase() === tu.id.toLowerCase()
          );
          if (!mlObject) {
            throw new Error("ML Object not found");
          }
        } catch {
          console.log(`Missing source: "${tu.id}"`);
          success = false;
        }
      });
    assert.ok(
      success,
      "There where some TransUnits that couldn't find it's source."
    );
  });

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

  test("Sort as g.xlf - External", function () {
    const translationMode = TranslationMode.external;

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
      ALParser.matchIndentationIncreased(
        new ALCodeLine(
          '                modify("Ongoing Sales Credit Memos") { Visible = true; }',
          0
        )
      ),
      false,
      "{ Visible = true; }"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine(
          "                column(CompanyName; CompanyName()) { }",
          0
        )
      ),
      false,
      "() { }"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine("            column(Source; GlobalSource) { }", 0)
      ),
      false,
      "{ }"
    );
    assert.strictEqual(
      ALParser.matchIndentationIncreased(
        new ALCodeLine(
          '                modify("Ongoing Sales Credit Memos") { Visible = true; } // My comment',
          0
        )
      ),
      false,
      "{ Visible = true; } // Comment"
    );
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
      ALParser.matchIndentationDecreased(
        new ALCodeLine(
          '                modify("Ongoing Sales Credit Memos") { Visible = true; }',
          0
        )
      ),
      false,
      "{ Visible = true; }"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(
        new ALCodeLine(
          "                column(CompanyName; CompanyName()) { }",
          0
        )
      ),
      false,
      "() { }"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(
        new ALCodeLine("            column(Source; GlobalSource) { }", 0)
      ),
      false,
      "{ }"
    );
    assert.strictEqual(
      ALParser.matchIndentationDecreased(
        new ALCodeLine(
          '                modify("Ongoing Sales Credit Memos") { Visible = true; } // My comment',
          0
        )
      ),
      false,
      "{ Visible = true; } // Comment"
    );
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
  test("hasEmptyBlock()", function () {
    assert.strictEqual(
      new ALCodeLine(
        "column(CompanyName; CompanyName()) { }",
        0
      ).hasEmptyBlock(),
      true,
      "Empty block in column"
    );
    assert.strictEqual(
      new ALCodeLine("column(Source; GlobalSource) { }", 0).hasEmptyBlock(),
      true,
      "Empty block in column without parameters"
    );
    assert.strictEqual(
      new ALCodeLine(" // column(Source; GlobalSource) { }", 0).hasEmptyBlock(),
      false,
      "Empty block in comment"
    );
  });

  test("Get Xliff Id from page with grid", function () {
    const gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getPageWithGrid(),
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
        <trans-unit id="Page 490015697 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Page With Grid</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page NAB With Grid - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 490015697 - Control 828292189 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Option</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page NAB With Grid - Control Option - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 490015697 - Control 1553686271 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Item Filter</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page NAB With Grid - Control ItemFilter - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 490015697 - Control 1553686271 - Property 1295455071" size-unit="char" translate="yes" xml:space="preserve">
          <source>Specifies the bla bla bla.</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page NAB With Grid - Control ItemFilter - Property ToolTip</note>
        </trans-unit>
        <trans-unit id="Page 490015697 - Control 739346273 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Lines</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page NAB With Grid - Control Group - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 490015697 - Control 1878130204 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Type</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page NAB With Grid - Control Type - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 490015697 - Control 3752523554 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>RecordLinks</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page NAB With Grid - Control RecordLinks - Property Caption</note>
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
        <trans-unit id="Report 529985455 - ReportLabel 2020178030" size-unit="char" translate="yes" xml:space="preserve">
          <source>Posting Date</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - ReportLabel PostingDateCaption</note>
        </trans-unit>
        <trans-unit id="Report 529985455 - ReportLabel 567180089" size-unit="char" translate="yes" xml:space="preserve">
          <source>Description</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Report NAB Test Report - ReportLabel DescCaption</note>
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
      path.resolve(__dirname, testResourcesPath, "customNotes.xlf")
    );
    const result: {
      lineNo: number;
      id: string;
    } = LanguageFunctions.getTransUnitID(12, document);
    assert.strictEqual(result.lineNo, 7, "TransUnit should be found");
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
  const settings = SettingsLoader.getSettings();
  const languageFunctionsSettings = new LanguageFunctionsSettings(settings);
  languageFunctionsSettings.translationMode = translationMode;
  const updatedXliff = XliffFunctions.refreshSelectedXlfFileFromGXlf(
    langXliff,
    gXliff,
    languageFunctionsSettings,
    new Map(),
    refreshResult,
    sortOnly,
    settings
  );
  return updatedXliff;
}
