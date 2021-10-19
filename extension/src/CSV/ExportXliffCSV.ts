import { CustomNoteType, Xliff } from "../Xliff/XLIFFDocument";
import { CSV } from "./CSV";

export function createXliffCSV(
  xlf: Xliff,
  options?: { columns: string[]; filter: string }
): CSV {
  const csv = new CSV();
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
  xlf.transunit.forEach((tu) => {
    const developerNote = tu.developerNote();
    const generatorNote = tu.xliffGeneratorNote();
    const customNote = tu.customNote(CustomNoteType.refreshXlfHint);

    csv.addLine([
      tu.id,
      checkNoInvalidCharacters(tu.source, csv.headers[1], tu.id),
      checkNoInvalidCharacters(tu.target.textContent, csv.headers[2], tu.id),
      developerNote?.textContent === undefined
        ? ""
        : checkNoInvalidCharacters(
            developerNote.textContent,
            csv.headers[3],
            tu.id
          ),
      tu?.maxwidth === undefined ? "" : tu.maxwidth.toString(),
      "", // comment
      generatorNote?.textContent === undefined
        ? ""
        : checkNoInvalidCharacters(
            generatorNote.textContent,
            csv.headers[6],
            tu.id
          ),
      customNote?.textContent === undefined
        ? ""
        : checkNoInvalidCharacters(
            customNote.textContent,
            csv.headers[7],
            tu.id
          ),
      checkNoInvalidCharacters(tu.targetState, csv.headers[8], tu.id),
      checkNoInvalidCharacters(tu.targetStateQualifier, csv.headers[9], tu.id),
    ]);
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
  options?: { columns: string[]; filter: string }
): CSV {
  const csv = createXliffCSV(xlf);
  csv.path = exportPath;
  csv.name = name;
  csv.encoding = "utf8bom";
  csv.writeFileSync();
  return csv;
}
