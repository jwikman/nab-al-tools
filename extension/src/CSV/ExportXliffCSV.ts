import { isNullOrUndefined } from "util";
import { CustomNoteType, Xliff } from "../XLIFFDocument";
import { CSV } from "./CSV";


export function createXliffCSV(xlf: Xliff): CSV {
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
        let developerNote = tu.developerNote();
        let generatorNote = tu.generatorNote();
        let customNote = tu.customNote(CustomNoteType.RefreshXlfHint);

        csv.addLine([
            tu.id,
            tu.source,
            tu.targetTextContent,
            isNullOrUndefined(developerNote?.textContent) ? "" : developerNote.textContent,
            isNullOrUndefined(tu.maxwidth) ? "" : tu.maxwidth.toString(),
            "", // comment
            isNullOrUndefined(generatorNote?.textContent) ? "" : generatorNote.textContent,
            isNullOrUndefined(customNote?.textContent) ? "" : customNote.textContent,
            tu.targetState,
            tu.targetStateQualifier
        ]);
    });
    return csv;
}

export function exportXliffCSV(exportPath: string, name: string, xlf: Xliff): CSV {
    let csv = createXliffCSV(xlf);
    csv.path = exportPath;
    csv.name = name;
    csv.exportSync();
    return csv;
}
