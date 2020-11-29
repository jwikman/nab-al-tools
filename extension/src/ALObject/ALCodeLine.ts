import { TransUnit } from "../XLIFFDocument";
import { XliffIdToken } from "./XliffIdToken";

export class ALCodeLine {
    lineNo: number = 0;
    code: string = '';
    indentation: number = 0;
    // indentation: number = 0;
    // _xliffIdWithNames?: XliffIdToken[];
    // isML = false;
    // transUnit?: TransUnit;
    constructor(code?: string, lineNo?: number) {
        if (code) {
            this.code = code;
        }
        if (lineNo) {
            this.lineNo = lineNo;
        }
    }

    // public xliffId(): string {
    //     if (!this._xliffIdWithNames) {
    //         return '';
    //     }
    //     return XliffIdToken.getXliffId(this._xliffIdWithNames);
    // }

    // public xliffIdWithNames(): string {
    //     if (!this._xliffIdWithNames) {
    //         return '';
    //     }
    //     return XliffIdToken.getXliffIdWithNames(this._xliffIdWithNames);
    // }
}

