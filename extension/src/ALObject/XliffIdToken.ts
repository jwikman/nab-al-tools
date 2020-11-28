import { alFnv } from "../AlFunctions";

export class XliffIdToken {
    public type: string = '';
    private _Name: string = '';
    public level: number = 0;
    public id: number = 0;
    public isMlToken: boolean = false;
    public get Name(): string {
        return this._Name;
    }
    public set Name(v: string) {
        if (v.startsWith('"') && v.endsWith('"')) {
            v = v.substr(1, v.length - 2);
        }
        this.id = alFnv(v);
        this._Name = v;
    }
    public xliffId(showName?: boolean): string {
        if (undefined === showName || !showName) {
            return `${this.type} ${this.id}`;
        }
        return `${this.type} ${this.Name}`;
    }

    public static getXliffIdTokenArray(IdText: string, NoteText: string): XliffIdToken[] {
        let fullIdArr = IdText.split(' ');
        fullIdArr = fullIdArr.filter(x => x !== '-');
        let typeArr = fullIdArr.filter(x => isNaN(Number(x)));
        let result: XliffIdToken[] = new Array();
        let noteText = NoteText;
        for (let index = 0; index < typeArr.length; index++) {
            const type = typeArr[index];
            let newToken: XliffIdToken = new XliffIdToken();
            newToken.level = index;
            newToken.type = type;
            if (index === typeArr.length - 1) {
                // last part
                newToken.Name = noteText.substr(type.length + 1);
            } else {
                let pos = noteText.indexOf(` - ${typeArr[index + 1]}`);
                newToken.Name = noteText.substr(type.length + 1, pos - type.length - 1);
                noteText = noteText.substr(pos + 3);
            }
            result.push(newToken);
        }
        return result;
    }
    public static getXliffId(XliffIdArray: XliffIdToken[]): string {
        let result = '';
        for (let index = 0; index < XliffIdArray.length; index++) {
            const item = XliffIdArray[index];
            result += `${item.xliffId()} - `;
        }
        return result.substr(0, result.length - 3);
    }
    public static getXliffIdWithNames(XliffIdArray: XliffIdToken[]): string {
        let result = '';
        for (let index = 0; index < XliffIdArray.length; index++) {
            const item = XliffIdArray[index];
            result += `${item.xliffId(true)} - `;
        }
        return result.substr(0, result.length - 3);
    }

}

