import * as assert from 'assert';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as xmldom from 'xmldom';
import { isNullOrUndefined } from 'util';

import * as ALObjectTestLibrary from './ALObjectTestLibrary';
import * as LanguageFunctions from '../LanguageFunctions';
import { SizeUnit, TranslationToken, TransUnit, Xliff } from '../XLIFFDocument';
import { ALObject } from '../ALObject/ALObject';
import * as ALParser from '../ALObject/ALParser';
import { ALCodeLine } from '../ALObject/ALCodeLine';

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
        assert.equal(formattedXml, xml);

    });


    test("Match indentation increase", function () {
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('  begin', 0)), true, '  begin');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('begin', 0)), true, 'begin');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('{', 0)), true, '{');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('{ // comment', 0)), true, '{ // comment');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('if condition then begin', 0)), true, 'if condition then begin');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('      begin      ', 0)), true, '      begin      ');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('begin   // Comment', 0)), true, 'begin   // Comment');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('foreach variable in list do begin', 0)), true, 'foreach variable in list do begin');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('case variable of', 0)), true, 'case variable of');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('case variable of // comment', 0)), true, 'case variabel of // comment');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('else begin', 0)), true, 'else begin');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('end else begin', 0)), true, 'end else begin');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('end else begin // Comment', 0)), true, 'end else begin // Comment');

        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine(' // { ', 0)), false, ' // { ');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('// if condition then begin', 0)), false, '// if condition then begin');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('//      begin      ', 0)), false, '//      begin      ');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('//begin   // Comment', 0)), false, '//begin   // Comment');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('//  whatever else begin', 0)), false, '//  whatever else begin');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('// asdf end else begin', 0)), false, '// asdf end else begin');
        assert.equal(ALParser.matchIndentationIncreased(new ALCodeLine('// if tStripePrice.Id.StartsWith(price_) then begin // TODOX: Ska vi skippa plans här, eller ta med?', 0)), false, '// if tStripePrice.Id.StartsWith(price_) then begin // TODOX: Ska vi skippa plans här, eller ta med?');
    });


    test("Match indentation decrease", function () {
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('end', 0)), true, 'end');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('end;', 0)), true, 'end;');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('}', 0)), true, '}');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('end // Comment', 0)), true, 'end // Comment');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('end; // Comment', 0)), true, 'end; // Comment');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('}', 0)), true, '}');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('} // Comment', 0)), true, '} // Comment');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('end else', 0)), true, 'end else');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('end else // Comment', 0)), true, 'end else // Comment');

        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('// end', 0)), false, '// end');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('// }', 0)), false, '// }');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('// whatever end', 0)), false, '// whatever end');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('// whatever }', 0)), false, '// whatever } ');
        assert.equal(ALParser.matchIndentationDecreased(new ALCodeLine('// if tStripePrice.Id.StartsWith(price_) then begin // TODOX: Ska vi skippa plans här, eller ta med?', 0)), false, '// if tStripePrice.Id.StartsWith(price_) then begin // TODOX: Ska vi skippa plans här, eller ta med?');
    });




    test("Get Xliff Id from cue page", function () {
        let gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getPageWithCuesAndActions(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        let transUnits = alObj.getTransUnits();
        if (null !== transUnits) {
            LanguageFunctions.updateGXlf(gXlfDoc, transUnits);
            assert.equal(gXlfDoc.toString(true, true), `<?xml version="1.0" encoding="utf-8"?>
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
</xliff>`);
        } else {
            assert.fail('No transunits identified');
        }
    });




    test("g.Xlf update Codeunit w/ overloads", function () {
        let gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getCodeunitWithOverloads(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        let transUnits = alObj.getTransUnits();
        if (null !== transUnits) {
            LanguageFunctions.updateGXlf(gXlfDoc, transUnits);
            assert.equal(gXlfDoc.toString(true, true), `<?xml version="1.0" encoding="utf-8"?>
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
</xliff>`);
        } else {
            assert.fail('No transunits identified');
        }
    });



    test("g.Xlf update Report", function () {
        let gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getReport(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        let transUnits = alObj.getTransUnits();
        if (null !== transUnits) {
            LanguageFunctions.updateGXlf(gXlfDoc, transUnits);
            assert.equal(gXlfDoc.toString(true, true), `<?xml version="1.0" encoding="utf-8"?>
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
</xliff>`);
        } else {
            assert.fail('No transunits identified');
        }
    });



    test("g.Xlf update XmlPort", function () {
        let gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getXmlPort(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        let transUnits = alObj.getTransUnits();
        if (null !== transUnits) {
            LanguageFunctions.updateGXlf(gXlfDoc, transUnits);
            assert.equal(gXlfDoc.toString(true, true), `<?xml version="1.0" encoding="utf-8"?>
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
</xliff>`);
        } else {
            assert.fail('No transunits identified');
        }
    });

    test("g.Xlf update with html tags", function () {
        let gXlfDoc = Xliff.fromString(ALObjectTestLibrary.getEmptyGXlf());
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getCodeunitWithHtmlTags(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
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
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getCodeunitWithApostrophes(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
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
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getPageWithEmptyString(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
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
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getTable(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
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
</xliff>`);
        } else {
            assert.fail('No transunits identified');
        }
    });

    test("Table TransUnits", function () {
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getTable(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        let transUnits = alObj.getTransUnits();
        if (null !== transUnits) {
            assert.equal(transUnits.length, 7, 'Unexpected number of trans units');
            let expectedTransUnit = '<trans-unit id="Table 2328808854 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>My Field Caption</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Property Caption</note></trans-unit>';
            assert.equal(transUnits[1].toString(), expectedTransUnit);
            expectedTransUnit = '<trans-unit id="Table 2328808854 - Field 3945078064 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>My Field 2 Caption</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField2 - Property Caption</note></trans-unit>';
            assert.equal(transUnits[3].toString(), expectedTransUnit);
            expectedTransUnit = '<trans-unit id="Table 2328808854 - Field 2443090863 - Property 62802879" size-unit="char" translate="yes" xml:space="preserve"><source> ,asdf,erew,fieldOptionCaption</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyFieldOption - Property OptionCaption</note></trans-unit>';
            assert.equal(transUnits[5].toString(), expectedTransUnit);
            expectedTransUnit = '<trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve"><source>This is a test ERROR in table</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note></trans-unit>';
            assert.equal(transUnits[6].toString(), expectedTransUnit);
        } else {
            assert.fail('No transunits identified');
        }
    });
});

suite("Language Functions Tests", function () {

    test("LoadMatchXlfIntoMap()", function () {
        /* 
        *   - Test with Xlf that has [NAB:* ] tokens 
        *   - Assert matchMap does not contain [NAB: *] tokens
        */
        let _dom = xmldom.DOMParser;
        let matchMap = LanguageFunctions.loadMatchXlfIntoMap(new _dom().parseFromString(ALObjectTestLibrary.getXlfHasNABTokens()), xmlns);
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

    test("matchTranslation()", async function () {
        /* 
        *   Test with Xlf that has multiple matching sources
        *   - Assert already translated targets does not receive [NAB: SUGGESTION] token.
        *   - Assert all matching sources gets suggestion in target.
        *   Test with Xlf that has [NAB: SUGGESTION] tokens
        *   - Assert matched sources has [NAB: SUGGESTION] tokens
        *   - Assert non matching sources is unchanged.
        */
        let xlfDoc: Xliff = Xliff.fromString(ALObjectTestLibrary.getXlfHasMatchingSources());
        let matchResult = LanguageFunctions.matchTranslations(xlfDoc);
        assert.equal(matchResult, 2, 'NumberOfMatchedTranslations should equal 2');
        assert.notEqual(xlfDoc.transunit[0].targets.length, 0, 'No targets in trans-unit.');
        if (!isNullOrUndefined(xlfDoc.transunit[0].targets)) {
            assert.equal(xlfDoc.transunit[0].targets[0].textContent, 'Has Token', 'Unexpected textContent');
        } else { assert.fail('transunit[0]: No target found.'); }
        if (!isNullOrUndefined(xlfDoc.transunit[1].targets)) {
            assert.equal(xlfDoc.transunit[1].targets[0].textContent, 'Has Token', 'Unexpected textConstant');
            assert.equal(xlfDoc.transunit[1].targets[0].translationToken, TranslationToken.Suggestion, 'Expected token [NAB: SUGGESTION]');
        } else {
            assert.fail('transunit[1]: No target found.');
        }
        if (!isNullOrUndefined(xlfDoc.transunit[2].targets)) {
            assert.equal(xlfDoc.transunit[2].targets[0].textContent, 'Has Token', 'Unexpected textConstant 2');
            assert.equal(xlfDoc.transunit[2].targets[0].translationToken, TranslationToken.Suggestion, 'Expected token [NAB: SUGGESTION] 2');
        } else {
            assert.fail('transunit[2]: No target found.');
        }
        xlfDoc = Xliff.fromString(ALObjectTestLibrary.getXlfHasNABTokens());
        matchResult = LanguageFunctions.matchTranslations(xlfDoc);
        assert.equal(matchResult, 0, 'NumberOfMatchedTranslations should equal 0');
        if (!isNullOrUndefined(xlfDoc.transunit[0].targets)) {
            assert.equal(xlfDoc.transunit[0].targets[0].textContent, 'Has Token', 'Unexpected textConstant 0');
            assert.equal(xlfDoc.transunit[0].targets[0].translationToken, TranslationToken.Suggestion, 'Expected token [NAB: SUGGESTION] 0');
        } else {
            assert.fail('transunit[0]: No target found.');
        }
        assert.notEqual(xlfDoc.transunit[1].targets.length, 0, 'No targets in trans-unit.');
        if (!isNullOrUndefined(xlfDoc.transunit[1].targets)) {
            assert.equal(xlfDoc.transunit[1].targets[0].textContent, 'No Token', 'Unexpected textContent 3');
            assert.equal(isNullOrUndefined(xlfDoc.transunit[1].targets[0].translationToken), true, 'Unexpected token 3');
        } else {
            assert.fail('transunit[1]: No target found.');
        }
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
        let xlfDoc: Xliff = Xliff.fromString(ALObjectTestLibrary.getXlfWithContextBasedMultipleMatchesInBaseApp());
        const matchMap: Map<string, string[]> = new Map<string, string[]>();
        matchMap.set('State', ["Tillstånd", "Status", "Delstat"]);
        let matchResult = LanguageFunctions.matchTranslationsFromTranslationMap(xlfDoc, matchMap);
        assert.equal(matchResult, 3, 'Number of matched translations should equal 3');
        assert.notEqual(xlfDoc.transunit[0].targets.length, 0, 'No targets in trans-unit.');
        assert.equal(xlfDoc.transunit[0].targets.length, 3, 'Expected 3 targets.');
        if (!isNullOrUndefined(xlfDoc.transunit[0].targets)) {
            assert.equal(xlfDoc.transunit[0].targets[0].textContent, 'Tillstånd', 'Unexpected textContent 0');
            assert.equal(xlfDoc.transunit[0].targets[0].translationToken, TranslationToken.Suggestion, 'Unexpected token 0');
            assert.equal(xlfDoc.transunit[0].targets[1].textContent, 'Status', 'Unexpected textContent 1');
            assert.equal(xlfDoc.transunit[0].targets[1].translationToken, TranslationToken.Suggestion, 'Unexpected token 1');
            assert.equal(xlfDoc.transunit[0].targets[2].textContent, 'Delstat', 'Unexpected textContent 2');
            assert.equal(xlfDoc.transunit[0].targets[2].translationToken, TranslationToken.Suggestion, 'Unexpected token 2');
        } else {
            assert.fail('transunit[0]: No target found.');
        }
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
        assert.equal(refreshResult2.NumberOfAddedTransUnitElements, 0, '2. No new trans-units should have been inserted.');
        assert.equal(refreshResult2.NumberOfCheckedFiles, refreshResult1.NumberOfCheckedFiles, '2. NumberOfCheckedFiles should be the same as last run.');
        assert.equal(refreshResult2.NumberOfRemovedTransUnits, 0, '2. NumberOfRemovedTransUnits should equal 0.');
        assert.equal(refreshResult2.NumberOfUpdatedMaxWidths, 0, '2. NumberOfUpdatedMaxWidths should equal 0.');
        assert.equal(refreshResult2.NumberOfUpdatedNotes, 0, '2. NumberOfUpdatedNotes should equal 0.');
        assert.equal(refreshResult2.NumberOfUpdatedSources, 0, '2. NumberOfUpdatedSources should equal 0.');
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
         * 
         * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
         */
        langFilesUri.forEach(lf => {
            transUnitsAreSorted(new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8')));
        });
    });

    test("translate=no has been skipped", function () {
        /**
         * Tests:
         *  - Trans-units with attribute translate=no has been skipped.
         *
         * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
         */
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
         *
         * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
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
         *
         * Depends on "Run __RefreshXlfFilesFromGXlf() x2"
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
                assert.equal(unitElementNames[0], 'source', ``);
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
            assert.equal(transUnit?.getElementsByTagName('target')[0].textContent?.includes(TranslationToken.Review), true, 'Change in source should insert review token.');
        });
    });

    test("existingTargetLanguages()", async function () {
        const existingTargetLanguages = await LanguageFunctions.existingTargetLanguageCodes();
        assert.equal(existingTargetLanguages?.length, 2, 'Expected 2 target languages to be found');
    });
});

function noMultipleNABTokensInXliff(xliff: string): boolean {
    const token_re = /\[NAB:/gm;
    let targetLangDom = new dom().parseFromString(xliff);
    let transUnitNodes = targetLangDom.getElementsByTagNameNS(xmlns, 'trans-unit');
    for (let i = 0; i < transUnitNodes.length; i++) {
        const targetElm = transUnitNodes[i].getElementsByTagName('target')[0];
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
