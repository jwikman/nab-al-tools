import * as assert from "assert";
import * as path from "path";
import { CSV } from "../CSV/CSV";
import {
  createXliffCSV,
  CSVExportFilter,
  CSVHeader,
  exportXliffCSV,
} from "../CSV/ExportXliffCSV";
import { importXliffCSV } from "../CSV/ImportXliffCSV";
import { TargetState, Xliff } from "../Xliff/XLIFFDocument";

suite("CSV Import / Export Tests", function () {
  const testResourcesPath = path.resolve(
    __dirname,
    "../../src/test/resources/"
  );

  test("ExportXliffCSV.createXliffCSV()", async function () {
    const xlf = Xliff.fromString(smallXliffXml());
    const csv = createXliffCSV(xlf);
    assert.deepStrictEqual(
      csv.headers.length,
      10,
      "unexpected number of header columns"
    );
    assert.deepStrictEqual(csv.lines.length, 3, "Unexpected number of lines");
    assert.deepStrictEqual(
      csv.lines[0].length,
      10,
      "Unexpected number of columns on line 0"
    );
    assert.deepStrictEqual(
      csv.lines[0].filter((col) => col === "").length,
      1,
      "Expected only one empty column for line 0 (Comment)."
    );
    assert.deepStrictEqual(
      csv.lines[1].length,
      10,
      "Unexpected number of columns on line 1"
    );
    const csvAsText = csv.toString();
    assert.deepStrictEqual(
      csvAsText.split("\r\n").length,
      csv.lines.length + 1,
      "Unexpected number of exported lines."
    );
  });

  test("ExportXliffCSV.createXliffCSV(): with options", async function () {
    const xlf = Xliff.fromString(smallXliffXml());
    const options = {
      columns: [CSVHeader.comment, CSVHeader.xliffGeneratorNote],
      filter: CSVExportFilter.inNeedOfReview,
      checkTargetState: true,
    };

    const csv = createXliffCSV(xlf, options);
    assert.deepStrictEqual(
      csv.headers.length,
      5,
      "unexpected number of header columns"
    );
    assert.deepStrictEqual(csv.lines.length, 2, "Unexpected number of lines");
    assert.deepStrictEqual(
      csv.lines[0].length,
      5,
      "Unexpected number of columns on line 0"
    );
    assert.deepStrictEqual(
      csv.lines[0].filter((col) => col === "").length,
      1,
      "Expected only one empty column for line 0 (Comment)."
    );
    assert.deepStrictEqual(
      csv.lines[1].length,
      5,
      "Unexpected number of columns on line 1"
    );
    const csvAsText = csv.toString();
    assert.deepStrictEqual(
      csvAsText.split("\r\n").length,
      csv.lines.length + 1,
      "Unexpected number of exported lines."
    );
    assert.deepStrictEqual(
      csv.lines[1][0],
      "Table 2328808888 - NamedType 12557666",
      "Unexpected id found on line 1, column 0."
    );
  });

  test("ExportXliffCSV.createXliffCSV(): Invalid Chars Error", async function () {
    const xlf = Xliff.fromString(smallXliffXml());
    const options = {
      columns: [CSVHeader.comment, CSVHeader.xliffGeneratorNote],
      filter: CSVExportFilter.inNeedOfReview,
      checkTargetState: true,
    };
    const expectedText = "Någon har \t sig...\n hehe";
    xlf.transunit[2].notes[1].textContent = expectedText;
    assert.throws(
      () => createXliffCSV(xlf, options),
      (error) => {
        assert.ok(error instanceof Error, "Expected Error");
        assert.strictEqual(
          error.message,
          `The value of Xliff Generator Note in trans-unit with id 'Table 2328808888 - NamedType 12557666' has invalid characters (tabs or newlines).\nValue: ${expectedText}`
        );
        return true;
      },
      "Expected Error to be thrown."
    );
  });

  test("ExportXliffCSV.exportXliffCSV()", async function () {
    const xlf = Xliff.fromString(smallXliffXml());
    const exportPath = path.resolve(testResourcesPath, "temp");
    exportXliffCSV(exportPath, "xlf_export", xlf);
  });

  test("ImportXliffCSV.importXliffCSV()", function () {
    const xlf = Xliff.fromString(smallXliffXml());
    const name = "xlf_export";
    const exportPath = path.resolve(testResourcesPath, "temp");
    const importPath = path.resolve(exportPath, `${name}.csv`);
    const csv = exportXliffCSV(exportPath, name, xlf);
    assert.deepStrictEqual(
      importXliffCSV(xlf, importPath, false, "(leave)", false),
      0,
      "Expected no changes in xlf"
    );
    csv.lines[1][2] = "Cool";
    assert.strictEqual(
      csv.lines.length,
      3,
      "Unexpected number of lines in import."
    );
    csv.writeFileSync();
    assert.deepStrictEqual(
      importXliffCSV(xlf, importPath, false, "(leave)", false),
      1,
      "Expected 1 change in xlf"
    );
  });

  test("ImportXliffCSV.importXliffCSV(): useTargetState", function () {
    const xlf = Xliff.fromString(smallXliffXml());
    const name = "xlf-export-targetstate";
    const exportPath = path.resolve(testResourcesPath, "temp");
    const importPath = path.resolve(exportPath, `${name}.csv`);
    const csv = exportXliffCSV(exportPath, name, xlf);
    assert.deepStrictEqual(
      importXliffCSV(xlf, importPath, true, "(leave)", false),
      0,
      "Expected no changes in xlf"
    );
    csv.lines[1][2] = "Cool";
    assert.strictEqual(
      csv.lines.length,
      3,
      "Unexpected number of lines in import."
    );
    csv.writeFileSync();
    assert.deepStrictEqual(
      importXliffCSV(xlf, importPath, true, "(leave)", false),
      1,
      "Expected 1 change in xlf"
    );
  });

  test("ImportXliffCSV.importXliffCSV(): updateTargetStateFromCSV", function () {
    const xlf = Xliff.fromString(smallXliffXml());
    assert.strictEqual(
      xlf.transunit[1].target?.state,
      null,
      "Unexpected Target state."
    );
    const name = "xlf-update-target-state";
    const importPath = path.resolve(testResourcesPath, `${name}.csv`);
    const updatedTargets = importXliffCSV(
      xlf,
      importPath,
      true,
      "(from csv)",
      false
    );
    assert.strictEqual(updatedTargets, 1, "Expected no changes in xlf");
    assert.strictEqual(
      xlf.transunit[0].target.state,
      TargetState.final,
      "Unexpected Target state."
    );
    assert.strictEqual(
      xlf.transunit[1].target.state,
      TargetState.final,
      "Unexpected Target state."
    );
    assert.strictEqual(
      xlf.transunit[2].target.state,
      TargetState.needsReviewTranslation,
      "Unexpected Target state."
    );
  });

  test.only("ImportXliffCSV.importXliffCSV(): Error: Transunit Id", function () {
    const badTransunitId = "1337";
    const exportXlf = Xliff.fromString(smallXliffXml());
    exportXlf.transunit[0].id = badTransunitId;
    const name = "xlf-export-error-id";
    const exportPath = path.resolve(testResourcesPath, "temp");
    const importPath = path.resolve(exportPath, `${name}.csv`);
    exportXliffCSV(exportPath, name, exportXlf);
    const updateXlf = Xliff.fromString(smallXliffXml());
    updateXlf._path = "update-xlf-path";

    assert.throws(
      () => importXliffCSV(updateXlf, importPath, true, "(leave)", false),
      (error) => {
        assert.ok(error instanceof Error, "Expected Error");
        assert.strictEqual(
          error.message,
          `Could not find any translation unit with id "${badTransunitId}" in "${updateXlf._path}"`,
          "Unexpected error message."
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });

  test.only("ImportXliffCSV.importXliffCSV(): Ignore missing transunit", function () {
    const badTransunitId = "1338";
    const exportXlf = Xliff.fromString(smallXliffXml());
    exportXlf.transunit[0].id = badTransunitId;
    const name = "xlf-export-error-id";
    const exportPath = path.resolve(testResourcesPath, "temp");
    const importPath = path.resolve(exportPath, `${name}.csv`);
    exportXliffCSV(exportPath, name, exportXlf);
    const updateXlf = Xliff.fromString(smallXliffXml());
    updateXlf._path = "update-xlf-path";

    const updatedTargets = importXliffCSV(
      updateXlf,
      importPath,
      true,
      "(leave)",
      true
    );
    assert.strictEqual(updatedTargets, 0, "Expected no changes in xlf");
  });

  test("ImportXliffCSV.importXliffCSV(): Error: Source", function () {
    const badValue = "1337";
    const exportXlf = Xliff.fromString(smallXliffXml());
    exportXlf.transunit[0].source = badValue;
    const name = "xlf-export-error-source";
    const exportPath = path.resolve(testResourcesPath, "temp");
    const importPath = path.resolve(exportPath, `${name}.csv`);
    exportXliffCSV(exportPath, name, exportXlf);
    const updateXlf = Xliff.fromString(smallXliffXml());
    assert.throws(
      () => importXliffCSV(updateXlf, importPath, true, "(leave)", false),
      (error) => {
        assert.ok(error instanceof Error, "Expected Error");
        assert.strictEqual(
          error.message,
          `Sources doesn't match for id ${updateXlf.transunit[0].id}.\nExisting Source: "${updateXlf.transunit[0].source}".\nImported source: "${badValue}"`,
          "Unexpected error message."
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });

  test("CSV.readFileSync(): Error", function () {
    const csv = new CSV();
    assert.throws(
      () =>
        csv.readFileSync(
          path.join(testResourcesPath, "xlf_export-semi-colon.csv")
        ),
      (error) => {
        assert.ok(error instanceof Error);
        assert.strictEqual(
          error.message,
          "Could not find expected column separator.",
          "Unexpected error message"
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });

  test("CSV.extension: set/get", function () {
    const expected = "tsv";
    const csv = new CSV("test", "\t");
    csv.extension = expected;
    assert.strictEqual(csv.extension, expected, "Unexpected extension.");
  });

  test("CSV.filepath", function () {
    const csv = new CSV("test", "\t");
    assert.throws(
      () => csv.filepath,
      (error) => {
        assert.ok(error instanceof Error);
        assert.strictEqual(
          error.message,
          "CSV.path is not set.",
          "Unexpected error message"
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });

  test("CSV.filename", function () {
    const csv = new CSV();
    assert.throws(
      () => csv.filename,
      (error) => {
        assert.ok(error instanceof Error);
        assert.strictEqual(
          error.message,
          "CSV.name is not set.",
          "Unexpected error message"
        );
        return true;
      },
      "Expected error to be thrown."
    );
  });
});

function smallXliffXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" maxwidth="50" translate="yes" xml:space="preserve">
          <source>This is a test</source>
          <target state="final" state-qualifier="exact-match">Detta är ett test</target>
          <note from="Developer" annotates="general" priority="2">Some kind of Dev note</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Source has been modified.</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>Cool</source>
          <target>Sval</target>
          <note from="Developer" annotates="general" priority="2"/>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Table 2328808888 - NamedType 12557666" size-unit="char" maxwidth="50" translate="yes" xml:space="preserve">
          <source>This is a test</source>
          <target state="needs-review-translation" state-qualifier="exact-match">Detta är ett test</target>
          <note from="Developer" annotates="general" priority="2">Some kind of Dev note</note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
          <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Source has been modified.</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}
