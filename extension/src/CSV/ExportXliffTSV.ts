import { isNullOrUndefined } from "util";
import { CustomNoteType, Xliff } from "../XLIFFDocument";
import { CSV } from "./CSV";


export function createXliffTSV(xlf: Xliff): CSV {
    let csv = new CSV();
    csv.headers =
        [
            "Id",
            "Source",
            "Target",
            "Developer Note",
            "Max Length",
            "Comment",
            "Xliff Generator Note",
            CustomNoteType.RefreshXlfHint,
            "State",
            "State Qualifier"
        ];
    xlf.transunit.forEach(tu => {
        csv.addLine([
            tu.id,
            tu.source,
            tu.targetTextContent,
            tu.getNoteTextContent("Developer"),
            isNullOrUndefined(tu.maxwidth) ? "" : tu.maxwidth.toString(),
            "", // comment
            tu.getNoteTextContent("Xliff Generator"),
            tu.getNoteTextContent(CustomNoteType.RefreshXlfHint),
            tu.targetState,
            tu.targetStateQualifier
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
