import { ALCodeLine } from "./ALCodeLine";
import { ALControl } from "./ALControl";

export class ALElement {
  startLineIndex = -1;
  endLineIndex = -1;
  parent?: ALControl;
  level = 0;
  alCodeLines: ALCodeLine[] = [];
}
