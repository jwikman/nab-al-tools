import * as fs from "fs";
import * as path from "path";
import { Dictionary } from "../Dictionary";
import { CustomNoteType, TargetState, Xliff } from "../Xliff/XLIFFDocument";
import { CSV } from "./CSV";
import { CSVHeader } from "./ExportXliffCSV";

export function importXliffCSV(
  updateXlf: Xliff,
  csvPath: string,
  useTargetStates: boolean,
  xliffCSVImportTargetState: string,
  useDictionary: boolean,
  translationFolderPath: string
): number {
  let updatedTargets = 0;
  const csv = new CSV();
  const requiredHeaders = csv.headers;
  csv.encoding = "utf8bom";
  csv.readFileSync(csvPath);

  const importSettings = getImportSettings(
    useTargetStates,
    xliffCSVImportTargetState,
    useDictionary
  );
  const dictionary = getDictionary(
    importSettings,
    updateXlf.targetLanguage,
    translationFolderPath
  );
  if (importSettings.updateTargetStateFromCsv) {
    requiredHeaders.push(CSVHeader.state);
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
        id: line[<number>headerIndexMap.get(CSVHeader.id)],
        source: line[<number>headerIndexMap.get(CSVHeader.source)],
        target: line[<number>headerIndexMap.get(CSVHeader.target)],
        state: importSettings.updateTargetStateFromCsv
          ? line[<number>headerIndexMap.get(CSVHeader.state)]
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
      values.target = dictionary
        ? dictionary.translate(values.target)
        : values.target;

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
  xliffCSVImportTargetState: string,
  useDictionary: boolean
): ImportSettings {
  const importSettings: ImportSettings = {
    updateTargetState: false,
    updateTargetStateFromCsv: false,
    newTargetState: undefined,
    useDictionary: useDictionary,
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
  return (
    line.slice(0, 3).toString() ===
    [CSVHeader.id, CSVHeader.source, CSVHeader.target].toString()
  );
}

function getDictionary(
  importSettings: ImportSettings,
  languageCode: string,
  translationPath: string
): Dictionary | undefined {
  if (!importSettings.useDictionary) {
    return undefined;
  }
  const dictionaryPath = path.join(translationPath, `${languageCode}.dts.json`);
  return fs.existsSync(dictionaryPath)
    ? new Dictionary(dictionaryPath)
    : Dictionary.newDictionary(translationPath, languageCode, "dts");
}

interface ImportSettings {
  updateTargetState: boolean;
  updateTargetStateFromCsv: boolean;
  newTargetState: TargetState | undefined;
  useDictionary: boolean;
}
