import * as assert from 'assert';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as xmldom from 'xmldom';

import * as ALObjectTestLibrary from './ALObjectTestLibrary';
import * as LanguageFunctions from '../LanguageFunctions';
import { SizeUnit, TransUnit, Xliff } from '../XLIFFDocument';
import { ALObject } from '../ALObject';

const xmlns = 'urn:oasis:names:tc:xliff:document:1.2';
const testResourcesPath = '../../src/test/resources/';
const dom = xmldom.DOMParser;
let gXlfUri: vscode.Uri = vscode.Uri.file(path.resolve(__dirname, testResourcesPath, 'NAB_AL_Tools.g.xlf'));
let gXlfDom = new dom().parseFromString(fs.readFileSync(gXlfUri.fsPath, 'UTF8'));
let testFiles = [
    // 'Base Application.sv-SE.xlf',
    'NAB_AL_Tools.da-DK.xlf',
    'NAB_AL_Tools.sv-SE.xlf',
];
let langFilesUri: vscode.Uri[] = [];
testFiles.forEach(f => {
    let fromPath = path.resolve(__dirname, testResourcesPath, f);
    let toPath = path.resolve(__dirname, testResourcesPath, 'temp', f);
    fs.copyFileSync(fromPath, toPath);
    langFilesUri.push(vscode.Uri.file(toPath));
});



suite("ALObject TransUnit Tests", function () {

    test("replaceSelfClosingTags(xml) with html tags", function () {
        let xml = `<?xml version="1.0" encoding="utf-8"?><xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd"><file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp"><body><group id="body"><trans-unit id="Codeunit 456387620 - NamedType 2350589126" size-unit="char" translate="yes" xml:space="preserve"><source>%1%1%1&lt;hr/&gt; &lt;!-- Swedish above, English below --&gt;%1%1%1</source><note from="Developer" annotates="general" priority="2"></note><note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Codeunit - NamedType MyLabel</note></trans-unit></group></body></file></xliff>`;

        let formattedXml = Xliff.replaceSelfClosingTags(xml);
        assert.equal(formattedXml,xml);

    });

    test("g.Xlf update with html tags", function () {
        let gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
        let alObj: ALObject = new ALObject(ALObjectTestLibrary.getCodeunitWithHtmlTags(), true);
        let transUnits = alObj.getTransUnits();
        if (null !== transUnits) {
            LanguageFunctions.updateGXlf(gXlfDoc, transUnits);
            assert.equal(gXlfDoc.toString(true, true), `<?xml version="1.0" encoding="utf-8"?>
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
</xliff>`);
        } else {
            assert.fail('No transunits identified');
        }
    });

    test("Labels with apostrophes", function () {
        let alObj: ALObject = new ALObject(ALObjectTestLibrary.getCodeunitWithApostrophes(), true);
        let transUnits = alObj.getTransUnits();
        if (null !== transUnits) {
            assert.equal(transUnits.length, 1, 'Unexpected number of trans-units');
            assert.equal(transUnits[0].toString(), `<trans-unit id="Codeunit 456387620 - NamedType 613788221" size-unit="char" translate="yes" xml:space="preserve"><source>'%1' can't be the same as '%2'</source><note from="Developer" annotates="general" priority="2">%1 = Field Caption 1, %2 = Field Caption 2</note><note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Codeunit - NamedType CantBeTheSameAsErr</note></trans-unit>`);
        } else {
            assert.fail('No trans-units identified');
        }
    });


    test("trans-unit with apostrophes", function () {
        let tu = new TransUnit('Table 2541146604 - NamedType 613788221', true, `'%1' can't be the same as '%2'`, undefined, SizeUnit.char, 'preserve');
        assert.equal(tu.toString(), `<trans-unit id="Table 2541146604 - NamedType 613788221" size-unit="char" translate="yes" xml:space="preserve"><source>'%1' can't be the same as '%2'</source></trans-unit>`);
    });


    test("g.Xlf update with empty string", function () {
        let gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
        let alObj: ALObject = new ALObject(ALObjectTestLibrary.getPageWithEmptyString(), true);
        let transUnits = alObj.getTransUnits();
        if (null !== transUnits) {
            LanguageFunctions.updateGXlf(gXlfDoc, transUnits);
            assert.equal(gXlfDoc.toString(true, true), `<?xml version="1.0" encoding="utf-8"?>
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
</xliff>`);
        } else {
            assert.fail('No transunits identified');
        }
    });

    test("g.Xlf update", function () {
        let gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
        let alObj: ALObject = new ALObject(ALObjectTestLibrary.getTable(), true);
        let transUnits = alObj.getTransUnits();
        if (null !== transUnits) {
            LanguageFunctions.updateGXlf(gXlfDoc, transUnits);
            assert.equal(gXlfDoc.toString(true, true), `<?xml version="1.0" encoding="utf-8"?>
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
</xliff>`);
        } else {
            assert.fail('No transunits identified');
        }
    });

    test("Table TransUnits", function () {
        let alObj: ALObject = new ALObject(ALObjectTestLibrary.getTable(), true);
        let transUnits = alObj.getTransUnits();
        if (null !== transUnits) {
            assert.equal(transUnits.length, 6, 'Unexpected number of trans units');
            let expectedTransUnit = '<trans-unit id="Table 2328808854 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>My Field Caption</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Property Caption</note></trans-unit>';
            assert.equal(transUnits[1].toString(), expectedTransUnit);
            expectedTransUnit = '<trans-unit id="Table 2328808854 - Field 3945078064 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>My Field 2 Caption</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField2 - Property Caption</note></trans-unit>';
            assert.equal(transUnits[2].toString(), expectedTransUnit);
            expectedTransUnit = '<trans-unit id="Table 2328808854 - Field 2443090863 - Property 62802879" size-unit="char" translate="yes" xml:space="preserve"><source> ,asdf,erew,fieldOptionCaption</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyFieldOption - Property OptionCaption</note></trans-unit>';
            assert.equal(transUnits[4].toString(), expectedTransUnit);
            expectedTransUnit = '<trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve"><source>This is a test ERROR in table</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note></trans-unit>';
            assert.equal(transUnits[5].toString(), expectedTransUnit);
        } else {
            assert.fail('No transunits identified');
        }
    });
});

suite("MlProperty Matching Tests", function () {

    test("MatchMlPropertyCommentLocked()", function () {
        let line = `Caption = 'The Caption Text', MaxLength = 250, Comment = 'A comment', Locked = true;`;
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 250);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyMaxLengthComment()", function () {
        let line = `Caption = 'The Caption Text', MaxLength = 250, Comment = 'A comment';`;
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 250);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyMaxLengthLocked()", function () {
        let line = `Caption = 'The Caption Text', maxlength = 128, locked = true;`;
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, 128);
        } else {
            assert.fail('MlProperty not identified');
        }
    });


    test("MatchMlPropertyCommentLockedMaxLength()", function () {
        let line = `Caption = 'The Caption Text', Comment = 'A comment', Locked=true, MaxLength = 123;`;
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyCommentMaxLengthLocked()", function () {
        let line = `Caption = 'The Caption Text', Comment = 'A comment', MaxLength = 123, Locked=true;`;
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });



    test("MatchMlPropertyEmpty()", function () {
        let line = 'Caption = \'\';';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, '');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, 0);
        } else {
            assert.fail('MlProperty not identified');
        }
    });


    test("MatchMlPropertyLockedUpper()", function () {
        let line = 'Caption = \'Text\', Locked = TRUE;';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'Text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, 0);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyEmptyLocked()", function () {
        let line = 'Caption = \'\', Locked = true;';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, '');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, 0);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyCommentApostrophe()", function () {
        let line = 'Caption = \'The Caption\'\'s text\',Comment = \'A comment\'\'s text\', MaxLength = 123;';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, `The Caption's text`);
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, `A comment's text`);
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyApostrophe()", function () {
        let line = 'Caption = \'The Caption\'\'s text\',Comment = \'A comment\', MaxLength = 123;';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, `The Caption's text`);
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyMaxLength()", function () {
        let line = 'Caption = \'The Caption text\', MaxLength = 123;';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyCommentMaxLength()", function () {
        let line = 'Caption = \'The Caption text\',Comment = \'A comment\', MaxLength = 123;';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyLockedCommentMaxLength()", function () {
        let line = 'Caption = \'The Caption text\', Locked=true, Comment = \'A comment\', MaxLength = 123;';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 123);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyLockedComment()", function () {
        let line = 'Caption = \'The Caption text\', Locked=true, Comment = \'A comment\';';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 0);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyComment()", function () {
        let line = 'Caption = \'The Caption text\', Comment = \'A comment\';';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, 'A comment');
            assert.equal(MlProperty.maxLength, 0);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyNotLocked()", function () {
        let line = 'Caption = \'The Caption text\', Locked = false;';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, 0);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlPropertyLocked()", function () {
        let line = 'Caption = \'The Caption text\', Locked = true;';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, true);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, 0);
        } else {
            assert.fail('MlProperty not identified');
        }
    });

    test("MatchMlProperty()", function () {
        let line = 'Caption = \'The Caption text\';';
        let MlProperty = ALObject.getMlProperty(line);
        if (null !== MlProperty) {
            assert.equal(MlProperty.text, 'The Caption text');
            assert.equal(MlProperty.name, 'Caption');
            assert.equal(MlProperty.locked, false);
            assert.equal(MlProperty.comment, '');
            assert.equal(MlProperty.maxLength, 0);
        } else {
            assert.fail('MlProperty not identified');
        }
    });
});



suite("Label Matching Tests", function () {

    test("MatchLabelMultipleApostropheComment()", function () {
        let line = `UomDoesNotExistErr: Label '%1 ''%2'' does not exist for %3 ''%4''.\\Add %5=''%2'' as %1 or use another %6', Comment = '%1=Item Unit of Measure/Resource Unit of Measure, %2=UnitOfMeasureCode, %3=Resource/Item, %4=Item/Resource No., %5=Code, %6=Unit of Measure Code. Sample: "Item Unit of Measure ''HOUR'' does not exist for Item ''1000''.\\Add Code=''HOUR'' as Item Unit of Measure or use another Unit of Measure Code"';`;
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, `%1 '%2' does not exist for %3 '%4'.\\Add %5='%2' as %1 or use another %6`);
            assert.equal(label.name, 'UomDoesNotExistErr');
            assert.equal(label.locked, false);
            assert.equal(label.comment, `%1=Item Unit of Measure/Resource Unit of Measure, %2=UnitOfMeasureCode, %3=Resource/Item, %4=Item/Resource No., %5=Code, %6=Unit of Measure Code. Sample: "Item Unit of Measure 'HOUR' does not exist for Item '1000'.\\Add Code='HOUR' as Item Unit of Measure or use another Unit of Measure Code"`);
            assert.equal(label.maxLength, 0);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelHtmlTags()", function () {
        let line = `MyLabel: Label '%1%1%1<hr/> <!-- Swedish above, English below -->%1%1%1', Locked = true;`;
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, '%1%1%1<hr/> <!-- Swedish above, English below -->%1%1%1');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, 0);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelEmpty()", function () {
        let line = 'MyLabel: label \'\';';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, '');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, 0);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelEmptyLocked()", function () {
        let line = 'MyLabel: label \'\', Locked = true;';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, '');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, 0);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelMaxLength()", function () {
        let line = 'MyLabel: label \'The Label Text\', MaxLength = 123;';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });


    test("MatchLabelApostrophe2()", function () {
        let line = `MyLabel: Label '''%1'' can''t be the same as ''%2''',Comment = 'A comment', MaxLength = 123;`;
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, `'%1' can't be the same as '%2'`);
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });


    test("MatchLabelApostrophe()", function () {
        let line = 'MyLabel: label \'The Label\'\'s text\',Comment = \'A comment\', MaxLength = 123;';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, `The Label's text`);
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelCommentApostrophe()", function () {
        let line = 'MyLabel: label \'The Label\'\'s text\',Comment = \'A comment\'\'s text\', MaxLength = 123;';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, `The Label's text`);
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, `A comment's text`);
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelCommentLocked()", function () {
        let line = `MyLabel: label 'The Label Text', MaxLength = 250, Comment = 'A comment', Locked = true;`;
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 250);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelMaxLengthComment()", function () {
        let line = `MyLabel: label 'The Label Text', MaxLength = 250, Comment = 'A comment';`;
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 250);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelMaxLengthLocked()", function () {
        let line = `MyLabel: label 'The Label Text', maxlength = 128, locked = true;`;
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, 128);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelCommentMaxLength()", function () {
        let line = `MyLabel: label 'The Label Text',Comment = 'A comment', MaxLength = 123;`;
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });
    test("MatchLabelCommentLockedMaxLength()", function () {
        let line = 'MyLabel: label \'The Label Text\', Comment = \'A comment\', Locked=true, MaxLength = 123;';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelCommentMaxLengthLocked()", function () {
        let line = 'MyLabel: label \'The Label Text\', Comment = \'A comment\', MaxLength = 123, Locked=true;';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });



    test("MatchLabelLockedCommentMaxLength()", function () {
        let line = 'MyLabel: label \'The Label Text\', Locked=true, Comment = \'A comment\', MaxLength = 123;';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 123);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelLockedComment()", function () {
        let line = 'MyLabel: label \'The Label Text\', Locked=true, Comment = \'A comment\';';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 0);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelComment()", function () {
        let line = 'MyLabel: label \'The Label Text\', Comment = \'A comment\';';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, 'A comment');
            assert.equal(label.maxLength, 0);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelNotLocked()", function () {
        let line = 'MyLabel: label \'The Label Text\', Locked = false;';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, 0);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabelLocked()", function () {
        let line = 'MyLabel: label \'The Label Text\', Locked = true;';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, true);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, 0);
        } else {
            assert.fail('Label not identified');
        }
    });

    test("MatchLabel()", function () {
        let line = 'MyLabel: label \'The Label Text\';';
        let label = ALObject.getLabel(line);
        if (null !== label) {
            assert.equal(label.text, 'The Label Text');
            assert.equal(label.name, 'MyLabel');
            assert.equal(label.locked, false);
            assert.equal(label.comment, '');
            assert.equal(label.maxLength, 0);
        } else {
            assert.fail('Label not identified');
        }
    });
});

suite("Language Functions Tests", function () {

    test("LoadMatchXlfIntoMap()", function () {
        /* 
        *   - Test with Xlf that has [NAB:* ] tokens 
        *   - Assert matchMap does not contain [NAB: *] tokens
        */
        let dom = xmldom.DOMParser;
        let matchMap = LanguageFunctions.loadMatchXlfIntoMap(new dom().parseFromString(ALObjectTestLibrary.getXlfHasNABTokens()), xmlns);
        assert.notEqual(matchMap.size, 0, 'matchMap.size should not equal 0.');
        assert.equal(matchMap.size, 1, 'matchMap.size should equal 1.');
        assert.equal(matchMap.get("No Token")?.values().next().value, "No Token");
        assert.notEqual(matchMap.get('Has Token')?.values().next().value, '[NAB: SUGGESTION]Has Token');
    });

    test("GetXlfMatchMap()", function () {
        /* 
        *   - Test with Xlf that has [NAB:* ] tokens 
        *   - Assert matchMap does not contain [NAB: *] tokens
        */
        let xlfDoc: Xliff = Xliff.fromString(ALObjectTestLibrary.getXlfHasNABTokens());
        let matchMap = LanguageFunctions.getXlfMatchMap(xlfDoc);
        assert.notEqual(matchMap.size, 0, 'matchMap.size should not equal 0.');
        assert.equal(matchMap.size, 1, 'matchMap.size should equal 1.');
        assert.equal(matchMap.get("No Token")?.values().next().value, "No Token");
        assert.notEqual(matchMap.get('Has Token')?.values().next().value, '[NAB: SUGGESTION]Has Token');
    });

    test("MatchTranslation()", async function () {
        /* 
        *   Test with Xlf that has multiple matching sources
        *   - Assert already translated targets does not receive [NAB: SUGGESTION] token.
        *   - Assert all matching sources gets suggestion in target.
        *   Test with Xlf that has [NAB: SUGGESTION] tokens
        *   - Assert matched sources has [NAB: SUGGESTION] tokens
        *   - Assert non matching sources is unchanged.
        */
        let xlfDoc: Xliff = Xliff.fromString(ALObjectTestLibrary.GetXlfHasMatchingSources());
        let matchResult = LanguageFunctions.matchTranslations(xlfDoc);
        assert.equal(matchResult, 2, 'NumberOfMatchedTranslations should equal 2');
        assert.equal(xlfDoc.transunit[0].target?.textContent, 'Has Token', 'Unexpected textContent');
        assert.equal(xlfDoc.transunit[1].target?.textContent, '[NAB: SUGGESTION]Has Token', 'Expected token [NAB: SUGGESTION]');
        assert.equal(xlfDoc.transunit[2].target?.textContent, '[NAB: SUGGESTION]Has Token', 'Expected token [NAB: SUGGESTION]');
        xlfDoc = Xliff.fromString(ALObjectTestLibrary.getXlfHasNABTokens());
        matchResult = LanguageFunctions.matchTranslations(xlfDoc);
        assert.equal(matchResult, 0, 'NumberOfMatchedTranslations should equal 0');
        assert.equal(xlfDoc.transunit[0].target?.textContent, '[NAB: SUGGESTION]Has Token', 'Expected token [NAB: SUGGESTION]');
        assert.equal(xlfDoc.transunit[1].target?.textContent, 'No Token', 'Unexpected textContent');
    });

    test("Run __RefreshXlfFilesFromGXlf() x2", async function () {
        /**
         * Tests:
         *  - Trans-units has been inserted.
         *  - Trans-units has been removed.
         */
        let useExternalTranslationTool = false;
        let useMatching = true;
        let sortOnly = false;

        let refreshResult1 = await LanguageFunctions.__refreshXlfFilesFromGXlf(gXlfUri, langFilesUri, useExternalTranslationTool, useMatching, sortOnly);
        assert.equal(refreshResult1.NumberOfAddedTransUnitElements, 26, 'Unexpected NumberOfAddedTransUnitElements.'); // 1. trans-units has been inserted
        assert.equal(refreshResult1.NumberOfCheckedFiles, langFilesUri.length, 'NumberOfCheckedFiles should equal the length of langFiles[].');
        assert.equal(refreshResult1.NumberOfRemovedTransUnits, 0, 'NumberOfRemovedTransUnits should equal 0.');
        assert.equal(refreshResult1.NumberOfUpdatedMaxWidths, 0, 'NumberOfUpdatedMaxWidths should equal 0.');
        assert.equal(refreshResult1.NumberOfUpdatedNotes, 0, 'NumberOfUpdatedNotes should equal 0.');
        assert.equal(refreshResult1.NumberOfUpdatedSources, 4, 'Unexpected NumberOfUpdatedSources.'); // 2. trans-units has been removed

        // The function so nice you test it twice
        let refreshResult2 = await LanguageFunctions.__refreshXlfFilesFromGXlf(gXlfUri, langFilesUri, useExternalTranslationTool, useMatching, sortOnly);
        assert.equal(refreshResult2.NumberOfAddedTransUnitElements, 0, 'No new trans-units should have been inserted.');
        assert.equal(refreshResult2.NumberOfCheckedFiles, refreshResult1.NumberOfCheckedFiles, 'NumberOfCheckedFiles should be the same as last run.');
        assert.equal(refreshResult2.NumberOfRemovedTransUnits, 0, 'NumberOfRemovedTransUnits should equal 0.');
        assert.equal(refreshResult2.NumberOfUpdatedMaxWidths, 0, 'NumberOfUpdatedMaxWidths should equal 0.');
        assert.equal(refreshResult2.NumberOfUpdatedNotes, 0, 'NumberOfUpdatedNotes should equal 0.');
        assert.equal(refreshResult2.NumberOfUpdatedSources, 0, 'NumberOfUpdatedSources should equal 0.');
    });

    test("No multiple NAB-tokens in refreshed files", function () {
        assert.equal(noMultipleNABTokensInXliff(ALObjectTestLibrary.getXlfMultipleNABTokens()), false, 'Fail check for multiple [NAB: *] tokens.');
        langFilesUri.forEach(lf => {
            assert.equal(noMultipleNABTokensInXliff(fs.readFileSync(lf.fsPath, 'UTF8')), true, 'There should never be more than 1 [NAB: * ] token in target.');
        });
    });

    test("Trans-units are sorted", function () {
        /**
         * Tests;
         *  - Trans-units has been sorted.
         */
        langFilesUri.forEach(lf => {
            transUnitsAreSorted(new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8')));
        });
    });

    test("translate=no has been skipped", function () {
        /**
         * Tests:
         *  - Trans-units with attribute translate=no has been skipped.
         */
        //TODO: Loop gXlf?
        let transUnitId = 'Table 2328808854 - Field 1296262074 - Property 2879900210';
        langFilesUri.forEach(lf => {
            let targetLangDom = new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8'));
            assert.equal(targetLangDom.getElementById(transUnitId), null);
        });
    });

    test("Blank source", function () {
        /**
        * Tests:
        *  - Trans-units: Blank source.
        */
        let transUnitId = 'Table 2328808854 - Field 3945078064 - Property 2879900210';
        langFilesUri.forEach(lf => {
            let targetLangDom = new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8'));
            let transUnit = targetLangDom.getElementById(transUnitId);
            assert.equal(transUnit?.getElementsByTagName('source')[0].textContent, transUnit?.getElementsByTagName('target')[0].textContent, 'Unexpected behaviour with blank source element.');
        });
    });
    test("Targets are inserted before notes", function () {
        /**
        * Tests:
        *  - Trans-units: Targets are inserted before notes.
        */

        langFilesUri.forEach(lf => {
            let targetLangDom = new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8'));
            let targetTransUnits = targetLangDom.getElementsByTagNameNS(xmlns, 'trans-unit');
            for (let i = 0; i < targetTransUnits.length; i++) {
                let unitElementNames = [];
                let unitNodes = targetTransUnits[i].childNodes;
                for (let n = 0; n < unitNodes.length; n++) {
                    // Could not find a reliable way to skip #text and #comments
                    let node = unitNodes[n];
                    if (node.nodeType !== node.TEXT_NODE && node.nodeType !== node.COMMENT_NODE) {
                        unitElementNames.push(unitNodes[n].nodeName);
                    }
                }
                assert.equal(unitElementNames[0], 'source');
                assert.equal(unitElementNames[1], 'target');
            }
        });
    });
    test("Missing targets are inserted", function () {
        /**
        * Tests:
        *  - Trans-units with missing targets are inserted.
        */
        let transUnitId = 'Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064';
        langFilesUri.forEach(lf => {
            let targetLangDom = new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8'));
            let transUnit = targetLangDom.getElementById(transUnitId);
            assert.notEqual(transUnit?.getElementsByTagName('target'), null, 'Missing <target> should be inserted.');
        });
    });
    test("Change in <source> inserts review", function () {
        /**
        * Tests:
        *  - Change in <source> from g.xlf gets [NAB: Review] token.
        */
        let transUnitId = 'Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064';
        langFilesUri.forEach(lf => {
            let targetLangDom = new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8'));
            let transUnit = targetLangDom.getElementById(transUnitId);
            assert.equal(transUnit?.getElementsByTagName('target')[0].textContent?.includes(LanguageFunctions.reviewToken()), true, 'Change in source should insert review token.');
        });
    });
});

function noMultipleNABTokensInXliff(xliff: string): boolean {
    const token_re = /\[NAB:/gm;
    let targetLangDom = new dom().parseFromString(xliff);
    let transUnitNodes = targetLangDom.getElementsByTagNameNS(xmlns, 'trans-unit');
    for (let i = 0; i < transUnitNodes.length; i++) {
        const targetElm = <Element>transUnitNodes[i].getElementsByTagName('target')[0];
        if (targetElm.textContent !== null) {
            let found_tokens = targetElm.textContent.match(token_re);
            if (found_tokens === null) { continue; }
            if (found_tokens.length > 1) {
                return false;
            }
        }
    }
    return true;
}
function transUnitsAreSorted(xlfDom: Document) {
    let gXlfTransUnits: Element[] = [];
    let targetTransUnits = xlfDom.getElementsByTagNameNS(xmlns, 'trans-unit');
    // Remove Translate = No. There must be a better way?!
    for (let i = 0; i < gXlfDom.getElementsByTagNameNS(xmlns, 'trans-unit').length; i++) {
        if (gXlfDom.getElementsByTagNameNS(xmlns, 'trans-unit')[i].attributes.getNamedItem('translate')?.nodeValue?.toLowerCase() !== 'no') {
            gXlfTransUnits.push(gXlfDom.getElementsByTagNameNS(xmlns, 'trans-unit')[i]);
        }
    }
    for (let i = 0; i < gXlfTransUnits.length; i++) {
        let gTU = gXlfTransUnits[i];
        let targetTU = targetTransUnits[i];
        assert.equal(gTU.attributes.getNamedItem('id')?.nodeValue, targetTU.attributes.getNamedItem('id')?.nodeValue);
    }
}
