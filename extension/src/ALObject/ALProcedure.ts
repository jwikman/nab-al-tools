import { ALControl } from "./ALControl";
import { wordPattern } from '../constants';

export class ALProcedure extends ALControl {


}


export class ALParameter {
    byRef: boolean = false;
    name: string;
    datatype: string;
    subtype?: string;
    constructor(byRef: boolean, name: string, datatype: string, subtype?: string) {
        this.byRef = byRef;
        this.name = name;
        this.datatype = datatype;
        this.subtype = subtype;
    }
    static fromString(param: string): ALParameter {
        let byRef: boolean = false;
        let name: string;
        let datatype: string;
        let subtype: string | undefined;
        if (param.trimStart().startsWith('var ')) {
            byRef = true;
            param = param.substr(4);
        }
        const paramRegex = new RegExp(`(?<name>${wordPattern})\\s*:\\s*(?<datatype>${wordPattern})\\s*(?<subtype>${wordPattern})?$`, "i");
        let paramMatch = param.match(paramRegex);
        if (!paramMatch) {
            throw new Error(`Could not parse ${param} as a valid parameter.`);
        }
        if (!paramMatch.groups) {
            throw new Error(`Could not parse ${param} as a valid parameter (groups).`);
        }
        name = paramMatch.groups.name;
        datatype = paramMatch.groups.datatype;
        if (paramMatch.groups.subtype) {
            subtype = paramMatch.groups.subtype;
        }
        return new ALParameter(byRef, name, datatype, subtype);
    }
}
