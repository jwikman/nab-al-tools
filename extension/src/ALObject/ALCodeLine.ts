import { ignoreCodeLinePattern } from "./RegexPatterns";

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

  public isInsignificant(): boolean {
    // Comments, compiler directives and whitespace
    const ignoreRegex = new RegExp(ignoreCodeLinePattern, "im");
    const ignoreMatch = this.code.match(ignoreRegex);
    return null !== ignoreMatch;
  }

  public isWhitespace(): boolean {
    return this.code.trim() === "";
  }

  public isXmlComment(): boolean {
    return null !== this.code.match(/^\s*\/\/\/.*/i);
  }

  public isCompilerDirective(): boolean {
    return null !== this.code.match(/^\s*#.*/i);
  }

  public matchesPattern(regexp: string | RegExp): boolean {
    return null !== this.code.match(regexp);
  }
  public hasEmptyBlock(): boolean {
    const trimmedCode = this.code.trim();
    // Check if line ends with {} or { } without a preceding comment
    return (
      /\{\s*\}$/.test(trimmedCode) &&
      !trimmedCode.includes("//") &&
      !this.isInsignificant()
    );
  }
}
