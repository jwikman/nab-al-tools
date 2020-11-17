import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { Xliff, TransUnit, Target, Note, TargetState, SizeUnit } from '../XLIFFDocument';

const testResourcesPath = '../../src/test/resources/';

suite("Xliff Types - Deserialization", function () {

    test("Xliff fromString", function () {
      let parsedXliff = Xliff.fromString(GetSmallXliffXml());
      assert.equal(parsedXliff.sourceLanguage, 'en-US', 'Unexpected source language');
      assert.equal(parsedXliff.targetLanguage, 'sv-SE', 'Unexpected target language');
      assert.equal(parsedXliff.transunit.length, 2, 'Unexpected number of trans-units');
      let manualXliff = new Xliff('xml', 'en-US', 'sv-SE', 'AlTestApp');
      let manualNotes = [
        new Note('Developer', 'general', 2, ''),
        new Note('Xliff Generator', 'general', 3,'Table MyTable - NamedType TestErr')
      ];

      let transUnit = new TransUnit('Table 2328808854 - NamedType 12557645', true, 'This is a test ERROR in table', new Target('This is a test ERROR in table', null), SizeUnit.char, 'preserve', manualNotes);
      manualXliff.transunit.push(transUnit);
      let manualNotes2 = [
        new Note('Developer', 'general', 2, ''),
        new Note('Xliff Generator', 'general', 3,'Page MyPage - NamedType TestErr')
      ];
      let transUnit2 = new TransUnit('Page 2931038265 - NamedType 12557645', true, 'This is a test ERROR', new Target('This is a test ERROR', null), SizeUnit.char, 'preserve', manualNotes2);
      manualXliff.transunit.push(transUnit2);
      assert.deepEqual(parsedXliff, manualXliff);
    });

    test("Transunit fromString", function () {
        let parsedTransUnit = TransUnit.fromString(GetTransUnitXml());
        let manualTarget = new Target('This is a test ERROR in table', TargetState.New);
        let manualNotes = [
          new Note('Developer', 'general', 2, ''),
          new Note('Xliff Generator', 'general', 3,'Table MyTable - NamedType TestErr')
        ];
        let manualTransUnit = new TransUnit('Table 2328808854 - NamedType 12557645', true, 'This is a test ERROR in table', manualTarget, SizeUnit.char, 'preserve', manualNotes);
        assert.deepEqual(parsedTransUnit, manualTransUnit);
        assert.equal(parsedTransUnit.sizeUnit, SizeUnit.char, 'Unexpected value for attribute size-unit');
        assert.equal(parsedTransUnit.note?.length, 2, 'Unexpected number of notes in trans-unit.');
        assert.equal(parsedTransUnit.translate, true, 'Unexpected value for attribute translate');
        assert.equal(parsedTransUnit.xmlSpace, 'preserve', 'Unexpected attribute value for xml:space in trans-unit');
        assert.equal(parsedTransUnit.source, 'This is a test ERROR in table', 'Unexpected textContent in source element');
    });

    test("Target with state fromString", function () {
        let parsedTarget = Target.fromString(GetTargetXml());
        let manualTarget = new Target('This is a test ERROR in table', TargetState.Final);
        assert.equal(parsedTarget.state, TargetState.Final, 'Unexpected value for target state in parsed target.');
        assert.equal(manualTarget.state, TargetState.Final, 'Unexpected value for target state in manual target.');
        assert.deepEqual(parsedTarget, manualTarget);
    });

    test("Target w/out state fromString", function () {
      let parsedTarget = Target.fromString(GetTargetWithoutStateXml());
      let manualTarget = new Target('This is a test ERROR in table', null);
      assert.equal(parsedTarget.state, null, 'Unexpected value for target state in parsed target.');
      assert.equal(manualTarget.state, null, 'Unexpected value for target state in manual target.');
      assert.deepEqual(parsedTarget, manualTarget);
  });

    test("Note fromString", function () {
        let parsedNote = Note.fromString(GetNoteXml());
        let manualNote = new Note('Xliff Generator','general', 3, 'Table MyTable - Field MyFieldOption - Property Caption');
        assert.deepEqual(parsedNote, manualNote);
    });
});

suite("Xliff Types - Serialization", function () {




  test("Xliff multiple html tags", function () {
    const sourceXml = GetSmallXliffXmlWithMultipleHtmlTag();
    let parsedXliff = Xliff.fromString(sourceXml);
    assert.equal(parsedXliff.toString(), sourceXml, 'String is not matching source.');
  });

  test("Xliff html tags", function () {
    const sourceXml = GetSmallXliffXmlWithHtmlTag();
    let parsedXliff = Xliff.fromString(sourceXml);
    assert.equal(parsedXliff.toString(), sourceXml, 'String is not matching source.');
  });


  
  test("Xliff toString", function () {
    const sourceXml = GetSmallFormattedXliffXml();
    let parsedXliff = Xliff.fromString(sourceXml);
    assert.equal(parsedXliff.toString(), sourceXml, 'String is not matching source.');
  });

  test("Xliff toDocument", function () {
    let xliff = new Xliff('xml', 'en-US', 'sv-SE', 'TestApp');
    let xliffDocument = xliff.toDocument();
    let xliffNodes = xliffDocument.getElementsByTagName('file');
    assert.equal(xliffNodes.length, 1,'Unexpected number of xliff tags.');
    assert.equal(xliffNodes[0].getAttribute('datatype'), 'xml');
    assert.equal(xliffNodes[0].getAttribute('source-language'), 'en-US');
    assert.equal(xliffNodes[0].getAttribute('target-language'), 'sv-SE');
    assert.equal(xliffNodes[0].getAttribute('original'), 'TestApp');

  });

  test("Transunit toString", function () {
    const sourceXml = GetTransUnitXml();
    let transUnitXml = TransUnit.fromString(sourceXml);
    assert.ok(transUnitXml.toString());
    // We can't test the output string against the source due to formatting.
    //assert.equal(parsedTransUnit.toString().length, sourceXml.length, 'String length is not matching source.');
  });

  test("Transunit toElement", function () {
      const target = new Target('Target String', TargetState.NeedsL10n);
      const transUnit = new TransUnit('1337', false, 'Source String', target , SizeUnit.char, 'preserve');
      const transUnitElement = transUnit.toElement();
      assert.equal(transUnitElement.getAttribute('id'), '1337');
      assert.equal(transUnitElement.getAttribute('size-unit'), 'char');
      assert.equal(transUnitElement.getAttribute('translate'), 'no');
      const sourceNode = transUnitElement.getElementsByTagName('source');
      const targetNode = transUnitElement.getElementsByTagName('target');
      assert.equal(sourceNode.length, 1, 'Unexpected number of source elements in trans-unit.');
      assert.equal(sourceNode[0].textContent, 'Source String');
      assert.equal(targetNode.length, 1, 'Unexpected number of target elements in trans-unit.');
      assert.equal(targetNode[0].getAttribute('state'), 'needs-l10n');
      assert.equal(targetNode[0].textContent, 'Target String');
  });

  test("Target toString", function () {
    let parsedTarget = Target.fromString(GetTargetXml());
    assert.equal(parsedTarget.toString(), GetTargetXml(), 'String is not matching source.');
  });

  test("Target toElement", function () {
    const target = new Target('Target String', TargetState.NeedsL10n);
    const targetElement = target.toElement();
    assert.equal(targetElement.textContent, 'Target String');
    assert.equal(targetElement.getAttribute('state'), 'needs-l10n');
  });

  test("Note toString", function () {
    const parsedNote = Note.fromString(GetNoteXml());
    assert.equal(parsedNote.toString(), GetNoteXml(), 'String is not matching source.');
  });

  test("Note toElement", function () {
    const note = new Note('nab-al-tools', 'test', 10, 'This is a test');
    const noteElement = note.toElement();
    assert.equal(noteElement.getAttribute('from'), 'nab-al-tools', 'Unexpected attribute value in from');
    assert.equal(noteElement.getAttribute('annotates'), 'test');
    assert.equal(noteElement.getAttribute('priority'), 10);
    assert.equal(noteElement.textContent, 'This is a test');
  });

  test("translationMap()", function() {
    // This test is a bit on the heavy side so we're increasing the timeout
    this.timeout(5000);
    const baseXlfPath = path.resolve(__dirname, testResourcesPath, "Base Application.sv-SE.xlf");
    const outJsonPath = path.resolve(__dirname, testResourcesPath, 'temp', "Base Application.sv-SE.json");
    const xlf = Xliff.fromFileSync(baseXlfPath);
    let transMap = xlf.translationMap();
    assert.equal(transMap.size, 42372, 'Unexpected Map-size');
    let json = JSON.stringify(Object.fromEntries(transMap));
    fs.writeFileSync(outJsonPath, json, "UTF8");
  });

  test("JSON Parse Base App Json", function() {
    //TODO: Move this test to the correct test suite
    const baseAppJsonPath = path.resolve(__dirname, testResourcesPath, 'temp', "Base Application.sv-SE.json");
    JSON.parse(fs.readFileSync(baseAppJsonPath, "UTF8"));
  });

});

suite("Xliff Types - Functions", function () {

  test("Transunit addNote", function () {
    const transUnit = TransUnit.fromString(GetTransUnitXml());
    assert.equal(transUnit.note?.length, 2);
    transUnit.addNote('nab-al-tools', 'test', 10, 'This is a test');
    assert.equal(transUnit.note?.length, 3);

  });

  test("Xliff getTransUnitById - existing id", function () {
    const xlf = Xliff.fromString(GetSmallXliffXml());
    const transunit = xlf.getTransUnitById('Table 2328808854 - NamedType 12557645');
    assert.deepEqual(transunit, xlf.transunit[0], 'Transunits are not the same.');
  });

  test("Xliff getTransUnitById - unknown id", function () {
    const xlf = Xliff.fromString(GetSmallXliffXml());
    const transunit = xlf.getTransUnitById('Table 666 - NamedType 666');
    assert.equal(transunit, undefined, 'expected transunit to be undefined');

  });

  test("Xliff hasTransUnit", function () {
    const xlf = Xliff.fromString(GetSmallXliffXml());
    assert.equal(xlf.hasTransUnit('Table 2328808854 - NamedType 12557645'), true, 'Unexpected return value.');
    assert.equal(xlf.hasTransUnit('Table 666 - NamedType 666'), false, 'Unexpected return value.');
  });
  
  test("Xliff.sortTransUnits()", function () {
    const xlf = Xliff.fromString(getUnsortedXliffXml());
    xlf.sortTransUnits();
    assert.equal(xlf.transunit[0].id, 'Table 2328808854 - NamedType 12557645', 'Not sorted');
  });
});
function GetNoteXml(): string {
    return '<note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyFieldOption - Property Caption</note>';
}

function GetTargetXml(): string {
    return '<target state="final">This is a test ERROR in table</target>';
}
function GetTargetWithoutStateXml(): string {
  return '<target>This is a test ERROR in table</target>';
}
function GetTransUnitXml() {
    return `<trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
    <source>This is a test ERROR in table</source>
    <target state="New">This is a test ERROR in table</target>
    <note from="Developer" annotates="general" priority="2"/>
    <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
  </trans-unit>`;
}

export function GetSmallXliffXmlWithMultipleHtmlTag(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test &lt;br&gt;&lt;br&gt;&lt;br&gt; in table</source>
          <target>This is a test &lt;br&gt;&lt;br&gt;&lt;br&gt; in table</target>
          <note from="Developer" annotates="general" priority="2">Comment &lt;&gt; Test</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable &lt;&gt;&lt;&gt; Test - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is &lt;br&gt;&lt;br&gt;&lt;br&gt; test ERROR</source>
          <target>This is &lt;br&gt;&lt;br&gt;&lt;br&gt; test ERROR</target>
          <note from="Developer" annotates="general" priority="2">Comment &lt;&gt; Test</note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage &lt;&gt;&lt;&gt; Test - NamedType TestErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}


export function GetSmallXliffXmlWithHtmlTag(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test &lt;br&gt; in table</source>
          <target>This is a test &lt;br&gt; in table</target>
          <note from="Developer" annotates="general" priority="2">Comment &lt;&gt; Test</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable &lt;&gt; Test - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is &lt;br&gt; test ERROR</source>
          <target>This is &lt;br&gt; test ERROR</target>
          <note from="Developer" annotates="general" priority="2">Comment &lt;&gt; Test</note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage &lt;&gt; Test - NamedType TestErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}


export function GetSmallFormattedXliffXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR in table</source>
          <target>This is a test ERROR in table</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR</source>
          <target>This is a test ERROR</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

export function GetSmallXliffXml(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR in table</source>
          <target>This is a test ERROR in table</target>
          <note from="Developer" annotates="general" priority="2"/>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR</source>
          <target>This is a test ERROR</target>
          <note from="Developer" annotates="general" priority="2"/>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

function getUnsortedXliffXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
<file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
  <body>
    <group id="body">
      <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
        <source>This is a test ERROR</source>
        <target>This is a test ERROR</target>
        <note from="Developer" annotates="general" priority="2"/>
        <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
      </trans-unit>
      <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
        <source>This is a test ERROR in table</source>
        <target>This is a test ERROR in table</target>
        <note from="Developer" annotates="general" priority="2"/>
        <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
      </trans-unit>
    </group>
  </body>
</file>
</xliff>`;
}
