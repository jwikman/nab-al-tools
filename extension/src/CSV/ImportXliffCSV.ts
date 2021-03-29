import { Xliff } from "../XLIFFDocument";
import { CSV } from "./CSV";

const requiredHeaders: string[] = ["Id", "Source", "Target"];

export function importXliffCSV(updateXlf: Xliff, csvPath: string): number {
    let csv = new CSV();
    let updatedTargets: number = 0;
    csv.importFileSync(csvPath);
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
    for (let i = 0; i < requiredHeaders.length; i++) {
        if (headers[i] !== requiredHeaders[i]) {
            throw new Error(`Missing requiered header "${requiredHeaders[0]}"`);
        }
    }
}
