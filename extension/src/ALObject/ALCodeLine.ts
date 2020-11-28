import { TransUnit } from "../XLIFFDocument";
import { XliffIdToken } from "./XliffIdToken";

export class ALCodeLine {
    public lineNo: number = 0;
    public code: string = '';
    // public indentation: number = 0;
    // public _xliffIdWithNames?: XliffIdToken[];
    // public isML = false;
    // public transUnit?: TransUnit;
    constructor(code: string, lineNo: number) {
        this.code = code;
        this.lineNo = lineNo;
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

