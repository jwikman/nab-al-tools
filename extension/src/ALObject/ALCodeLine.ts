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
}
