export class ALCodeLine {
  lineNo: number;
  code: string;
  indentation = 0;

  constructor(code: string, lineNo: number, indentation?: number) {
    this.code = code;
    this.lineNo = lineNo;
    if (indentation) {
      this.indentation = indentation;
    }
  }
  static fromString(code: string): ALCodeLine[] {
    const alCodeLines: ALCodeLine[] = [];
    let lineNo = 0;

    code
      .replace(/(\r\n|\n)/gm, "\n")
      .split("\n")
      .forEach((line) => {
        alCodeLines.push(new ALCodeLine(line, lineNo));
        lineNo++;
      });

    return alCodeLines;
  }
}
