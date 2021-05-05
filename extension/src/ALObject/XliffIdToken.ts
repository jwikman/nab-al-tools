import { alFnv } from "../AlFunctions";

export class XliffIdToken {
    public type = '';
    private _name = '';
    public level = 0;
    public id = 0;
    public isMlToken = false;

    constructor(type: string, name: string) {
        this.type = type;
        this.name = name;
    }

    public get name(): string {
        return this._name;
    }
    public set name(v: string) {
        if (v.startsWith('"') && v.endsWith('"')) {
            v = v.substr(1, v.length - 2);
        }
        this.id = alFnv(v);
        this._name = v;
    }
    public xliffId(showName?: boolean): string {
        if (undefined === showName || !showName) {
            return `${this.type} ${this.id}`;
        }
        return `${this.type} ${this.name}`;
    }

    public static getXliffIdTokenArray(idText: string, noteText: string): XliffIdToken[] {
        let fullIdArr = idText.split(' ');
        fullIdArr = fullIdArr.filter(x => x !== '-');
        const typeArr = fullIdArr.filter(x => isNaN(Number(x)));
        const result: XliffIdToken[] = [];
        for (let index = 0; index < typeArr.length; index++) {
            const type = typeArr[index];
            let name: string;

            if (index === typeArr.length - 1) {
                // last part
                name = noteText.substr(type.length + 1);
            } else {
                const pos = noteText.indexOf(` - ${typeArr[index + 1]}`);
                name = noteText.substr(type.length + 1, pos - type.length - 1);
                noteText = noteText.substr(pos + 3);
            }
            const newToken: XliffIdToken = new XliffIdToken(type, name);
            newToken.level = index;
            result.push(newToken);
        }
        return result;
    }
    public static getXliffId(xliffIdArray: XliffIdToken[]): string {
        let result = '';
        for (let index = 0; index < xliffIdArray.length; index++) {
            const item = xliffIdArray[index];
            result += `${item.xliffId()} - `;
        }
        return result.substr(0, result.length - 3);
    }
    public static getXliffIdWithNames(xliffIdArray: XliffIdToken[]): string {
        let result = '';
        for (let index = 0; index < xliffIdArray.length; index++) {
            const item = xliffIdArray[index];
            result += `${item.xliffId(true)} - `;
        }
        return result.substr(0, result.length - 3);
    }

}

