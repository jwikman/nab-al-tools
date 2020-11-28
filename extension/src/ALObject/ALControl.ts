import { ALMethod } from "./ALMethod";
import { ALObject2 } from "./ALObject2";
import { ALControlKind } from "./Enums";

export class ALControl {
    public type: ALControlKind = ALControlKind.None;
    public name: string | undefined;
    public caption: string | undefined;
    public value: string | undefined;
    public toolTip: string | undefined;
    public relatedObject: ALObject2 | undefined;
    public controls: ALControl[] | undefined;
    public methods: ALMethod[] | undefined;


    constructor() {

    }
}


