import { isNullOrUndefined } from "util";
import { Xliff } from "../XLIFFDocument";
import { CSV } from "./CSV";

export function createXliffTSV(xlf: Xliff): CSV {
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

export function exportXliffTSV(exportPath: string, name: string, xlf: Xliff): CSV {
    let csv = createXliffTSV(xlf);
    csv.path = exportPath;
    csv.name = name;
    csv.exportSync();
    return csv;
}
