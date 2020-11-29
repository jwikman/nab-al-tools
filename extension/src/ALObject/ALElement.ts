import { ALCodeLine } from "./ALCodeLine";
import { ALControl } from "./ALControl";
import { ALMethod } from "./ALMethod";
import { ALObject2 } from "./ALObject2";

export class ALElement {
    startLineIndex?: number;
    endLineIndex?: number;
    parent?: ALControl;
    level: number = 0;
    alCodeLines: ALCodeLine[] = new Array();
    hasXliffToken: boolean = false;
    // isAlCode: boolean = false;
    // methods: ALMethod[] = new Array();
    // controls: ALControl[] = new Array();

    // isTranslatable(): boolean {
    //     return false;
    // }
    // static parse(codeLines: ALCodeLine[], startLineIndex: number) {

    // }
}