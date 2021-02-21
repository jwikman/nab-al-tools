import * as _ from 'lodash';
import { ALControl } from "./ALControl";
import { parameterPattern, wordPattern, anyWhiteSpacePattern } from '../constants';
import { ALAccessModifier, ALControlType, XliffTokenType } from "./Enums";
import { isNullOrUndefined } from "util";

export class ALProcedure extends ALControl {
    parameters: ALVariable[] = [];
    access: ALAccessModifier = ALAccessModifier.public;
    returns?: ALVariable;
    attributes: string[] = [];

    constructor(name?: string, access?: ALAccessModifier, parameters?: ALVariable[], returns?: ALVariable, attributes?: string[]) {
        super(ALControlType.Procedure, name);
        this.xliffTokenType = XliffTokenType.Method;
        this.isALCode = true;

        if (access) {
            this.access = access;
        }
        if (parameters) {
            this.parameters = parameters;
        }
        if (returns) {
            this.returns = returns;
        }
        if (attributes) {
            this.attributes = attributes;
        }
    }

    public get event(): boolean {
        return this.attributes.filter(x => x.startsWith("BusinessEvent") || x.startsWith("IntegrationEvent")).length > 0;
    }
    public get integrationEvent(): boolean {
        return this.attributes.filter(x => x.startsWith("IntegrationEvent")).length > 0;
    }
    public get businessEvent(): boolean {
        return this.attributes.filter(x => x.startsWith("BusinessEvent")).length > 0;
    }
    public get obsoletePending(): boolean {
        return this.attributes.filter(x => x.startsWith("Obsolete")).length > 0;
    }
    public get filename(): string {
        return `${_.kebabCase(this.name)}.md`;
    }

    public toString(includeParameterNames: boolean): string {
        let paramsArr = this.parameters.map(function (p) {
            return `${p.toString(includeParameterNames)}`;
        });
        let params = paramsArr.join(',');
        let proc = `${this.name}(${params})`;
        if (this.returns) {
            proc += this.returns.toString(includeParameterNames);
        }
        return proc;
    }

    static fromString(procedure: string): ALProcedure {
        let name: string;
        let parameters: ALVariable[] = [];
        let access: ALAccessModifier;
        let attributes: string[] = [];
        let returns;

        procedure = procedure.trim();
        if (procedure.endsWith(';')) {
            procedure = procedure.substr(0, procedure.length - 1);
        }

        const procedureRegex = new RegExp(`^${anyWhiteSpacePattern}*(?<attributes>(\\[.*\\]${anyWhiteSpacePattern}*)*)?(?<access>internal |protected |local |)procedure\\s+(?<name>${wordPattern})\\(${anyWhiteSpacePattern}*(?<params>((?<firstParam>${removeGroupNamesFromRegex(parameterPattern)}))?(?<moreParams>${anyWhiteSpacePattern}*;${anyWhiteSpacePattern}*${removeGroupNamesFromRegex(parameterPattern)})*)${anyWhiteSpacePattern}*\\)${anyWhiteSpacePattern}*(?<returns>.*)?$`, "im");
        console.log(procedureRegex.source);
        let procedureMatch = procedure.match(procedureRegex);
        if (!procedureMatch) {
            throw new Error(`Could not parse '${procedure}' as a valid procedure.`);
        }
        if (!procedureMatch.groups) {
            throw new Error(`Could not parse '${procedure}' as a valid procedure (groups).`);
        }
        name = procedureMatch.groups.name;
        let accessText = procedureMatch.groups.access;

        switch (accessText.trim().toLowerCase()) {
            case '':
                access = ALAccessModifier.public;
                break;
            case 'local':
                access = ALAccessModifier.local;
                break;
            case 'internal':
                access = ALAccessModifier.internal;
                break;
            case 'protected':
                access = ALAccessModifier.protected;
                break;
            default:
                throw new Error(`${accessText.trim().toLowerCase()} is not a valid access modifier. Procedure ${name}.`);
        }


        if (procedureMatch.groups.attributes) {
            let attributesText = procedureMatch.groups.attributes;
            let attributePattern = /^\s*\[(?<attribute>.+)\]\s*$/igm;
            let attributeMatchArr = [...attributesText.matchAll(attributePattern)];
            attributeMatchArr.forEach(x => {
                if (x.groups?.attribute) {
                    attributes.push(x.groups?.attribute);
                }
            });
        }
        if (procedureMatch.groups.params) {
            let paramsText = procedureMatch.groups.params;
            const paramsRegex = new RegExp(`(?<param>${parameterPattern})(?<rest>.*)`, "ims");
            const separatorRegex = new RegExp(`^${anyWhiteSpacePattern}*;${anyWhiteSpacePattern}*`, "im");
            let loop = true;
            do {
                let paramsMatch = paramsText.match(paramsRegex);
                if (!paramsMatch) {
                    throw new Error(`Could not parse '${procedure}' as a valid procedure with parameters.`);
                }
                if (!paramsMatch.groups) {
                    throw new Error(`Could not parse '${procedure}' as a valid procedure with parameters (groups).`);
                }
                if (!paramsMatch.groups.param) {
                    throw new Error(`Could not parse '${procedure}' as a valid procedure with parameters (group param).`);
                }
                parameters.push(ALVariable.fromString(paramsMatch.groups.param));
                paramsText = paramsMatch.groups.rest.replace(separatorRegex, "");
                if (paramsText.trim() === "") {
                    loop = false;
                }

            } while (loop);

        }
        if (procedureMatch.groups.returns) {
            let returnsText = procedureMatch.groups.returns;
            const returnsRegex = new RegExp(`(?<name>${wordPattern})?\\s*:\\s*(?<datatype>${wordPattern})\\s*(?<subtype>${wordPattern})?`, "i");
            let returnsMatch = returnsText.match(returnsRegex);
            if (!returnsMatch) {
                throw new Error(`Could not parse '${procedure}' as a valid procedure with return value.`);
            }
            if (!returnsMatch.groups) {
                throw new Error(`Could not parse '${procedure}' as a valid procedure with return value (groups).`);
            }
            let returnDatatype;
            let returnSubtype;
            let returnName;

            if (returnsMatch.groups.name) {
                returnName = returnsMatch.groups.name;
            }
            returnDatatype = returnsMatch.groups.datatype;
            if (returnsMatch.groups.subtype) {
                returnSubtype = returnsMatch.groups.subtype;
            }
            returns = new ALVariable({ byRef: false, name: returnName, datatype: returnDatatype, subtype: returnSubtype });

        }

        return new ALProcedure(name, access, parameters, returns, attributes);
    }

}


export class ALVariable {
    byRef: boolean = false;
    name?: string;
    datatype: string;
    subtype?: string;
    temporary?: boolean;
    constructor({ byRef, name, datatype, subtype, temporary }: { byRef: boolean; name?: string; datatype: string; subtype?: string; temporary?: boolean; }) {
        this.byRef = byRef;
        this.name = name;
        this.datatype = datatype;
        this.subtype = subtype;
        this.temporary = temporary;
    }

    public get fullDataType(): string {
        return isNullOrUndefined(this.subtype) ? this.datatype : `${this.datatype} ${this.subtype}${this.temporary ? ' temporary' : ''}`;
    }

    public toString(includeParameterName: boolean): string {

        if (includeParameterName) {
            return `${this.byRef ? "var " : ""}${this.name} : ${this.fullDataType}`;
        } else {
            return `${this.fullDataType}`;
        }
    }


    static fromString(param: string): ALVariable {
        let byRef: boolean = false;
        let name: string;
        let datatype: string;
        let subtype: string | undefined;
        let temporary: boolean | undefined;

        const paramRegex = new RegExp(`${parameterPattern}$`, "i");
        console.log(paramRegex.source);
        let paramMatch = param.match(paramRegex);
        if (!paramMatch) {
            throw new Error(`Could not parse ${param} as a valid parameter.`);
        }
        if (!paramMatch.groups) {
            throw new Error(`Could not parse ${param} as a valid parameter (groups).`);
        }
        name = paramMatch.groups.name;

        if (paramMatch.groups.byRef) {
            if (paramMatch.groups.byRef.trim() === "var") {
                byRef = true;
            }
        }

        datatype = paramMatch.groups.datatype; // TODO: Support complex datatypes as dictionary, array, List etc
        if (paramMatch.groups.objectDataType) {
            datatype = paramMatch.groups.objectType;
            subtype = paramMatch.groups.objectName;
            if (paramMatch.groups.temporary) {
                temporary = true;
            }
        }

        return new ALVariable({ byRef, name, datatype, subtype, temporary });
    }
}

export function removeGroupNamesFromRegex(regex: string): string {
    return regex.replace(/\?<\w+>/g, "");
}