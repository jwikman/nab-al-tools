/**
 *  https://docs.oasis-open.org/xliff/xliff-core/xliff-core.html
 */
import * as fs from "fs";
import * as xmldom from "@xmldom/xmldom";
import * as path from "path";

import {
  XmlFormattingOptionsFactory,
  ClassicXmlFormatter,
} from "../XmlFormatter";
import * as Common from "../Common";
import { XliffIdToken } from "../ALObject/XliffIdToken";
import { InvalidXmlError } from "../Error";

// <target missing end gt</target>
const matchBrokenTargetStart = `<target[^>]*target>`;
// <target> missing start lt /target>
const matchBrokenTargetEnd = `<target>[^<]*target>`;
// <target> greater than > in value</target>
const matchGreaterThanInValue = `>[^<>]*>[^<>]*<`;
// above combined
export const invalidXmlSearchExpression = `(${matchBrokenTargetStart})|(${matchBrokenTargetEnd})|(${matchGreaterThanInValue})`;

export class Xliff implements XliffDocumentInterface {
  public datatype: string;
  public sourceLanguage: string;
  public targetLanguage: string;
  public original: string;
  public transunit: TransUnit[];
  public lineEnding = "\n";
  static xmlns = "urn:oasis:names:tc:xliff:document:1.2";
  public _path = "";
  public toolId?: string;
  public productName?: string;
  public productVersion?: string;
  public buildNum?: string;
  public requestId?: string;
  public header?: HeaderInterface;

  constructor(
    datatype: string,
    sourceLanguage: string,
    targetLanguage: string,
    original: string
  ) {
    this.datatype = datatype;
    this.sourceLanguage = sourceLanguage;
    this.targetLanguage = targetLanguage;
    this.original = original;
    this.transunit = [];
  }

  static fromString(xml: string): Xliff {
    xml = Xliff.validateXml(xml);
    const dom = xmldom.DOMParser;
    const xlfDom = new dom().parseFromString(xml);
    const xliff = Xliff.fromDocument(xlfDom);
    xliff.lineEnding = Xliff.detectLineEnding(xml);
    return xliff;
  }

  static fromDocument(xmlDoc: Document): Xliff {
    const fileElement = xmlDoc.getElementsByTagName("file")[0];
    const _datatype = fileElement.getAttributeNode("datatype")?.value ?? "";
    const _sourceLang =
      fileElement.getAttributeNode("source-language")?.value ?? "";
    const _targetLang =
      fileElement.getAttributeNode("target-language")?.value ?? "";
    const _original = fileElement.getAttributeNode("original")?.value ?? "";
    const xliff = new Xliff(_datatype, _sourceLang, _targetLang, _original);
    const toolId = fileElement.getAttributeNode("tool-id");
    if (!(toolId === null || toolId === undefined)) {
      xliff.toolId = toolId.value;
    }
    const productName = fileElement.getAttributeNode("product-name");
    if (!(productName === null || productName === undefined)) {
      xliff.productName = productName.value;
    }
    const productVersion = fileElement.getAttributeNode("product-version");
    if (!(productVersion === null || productVersion === undefined)) {
      xliff.productVersion = productVersion.value;
    }
    const buildNum = fileElement.getAttributeNode("build-num");
    if (!(buildNum === null || buildNum === undefined)) {
      xliff.buildNum = buildNum.value;
    }
    const requestId = fileElement.getAttributeNode("request-id");
    if (!(requestId === null || requestId === undefined)) {
      xliff.requestId = requestId.value;
    }
    const headerElement = fileElement.getElementsByTagName("header")[0];
    if (!(headerElement === undefined || headerElement === null)) {
      const toolElement = headerElement.getElementsByTagName("tool")[0];
      if (!(toolElement === undefined || toolElement === null)) {
        xliff.header = {
          tool: {
            toolId: toolElement.getAttributeNode("tool-id")?.value || "",
            toolName: toolElement.getAttributeNode("tool-name")?.value || "",
          },
        };
        const toolCompany = toolElement.getAttributeNode("tool-company");
        if (toolCompany !== null) {
          xliff.header.tool.toolCompany = toolCompany.value;
        }
        const toolVersion = toolElement.getAttributeNode("tool-version");
        if (toolVersion !== null) {
          xliff.header.tool.toolVersion = toolVersion.value;
        }
      }
    }
    const tu = xmlDoc.getElementsByTagNameNS(Xliff.xmlns, "trans-unit");
    for (let i = 0; i < tu.length; i++) {
      xliff.transunit.push(TransUnit.fromElement(tu[i]));
    }
    return xliff;
  }

  public static validateXml(xml: string): string {
    const re = new RegExp(invalidXmlSearchExpression, "g");
    const result = re.exec(xml);
    if (result) {
      throw new InvalidXmlError(
        `Invalid XML found at position ${result.index}.`,
        "",
        result.index,
        result[0].length
      );
    }
    return xml;
  }

  public cloneWithoutTransUnits(): Xliff {
    const newXliff = new Xliff(
      this.datatype,
      this.sourceLanguage,
      this.targetLanguage,
      this.original
    );
    newXliff.buildNum = this.buildNum;
    newXliff.productName = this.productName;
    newXliff.productVersion = this.productVersion;
    newXliff.toolId = this.toolId;
    newXliff.requestId = this.requestId;
    if (this.header) {
      newXliff.header = {
        tool: {
          toolId: this.header?.tool.toolId,
          toolName: this.header?.tool.toolName,
          toolCompany: this.header?.tool.toolCompany,
          toolVersion: this.header?.tool.toolVersion,
        },
      };
    }
    return newXliff;
  }

  public toString(replaceSelfClosingTags = true, formatXml = true): string {
    let xml = new xmldom.XMLSerializer().serializeToString(this.toDocument());
    xml = Xliff.fixGreaterThanChars(xml);
    if (replaceSelfClosingTags) {
      xml = Xliff.replaceSelfClosingTags(xml);
    }
    if (formatXml) {
      xml = Xliff.formatXml(xml, this.lineEnding);
    }

    return xml;
  }

  static fixGreaterThanChars(xml: string): string {
    // Workaround "> bug" in xmldom where a ">" in the Xml TextContent won't be written as "&gt;" as it should be,
    // ref https://github.com/jwikman/nab-al-tools/issues/43 and https://github.com/xmldom/xmldom/issues/22
    const find = />([^<>]*)>/im;
    const replaceString = ">$1&gt;";
    let lastXml = xml;
    do {
      // Replacing one > in a TextContent for each loop, loops if multiple > in any TextContent
      lastXml = xml;
      xml = Common.replaceAll(xml, find, replaceString);
    } while (xml !== lastXml);
    return xml;
  }

  static formatXml(xml: string, newLine = "\n"): string {
    const xmlFormatter = new ClassicXmlFormatter();
    const formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions(
      newLine
    );
    return xmlFormatter.formatXml(xml, formattingOptions);
  }

  static replaceSelfClosingTags(xml: string): string {
    // ref https://stackoverflow.com/a/16792194/5717285
    const split = xml.split("/>");
    let newXml = "";
    for (let i = 0; i < split.length - 1; i++) {
      const edsplit = split[i].split("<");
      newXml +=
        split[i] + "></" + edsplit[edsplit.length - 1].split(" ")[0] + ">";
    }
    return newXml + split[split.length - 1];
  }

  public toDocument(): Document {
    const xliffDocument: Document = new xmldom.DOMParser().parseFromString(
      '<?xml version="1.0" encoding="utf-8"?>'
    );
    const xliffNode = xliffDocument.createElement("xliff");
    xliffNode.setAttribute("version", "1.2");
    xliffNode.setAttribute("xmlns", Xliff.xmlns);
    xliffNode.setAttribute(
      "xmlns:xsi",
      "http://www.w3.org/2001/XMLSchema-instance"
    );
    xliffNode.setAttribute(
      "xsi:schemaLocation",
      "urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd"
    );
    const fileNode = xliffDocument.createElementNS(Xliff.xmlns, "file");
    fileNode.setAttribute("datatype", this.datatype);
    fileNode.setAttribute("source-language", this.sourceLanguage);
    fileNode.setAttribute("target-language", this.targetLanguage);
    fileNode.setAttribute("original", this.original);
    if (this.toolId) {
      fileNode.setAttribute("tool-id", this.toolId);
    }
    if (this.productName) {
      fileNode.setAttribute("product-name", this.productName);
    }
    if (this.productVersion) {
      fileNode.setAttribute("product-version", this.productVersion);
    }
    if (this.buildNum) {
      fileNode.setAttribute("build-num", this.buildNum);
    }
    if (this.requestId) {
      fileNode.setAttribute("request-id", this.requestId);
    }
    if (this.header) {
      const headerElement = xliffDocument.createElementNS(
        Xliff.xmlns,
        "header"
      );
      fileNode.appendChild(headerElement);
      if (this.header.tool) {
        const toolElement = xliffDocument.createElementNS(Xliff.xmlns, "tool");
        toolElement.setAttribute("tool-id", this.header.tool.toolId);
        toolElement.setAttribute("tool-name", this.header.tool.toolName);
        if (this.header.tool.toolVersion) {
          toolElement.setAttribute(
            "tool-version",
            this.header.tool.toolVersion
          );
        }
        if (this.header.tool.toolCompany) {
          toolElement.setAttribute(
            "tool-company",
            this.header.tool.toolCompany
          );
        }
        headerElement.appendChild(toolElement);
      }
    }
    const bodyNode = xliffDocument.createElementNS(Xliff.xmlns, "body");
    const bodyGroupNode = xliffDocument.createElementNS(Xliff.xmlns, "group");
    bodyGroupNode.setAttribute("id", "body");
    this.transunit.forEach((tUnit) => {
      bodyGroupNode.appendChild(tUnit.toElement());
    });
    bodyNode.appendChild(bodyGroupNode);
    fileNode.appendChild(bodyNode);
    xliffNode.appendChild(fileNode);
    xliffDocument.appendChild(xliffNode);
    return xliffDocument;
  }

  static fromFileSync(filepath: string, encoding?: string): Xliff {
    encoding = encoding ?? "utf8";
    if (!filepath.endsWith("xlf")) {
      throw new Error(`Not a Xlf file path: ${filepath}`);
    }
    let xlf;
    try {
      xlf = Xliff.fromString(fs.readFileSync(filepath, encoding));
    } catch (error) {
      if (error instanceof InvalidXmlError) {
        error.message = `The xml in ${path.basename(filepath)} is invalid.`;
        error.path = filepath;
      }
      throw error;
    }
    xlf._path = filepath;
    return xlf;
  }

  public toFileSync(
    path: string,
    replaceSelfClosingTags = true,
    formatXml = true,
    encoding?: string
  ): void {
    let data;
    ({ data, encoding } = this.encodeData(
      encoding,
      replaceSelfClosingTags,
      formatXml
    ));

    fs.writeFileSync(path, data, encoding);
  }

  public toFileAsync(
    path: string,
    replaceSelfClosingTags = true,
    formatXml = true,
    encoding?: string
  ): void {
    let data;
    ({ data, encoding } = this.encodeData(
      encoding,
      replaceSelfClosingTags,
      formatXml
    ));

    fs.writeFile(path, data, { encoding: encoding }, function (err) {
      if (err) {
        throw new Error(`Error while saving file: ${err}`);
      }
    });
  }

  private encodeData(
    encoding: string | undefined,
    replaceSelfClosingTags: boolean,
    formatXml: boolean
  ): {
    data: string;
    encoding: string;
  } {
    encoding = encoding ?? "utf8";
    let bom = "";
    if (encoding.toLowerCase() === "utf8bom") {
      encoding = "utf8";
      bom = "\ufeff";
    }
    const data = bom + this.toString(replaceSelfClosingTags, formatXml);
    return { data, encoding };
  }

  /**
   * @description Returns map of source string and translated targets.
   * @summary description
   * @returnType {Map<string, string[]>}
   */
  public translationMap(): Map<string, string[]> {
    const transMap = new Map<string, string[]>();
    this.transunit
      .filter((tu) => tu.targetsHasTextContent())
      .forEach((unit) => {
        if (!transMap.has(unit.source)) {
          transMap.set(unit.source, [unit.target.textContent]);
        } else {
          const mapElements = transMap.get(unit.source);
          if (!mapElements?.includes(unit.target.textContent)) {
            mapElements?.push(unit.target.textContent);
          }
          if (mapElements !== undefined) {
            transMap.set(unit.source, mapElements);
          }
        }
      });
    return transMap;
  }

  public getTransUnitById(id: string): TransUnit {
    return this.transunit.filter((tu) => tu.id === id)[0];
  }

  public hasTransUnit(id: string): boolean {
    return this.getTransUnitById(id) !== undefined;
  }

  /**
   * Returns an array of trans-units where source matches and the translation differs from the input TransUnit
   * @param transUnit trans-unit to match with.
   * @returns TransUnit[]
   */
  public getSameSourceDifferentTarget(transUnit: TransUnit): TransUnit[] {
    return this.transunit.filter(
      (t) =>
        t.source === transUnit.source &&
        t.target.textContent !== transUnit.target.textContent
    );
  }

  /**
   * Checks if source exists more than once.
   * @param source Source string to search for.
   * @returns boolean
   */
  public sourceHasDuplicates(source: string): boolean {
    return this.getTransUnitsBySource(source).length > 1;
  }

  /**
   * Returns an array of trans-units where source matches the input.
   * @param source Source string to search for.
   * @returns TransUnit[]
   */
  public getTransUnitsBySource(source: string): TransUnit[] {
    return this.transunit.filter((t) => t.source === source);
  }

  /**
   * Returns an array of trans-units with matching sources and different translations.
   * @returns TransUnit[]
   */
  public differentlyTranslatedTransUnits(): TransUnit[] {
    const transUnits: TransUnit[] = [];
    this.transunit.forEach((tu) => {
      this.getSameSourceDifferentTarget(tu).forEach((duplicate) => {
        if (transUnits.filter((a) => a.id === duplicate.id).length === 0) {
          transUnits.push(duplicate);
        }
      });
    });
    return transUnits;
  }

  static detectLineEnding(xml: string): string {
    const temp = xml.indexOf("\n");
    if (xml[temp - 1] === "\r") {
      return "\r\n";
    }
    return "\n";
  }

  /**
   * @description Determines if custom notes of passed types exists in transunits.
   * @param customNoteType Custom note type to search for.
   * @returns boolean
   */
  public customNotesOfTypeExists(customNoteType: CustomNoteType): boolean {
    return (
      this.transunit.find((tu) => tu.hasCustomNote(customNoteType)) !==
      undefined
    );
  }

  /**
   * @description Removes all notes were 'From' attribute equals the customNoteType.
   * @param customNoteType Custom note type to remove.
   * @returns number of notes removed.
   * @returnType number
   */
  public removeAllCustomNotesOfType(customNoteType: CustomNoteType): number {
    let removedNotes = 0;
    this.transunit
      .filter((tu) => tu.hasCustomNote(customNoteType))
      .forEach((tu) => {
        tu.removeCustomNote(customNoteType);
        removedNotes++;
      });
    return removedNotes;
  }

  public translationTokensExists(): boolean {
    return this.transunit.find((tu) => tu.hasTranslationToken()) !== undefined;
  }
}

export class TransUnit implements TransUnitInterface {
  id: string;
  translate: boolean;
  source: string;
  targets: Target[] = [];
  notes: Note[] = [];
  sizeUnit?: SizeUnit;
  xmlSpace: string;
  maxwidth: number | undefined;
  alObjectTarget: string | undefined;

  constructor(
    id: string,
    translate: boolean,
    source: string,
    target: Target | undefined,
    sizeUnit: SizeUnit,
    xmlSpace: string,
    notes?: Note[],
    maxwidth?: number | undefined,
    alObjectTarget?: string | undefined
  ) {
    this.id = id;
    this.translate = translate;
    this.source = source;
    if (target !== undefined) {
      this.targets.push(target);
    }
    if (notes) {
      this.notes = notes;
    }
    this.sizeUnit = sizeUnit;
    this.xmlSpace = xmlSpace;
    this.maxwidth = maxwidth;
    this.alObjectTarget = alObjectTarget;
  }

  get targetState(): string {
    return this.target.state ?? "";
  }

  get targetStateQualifier(): string {
    return this.target.stateQualifier ?? "";
  }

  get targetTranslationToken(): string {
    return this.target.translationToken ?? "";
  }

  public get target(): Target {
    if (this.targets.length === 0) {
      return new Target("");
    }
    return this.targets[0];
  }
  public set target(newTarget: Target) {
    if (this.targets.length === 0) {
      this.targets.push(newTarget);
    } else {
      this.targets[0] = newTarget;
    }
  }

  public getXliffIdTokenArray(): XliffIdToken[] {
    const note = this.xliffGeneratorNote();
    if (note === undefined) {
      throw new Error(
        `Could not find a note from "Xliff Generator" in trans-unit "${this.id}"`
      );
    }
    return XliffIdToken.getXliffIdTokenArray(this.id, note.textContent);
  }

  static fromString(xml: string): TransUnit {
    const dom = xmldom.DOMParser;
    const transUnit = new dom()
      .parseFromString(xml)
      .getElementsByTagName("trans-unit")[0];
    return TransUnit.fromElement(transUnit);
  }

  static fromElement(transUnit: Element): TransUnit {
    let _maxwidth = undefined;
    const _maxwidthText = transUnit.getAttributeNode("maxwidth")?.value;
    if (_maxwidthText) {
      _maxwidth = Number.parseInt(_maxwidthText);
    }
    const _notes: Array<Note> = [];
    const _id = transUnit.getAttributeNode("id")?.value ?? "";
    const _alObjectTarget =
      transUnit.getAttributeNode("al-object-target")?.value ?? undefined;
    const _sizeUnit = transUnit.getAttributeNode("size-unit")?.value;
    const _xmlSpace =
      transUnit.getAttributeNode("xml:space")?.value ?? "preserve";
    const t = transUnit.getAttributeNode("translate")?.value;
    const _translate =
      t === null || t === undefined || t.toLowerCase() === "no" ? false : true;
    const _source =
      transUnit.getElementsByTagName("source")[0]?.childNodes[0]?.nodeValue ??
      "";
    const notesElmnts = transUnit.getElementsByTagName("note");
    for (let i = 0; i < notesElmnts.length; i++) {
      _notes.push(Note.fromElement(notesElmnts[i]));
    }
    const _transUnit = new TransUnit(
      _id,
      _translate,
      _source,
      undefined,
      <SizeUnit>_sizeUnit,
      _xmlSpace,
      _notes,
      _maxwidth,
      _alObjectTarget
    );
    const _targets: Target[] = [];
    const targetElmnt = transUnit.getElementsByTagName("target");
    for (let i = 0; i < targetElmnt.length; i++) {
      if (targetElmnt) {
        _targets?.push(Target.fromElement(targetElmnt[i]));
      }
    }
    _transUnit.targets = _targets;
    return _transUnit;
  }

  public toString(): string {
    return new xmldom.XMLSerializer().serializeToString(this.toElement());
  }

  public toElement(): Element {
    const transUnit = new xmldom.DOMImplementation()
      .createDocument(null, null, null)
      .createElement("trans-unit");
    transUnit.setAttribute("id", this.id);
    if (this.maxwidth) {
      transUnit.setAttribute("maxwidth", this.maxwidth.toString());
    }
    if (this.sizeUnit) {
      transUnit.setAttribute("size-unit", this.sizeUnit);
    }
    transUnit.setAttribute("translate", this.translateAttributeYesNo());
    transUnit.setAttribute("xml:space", this.xmlSpace);
    if (this.alObjectTarget !== undefined) {
      transUnit.setAttribute("al-object-target", this.alObjectTarget);
    }
    const source = new xmldom.DOMImplementation()
      .createDocument(null, null, null)
      .createElement("source");
    source.textContent = this.source;
    transUnit.appendChild(source);
    if (this.targets !== undefined) {
      this.targets.forEach((t) => {
        transUnit.appendChild(t.toElement());
      });
    }
    this.notes
      .sort((a, b) => a.priority - b.priority)
      .forEach((n) => {
        transUnit.appendChild(n.toElement());
      });
    return transUnit;
  }

  public addTarget(target: Target): void {
    this.targets.push(target);
  }

  public hasTargets(): boolean {
    return this.targets.length > 0;
  }

  /**
   * Compares the first target textContent with source.
   * @returns true if target textContent is exact match with source.
   */
  public targetMatchesSource(): boolean {
    return this.target.textContent === this.source;
  }

  /**
   * Removes the leading and trailing white space and line terminator characters from source and compares with an empty string.
   * @returns true if source contains no other characters than whitespace.
   */
  public sourceIsEmpty(): boolean {
    return this.source.trim() === "";
  }

  /**
   * Removes the leading and trailing white space and line terminator characters from target textContent and compares with an empty string.
   * @returns true if target textContent contains no other characters than whitespace.
   */
  public targetIsEmpty(): boolean {
    return this.target.textContent.trim() === "";
  }

  public identicalTargetExists(target: Target): boolean {
    return (
      this.targets.find((t) => t.textContent === target.textContent) !==
      undefined
    );
  }

  public targetsHasTextContent(): boolean {
    return this.targets.find((t) => t.textContent !== "") !== undefined;
  }

  public addNote(
    from: string,
    annotates: string,
    priority: number,
    textContent: string
  ): void {
    this.notes.push(new Note(from, annotates, priority, textContent));
  }

  /**
   * Filters notes with matching from attribute value. If no matching notes is found an array of empty notes is returned.
   * @param from Attribute value to search for.
   * @returns Array of Notes.
   */
  public getNoteFrom(from: string): Note[] {
    const note = this.notes.filter((n) => n.from === from);
    return note !== undefined ? note : [new Note("", "", 0, "")];
  }

  private translateAttributeYesNo(): string {
    return this.translate ? "yes" : "no";
  }

  public insertCustomNote(customNoteType: CustomNoteType, text: string): void {
    this.removeCustomNote(customNoteType);
    const note = new Note(customNoteType, "general", 3, text);
    this.notes.unshift(note);
  }

  public removeCustomNote(customNoteType: CustomNoteType): void {
    this.notes = this.notes.filter((x) => x.from !== customNoteType);
  }

  public hasCustomNote(customNoteType: CustomNoteType): boolean {
    return this.customNote(customNoteType) !== undefined;
  }

  public customNote(customNoteType: CustomNoteType): Note {
    return this.notes.filter((x) => x.from === customNoteType)[0];
  }

  public customNoteContent(customNoteType: CustomNoteType): string {
    const note = this.customNote(customNoteType);
    return note ? note.textContent : "";
  }

  public removeDeveloperNoteIfEmpty(): void {
    const note = this.developerNote();
    if (note !== undefined) {
      if (note.textContent === "") {
        this.notes = this.notes.filter((x) => x.from !== note.from);
      }
    }
  }

  public developerNote(): Note {
    return this.notes.filter((x) => x.from === "Developer")[0];
  }
  public developerNoteContent(): string {
    const note = this.developerNote();
    return note ? note.textContent : "";
  }

  public xliffGeneratorNote(): Note | undefined {
    return this.notes.find((x) => x.from === "Xliff Generator");
  }

  public xliffGeneratorNoteContent(): string {
    const note = this.xliffGeneratorNote();
    return note ? note.textContent : "";
  }

  public hasTranslationToken(): boolean {
    return (
      this.targets.find((t) => t.translationToken !== undefined) !== undefined
    );
  }

  public needsReview(checkTargetState: boolean): boolean {
    return (
      this.target.translationToken !== undefined ||
      this.hasCustomNote(CustomNoteType.refreshXlfHint) ||
      (checkTargetState &&
        !(this.target.state === undefined || this.target.state === null) &&
        targetStateActionNeededValues().includes(this.target.state))
    );
  }

  public setTargetStateFromToken(): void {
    if (this.target.state) {
      return;
    }
    switch (this.target.translationToken) {
      case TranslationToken.notTranslated:
        this.target.state = TargetState.needsTranslation;
        this.target.stateQualifier = undefined;
        break;
      case TranslationToken.review:
        this.target.state = TargetState.needsReviewTranslation;
        this.target.stateQualifier = undefined;
        break;
      case TranslationToken.suggestion:
        this.target.state = TargetState.translated;
        this.target.stateQualifier = StateQualifier.exactMatch;
        break;
      default:
        this.target.state = TargetState.translated;
        this.target.stateQualifier = undefined;
        break;
    }
    this.target.translationToken = undefined;
  }
}

export class Target implements TargetInterface {
  textContent: string;
  state?: TargetState | null;
  translationToken?: TranslationToken;
  stateQualifier?: string;

  constructor(textContent: string, state?: TargetState | null) {
    this.setTranslationToken(textContent);
    if (this.translationToken) {
      textContent = textContent.substring(this.translationToken.length);
    }
    this.textContent = textContent;
    this.state = state;
    this.stateQualifier = undefined;
  }
  static fromString(xml: string): Target {
    const dom = xmldom.DOMParser;
    const targetElement = new dom()
      .parseFromString(xml)
      .getElementsByTagName("target")[0];
    return Target.fromElement(targetElement);
  }

  static fromElement(target: Element): Target {
    let _stateValue = null;
    const _textContent = target.textContent ?? "";
    const _stateQualifierValue =
      target.getAttributeNode("state-qualifier")?.value.toLowerCase() ??
      undefined;
    if (target.getAttributeNode("state")?.value !== undefined) {
      _stateValue =
        target.getAttributeNode("state")?.value?.toLowerCase() ??
        TargetState.new;
    }

    const newTarget = new Target(_textContent, _stateValue as TargetState);
    newTarget.stateQualifier = _stateQualifierValue as StateQualifier;
    return newTarget;
  }

  public toString(): string {
    return new xmldom.XMLSerializer().serializeToString(this.toElement());
  }

  public toElement(): Element {
    const target = new xmldom.DOMImplementation()
      .createDocument(null, null, null)
      .createElement("target");
    if (!(this.state === null || this.state === undefined)) {
      target.setAttribute("state", this.state);
    }
    if (this.stateQualifier !== undefined) {
      target.setAttribute("state-qualifier", this.stateQualifier);
    }
    target.textContent = this.translationToken
      ? this.translationToken + this.textContent
      : this.textContent;
    return target;
  }

  public hasContent(): boolean {
    return this.textContent !== "";
  }

  public includes(...values: string[]): boolean {
    for (const v of values) {
      if (this.textContent.includes(v)) {
        return true;
      }
    }
    return false;
  }

  private setTranslationToken(textContent: string): void {
    for (const translationToken of Object.values(TranslationToken)) {
      if (textContent.startsWith(translationToken)) {
        this.translationToken = translationToken;
        return;
      }
    }
  }
}

export class Note implements NoteInterface {
  from: string;
  annotates: string;
  priority: number;
  textContent: string;

  constructor(
    from: string,
    annotates: string,
    priority: number,
    textContent: string
  ) {
    this.from = from;
    this.annotates = annotates;
    this.priority = priority;
    this.textContent = textContent;
  }

  static fromString(xml: string): Note {
    const dom = xmldom.DOMParser;
    const note: Element = new dom()
      .parseFromString(xml)
      .getElementsByTagName("note")[0];
    return Note.fromElement(note);
  }

  static fromElement(note: Element): Note {
    const _from = note.getAttributeNode("from")?.value ?? "";
    const _annotates = note.getAttributeNode("annotates")?.value ?? "";
    const _prio = note.getAttributeNode("priority")?.value;
    const _priority =
      _prio === null || _prio === undefined ? 0 : parseInt(_prio);
    const _textContent = note.childNodes[0]?.nodeValue ?? "";
    return new Note(_from, _annotates, _priority, _textContent);
  }

  public toString(): string {
    return new xmldom.XMLSerializer().serializeToString(this.toElement());
  }

  public toElement(): Element {
    const note = new xmldom.DOMImplementation()
      .createDocument(null, null, null)
      .createElement("note");
    note.setAttribute("from", this.from);
    note.setAttribute("annotates", this.annotates);
    note.setAttribute("priority", this.priority.toString());
    note.textContent = this.textContent;
    return note;
  }
}

export enum TargetState {
  final = "final", // Indicates the terminating state.
  needsAdaptation = "needs-adaptation", // Indicates only non-textual information needs adaptation.
  needsL10n = "needs-l10n", // Indicates both text and non-textual information needs adaptation.
  needsReviewAdaptation = "needs-review-adaptation", // Indicates only non-textual information needs review.
  needsReviewL10n = "needs-review-l10n", // Indicates both text and non-textual information needs review.
  needsReviewTranslation = "needs-review-translation", // Indicates that only the text of the item needs to be reviewed.
  needsTranslation = "needs-translation", // Indicates that the item needs to be translated.
  new = "new", // Indicates that the item is new. For example, translation units that were not in a previous version of the document.
  signedOff = "signed-off", // Indicates that changes are reviewed and approved.
  translated = "translated", // Indicates that the item has been translated.
}

export enum TranslationToken {
  notTranslated = "[NAB: NOT TRANSLATED]",
  suggestion = "[NAB: SUGGESTION]",
  review = "[NAB: REVIEW]",
}

export enum CustomNoteType {
  refreshXlfHint = "NAB AL Tool Refresh Xlf",
}

export enum StateQualifier {
  msExactMatch = "x-microsoft-exact-match", // Indicates an exact match with Microsoft DTS translation memory. An exact match occurs when a source text of a segment is exactly the same as the source text of a segment that was translated previously.
  exactMatch = "exact-match", // Indicates an exact match. An exact match occurs when a source text of a segment is exactly the same as the source text of a segment that was translated previously.
  fuzzyMatch = "fuzzy-match", // Indicates a fuzzy match. A fuzzy match occurs when a source text of a segment is very similar to the source text of a segment that was translated previously (e.g. when the difference is casing, a few changed words, white-space discripancy, etc.).
  idMatch = "id-match", // Indicates a match based on matching IDs (in addition to matching text).
  leveragedGlossary = "leveraged-glossary", // Indicates a translation derived from a glossary.
  leveragedInherited = "leveraged-inherited", // Indicates a translation derived from existing translation.
  leveragedMT = "leveraged-mt", // Indicates a translation derived from machine translation.
  leveragedRepository = "leveraged-repository", // Indicates a translation derived from a translation repository.
  leveragedTM = "leveraged-tm", // Indicates a translation derived from a translation memory.
  mtSuggestion = "mt-suggestion", // Indicates the translation is suggested by machine translation.
  rejectedGrammar = "rejected-grammar", // Indicates that the item has been rejected because of incorrect grammar.
  rejectedInaccurate = "rejected-inaccurate", // Indicates that the item has been rejected because it is incorrect.
  rejectedLength = "rejected-length", // Indicates that the item has been rejected because it is too long or too short.
  rejectedSpelling = "rejected-spelling", // Indicates that the item has been rejected because of incorrect spelling.
  tmSuggestion = "tm-suggestion", // Indicates the translation is suggested by translation memory.
}

export enum SizeUnit {
  byte = "byte", // Indicates a size in 8-bit bytes.
  char = "char", // Indicates a size in Unicode characters.
  col = "col", // Indicates a size in columns. Used for HTML text area.
  cm = "cm", // Indicates a size in centimeters.
  dlgunit = "dlgunit", // Indicates a size in dialog units, as defined in Windows resources.
  em = "em", // Indicates a size in 'font-size' units (as defined in CSS).
  ex = "ex", // Indicates a size in 'x-height' units (as defined in CSS).
  glyph = "glyph", // Indicates a size in glyphs. A glyph is considered to be one or more combined Unicode characters that represent a single displayable text character. Sometimes referred to as a 'grapheme cluster'
  in = "in", // Indicates a size in inches.
  mm = "mm", // Indicates a size in millimeters.
  percent = "percent", // Indicates a size in percentage.
  pixel = "pixel", // Indicates a size in pixels.
  point = "point", // Indicates a size in point.
  row = "row", // Indicates a size in rows. Used for HTML text area.
}

export interface XliffDocumentInterface {
  version?: string;
  datatype?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  original?: string;
  transunit?: TransUnit[];
  toString(replaceSelfClosingTags: boolean, formatXml: boolean): string;
}

export interface TransUnitInterface {
  id: string;
  translate: boolean;
  source: string;
  targets: Target[];
  sizeUnit?: SizeUnit;
  xmlSpace?: string;
  notes: Note[];
  alObjectTarget: string | undefined;
  toString(): string;
  toElement(): Element;
}

export interface TargetInterface {
  textContent?: string;
  state?: TargetState | null;
  stateQualifier?: string;
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

export interface HeaderInterface {
  tool: ToolInterface;
}

export interface ToolInterface {
  toolId: string;
  toolName: string;
  toolVersion?: string;
  toolCompany?: string;
}

function targetStateActionNeededValues(
  lowerThanTargetState?: TargetState
): string[] {
  const stateActionNeeded = Object.values(TargetState).filter(
    (state) =>
      [
        TargetState.final,
        TargetState.signedOff,
        TargetState.translated,
      ].includes(state) === false
  );

  if (lowerThanTargetState) {
    switch (lowerThanTargetState) {
      case TargetState.signedOff:
        stateActionNeeded.push(TargetState.translated);
        break;
      case TargetState.final:
        stateActionNeeded.push(TargetState.translated);
        stateActionNeeded.push(TargetState.signedOff);
        break;
    }
  }
  return stateActionNeeded;
}

/**
 * Returns a list of target states where the state indicates that action is needed formatted as attributes.
 * @param lowerThanTargetState (optional) `signed-off` includes "translated". `final` includes "translated" and "signed-off".
 * @returns string[]
 */
export function targetStateActionNeededAttributes(
  lowerThanTargetState?: TargetState
): string[] {
  return targetStateActionNeededValues(lowerThanTargetState).map((state) => {
    return `state="${state}"`;
  });
}

// RegEx strings:
// All translation tokens

export const translationTokenSearchExpression = `${Common.escapeRegex(
  TranslationToken.notTranslated
)}|${Common.escapeRegex(TranslationToken.review)}|${Common.escapeRegex(
  TranslationToken.suggestion
)}|${Common.escapeRegex("[NAB:")}|state="(${TargetState.needsAdaptation}|${
  TargetState.needsL10n
}|${TargetState.needsReviewAdaptation}|${TargetState.needsReviewL10n}|${
  TargetState.needsReviewTranslation
}|${TargetState.needsTranslation}|${TargetState.new})"`;

// <note from="NAB AL Tool Refresh Xlf" annotates="general" priority="3">Source has been modified.</note>
export const refreshXlfNoteSearchExpression = `<note from="${CustomNoteType.refreshXlfHint}" annotates="general" priority="3">(?<note>.*)<`;
