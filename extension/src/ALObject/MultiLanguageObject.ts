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
        if (type === MultiLanguageType.Label) {
            this.type = MultiLanguageType.NamedType;
            this.name = name;
        } else {
            this.type = MultiLanguageType.Property;
            this.name = MultiLanguageType[type];
        }
        this.parent = parent;
    }

    public xliffIdToken(): XliffIdToken {
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
    public xliffIdTokenArray() {
        if (!this.parent) {
            throw new Error(`MultiLanguageObject ${this.type} ${this.name} does not have a parent`);
        }
        let xliffIdTokenArray = this.parent.xliffIdTokenArray();
        if (!xliffIdTokenArray) {
            throw new Error(`MultiLanguageObject ${this.type} ${this.name} does not have a XliffIdTokenArray`);
        }
        xliffIdTokenArray.push(this.xliffIdToken());
        return xliffIdTokenArray;
    }

    public xliffId(): string {

        let xliffIdTokenArray = this.xliffIdTokenArray();

        let result = '';
        for (let index = 0; index < xliffIdTokenArray.length; index++) {
            const item = xliffIdTokenArray[index];
            result += `${item.xliffId()} - `;
        }
        return result.substr(0, result.length - 3);
    }
    public xliffIdWithNames(): string {
        let xliffIdTokenArray = this.xliffIdTokenArray();

        let result = '';
        for (let index = 0; index < xliffIdTokenArray.length; index++) {
            const item = xliffIdTokenArray[index];
            result += `${item.xliffId(true)} - `;
        }
        return result.substr(0, result.length - 3);
    }

    public transUnit() {
        if (this.locked) {
            return;
        }

        let notes: Note[] = new Array();
        // <note from="Developer" annotates="general" priority="2">A comment</note>
        let commentNote: Note = new Note('Developer', 'general', 2, this.comment);
        // <note from="Xliff Generator" annotates="general" priority="3">Table MyCustomer - Field Name - Property Caption</note>
        let idNote: Note = new Note('Xliff Generator', 'general', 3, this.xliffIdWithNames());
        notes.push(commentNote);
        notes.push(idNote);

        // <trans-unit id="Table 435452646 - Field 2961552353 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
        let source = this.text.replace("''", "'");
        let transUnit = new TransUnit(this.xliffId(), !this.locked, source, undefined, SizeUnit.char, 'preserve', notes, this.maxLength);
        return transUnit;

    }

}
