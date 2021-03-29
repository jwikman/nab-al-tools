import * as assert from 'assert';
import * as path from 'path';
import { createXliffCSV, exportXliffCSV } from '../CSV/ExportXliffCSV';
import { importXliffCSV } from '../CSV/ImportXliffCSV';
import { Xliff } from '../XLIFFDocument';

const testResourcesPath = '../../src/test/resources/';

suite("CSV Import / Export Tests", function () {

  test("ExportXliffCSV.createXliffCSV()", async function () {
    let xlf = Xliff.fromString(smallXliffXml());
    let csv = createXliffCSV(xlf);
    assert.equal(csv.headers.length, 10, "unexpected number of header columns");
    assert.equal(csv.lines.length, 2, "Unexpected number of lines");
    assert.equal(csv.lines[0].length, 10, "Undexpected number of columns on line 0");
    assert.equal(csv.lines[0].filter(col => col === "").length, 1, "Expected only one empty column for line 0 (Comment).");
    assert.equal(csv.lines[1].length, 10, "Undexpected number of columns on line 1");
    let csvAsText = csv.toString();
    assert.equal(csvAsText.split("\r\n").length, csv.lines.length + 1, "Unexpexted number of exported lines.");
  });

  test("ExportXliffCSV.exportXliffCSV()", async function () {
    let xlf = Xliff.fromString(smallXliffXml());
    let exportPath = path.resolve(__dirname, testResourcesPath, "temp");
    exportXliffCSV(exportPath, "xlf_export", xlf);
  });

  test("ImportXliffCSV.importXliffCSV()", function () {
    let xlf = Xliff.fromString(smallXliffXml());
    const name = "xlf_export";
    let exportPath = path.resolve(__dirname, testResourcesPath, "temp");
    let importPath = path.resolve(exportPath, `${name}.csv`);
    let csv = exportXliffCSV(exportPath, name, xlf);
    assert.equal(importXliffCSV(xlf, importPath), 0, "Expected no changes in xlf");
    csv.lines[1][2] = "Cool";
    csv.writeFileSync();
    assert.equal(importXliffCSV(xlf, importPath), 1, "Expected 1 change in xlf");
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
      </group>
    </body>
  </file>
</xliff>`;
}
