export class ALCodeLine {
    lineNo: number = 0;
    code: string = '';
    indentation: number = 0;

    constructor(code?: string, lineNo?: number) {
        if (code) {
            this.code = code;
        }
        if (lineNo) {
            this.lineNo = lineNo;
        }
    }

}

