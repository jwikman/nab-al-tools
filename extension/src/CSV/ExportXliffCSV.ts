import { CustomNoteType, Xliff } from "../Xliff/XLIFFDocument";
import { CSV } from "./CSV";

export function createXliffCSV(
  xlf: Xliff,
  options?: { columns: string[]; filter: string; checkTargetState: boolean }
): CSV {
  const csv = new CSV();
  // Set required headers
  csv.headers = ["Id", "Source", "Target"];
  if (options) {
    csv.headers = options.columns;
    xlf.transunit =
      options.filter === "All"
        ? xlf.transunit
        : xlf.transunit.filter((u) => u.needsReview(options.checkTargetState));
  } else {
    csv.headers = [
      "Id",
      "Source",
      "Target",
      "Developer Note",
      "Max Length",
      "Comment",
      "Xliff Generator Note",
      CustomNoteType.refreshXlfHint,
      "State",
      "State Qualifier",
    ];
  }

  xlf.transunit.forEach((tu) => {
    const developerNote = tu.developerNote();
    const generatorNote = tu.xliffGeneratorNote();
    const customNote = tu.customNote(CustomNoteType.refreshXlfHint);
    const line = [
      tu.id,
      checkNoInvalidCharacters(tu.source, csv.headers[1], tu.id),
      checkNoInvalidCharacters(tu.target.textContent, csv.headers[2], tu.id),
    ];
    csv.headers.slice(3).forEach((head) => {
      let value: string;
      switch (head) {
        case "Developer Note":
          value =
            developerNote?.textContent === undefined
              ? ""
              : checkNoInvalidCharacters(
                  developerNote.textContent,
                  head,
                  tu.id
                );
          break;
        case "Max Length":
          value = tu?.maxwidth === undefined ? "" : tu.maxwidth.toString();
          break;
        case "Comment":
          value = "";
          break;
        case "Xliff Generator Note":
          value =
            generatorNote?.textContent === undefined
              ? ""
              : checkNoInvalidCharacters(
                  generatorNote.textContent,
                  head,
                  tu.id
                );
          break;
        case CustomNoteType.refreshXlfHint:
          value =
            customNote?.textContent === undefined
              ? ""
              : checkNoInvalidCharacters(customNote.textContent, head, tu.id);
          break;
        case "State":
          value = checkNoInvalidCharacters(tu.targetState, head, tu.id);
          break;
        case "State Qualifier":
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
  options?: { columns: string[]; filter: string; checkTargetState: boolean }
): CSV {
  const csv = createXliffCSV(xlf, options);
  csv.path = exportPath;
  csv.name = name;
  csv.encoding = "utf8bom";
  csv.writeFileSync();
  return csv;
}
