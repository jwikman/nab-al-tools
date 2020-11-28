import { ALCodeLine } from "./ALCodeLine";
import { ALObject2 } from "./ALObject2";
import { ALObjectType } from "./Enums";

export class ALElement {
    public objectType: ALObjectType = ALObjectType.None;
    startLineIndex?: number;
    endLineIndex?: number;
    parentALObject?: ALObject2;
    isAlCode: boolean = false;
    codeLines: ALCodeLine[] = new Array();

    constructor(objectType: ALObjectType, codeLines: ALCodeLine[], startLineIndex: number) {
        this.objectType = objectType;
        this.codeLines = codeLines;
        for (let index = startLineIndex; index < codeLines.length; index++) {
            const codeLine = codeLines[index];
            if (codeLine.code) {

            }
        }
    }
    isTranslatable(): boolean {
        return false;
    }
    static parse(codeLines: ALCodeLine[], startLineIndex: number): ALElement {

    }
}