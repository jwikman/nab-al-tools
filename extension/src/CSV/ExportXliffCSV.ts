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
        let generatorNote = tu.xliffGeneratorNote();
        let customNote = tu.customNote(CustomNoteType.RefreshXlfHint);

        csv.addLine([
            tu.id,
            checkNoInvalidCharacters(tu.source, csv.headers[1], tu.id),
            checkNoInvalidCharacters(tu.target.textContent, csv.headers[2], tu.id),
            isNullOrUndefined(developerNote?.textContent) ? "" : checkNoInvalidCharacters(developerNote.textContent, csv.headers[3], tu.id),
            isNullOrUndefined(tu.maxwidth) ? "" : tu.maxwidth.toString(),
            "", // comment
            isNullOrUndefined(generatorNote?.textContent) ? "" : checkNoInvalidCharacters(generatorNote.textContent, csv.headers[6], tu.id),
            isNullOrUndefined(customNote?.textContent) ? "" : checkNoInvalidCharacters(customNote.textContent, csv.headers[7], tu.id),
            checkNoInvalidCharacters(tu.targetState, csv.headers[8], tu.id),
            checkNoInvalidCharacters(tu.targetStateQualifier, csv.headers[9], tu.id)
        ]);
    });
    return csv;

    function checkNoInvalidCharacters(text: string, fieldDescription: string, transUnitId: string): string {
        if (hasInvalidChars(text)) {
            throw new Error(`The value of ${fieldDescription} in trans-unit with id '${transUnitId}' has invalid characters (tabs or newlines).\nValue: ${text}`);
        }
        return text;
    }
    function hasInvalidChars(value: string): boolean {
        return value.replace(/[\t\n\r]+/, '') !== value;
    }
}

export function exportXliffCSV(exportPath: string, name: string, xlf: Xliff): CSV {
    let csv = createXliffCSV(xlf);
    csv.path = exportPath;
    csv.name = name;
    csv.encoding = "utf8bom"
    csv.writeFileSync();
    return csv;
}
