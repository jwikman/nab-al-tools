import { CustomNoteType, Xliff } from "../Xliff/XLIFFDocument";
import { CSV } from "./CSV";

export function createXliffCSV(
  xlf: Xliff,
  options?: {
    columns: CSVHeader[];
    filter: CSVExportFilter;
    checkTargetState: boolean;
  }
): CSV {
  const csv = new CSV();
  // Set required headers
  csv.headers = [CSVHeader.id, CSVHeader.source, CSVHeader.target];
  if (options) {
    csv.headers = options.columns;
    xlf.transunit =
      options.filter === CSVExportFilter.all
        ? xlf.transunit
        : xlf.transunit.filter((u) => u.needsAction(options.checkTargetState));
  } else {
    csv.headers = Object.values(CSVHeader);
  }

  xlf.transunit.forEach((tu) => {
    const developerNote = tu.developerNote();
    const generatorNote = tu.xliffGeneratorNote();
    const customNote = tu.customNote(CustomNoteType.refreshXlfHint);
    const line = [
      tu.id,
      checkNoInvalidCharacters(tu.source, CSVHeader.id, tu.id),
      checkNoInvalidCharacters(tu.target.textContent, CSVHeader.target, tu.id),
    ];
    csv.headers.slice(3).forEach((head) => {
      let value: string;
      switch (head) {
        case CSVHeader.developerNote:
          value =
            developerNote?.textContent === undefined
              ? ""
              : checkNoInvalidCharacters(
                  developerNote.textContent,
                  head,
                  tu.id
                );
          break;
        case CSVHeader.maxLength:
          value = tu?.maxwidth === undefined ? "" : tu.maxwidth.toString();
          break;
        case CSVHeader.comment:
          value = "";
          break;
        case CSVHeader.xliffGeneratorNote:
          value =
            generatorNote?.textContent === undefined
              ? ""
              : checkNoInvalidCharacters(
                  generatorNote.textContent,
                  head,
                  tu.id
                );
          break;
        case CSVHeader.refreshXlfHint:
          value =
            customNote?.textContent === undefined
              ? ""
              : checkNoInvalidCharacters(customNote.textContent, head, tu.id);
          break;
        case CSVHeader.state:
          value = checkNoInvalidCharacters(tu.targetState, head, tu.id);
          break;
        case CSVHeader.stateQualifier:
          value = checkNoInvalidCharacters(
            tu.targetStateQualifier,
            head,
            tu.id
          );
          break;
        default:
          return;
      }
      line.push(value);
    });
    csv.addLine(line);
  });
  return csv;

  function checkNoInvalidCharacters(
    text: string,
    fieldDescription: string,
    transUnitId: string
  ): string {
    if (hasInvalidChars(text)) {
      throw new Error(
        `The value of ${fieldDescription} in trans-unit with id '${transUnitId}' has invalid characters (tabs or newlines).\nValue: ${text}`
      );
    }
    return text;
  }
  function hasInvalidChars(value: string): boolean {
    return value.replace(/[\t\n\r]+/, "") !== value;
  }
}

export function exportXliffCSV(
  exportPath: string,
  name: string,
  xlf: Xliff,
  options?: {
    columns: CSVHeader[];
    filter: CSVExportFilter;
    checkTargetState: boolean;
  }
): CSV {
  const csv = createXliffCSV(xlf, options);
  csv.path = exportPath;
  csv.name = name;
  csv.encoding = "utf8bom";
  csv.writeFileSync();
  return csv;
}

export enum CSVHeader {
  id = "Id",
  source = "Source",
  target = "Target",
  developerNote = "Developer Note",
  maxLength = "Max Length",
  comment = "Comment",
  xliffGeneratorNote = "Xliff Generator Note",
  refreshXlfHint = "NAB AL Tool Refresh Xlf",
  state = "State",
  stateQualifier = "State Qualifier",
}

export enum CSVExportFilter {
  all = "All",
  inNeedOfReview = "In Need Of Review",
}
