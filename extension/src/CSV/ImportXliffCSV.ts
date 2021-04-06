import { isNullOrUndefined } from "util";
import { CustomNoteType, TargetState, Xliff } from "../XLIFFDocument";
import { CSV } from "./CSV";


export function importXliffCSV(updateXlf: Xliff, csvPath: string, useExternalTranslationTool: boolean, xliffCSVImportTargetState: string): number {
    let requiredHeaders: string[] = ["Id", "Source", "Target"];

    let updatedTargets: number = 0;
    let csv = new CSV();
    csv.encoding = "utf8bom";
    csv.readFileSync(csvPath);
    let updateTargetState = false;
    let updateTargetStateFromCsv = false;
    let newTargetState: TargetState;
    if (useExternalTranslationTool) {
        switch (xliffCSVImportTargetState.toLowerCase()) {
            case "(leave)":
                updateTargetState = false;
                break;
            case "(from csv)":
                updateTargetState = true;
                updateTargetStateFromCsv = true;
                break;
            default:
                updateTargetState = true;
                newTargetState = <TargetState>xliffCSVImportTargetState;
                break;
        }
    }
    if (updateTargetStateFromCsv) {
        requiredHeaders.push("State");
    }
    const headerIndexMap = csv.headerIndexMap;
    testRequiredHeaders(headerIndexMap, requiredHeaders);

    csv.lines.filter(l => l.length > 1).forEach(line => {
        let values = { id: line[<number>headerIndexMap.get("Id")], source: line[<number>headerIndexMap.get("Source")], target: line[<number>headerIndexMap.get("Target")], state: "" }
        if (updateTargetStateFromCsv) {
            values.state = line[<number>headerIndexMap.get("State")];
        }

        let transUnit = updateXlf.getTransUnitById(values.id);
        if (isNullOrUndefined(transUnit)) {
            throw new Error(`Could not find any translation unit with id "${values.id}" in "${updateXlf._path}"`);
        }
        if (transUnit.source !== values.source) {
            throw new Error(`Sources doesn't match for id ${transUnit.id}.\nExisting Source: "${transUnit.source}".\nImported source: "${values.source}"`);
        }

        if (transUnit.target.textContent !== values.target) {
            transUnit.target.textContent = values.target;
            if (updateTargetState) {
                if (updateTargetStateFromCsv) {
                    transUnit.target.state = <TargetState>values.state;
                } else {
                    transUnit.target.state = newTargetState;
                }
                transUnit.target.stateQualifier = undefined;
            }
            transUnit.removeCustomNote(CustomNoteType.RefreshXlfHint);
            updatedTargets++;
        }
    });
    return updatedTargets;
}

function testRequiredHeaders(headerIndexMap: Map<string, number>, requiredHeaders: string[]) {
    for (let i = 0; i < requiredHeaders.length; i++) {
        if (!headerIndexMap.has(requiredHeaders[i])) {
            throw new Error(`Missing required header "${requiredHeaders[i]}"`);
        }
    }
}

