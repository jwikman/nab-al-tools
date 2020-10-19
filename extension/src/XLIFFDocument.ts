/**
 *  https://docs.oasis-open.org/xliff/xliff-core/xliff-core.html
 */
import * as fs from 'fs';
import * as xmldom from 'xmldom';

import {XliffDocumentInterface, TransUnitInterface, TargetInterface, NoteInterface} from './XLIFFInterface';
import { XmlFormattingOptionsFactory, ClassicXmlFormatter} from './XmlFormatter';
import { isNullOrUndefined } from 'util';

export class Xliff implements XliffDocumentInterface {
    public datatype: string;
    public sourceLanguage: string;
    public targetLanguage: string;
    public original: string;
    public transunit: TransUnit[];
    public lineEnding: string = '\n';
    static xmlns = 'urn:oasis:names:tc:xliff:document:1.2';

    constructor (datatype: string, sourceLanguage: string, targetLanguage: string, original: string) {
        this.datatype = datatype;
        this.sourceLanguage = sourceLanguage;
        this.targetLanguage = targetLanguage;
        this.original = original;
        this.transunit = [];
    }

    static fromString(xml: string): Xliff {
        let dom = xmldom.DOMParser;
        let xlfDom = new dom().parseFromString(xml);
        let xliff = Xliff.fromDocument(xlfDom);
        xliff.lineEnding = Xliff.detectLineEnding(xml);
        return xliff;
    }

    static fromDocument(xmlDoc: Document): Xliff {
        let fileElmnt = xmlDoc.getElementsByTagName('file')[0];
        let _datatype = fileElmnt.getAttributeNode('datatype')?.value;// 'xml';
        _datatype = isNullOrUndefined(_datatype) ? '' : _datatype;
        let _sourceLang = fileElmnt.getAttributeNode('source-language')?.value;
        _sourceLang = isNullOrUndefined(_sourceLang) ? '' : _sourceLang;
        let _targetLang = fileElmnt.getAttributeNode('target-language')?.value;
        _targetLang = isNullOrUndefined(_targetLang) ? '' : _targetLang;
        let _original = fileElmnt.getAttributeNode('original')?.value;
        _original = isNullOrUndefined(_original) ? '' : _original;
        let xliff = new Xliff(_datatype, _sourceLang, _targetLang, _original);
        let tu = xmlDoc.getElementsByTagNameNS(Xliff.xmlns, 'trans-unit');
        for (let i = 0; i < tu.length; i++) {
            xliff.transunit.push(TransUnit.fromElement(tu[i]));
        }
        return xliff;
    }

    public toString(removeSelfClosingTags: boolean = true, formatXml: boolean = true): string {
        let xml = new xmldom.XMLSerializer().serializeToString(this.toDocument());
        if (removeSelfClosingTags) {
            xml = this.removeSelfClosingTags(xml);
        }
        if (formatXml) {
            xml = this.formatXml(xml);
        }
        return xml;
    }
    private formatXml(xml: string): string {
        let xmlFormatter = new ClassicXmlFormatter();
        let formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();
        return xmlFormatter.formatXml(xml, formattingOptions);
    }
    private removeSelfClosingTags(xml: string): string {
        // ref https://stackoverflow.com/a/16792194/5717285
        var split = xml.split("/>");
        var newXml = "";
        for (var i = 0; i < split.length - 1; i++) {
            var edsplit = split[i].split("<");
            newXml += split[i] + "></" + edsplit[edsplit.length - 1].split(" ")[0] + ">";
        }
        return newXml + split[split.length - 1];
    }

    public toDocument(): Document {
        let xliffDocument: Document = new xmldom.DOMParser().parseFromString('<?xml version="1.0" encoding="utf-8"?>');
        let xliffNode = xliffDocument.createElement('xliff');
        xliffNode.setAttribute('version', '1.2');
        xliffNode.setAttribute('xmlns', Xliff.xmlns);
        xliffNode.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        xliffNode.setAttribute('xsi:schemaLocation', 'urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd');
        let fileNode = xliffDocument.createElementNS(Xliff.xmlns, 'file');
        fileNode.setAttribute('datatype', this.datatype);
        fileNode.setAttribute('source-language', this.sourceLanguage);
        fileNode.setAttribute('target-language', this.targetLanguage);
        fileNode.setAttribute('original', this.original);
        let bodyNode = xliffDocument.createElementNS(Xliff.xmlns, 'body');
        let bodyGroupNode = xliffDocument.createElementNS(Xliff.xmlns, 'group');
        bodyGroupNode.setAttribute('id', 'body');
        this.transunit.forEach( tUnit => {
            bodyGroupNode.appendChild(tUnit.toElement());
        });
        bodyNode.appendChild(bodyGroupNode);
        fileNode.appendChild(bodyNode);
        xliffNode.appendChild(fileNode);
        xliffDocument.appendChild(xliffNode);
        return xliffDocument;
    }

    static fromFileSync(path: string, encoding?: string): Xliff {
        encoding = isNullOrUndefined(encoding) ? 'utf8': encoding;
        if (!path.endsWith('xlf')) {
            throw new Error(`Not a Xlf file path: ${path}`);
            
        }
        return Xliff.fromString(fs.readFileSync(path, encoding));
    }

    public toFileSync(path: string, removeSelfClosingTags: boolean = true, formatXml: boolean = true, encoding?: string) {
        encoding = isNullOrUndefined(encoding) ? 'utf8': encoding;
        fs.writeFileSync(path, this.toString(removeSelfClosingTags, formatXml), encoding);
    }

    public getTransUnitById(id: string): TransUnit {
        return this.transunit.filter(tu => tu.id === id)[0];
    }

    public hasTransUnit(id: string): boolean {
        return !isNullOrUndefined(this.getTransUnitById(id));
    }

    public sortTransUnits() {
        this.transunit = this.transunit.sort(CompareTransUnitId);
    }
    static detectLineEnding(xml: string): string {
        const temp = xml.indexOf('\n');
        if (xml[temp - 1] === '\r') {
            return '\r\n';
        }
        return '\n';
    }
}

export class TransUnit implements TransUnitInterface {
    id: string;
    translate: boolean;
    source: string;
    target: Target;
    note?: Note[];
    sizeUnit?: SizeUnit;
    xmlSpace: string;
    maxwidth: number|undefined;
    alObjectTarget: string|undefined;

    constructor(id: string, translate: boolean, source: string, target: Target, sizeUnit: SizeUnit, xmlSpace: string, notes?: Note[], maxwidth?:number|undefined, alObjectTarget?: string|undefined) {
        this.id = id;
        this.translate = translate;
        this.source = source;
        this.target = target;
        this.note = notes;
        this.sizeUnit = sizeUnit;
        this.xmlSpace = xmlSpace;
        this.maxwidth = maxwidth;
        this.alObjectTarget = alObjectTarget;
    }

    static fromString(xml: string): TransUnit {
        let dom = xmldom.DOMParser;
        let transUnit = new dom().parseFromString(xml).getElementsByTagName('trans-unit')[0];
        return TransUnit.fromElement(transUnit);
    }

    static fromElement(transUnit: Element): TransUnit {
        let _maxwidth = undefined;
        let _notes: Array<Note> = [];
        let _id = transUnit.getAttributeNode('id')?.value;
        _id = isNullOrUndefined(_id) ? '' : _id;
        let _alObjectTarget = transUnit.getAttributeNode('al-object-target')?.value;
        _alObjectTarget = isNullOrUndefined(_alObjectTarget) ? undefined : _alObjectTarget;
        let _sizeUnit = transUnit.getAttributeNode('size-unit')?.value;
        _sizeUnit = isNullOrUndefined(_sizeUnit) ? SizeUnit.char : _sizeUnit;
        let _xmlSpace = transUnit.getAttributeNode('xml:space')?.value;
        _xmlSpace = isNullOrUndefined(_xmlSpace) ? 'preserve' : _xmlSpace;
        let t = transUnit.getAttributeNode('translate')?.value;
        let _translate = (t === null || t === undefined || t.toLowerCase() === 'no') ? false : true;
        let _source = transUnit.getElementsByTagName('source')[0]?.childNodes[0]?.nodeValue;
        _source = isNullOrUndefined(_source) ? '': _source;
        let targetElmnt = transUnit.getElementsByTagName('target')[0];
        let notesElmnts = transUnit.getElementsByTagName('note');
        for (let i = 0; i < notesElmnts.length; i++) {
            _notes.push(Note.fromElement(notesElmnts[i]));
        }
        return new TransUnit(_id, _translate, _source, Target.fromElement(targetElmnt), <SizeUnit>_sizeUnit, _xmlSpace, _notes, _maxwidth, _alObjectTarget);
    }

    public toString(): string {
        return new xmldom.XMLSerializer().serializeToString(this.toElement());
    }

    public toElement(): Element {
        let transUnit = new xmldom.DOMImplementation().createDocument(null, null, null).createElement('trans-unit');
        transUnit.setAttribute('id', this.id);
        transUnit.setAttribute('size-unit', isNullOrUndefined(this.sizeUnit) ? SizeUnit.char : this.sizeUnit);
        transUnit.setAttribute('translate', this.translateAttributeYesNo());
        transUnit.setAttribute('xml:space', this.xmlSpace);
        let source = new xmldom.DOMImplementation().createDocument(null, null, null).createElement('source');
        source.textContent = this.source;
        transUnit.appendChild(source);
        transUnit.appendChild(this.target.toElement());
        this.note?.forEach(n => {
            transUnit.appendChild(n.toElement());
        });
        return transUnit;
    }

    public addNote(from: string, annotates: string, priority: number, textContent: string) {
        this.note?.push(new Note(from, annotates, priority, textContent));
    }

    public getNoteFrom(from: string): Note[]|null {
        let note = this.note?.filter((n) => n.from = from);
        return isNullOrUndefined(note) ? null: note;
    }

    private translateAttributeYesNo(): string {
        return this.translate ? 'yes' : 'no';
    }
}

export class Target implements TargetInterface {
    textContent: string;
    state?: TargetState|null;
    constructor(textContent: string, state?: TargetState|null) {
        this.textContent = textContent;
        this.state = state;
    }
    static fromString(xml: string): Target {
        let dom = xmldom.DOMParser;
        let targetElement = new dom().parseFromString(xml).getElementsByTagName('target')[0];
        return Target.fromElement(targetElement);
    }

    static fromElement(target: Element): Target {
        let _textContent = '';
        if (!isNullOrUndefined(target) && target.hasChildNodes()) {
            _textContent = isNullOrUndefined(target.childNodes[0]?.nodeValue) ? '': target.childNodes[0]?.nodeValue;
            if (!isNullOrUndefined(target.getAttributeNode('state')?.value)) {
                let _stateValue = isNullOrUndefined(target.getAttributeNode('state')?.value) ? TargetState.New : target.getAttributeNode('state')?.value.toLowerCase();
                return new Target(_textContent, <TargetState>_stateValue);
            }
        }
        return new Target(_textContent, null);

    }
    public toString(): string {
        return new xmldom.XMLSerializer().serializeToString(this.toElement());
    }
    public toElement(): Element {
        let target = new xmldom.DOMImplementation().createDocument(null, null, null).createElement('target');
        if (!isNullOrUndefined(this.state)) {
            target.setAttribute('state', this.state);
        }
        target.textContent = this.textContent;
        return target;
    }
}

export class Note implements NoteInterface {
    from: string;
    annotates: string;
    priority: number;
    textContent: string;
    constructor(from: string, annotates: string, priority: number, textContent: string) {
        this.from = from;
        this.annotates = annotates;
        this.priority = priority;
        this.textContent = textContent;
    }

    static fromString(xml: string): Note {
        let dom = xmldom.DOMParser;
        let note: Element = new dom().parseFromString(xml).getElementsByTagName('note')[0];
        return Note.fromElement(note);
    }

    static fromElement(note: Element): Note {
        let _from = note.getAttributeNode('from')?.value;
        _from = (_from === null || _from === undefined) ? '': _from;
        let _annotates = note.getAttributeNode('annotates')?.value;
        _annotates = (_annotates === null || _annotates === undefined) ? '': _annotates;
        let _prio = note.getAttributeNode('priority')?.value;
        let _priority = (_prio === null || _prio === undefined) ? 0: parseInt(_prio);
        let _textContent = note.childNodes[0]?.nodeValue;
        _textContent = (_textContent === null || _textContent === undefined) ? '': _textContent;
        return new Note(_from, _annotates, _priority, _textContent);
    }

    public toString(): string {
        return new xmldom.XMLSerializer().serializeToString(this.toElement());
    }

    public toElement(): Element {
        let note = new xmldom.DOMImplementation().createDocument(null, null, null).createElement('note');
        note.setAttribute('from', this.from);
        note.setAttribute('annotates', this.annotates);
        note.setAttribute('priority', this.priority.toString());
        note.textContent = this.textContent;
        return note;
    }
}

export enum TargetState {
    Final = 'final', 	                                    // Indicates the terminating state.
    NeedsAdaptation = 'needs-adaptation', 	                // Indicates only non-textual information needs adaptation.
    NeedsL10n = 'needs-l10n',                               // Indicates both text and non-textual information needs adaptation.
    NeedsReviewAdaptation = 'needs-review-adaptation',      // Indicates only non-textual information needs review.
    NeedsReviewL10n = 'needs-review-l10n', 	                // Indicates both text and non-textual information needs review.
    NeedsReviewTranslation = 'needs-review-translation', 	// Indicates that only the text of the item needs to be reviewed.
    NeedsTranslation = 'needs-translation', 	            // Indicates that the item needs to be translated.
    New = 'new', 	                                        // Indicates that the item is new. For example, translation units that were not in a previous version of the document.
    SignedOff = 'signed-off',                               // Indicates that changes are reviewed and approved.
    Translated = 'translated'                               // Indicates that the item has been translated. 
}

export enum StateQualifier {
    ExactMatch = 'exact-match',                     // Indicates an exact match. An exact match occurs when a source text of a segment is exactly the same as the source text of a segment that was translated previously.
    FuzzyMatch = 'fuzzy-match',                     // Indicates a fuzzy match. A fuzzy match occurs when a source text of a segment is very similar to the source text of a segment that was translated previously (e.g. when the difference is casing, a few changed words, white-space discripancy, etc.).
    IdMatch = 'id-match',                           // Indicates a match based on matching IDs (in addition to matching text).
    LeveragedGlossary = 'leveraged-glossary',       // Indicates a translation derived from a glossary.
    LeveragedInherited = 'leveraged-inherited',     // Indicates a translation derived from existing translation.
    LeveragedMT = 'leveraged-mt',                   // Indicates a translation derived from machine translation.
    LeveragedRepository = 'leveraged-repository',   // Indicates a translation derived from a translation repository.
    LeveragedTM = 'leveraged-tm',                   // Indicates a translation derived from a translation memory.
    MTSuggestion = 'mt-suggestion',                 // Indicates the translation is suggested by machine translation.
    RejectedGrammar = 'rejected-grammar',           // Indicates that the item has been rejected because of incorrect grammar.
    RejectedInaccurate = 'rejected-inaccurate',     // Indicates that the item has been rejected because it is incorrect.
    RejectedLength = 'rejected-length',             // Indicates that the item has been rejected because it is too long or too short.
    RejectedSpelling = 'rejected-spelling',         // Indicates that the item has been rejected because of incorrect spelling.
    TMSuggestion = 'tm-suggestion'                  // Indicates the translation is suggested by translation memory.
}

export enum SizeUnit {
    byte = 'byte',          // Indicates a size in 8-bit bytes.
    char = 'char',          // Indicates a size in Unicode characters.
    col = 'col',            // Indicates a size in columns. Used for HTML text area.
    cm = 'cm',              // Indicates a size in centimeters.
    dlgunit = 'dlgunit',    // Indicates a size in dialog units, as defined in Windows resources.
    em = 'em',              // Indicates a size in 'font-size' units (as defined in CSS).
    ex = 'ex',              // Indicates a size in 'x-height' units (as defined in CSS).
    glyph = 'glyph',        // Indicates a size in glyphs. A glyph is considered to be one or more combined Unicode characters that represent a single displayable text character. Sometimes referred to as a 'grapheme cluster'
    in = 'in',              // Indicates a size in inches.
    mm = 'mm',              // Indicates a size in millimeters.
    percent = 'percent',    // Indicates a size in percentage.
    pixel = 'pixel',        // Indicates a size in pixels.
    point = 'point',        // Indicates a size in point.
    row = 'row'             // Indicates a size in rows. Used for HTML text area.
}

function CompareTransUnitId(aUnit:TransUnit, bUnit: TransUnit): number {
    const a = transUnitIdAsObject(aUnit);
    const b = transUnitIdAsObject(bUnit);
    if (a.objectTypeId < b.objectTypeId) {
        return -1;
    }
    if (a.objectTypeId > b.objectTypeId) {
        return 1;
    }
    if (a.controlId < b.controlId) {
        return -1;
    }
    if (a.controlId > b.controlId) {
        return 1;
    }
    if (a.propertyId < b.propertyId) {
        return -1;
    }
    if (a.propertyId > b.propertyId) {
        return 1;
    }
    return 0;
}
function transUnitIdAsObject(transUnit:TransUnit): {objectTypeId: number, controlId: number, propertyId: number} {
    const idStr = transUnit.id.split('-');
    let typeId = idStr[0].trim().split(' ')[1].trim();
    let fieldId = idStr[1].trim().split(' ')[1].trim();
    let propertyId = '0';
    if (idStr.length === 3) {
        propertyId = idStr[2].trim().split(' ')[1].trim();
    }
    return {
        objectTypeId: parseInt(typeId),
        controlId: parseInt(fieldId),
        propertyId: parseInt(propertyId)
    };
}
