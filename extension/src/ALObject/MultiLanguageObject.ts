import { Note, SizeUnit, TransUnit } from "../XLIFFDocument";
import { ALElement } from "./ALElement";
import { ALObjectType, MultiLanguageType } from "./Enums";
import { XliffIdToken } from "./XliffIdToken";

export class MultiLanguageObject extends ALElement {
    public type: MultiLanguageType = MultiLanguageType.None;
    public name: string = '';
    public text: string = '';
    public locked: boolean = false;
    public comment: string = '';
    public maxLength: number | undefined;

    public getXliffIdToken(): XliffIdToken | undefined {
        if (!this.name) {
            return;
        }
        let tokenType: string = ALObjectType[this.type];
        let token = new XliffIdToken(tokenType, this.name);
        return token;
    }

    public getXliffId(): string {
        if (!this.parent) {
            throw new Error(`MultiLanguageObject ${this.type} ${this.name} does not have a parent`);
        }
        let xliffIdTokenArray = this.parent.getXliffIdTokenArray();
        if (!xliffIdTokenArray) {
            throw new Error(`MultiLanguageObject ${this.type} ${this.name} does not have a XliffIdTokenArray`);
        }
    }


    // public getTransUnit() {
    //     // source: string, translate: boolean, comment: string, maxLen: number | undefined, xliffId: string, xliffIdWithNames: string
    //     if (!this.locked) {
    //         return null;
    //     }

    //     let notes: Note[] = new Array();
    //     // <note from="Developer" annotates="general" priority="2">A comment</note>
    //     let commentNote: Note = new Note('Developer', 'general', 2, this.comment);
    //     // <note from="Xliff Generator" annotates="general" priority="3">Table MyCustomer - Field Name - Property Caption</note>
    //     let idNote: Note = new Note('Xliff Generator', 'general', 3, this.xliffIdWithNames);
    //     notes.push(commentNote);
    //     notes.push(idNote);

    //     // <trans-unit id="Table 435452646 - Field 2961552353 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
    //     let source = this.text.replace("''", "'");
    //     let transUnit = new TransUnit(xliffId, !this.locked, source, undefined, SizeUnit.char, 'preserve', notes, this.maxLength);
    //     return transUnit;

    // }
}
