import { ALControl, ObsoletePendingInfo } from "./ALControl";
import { parameterPattern, anyWhiteSpacePattern, returnVariablePattern, procedurePattern } from '../constants';
import { ALAccessModifier, ALControlType, XliffTokenType } from "./Enums";
import { isNullOrUndefined } from "util";
import { ALVariable } from './ALVariable';
import { kebabCase, snakeCase } from "lodash";

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
        return this.attributes.filter(x => x.toLowerCase().startsWith("businessevent") || x.toLowerCase().startsWith("integrationevent")).length > 0;
    }
    public get integrationEvent(): boolean {
        return this.attributes.filter(x => x.toLowerCase().startsWith("integrationevent")).length > 0;
    }
    public get businessEvent(): boolean {
        return this.attributes.filter(x => x.toLowerCase().startsWith("businessevent")).length > 0;
    }
    public get obsoletePending(): boolean {
        return this.attributes.filter(x => x.toLowerCase().startsWith("obsolete")).length > 0;
    }
    public get docsFilename(): string {
        return `${kebabCase(this.name)}.md`;
    }
    public get docsAnchor(): string {
        return `${snakeCase(this.toString(false, true))}`;
    }
    public get docsLink(): string {
        return `${this.docsFilename}#${this.docsAnchor}`;
    }

    public isObsoletePending(inheritFromParent: boolean = true): boolean {
        let obsoleteAttributeExists = this.attributes.filter(x => x.toLowerCase().startsWith("obsolete")).length > 0;

        if (obsoleteAttributeExists) {
            return true;
        }
        if (!inheritFromParent) {
            return false;
        }
        if (!this.parent) {
            return false; // Object level, no ObsoleteState Pending set
        }
        return this.parent.isObsoletePending(inheritFromParent);
    }


    public getObsoletePendingInfo(): ObsoletePendingInfo | undefined {
        if (!this.isObsoletePending(false)) {
            return;
        }
        let obsoleteAttribute = this.attributes.filter(x => x.toLowerCase().startsWith("obsolete"))[0];
        if (!obsoleteAttribute) {
            return;
        }
        let info: ObsoletePendingInfo = new ObsoletePendingInfo();

        let obsoletePattern = /^\s*Obsolete(\(('(?<reason>([^']|('(?=')(?<=')'))*)')?(\s*,\s*'(?<tag>[^']*)')?\))?/i;
        let obsoleteResult = obsoleteAttribute.match(obsoletePattern);
        if (!obsoleteResult) {
            return;
        }
        if (!obsoleteResult.groups) {
            return;
        }
        info.obsoleteState = "Pending";
        info.obsoleteReason = obsoleteResult.groups.reason ? obsoleteResult.groups.reason : '';
        info.obsoleteTag = obsoleteResult.groups.tag ? obsoleteResult.groups.tag : '';

        return info;
    }

    public toString(includeParameterNames: boolean, omitReturn?: boolean): string {
        let paramsArr = this.parameters.map(function (p) {
            return `${p.toString(includeParameterNames)}`;
        });
        let attributes = '';
        if (includeParameterNames) {

            attributes = this.attributes.map(function (a) {
                return `[${a}]`;
            }).join('\n');
            if (attributes.length > 0) {
                attributes += '\n';
            }
        }
        let params = paramsArr.join(', ');
        let proc = `${attributes}${this.name}(${params})`;
        if (!isNullOrUndefined(omitReturn) && !omitReturn && !isNullOrUndefined(this.returns)) {
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

        const procedureRegex = new RegExp(procedurePattern, "im");
        // console.log(procedureRegex.source);
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
            const returnsRegex = new RegExp(returnVariablePattern, "i");
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
            let returnTemporary: boolean | undefined;

            if (returnsMatch.groups.name) {
                returnName = returnsMatch.groups.name;
            }

            returnDatatype = returnsMatch.groups.datatype;
            if (returnsMatch.groups.objectDataType) {
                returnDatatype = returnsMatch.groups.objectType;
                returnSubtype = returnsMatch.groups.objectName;
                if (returnsMatch.groups.temporary) {
                    returnTemporary = true;
                }
            }

            returns = new ALVariable({ byRef: false, name: returnName, datatype: returnDatatype, subtype: returnSubtype, temporary: returnTemporary });
        }

        return new ALProcedure(name, access, parameters, returns, attributes);
    }

}
