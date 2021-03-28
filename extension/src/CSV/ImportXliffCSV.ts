import { Xliff } from "../XLIFFDocument";
import { CSV } from "./CSV";

const requiredHeaders: string[] = ["Id", "Source", "Target"];

export function importXliffCSV(updateXlf: Xliff, path: string): number {
    let csv = new CSV();
    let updatedTargets: number = 0;
    csv.importFileSync(path);
    testRequiredHeaders(csv.headers);
    csv.lines.forEach(line => {
        let values = { id: line[0], source: line[1], target: line[2] }
        let transunit = updateXlf.getTransUnitById(values.id);
        if (transunit.source !== values.source) {
            throw new Error(`Sources doesn't match for id ${transunit.id}`);
        }
        if (transunit.targetTextContent !== values.target) {
            transunit.targets[0].textContent = values.target;
            updatedTargets++;
        }
    });
    return updatedTargets;
}

function testRequiredHeaders(headers: string[]) {
    if (headers[0] !== requiredHeaders[0]) {
        throw new Error(`Missing requiered header "${requiredHeaders[0]}"`);
    }
    if (headers[1] !== requiredHeaders[1]) {
        throw new Error(`Missing requiered header "${requiredHeaders[1]}"`);
    }
    if (headers[2] !== requiredHeaders[2]) {
        throw new Error(`Missing requiered header "${requiredHeaders[2]}"`);
    }
}
