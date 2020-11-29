import { Note, SizeUnit, TransUnit } from "../XLIFFDocument";
import { ALControl } from "./ALControl";
import { ALElement } from "./ALElement";
import { MultiLanguageType } from "./Enums";
import { XliffIdToken } from "./XliffIdToken";

export class MultiLanguageObject extends ALElement {
    type: MultiLanguageType;
    name: string;
    text: string = '';
    locked: boolean = false;
    comment: string = '';
    maxLength: number | undefined;
    constructor(parent: ALControl, type: MultiLanguageType, name: string) {
        super();
        this.type = type;
        this.name = name;
        this.parent = parent;
    }

    public getXliffIdToken(): XliffIdToken {
        let tokenType: string = MultiLanguageType[this.type];
        let token = new XliffIdToken(tokenType, this.name);
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
    public getXliffIdTokenArray() {
        if (!this.parent) {
            throw new Error(`MultiLanguageObject ${this.type} ${this.name} does not have a parent`);
        }
        let xliffIdTokenArray = this.parent.getXliffIdTokenArray();
        if (!xliffIdTokenArray) {
            throw new Error(`MultiLanguageObject ${this.type} ${this.name} does not have a XliffIdTokenArray`);
        }
        return xliffIdTokenArray;
    }

    public getXliffId(): string {

        let xliffIdTokenArray = this.getXliffIdTokenArray();

        let result = '';
        for (let index = 0; index < xliffIdTokenArray.length; index++) {
            const item = xliffIdTokenArray[index];
            result += `${item.xliffId()} - `;
        }
        return result.substr(0, result.length - 3);
    }
    public getXliffIdWithNames(): string {
        let xliffIdTokenArray = this.getXliffIdTokenArray();

        let result = '';
        for (let index = 0; index < xliffIdTokenArray.length; index++) {
            const item = xliffIdTokenArray[index];
            result += `${item.xliffId(true)} - `;
        }
        return result.substr(0, result.length - 3);
    }


    public getTransUnit() {
        if (!this.locked) {
            return null;
        }

        let notes: Note[] = new Array();
        // <note from="Developer" annotates="general" priority="2">A comment</note>
        let commentNote: Note = new Note('Developer', 'general', 2, this.comment);
        // <note from="Xliff Generator" annotates="general" priority="3">Table MyCustomer - Field Name - Property Caption</note>
        let idNote: Note = new Note('Xliff Generator', 'general', 3, this.getXliffIdWithNames());
        notes.push(commentNote);
        notes.push(idNote);

        // <trans-unit id="Table 435452646 - Field 2961552353 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
        let source = this.text.replace("''", "'");
        let transUnit = new TransUnit(this.getXliffId(), !this.locked, source, undefined, SizeUnit.char, 'preserve', notes, this.maxLength);
        return transUnit;

    }
}
