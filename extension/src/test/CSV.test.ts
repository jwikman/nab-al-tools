import * as assert from 'assert';
import * as path from 'path';
import { createXliffTSV, exportXliffTSV } from '../CSV/ExportXliffTSV';
import { Xliff } from '../XLIFFDocument';
import { getSmallXliffXml } from './XLIFFTypes.test';

const testResourcesPath = '../../src/test/resources/';

suite("CSV Import / Export Tests", function () {

    test("ExportXliffCSV.createXliffCSV()", async function () {
        let xlf = Xliff.fromString(getSmallXliffXml()); // TODO: test with xlf that contains at least one transunit with all values
        let csv = createXliffTSV(xlf);
        assert.equal(csv.headers.length, 10, "unexpected number of header columns");
        assert.equal(csv.lines.length, 2, "Unexpected number of lines");
        assert.equal(csv.lines[0].length, 10, "Undexpected number of columns on line 0");
        assert.equal(csv.lines[1].length, 10, "Undexpected number of columns on line 1");
        let csvAsText = csv.toString();
        assert.equal(csvAsText.split("\r\n").length, csv.lines.length + 1, "Unexpexted number of exported lines.");
    });

    test("ExportXliffCSV.exportXliffCSV()", async function () {
        let xlf = Xliff.fromString(getSmallXliffXml());
        let exportPath = path.resolve(__dirname, testResourcesPath, "temp");
        exportXliffTSV(exportPath, "xlf_export", xlf);
    });
});
