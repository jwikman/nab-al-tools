import { MultiLanguageType } from "./Enums";

export class MultiLanguageObject {
    public type: MultiLanguageType = MultiLanguageType.None;
    public name: string = '';
    public text: string = '';
    public locked: boolean = false;
    public comment: string = '';
    public maxLength: number | undefined;
}
