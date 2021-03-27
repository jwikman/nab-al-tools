import { isNullOrUndefined } from "util";
import { Xliff } from "../XLIFFDocument";
import { CSV } from "./CSV";

export function createXliffCSV(xlf: Xliff): CSV {
    let csv = new CSV();
    csv.headers =
        [
            "Id"
            , "Source"
            , "Target"
            , "Developer Note"
            , "Max Length"
            , "Comment"
            , "Xliff Generator Note"
            , "NAB AL Tool Note"
            , "State"
            , "State Qualifier"
        ];
    xlf.transunit.forEach(tu => {
        csv.addLine([
            tu.id
            , tu.source
            , tu.targetTextContent
            , tu.getNoteTextContent("Developer Note")
            , isNullOrUndefined(tu.maxwidth) ? "" : tu.maxwidth.toString()
            , "" // comment
            , tu.getNoteTextContent("Xliff Generator Note")
            , tu.getNoteTextContent("NAB AL Tool Note")
            , tu.targetState
            , tu.targetStateQualifier
        ]);
    });
    return csv;
}

export function exportXliffCSV(exportPath: string, xlf: Xliff) {
    let csv = createXliffCSV(xlf);
    csv.filePath = exportPath;
    csv.exportSync();
}
