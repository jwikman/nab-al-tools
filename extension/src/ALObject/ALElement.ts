import { ALCodeLine } from "./ALCodeLine";
import { ALControl } from "./ALControl";

export class ALElement {
    startLineIndex: number = -1;
    endLineIndex: number = -1;
    parent?: ALControl;
    level: number = 0;
    alCodeLines: ALCodeLine[] = new Array();
}