import { Setting, Settings } from "../Settings";
import { CustomNoteType, TargetState, Xliff } from "../XLIFFDocument";
import { CSV } from "./CSV";

const requiredHeaders: string[] = ["Id", "Source", "Target"];

export function importXliffCSV(updateXlf: Xliff, csvPath: string): number {
    const useExternalTranslationTool = Settings.getConfigSettings()[Setting.UseExternalTranslationTool];
    let updatedTargets: number = 0;
    let csv = new CSV();
    csv.encoding = "utf8bom";
    csv.readFileSync(csvPath);
    testRequiredHeaders(csv.headers);
    csv.lines.filter(l => l.length > 1).forEach(line => {
        let values = { id: line[0], source: line[1], target: line[2] }
        let transunit = updateXlf.getTransUnitById(values.id);
        if (transunit.source !== values.source) {
            throw new Error(`Sources doesn't match for id ${transunit.id}.\nExisting Source: "${transunit.source}".\nImported source: "${values.source}"`);
        }
        if (transunit.target.textContent !== values.target) {
            transunit.target.textContent = values.target;
            if (useExternalTranslationTool) {
                transunit.target.stateQualifier = undefined;
                transunit.target.state = TargetState.Translated; // TODO: when import column mapping is fixed in  more flexible way -> Setting for State after import: Translated (default), From CSV, Leave, A fixed configured TargetState
            }
            transunit.removeCustomNote(CustomNoteType.RefreshXlfHint);
            updatedTargets++;
        }
    });
    return updatedTargets;
}

function testRequiredHeaders(headers: string[]) {
    for (let i = 0; i < requiredHeaders.length; i++) {
        if (headers[i] !== requiredHeaders[i]) {
            throw new Error(`Missing requiered header "${requiredHeaders[0]}"`);
        }
    }
}
