import * as assert from "assert";
import * as path from "path";
import { createXliffCSV, exportXliffCSV } from "../CSV/ExportXliffCSV";
import { importXliffCSV } from "../CSV/ImportXliffCSV";
import { Xliff } from "../Xliff/XLIFFDocument";

const testResourcesPath = path.resolve(__dirname, "../../src/test/resources/");

suite("CSV Import / Export Tests", function () {
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
      importXliffCSV(
        xlf,
        importPath,
        false,
        "(leave)",
        false,
        testResourcesPath
      ),
      0,
      "Expected no changes in xlf"
    );
    csv.lines[1][2] = "Cooling";
    assert.strictEqual(csv.lines.length, 3, "Only 3 lines was expected.");
    csv.writeFileSync();
    assert.deepStrictEqual(
      importXliffCSV(
        xlf,
        importPath,
        false,
        "(leave)",
        false,
        testResourcesPath
      ),
      1,
      "Expected 1 changes in xlf"
    );
    csv.writeFileSync();
    // Run with dictionary
    assert.deepStrictEqual(
      importXliffCSV(
        xlf,
        importPath,
        false,
        "(leave)",
        true,
        testResourcesPath
      ),
      1,
      "Expected 1 changes in xlf"
    );
    assert.strictEqual(
      xlf.transunit[2].target.textContent,
      "Kall",
      "Expected dictionary replacement of target"
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
          <source>Cooling</source>
          <target>Svalkande</target>
          <note from="Developer" annotates="general" priority="2"/>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038666 - NamedType 12557666" size-unit="char" translate="yes" xml:space="preserve">
          <source>Cool</source>
          <target>Sval</target>
          <note from="Developer" annotates="general" priority="2"/>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}
