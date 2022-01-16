import * as assert from "assert";
import * as path from "path";
import { XliffIdToken } from "../ALObject/XliffIdToken";
import { InvalidXmlError } from "../Error";
import {
  Xliff,
  TransUnit,
  Target,
  Note,
  TargetState,
  SizeUnit,
  CustomNoteType,
  StateQualifier,
  targetStateActionNeededAttributes,
  TranslationToken,
} from "../Xliff/XLIFFDocument";

suite("Xliff Types - Deserialization", function () {
  test("Xliff.fromFileSync() invalid xml", function () {
    const expectedIndex = process.platform === "linux" ? 996 : 1010; //crlf workaround? (:
    assert.throws(
      () =>
        Xliff.fromFileSync(
          path.resolve(__dirname, "../../src/test/resources/invalid-xml.xlf")
        ),
      (err) => {
        assert.ok(err instanceof InvalidXmlError);
        assert.strictEqual(
          err.message,
          "The xml in invalid-xml.xlf is invalid."
        );
        assert.strictEqual(
          err.index,
          expectedIndex,
          "Invalid XML found at unexpected index."
        );
        assert.strictEqual(
          err.length,
          44,
          "Unexpected length of invalid index"
        );
        return true;
      },
      "Expected InvalidXmlError to be thrown."
    );
  });

  test("Xliff fromString", function () {
    const parsedXliff = Xliff.fromString(getSmallXliffXml());
    assert.equal(
      parsedXliff.sourceLanguage,
      "en-US",
      "Unexpected source language"
    );
    assert.equal(
      parsedXliff.targetLanguage,
      "sv-SE",
      "Unexpected target language"
    );
    assert.equal(
      parsedXliff.transunit.length,
      2,
      "Unexpected number of trans-units"
    );
    const manualXliff = new Xliff("xml", "en-US", "sv-SE", "AlTestApp");
    const manualNotes = [
      new Note("Developer", "general", 2, ""),
      new Note(
        "Xliff Generator",
        "general",
        3,
        "Table MyTable - NamedType TestErr"
      ),
    ];

    const transUnit = new TransUnit(
      "Table 2328808854 - NamedType 12557645",
      true,
      "This is a test ERROR in table",
      new Target("This is a test ERROR in table", null),
      SizeUnit.char,
      "preserve",
      manualNotes
    );
    manualXliff.transunit.push(transUnit);
    const manualNotes2 = [
      new Note("Developer", "general", 2, ""),
      new Note(
        "Xliff Generator",
        "general",
        3,
        "Page MyPage - NamedType TestErr"
      ),
    ];
    const transUnit2 = new TransUnit(
      "Page 2931038265 - NamedType 12557645",
      true,
      "This is a test ERROR",
      new Target("This is a test ERROR", null),
      SizeUnit.char,
      "preserve",
      manualNotes2
    );
    manualXliff.transunit.push(transUnit2);
    assert.deepEqual(parsedXliff, manualXliff);
  });

  test("Transunit fromString", function () {
    const parsedTransUnit = TransUnit.fromString(getTransUnitXml());
    const manualTarget = new Target(
      "This is a test ERROR in table",
      TargetState.new
    );
    const manualNotes = [
      new Note("Developer", "general", 2, ""),
      new Note(
        "Xliff Generator",
        "general",
        3,
        "Table MyTable - NamedType TestErr"
      ),
    ];
    const manualTransUnit = new TransUnit(
      "Table 2328808854 - NamedType 12557645",
      true,
      "This is a test ERROR in table",
      manualTarget,
      SizeUnit.char,
      "preserve",
      manualNotes
    );
    assert.deepEqual(parsedTransUnit, manualTransUnit);
    assert.equal(parsedTransUnit.id, manualTransUnit.id);
    assert.equal(
      parsedTransUnit.targets.length,
      manualTransUnit.targets.length,
      "Expected same number of targets"
    );
    assert.equal(
      parsedTransUnit.target.textContent,
      manualTransUnit.target.textContent
    );
    assert.equal(
      parsedTransUnit.notes.length,
      manualTransUnit.notes.length,
      "Expected same number of notes"
    );
    assert.equal(
      parsedTransUnit.sizeUnit,
      SizeUnit.char,
      "Unexpected value for attribute size-unit"
    );
    assert.equal(
      parsedTransUnit.notes.length,
      2,
      "Unexpected number of notes in trans-unit."
    );
    assert.equal(
      parsedTransUnit.translate,
      true,
      "Unexpected value for attribute translate"
    );
    assert.equal(
      parsedTransUnit.xmlSpace,
      "preserve",
      "Unexpected attribute value for xml:space in trans-unit"
    );
    assert.equal(
      parsedTransUnit.source,
      "This is a test ERROR in table",
      "Unexpected textContent in source element"
    );
  });

  test("Transunit - get properties", function () {
    const transUnit = TransUnit.fromString(getTransUnitXml());
    assert.equal(
      transUnit.target.textContent,
      transUnit.target.textContent,
      "targetTextContent should equal the first element of TransUnitTargets."
    );
    assert.equal(transUnit.targetState, TargetState.new, "Unexpected state");
    assert.equal(
      transUnit.targetTranslationToken,
      "",
      "Expected translation token to be empty string"
    );
  });

  test("Target with state fromString", function () {
    const parsedTarget = Target.fromString(getTargetXml());
    const manualTarget = new Target(
      "This is a test ERROR in table",
      TargetState.final
    );
    assert.equal(
      parsedTarget.state,
      TargetState.final,
      "Unexpected value for target state in parsed target."
    );
    assert.equal(
      manualTarget.state,
      TargetState.final,
      "Unexpected value for target state in manual target."
    );
    assert.deepEqual(parsedTarget, manualTarget);
  });

  test("Target with state-qualifier fromString", function () {
    const parsedTarget = Target.fromString(getTargetXmlWithStateQualifier());
    const manualTarget = new Target(
      "This is a test ERROR in table",
      TargetState.final
    );
    manualTarget.stateQualifier = StateQualifier.idMatch;
    assert.equal(
      parsedTarget.stateQualifier,
      StateQualifier.idMatch,
      "Unexpected state-qualifier."
    );
    assert.equal(
      parsedTarget.stateQualifier,
      manualTarget.stateQualifier,
      "Expected state-qualifier to be the same."
    );
    assert.deepEqual(parsedTarget, manualTarget);
  });

  test("Cast as TargetState", function () {
    for (const stateValue of [null, undefined, "final"]) {
      const targetState = stateValue as TargetState;
      assert.ok(
        targetState === stateValue,
        `Unexpected target state: ${targetState}`
      );
    }
  });

  test("Target w/out state fromString", function () {
    const parsedTarget = Target.fromString(getTargetWithoutStateXml());
    const manualTarget = new Target("This is a test ERROR in table", null);
    assert.equal(
      parsedTarget.state,
      null,
      "Unexpected value for target state in parsed target."
    );
    assert.equal(
      manualTarget.state,
      null,
      "Unexpected value for target state in manual target."
    );
    assert.deepEqual(parsedTarget, manualTarget);
  });

  test("Note fromString", function () {
    const parsedNote = Note.fromString(getNoteXml());
    const manualNote = new Note(
      "Xliff Generator",
      "general",
      3,
      "Table MyTable - Field MyFieldOption - Property Caption"
    );
    assert.deepEqual(parsedNote, manualNote);
  });
});

suite("Xliff Types - Serialization", function () {
  test("Xliff multiple html tags", function () {
    const sourceXml = getSmallXliffXmlWithMultipleHtmlTag();
    const parsedXliff = Xliff.fromString(sourceXml);
    assert.equal(
      parsedXliff.toString(),
      sourceXml,
      "String is not matching source."
    );
  });
  test("Xliff with header and tool", function () {
    const sourceXml = getXliffWithHeaderXml();
    const parsedXliff = Xliff.fromString(sourceXml);
    assert.equal(
      parsedXliff.toString(false),
      sourceXml,
      "String is not matching source."
    );
  });

  test("Xliff html tags", function () {
    const sourceXml = getSmallXliffXmlWithHtmlTag();
    const parsedXliff = Xliff.fromString(sourceXml);
    assert.equal(
      parsedXliff.toString(),
      sourceXml,
      "String is not matching source."
    );
  });

  test("Xliff toString", function () {
    const sourceXml = getSmallFormattedXliffXml();
    const parsedXliff = Xliff.fromString(sourceXml);
    assert.equal(
      parsedXliff.toString(),
      sourceXml,
      "String is not matching source."
    );
  });

  test("Xliff toDocument", function () {
    const xliff = new Xliff("xml", "en-US", "sv-SE", "TestApp");
    const xliffDocument = xliff.toDocument();
    const xliffNodes = xliffDocument.getElementsByTagName("file");
    assert.equal(xliffNodes.length, 1, "Unexpected number of xliff tags.");
    assert.equal(xliffNodes[0].getAttribute("datatype"), "xml");
    assert.equal(xliffNodes[0].getAttribute("source-language"), "en-US");
    assert.equal(xliffNodes[0].getAttribute("target-language"), "sv-SE");
    assert.equal(xliffNodes[0].getAttribute("original"), "TestApp");
  });

  test("Transunit toString", function () {
    const sourceXml = getTransUnitXml();
    const transUnitXml = TransUnit.fromString(sourceXml);
    assert.ok(transUnitXml.toString());
    // We can't test the output string against the source due to formatting.
    //assert.equal(parsedTransUnit.toString().length, sourceXml.length, 'String length is not matching source.');
  });

  test("Transunit toElement", function () {
    const target = new Target("Target String", TargetState.needsL10n);
    const transUnit = new TransUnit(
      "1337",
      false,
      "Source String",
      target,
      SizeUnit.char,
      "preserve"
    );
    const transUnitElement = transUnit.toElement();
    assert.equal(transUnitElement.getAttribute("id"), "1337");
    assert.equal(transUnitElement.getAttribute("size-unit"), "char");
    assert.equal(transUnitElement.getAttribute("translate"), "no");
    const sourceNode = transUnitElement.getElementsByTagName("source");
    const targetNode = transUnitElement.getElementsByTagName("target");
    assert.equal(
      sourceNode.length,
      1,
      "Unexpected number of source elements in trans-unit."
    );
    assert.equal(sourceNode[0].textContent, "Source String");
    assert.equal(
      targetNode.length,
      1,
      "Unexpected number of target elements in trans-unit."
    );
    assert.equal(targetNode[0].getAttribute("state"), "needs-l10n");
    assert.equal(targetNode[0].textContent, "Target String");
  });

  test("Target toString", function () {
    const parsedTarget = Target.fromString(getTargetXml());
    assert.equal(
      parsedTarget.toString(),
      getTargetXml(),
      "String is not matching source."
    );
  });

  test("Target toElement", function () {
    const target = new Target("Target String", TargetState.needsL10n);
    const targetElement = target.toElement();
    assert.equal(targetElement.textContent, "Target String");
    assert.equal(targetElement.getAttribute("state"), "needs-l10n");
  });

  test("Note toString", function () {
    const parsedNote = Note.fromString(getNoteXml());
    assert.equal(
      parsedNote.toString(),
      getNoteXml(),
      "String is not matching source."
    );
  });

  test("Note toElement", function () {
    const note = new Note("nab-al-tools", "test", 10, "This is a test");
    const noteElement = note.toElement();
    assert.equal(
      noteElement.getAttribute("from"),
      "nab-al-tools",
      "Unexpected attribute value in from"
    );
    assert.equal(noteElement.getAttribute("annotates"), "test");
    assert.equal(noteElement.getAttribute("priority"), 10);
    assert.equal(noteElement.textContent, "This is a test");
  });

  test("translationMap()", function () {
    const xlf = Xliff.fromString(getSmallXliffXml());
    const transMap = xlf.translationMap();
    assert.equal(transMap.size, 2, "Unexpected Map-size");
    const json = JSON.stringify(Object.fromEntries(transMap));
    assert.notEqual(json.length, 0, "Stringfied JSON lenght should not be 0");
  });
});

suite("Xliff Types - Functions", function () {
  test("Transunit addNote", function () {
    const transUnit = TransUnit.fromString(getTransUnitXml());
    assert.equal(transUnit.notes.length, 2);
    transUnit.addNote("nab-al-tools", "test", 10, "This is a test");
    assert.equal(transUnit.notes.length, 3);
  });

  test("Xliff getTransUnitById - existing id", function () {
    const xlf = Xliff.fromString(getSmallXliffXml());
    const transunit = xlf.getTransUnitById(
      "Table 2328808854 - NamedType 12557645"
    );
    assert.deepEqual(
      transunit,
      xlf.transunit[0],
      "Transunits are not the same."
    );
  });

  test("Xliff getTransUnitById - unknown id", function () {
    const xlf = Xliff.fromString(getSmallXliffXml());
    const transunit = xlf.getTransUnitById("Table 666 - NamedType 666");
    assert.equal(transunit, undefined, "expected transunit to be undefined");
  });

  test("Xliff hasTransUnit", function () {
    const xlf = Xliff.fromString(getSmallXliffXml());
    assert.equal(
      xlf.hasTransUnit("Table 2328808854 - NamedType 12557645"),
      true,
      "Unexpected return value."
    );
    assert.equal(
      xlf.hasTransUnit("Table 666 - NamedType 666"),
      false,
      "Unexpected return value."
    );
  });

  test("Xliff.customNotesOfTypeExists", function () {
    const xlf = Xliff.fromString(xlfWithCustomNotes());
    assert.equal(
      xlf.customNotesOfTypeExists(CustomNoteType.refreshXlfHint),
      true,
      "Expected Xliff to have custom notes."
    );
  });

  test("Xliff.removeAllCustomNotesOfType", function () {
    const xlf = Xliff.fromString(xlfWithCustomNotes());
    assert.equal(
      xlf.customNotesOfTypeExists(CustomNoteType.refreshXlfHint),
      true,
      "Expected Xliff to have custom notes."
    );
    assert.equal(
      xlf.removeAllCustomNotesOfType(CustomNoteType.refreshXlfHint),
      2,
      "Function should return number of removed notes."
    );
    assert.equal(
      xlf.customNotesOfTypeExists(CustomNoteType.refreshXlfHint),
      false,
      "Expected no custom notes."
    );
  });

  test("Xliff.translationTokensExists", function () {
    const xlfWithTranslationTokens = Xliff.fromString(xlfWithCustomNotes());
    assert.equal(
      xlfWithTranslationTokens.translationTokensExists(),
      true,
      "Expected xliff to have translation tokens"
    );
    const xlfNoTranslationTokens = Xliff.fromString(getSmallXliffXml());
    assert.equal(
      xlfNoTranslationTokens.translationTokensExists(),
      false,
      "Expected xliff not to have translation tokens."
    );
  });

  test("Xliff.sourceHasDuplicates()", function () {
    let xlf = Xliff.fromString(xliffXmlWithDuplicateSources());
    assert.equal(
      xlf.sourceHasDuplicates("Duplicate"),
      true,
      "Expected duplicate to be found"
    );
    assert.equal(
      xlf.sourceHasDuplicates("Nope!"),
      false,
      "Unexpected duplicate found"
    );
    xlf = Xliff.fromString(getSmallXliffXml());
    assert.equal(
      xlf.sourceHasDuplicates("This is a test ERROR in table"),
      false,
      "Unexpected duplicate found"
    );
  });

  test("Xliff.getTransUnitsBySource()", function () {
    const xlf = Xliff.fromString(xliffXmlWithDuplicateSources());
    assert.equal(
      xlf.getTransUnitsBySource("Duplicate").length,
      3,
      "Expected 2 transunits to be found"
    );
    assert.equal(
      xlf.getTransUnitsBySource("Nope!").length,
      0,
      "Unexpected number of transunits found"
    );
  });

  test("Xliff.getSameSourceDifferentTarget", function () {
    const xlf = Xliff.fromString(xliffXmlWithDuplicateSources());
    const transUnits = xlf.getSameSourceDifferentTarget(xlf.transunit[1]);
    assert.deepStrictEqual(
      transUnits.length,
      1,
      "Unexpected number of trans-units returned."
    );
  });

  test("Xliff.differentlyTranslatedTransunits", function () {
    const xlf = Xliff.fromString(xliffXmlWithDuplicateSources());
    const transUnits = xlf.differentlyTranslatedTransUnits();
    assert.notDeepStrictEqual(
      transUnits.length,
      xlf.transunit.length,
      "Same number of transunit as the total was returned. No bueno!"
    );
    assert.deepStrictEqual(
      transUnits.length,
      3,
      "Unexpected number of transunits returned."
    );
    const id = transUnits.map((t) => {
      return t.id;
    });
    assert.deepStrictEqual(
      id.length,
      new Set(id).size,
      "Duplicate trans-units in result"
    );
  });

  test("TransUnit.sourceIsEmpty", function () {
    const transUnit = TransUnit.fromString(getTransUnitXml());
    assert.strictEqual(
      transUnit.sourceIsEmpty(),
      false,
      "Source should not be considered empty."
    );
    transUnit.source = "       ";
    assert.strictEqual(
      transUnit.sourceIsEmpty(),
      true,
      "Source should be considered empty."
    );
  });

  test("TransUnit.targetIsEmpty", function () {
    const transUnit = TransUnit.fromString(getTransUnitXml());
    assert.strictEqual(
      transUnit.targetIsEmpty(),
      false,
      "target should not be considered empty."
    );
    transUnit.target.textContent = "       ";
    assert.strictEqual(
      transUnit.targetIsEmpty(),
      true,
      "target should be considered empty."
    );
  });

  test("TransUnit.targetMatchesSource", function () {
    const transUnit = TransUnit.fromString(getTransUnitXml());
    assert.strictEqual(
      transUnit.targetMatchesSource(),
      true,
      "target text content should match source."
    );
    transUnit.target.textContent = "dlalmlsmlmadmlsla";
    assert.strictEqual(
      transUnit.targetMatchesSource(),
      false,
      "target text content should not match source."
    );
  });

  test("Xliff.getXliffIdTokenArray()", function () {
    const langXlf = Xliff.fromString(getXliffMissingXliffGeneratorNote());
    const unitMissingGeneratorNote = langXlf.getTransUnitById(
      "Page 2931038265 - NamedType 12557645"
    );
    const normalUnit = langXlf.getTransUnitById(
      "Table 2328808854 - NamedType 12557645"
    );

    assert.throws(
      () => unitMissingGeneratorNote.getXliffIdTokenArray(),
      /Could not find a note from "Xliff Generator" in trans-unit "Page 2931038265 - NamedType 12557645"/
    );
    assert.doesNotThrow(
      () => normalUnit.getXliffIdTokenArray(),
      /Could not find a note from "Xliff Generator" in trans-unit "Table 2328808854 - NamedType 12557645"/
    );
    assert.deepStrictEqual(
      normalUnit.getXliffIdTokenArray(),
      XliffIdToken.getXliffIdTokenArray(
        normalUnit.id,
        normalUnit.notes.filter((n) => n.from === "Xliff Generator")[0]
          .textContent
      ),
      "XliffIdToken is not matching"
    );
  });

  test("targetStateActionNeededAttributes()", function () {
    assert.deepStrictEqual(
      targetStateActionNeededAttributes(),
      [
        'state="needs-adaptation"',
        'state="needs-l10n"',
        'state="needs-review-adaptation"',
        'state="needs-review-l10n"',
        'state="needs-review-translation"',
        'state="needs-translation"',
        'state="new"',
      ],
      "Unexpected contents of array"
    );
  });

  test("TransUnit.setTargetStateFromToken: default", function () {
    // Test switch default case
    const tu = getTransUnit();
    tu.setTargetStateFromToken();
    assert.strictEqual(
      tu.target.state,
      TargetState.translated,
      `Expected no TranslationToget to set state as: "${TargetState.translated}".`
    );
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(tu.target.translationToken, undefined);
  });

  test("TransUnit.setTargetStateFromToken: notTranslated", function () {
    const tu = getTransUnit(TranslationToken.notTranslated);
    tu.setTargetStateFromToken();
    assert.strictEqual(
      tu.target.state,
      TargetState.needsTranslation,
      `Expected token "${TranslationToken.notTranslated} to set state "${TargetState.needsTranslation}".`
    );
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(tu.target.translationToken, undefined);
  });

  test("TransUnit.setTargetStateFromToken: review", function () {
    const tu = getTransUnit(TranslationToken.review);
    tu.setTargetStateFromToken();
    assert.strictEqual(
      tu.target.state,
      TargetState.needsReviewTranslation,
      `Expected token "${TranslationToken.review} to set state "${TargetState.needsReviewTranslation}".`
    );
    assert.strictEqual(tu.target.stateQualifier, undefined);
    assert.strictEqual(tu.target.translationToken, undefined);
  });

  test("TransUnit.setTargetStateFromToken: suggestion", function () {
    const tu = getTransUnit(TranslationToken.suggestion);
    tu.setTargetStateFromToken();
    assert.strictEqual(
      tu.target.state,
      TargetState.translated,
      `Expected token "${TranslationToken.suggestion} to set state "${TargetState.translated}".`
    );
    assert.strictEqual(tu.target.stateQualifier, StateQualifier.exactMatch);
    assert.strictEqual(tu.target.translationToken, undefined);
  });
});

function getTransUnit(translationToken?: TranslationToken): TransUnit {
  const transUnit = new TransUnit(
    "Table 12557645",
    true,
    "Test",
    new Target("Test"),
    SizeUnit.char,
    "preserve"
  );
  transUnit.target.translationToken = translationToken;
  return transUnit;
}

function getNoteXml(): string {
  return '<note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyFieldOption - Property Caption</note>';
}

function getTargetXml(): string {
  return '<target state="final">This is a test ERROR in table</target>';
}

function getTargetXmlWithStateQualifier(): string {
  return '<target state="final" state-qualifier="id-match">This is a test ERROR in table</target>';
}

function getTargetWithoutStateXml(): string {
  return "<target>This is a test ERROR in table</target>";
}
function getTransUnitXml(): string {
  return `<trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
    <source>This is a test ERROR in table</source>
    <target state="New">This is a test ERROR in table</target>
    <note from="Developer" annotates="general" priority="2" />
    <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
  </trans-unit>`;
}

export function getSmallXliffXmlWithMultipleHtmlTag(): string {
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

export function getSmallXliffXmlWithHtmlTag(): string {
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

export function getSmallFormattedXliffXml(): string {
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

export function getSmallXliffXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR in table</source>
          <target>This is a test ERROR in table</target>
          <note from="Developer" annotates="general" priority="2" />
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR</source>
          <target>This is a test ERROR</target>
          <note from="Developer" annotates="general" priority="2" />
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

function xlfWithCustomNotes(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="Al">
    <body>
      <group id="body">
        <trans-unit id="Table 596208023 - Field 440443472 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field</source>
          <target>asdf</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field Test Field - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 596208023 - Field 440443472 - Method 1213635141 - NamedType 1061650423" size-unit="char" translate="yes" xml:space="preserve">
          <source>Field End OnLookupLabel</source>
          <target>[NAB: REVIEW]End OnLookUpLabel TEST Match</target>
            <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Source has been modified.</note>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field Test Field - Method OnLookup - NamedType LocalTestLabelTxt</note>
        </trans-unit>
        <trans-unit id="Table 596208023 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>MyField</source>
          <target>MyField</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table NAB Test Table - Field MyField - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 596208023 - Control 2961552353 - Property 62802879" size-unit="char" translate="yes" xml:space="preserve">
          <source>asdf,sadf,____ASADF</source>
          <target>asdf,sadf,____ASADF</target>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page NAB Test Table - Control Name - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Page 596208023 - Control 2961552353 - Property 1295455071" size-unit="char" translate="yes" xml:space="preserve">
          <source>Tooltup 3</source>
          <target>[NAB: REVIEW]Tooltup</target>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Source has been modified.</note>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page NAB Test Table - Control Name - Property ToolTip</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

export function xliffXmlWithDuplicateSources(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
<file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
  <body>
    <group id="body">
      <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
        <source>Duplicate</source>
        <target>This is a test ERROR in table</target>
        <note from="Developer" annotates="general" priority="2" />
        <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
      </trans-unit>
      <trans-unit id="Page 22931038265 - NamedType 212557645" size-unit="char" translate="yes" xml:space="preserve">
        <source>Duplicate</source>
        <target>This is a test ERROR</target>
        <note from="Developer" annotates="general" priority="2" />
        <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
      </trans-unit>
      <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
        <source>Duplicate</source>
        <target>This is a test ERROR</target>
        <note from="Developer" annotates="general" priority="2" />
        <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
      </trans-unit>
      <trans-unit id="Page 596208023 - Control 2961552353 - Property 1295455071" size-unit="char" translate="yes" xml:space="preserve">
        <source>Tooltup 3</source>
        <target>[NAB: REVIEW]Tooltup</target>
        <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Source has been modified.</note>
        <note from="Developer" annotates="general" priority="2"></note>
        <note from="Xliff Generator" annotates="general" priority="3">Page NAB Test Table - Control Name - Property ToolTip</note>
      </trans-unit>
    </group>
  </body>
</file>
</xliff>`;
}

export function getXliffWithHeaderXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp" tool-id="ERPLoc" product-name="n/a" product-version="n/a" build-num="n/a" request-id="37856">
    <header>
      <tool tool-id="ERPLoc" tool-name="ERPLoc" tool-version="1.0.172.638" tool-company="Microsoft CoreXT" />
    </header>
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - NamedType 12557645" translate="yes" xml:space="preserve">
          <source>This is a test ERROR in table</source>
          <target>This is a test ERROR in table</target>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - NamedType 12557645" translate="yes" xml:space="preserve">
          <source>This is a test ERROR</source>
          <target>This is a test ERROR</target>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

function getXliffMissingXliffGeneratorNote(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR in table</source>
          <target>This is a test ERROR in table</target>
          <note from="Developer" annotates="general" priority="2" />
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR</source>
          <target>This is a test ERROR</target>
          <note from="Developer" annotates="general" priority="2" />
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}
