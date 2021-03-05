import { alFnv } from "../AlFunctions";
import { Note, SizeUnit, TransUnit } from "../XLIFFDocument";
import { ALControl } from "./ALControl";
import { ALElement } from "./ALElement";
import { ALControlType, ALObjectType, MultiLanguageType, XliffTokenType } from "./Enums";
import { XliffIdToken } from "./XliffIdToken";

export class MultiLanguageObject extends ALElement {
    type: MultiLanguageType;
    name: string;
    text: string = '';
    locked: boolean = false;
    comment: string = '';
    maxLength: number | undefined;
    commentedOut: boolean = false;
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
        xliffIdTokenArray = this.compressArray(xliffIdTokenArray);
        xliffIdTokenArray.push(this.xliffIdToken());
        return xliffIdTokenArray;
    }
    private compressArray(xliffIdTokenArray: XliffIdToken[]) {
        // const firstToken = xliffIdTokenArray[0];
        // const objectType = ALObjectType[<any>firstToken.type];
        for (let index = xliffIdTokenArray.length - 1; index > 1; index--) {
            const element = xliffIdTokenArray[index];
            const parent = xliffIdTokenArray[index - 1];
            let popParent: boolean = ([XliffTokenType[XliffTokenType.Control], XliffTokenType[XliffTokenType.Action]].includes(element.type) && parent.type === ALControlType[ALControlType.RequestPage]);
            if (!popParent) {
                popParent = parent.type === XliffTokenType[XliffTokenType.Control] && element.type === XliffTokenType[XliffTokenType.Action];
            }
            if (popParent) {
                xliffIdTokenArray.splice(index - 1, 1);
                index--;
            }

        }
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
        let transUnit = new TransUnit({ id: this.xliffId(), translate: !this.locked, source, sizeUnit: SizeUnit.char, xmlSpace: 'preserve', notes, maxwidth: this.maxLength, mlObject: this });
        let xliffIdTokenArray = this.xliffIdTokenArray();
        transUnit.Level1Name = xliffIdTokenArray[0].name;
        transUnit.Level1Type = xliffIdTokenArray[0].type;
        if (xliffIdTokenArray.length > 1) {
            transUnit.Level2Name = xliffIdTokenArray[1].name;
            transUnit.Level2Type = xliffIdTokenArray[1].type;
        }
        if (xliffIdTokenArray.length > 2) {
            transUnit.Level3Name = xliffIdTokenArray[2].name;
            transUnit.Level3Type = xliffIdTokenArray[2].type;
        }
        if (xliffIdTokenArray.length > 3) {
            transUnit.Level3Name = xliffIdTokenArray[3].name;
            transUnit.Level3Type = xliffIdTokenArray[3].type;
        }

        if (this.parent) {
            if ([ALObjectType.TableExtension, ALObjectType.PageExtension].includes(this.parent?.getObjectType())) {
                if (this.parent?.getObject().extendedObjectName) {

                    let targetObjectType = this.parent?.getObjectType() === ALObjectType.TableExtension ? 'Table' : 'Page';
                    let extendedObjectName = this.parent?.getObject().extendedObjectName;
                    if (extendedObjectName) {
                        transUnit.alObjectTarget = `${targetObjectType} ${alFnv(extendedObjectName)}`;
                    }
                }
            }

        }
        return transUnit;

    }

}
