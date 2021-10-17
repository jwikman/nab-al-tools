import { CustomNoteType, TargetState, Xliff } from "../Xliff/XLIFFDocument";
import { CSV } from "./CSV";

export function importXliffCSV(
  updateXlf: Xliff,
  csvPath: string,
  useTargetStates: boolean,
  xliffCSVImportTargetState: string
): number {
  let updatedTargets = 0;
  const csv = new CSV();
  const requiredHeaders = csv.headers;
  csv.encoding = "utf8bom";
  csv.readFileSync(csvPath);

  const importSettings = getImportSettings(
    useTargetStates,
    xliffCSVImportTargetState
  );

  if (importSettings.updateTargetStateFromCsv) {
    requiredHeaders.push("State");
  }
  const headerIndexMap = csv.headerIndexMap;
  testRequiredHeaders(headerIndexMap, requiredHeaders);
  csv.lines
    .filter((l) => l.length > 1)
    .forEach((line) => {
      if (isHeader(line)) {
        return;
      }
      const values = {
        id: line[<number>headerIndexMap.get("Id")],
        source: line[<number>headerIndexMap.get("Source")],
        target: line[<number>headerIndexMap.get("Target")],
        state: importSettings.updateTargetStateFromCsv
          ? line[<number>headerIndexMap.get("State")]
          : "",
      };

      const transUnit = updateXlf.getTransUnitById(values.id);
      if (transUnit === undefined) {
        throw new Error(
          `Could not find any translation unit with id "${values.id}" in "${updateXlf._path}"`
        );
      }
      if (transUnit.source !== values.source) {
        throw new Error(
          `Sources doesn't match for id ${transUnit.id}.\nExisting Source: "${transUnit.source}".\nImported source: "${values.source}"`
        );
      }

      if (transUnit.target.textContent !== values.target) {
        transUnit.target.textContent = values.target;
        if (importSettings.updateTargetState) {
          transUnit.target.state = importSettings.updateTargetStateFromCsv
            ? (values.state as TargetState)
            : importSettings.newTargetState;
          transUnit.target.stateQualifier = undefined;
        }
        transUnit.removeCustomNote(CustomNoteType.refreshXlfHint);
        updatedTargets++;
      }
    });
  return updatedTargets;
}

function getImportSettings(
  useTargetStates: boolean,
  xliffCSVImportTargetState: string
): {
  updateTargetState: boolean;
  updateTargetStateFromCsv: boolean;
  newTargetState: TargetState | undefined;
} {
  const importSettings: {
    updateTargetState: boolean;
    updateTargetStateFromCsv: boolean;
    newTargetState: TargetState | undefined;
  } = {
    updateTargetState: false,
    updateTargetStateFromCsv: false,
    newTargetState: undefined,
  };
  if (useTargetStates) {
    switch (xliffCSVImportTargetState.toLowerCase()) {
      case "(leave)":
        importSettings.updateTargetState = false;
        break;
      case "(from csv)":
        importSettings.updateTargetState = true;
        importSettings.updateTargetStateFromCsv = true;
        break;
      default:
        importSettings.updateTargetState = true;
        importSettings.newTargetState = xliffCSVImportTargetState as TargetState;
        break;
    }
  }
  return importSettings;
}

function testRequiredHeaders(
  headerIndexMap: Map<string, number>,
  requiredHeaders: string[]
): void {
  for (let i = 0; i < requiredHeaders.length; i++) {
    if (!headerIndexMap.has(requiredHeaders[i])) {
      throw new Error(`Missing required header "${requiredHeaders[i]}"`);
    }
  }
}

function isHeader(line: string[]): boolean {
  return line.slice(0, 3).toString() === new CSV().headers.toString();
}
