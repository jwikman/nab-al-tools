import { TransUnit, Target, Note, TargetState, SizeUnit } from './XLIFFDocument';

export interface XliffDocumentInterface {
    version?: string;
    datatype?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    original?: string;
    transunit?: TransUnit[];
    toString(removeSelfClosingTags: boolean, formatXml: boolean): string;
}

export interface TransUnitInterface {
    id: string;
    translate: boolean;
    source: string;
    target: Target;
    sizeUnit?: SizeUnit;
    xmlSpace?: string;
    note?: Note[];
    toString(): string;
    toElement(): Element;
}

export interface TargetInterface {
    textContent?: string;
    state?: TargetState|null;
    toString(): string;
    toElement(): Element;
}

export interface NoteInterface {
    from: string;
    annotates: string;
    priority: number;
    textContent: string;
    toString(): string;
    toElement(): Element;
}
