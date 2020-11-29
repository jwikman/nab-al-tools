import { ALCodeLine } from "./ALCodeLine";
import { ALControl } from "./ALControl";

export class ALElement {
    startLineIndex?: number;
    endLineIndex?: number;
    parent?: ALControl;
    level: number = 0;
    alCodeLines: ALCodeLine[] = new Array();
}