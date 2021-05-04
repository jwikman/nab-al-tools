import { alFnv } from "../AlFunctions";
import { Note, SizeUnit, TransUnit } from "../Xliff/XLIFFDocument";
import { ALControl } from "./ALControl";
import { ALElement } from "./ALElement";
import { ALControlType, ALObjectType, MultiLanguageType, XliffTokenType } from "./Enums";
import { XliffIdToken } from "./XliffIdToken";

export class MultiLanguageObject extends ALElement {
    type: MultiLanguageType;
    name: string;
    text = '';
    locked = false;
    comment = '';
    maxLength: number | undefined;
    commentedOut = false;
    constructor(parent: ALControl, type: MultiLanguageType, name: string) {
        super();
        if (type === MultiLanguageType.label) {
            this.type = MultiLanguageType.namedType;
            this.name = name;
        } else {
            this.type = MultiLanguageType.property;
            this.name = type;
        }
        this.parent = parent;
    }

    public xliffIdToken(): XliffIdToken {
        const tokenType: string = this.type;
        const token = new XliffIdToken(tokenType, this.name);
        return token;
    }

    public shouldBeTranslated(): boolean {
        if (this.locked) {
            return false;
        }
        if (!this.parent) {
            return true;
        }
        return !this.parent.isObsolete();
    }
    public xliffIdTokenArray(): XliffIdToken[] {
        if (!this.parent) {
            throw new Error(`MultiLanguageObject ${this.type} ${this.name} does not have a parent`);
        }
        let xliffIdTokenArray = this.parent.xliffIdTokenArray();
        if (!xliffIdTokenArray) {
            throw new Error(`MultiLanguageObject ${this.type} ${this.name} does not have a XliffIdTokenArray`);
        }
        xliffIdTokenArray = this.compressArray(xliffIdTokenArray);
        xliffIdTokenArray.push(this.xliffIdToken());
        return xliffIdTokenArray;
    }
    private compressArray(xliffIdTokenArray: XliffIdToken[]): XliffIdToken[] {
        // const firstToken = xliffIdTokenArray[0];
        // const objectType = ALObjectType[<any>firstToken.type];
        for (let index = xliffIdTokenArray.length - 1; index > 1; index--) {
            const element = xliffIdTokenArray[index];
            const parent = xliffIdTokenArray[index - 1];
            let popParent: boolean = ([XliffTokenType.control.toString(), XliffTokenType.action.toString()].includes(element.type) && parent.type.toLowerCase() === ALControlType.requestPage.toLowerCase());
            if (!popParent) {
                popParent = parent.type === XliffTokenType.control && element.type === XliffTokenType.action;
            }
            if (popParent) {
                xliffIdTokenArray.splice(index - 1, 1);
                index--;
            }

        }
        return xliffIdTokenArray;
    }
    public xliffId(): string {

        const xliffIdTokenArray = this.xliffIdTokenArray();

        let result = '';
        for (let index = 0; index < xliffIdTokenArray.length; index++) {
            const item = xliffIdTokenArray[index];
            result += `${item.xliffId()} - `;
        }
        return result.substr(0, result.length - 3);
    }
    public xliffIdWithNames(): string {
        const xliffIdTokenArray = this.xliffIdTokenArray();

        let result = '';
        for (let index = 0; index < xliffIdTokenArray.length; index++) {
            const item = xliffIdTokenArray[index];
            result += `${item.xliffId(true)} - `;
        }
        return result.substr(0, result.length - 3);
    }

    public transUnit(): TransUnit | undefined {
        if (this.locked) {
            return;
        }

        const notes: Note[] = [];
        // <note from="Developer" annotates="general" priority="2">A comment</note>
        const commentNote: Note = new Note('Developer', 'general', 2, this.comment);
        // <note from="Xliff Generator" annotates="general" priority="3">Table MyCustomer - Field Name - Property Caption</note>
        const idNote: Note = new Note('Xliff Generator', 'general', 3, this.xliffIdWithNames());
        notes.push(commentNote);
        notes.push(idNote);

        // <trans-unit id="Table 435452646 - Field 2961552353 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
        const source = this.text.replace("''", "'");
        const transUnit = new TransUnit(this.xliffId(), !this.locked, source, undefined, SizeUnit.char, 'preserve', notes, this.maxLength);
        if (this.parent) {
            if ([ALObjectType.tableExtension, ALObjectType.pageExtension].includes(this.parent?.getObjectType())) {
                if (this.parent?.getObject().extendedObjectName) {

                    const targetObjectType = this.parent?.getObjectType() === ALObjectType.tableExtension ? 'Table' : 'Page';
                    const extendedObjectName = this.parent?.getObject().extendedObjectName;
                    if (extendedObjectName) {
                        transUnit.alObjectTarget = `${targetObjectType} ${alFnv(extendedObjectName)}`;
                    }
                }
            }

        }
        return transUnit;

    }

}
