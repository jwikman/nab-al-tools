/*
 * Based on: https://github.com/DotJoshJohnson/vscode-xml (MIT Licensed)
 */

export interface XmlFormattingOptions {
  //editorOptions: FormattingOptions;
  enforcePrettySelfClosingTagOnFormat: boolean;
  newLine: string;
  removeCommentsOnMinify: boolean;
  splitAttributesOnFormat: boolean;
  splitXmlnsOnFormat: boolean;
  initialIndentLevel?: number;
  tabSize: number;
  preferSpaces: boolean;
  keepInsignificantWhitespaceOnMinify: boolean;
}
export interface XmlFormatter {
  formatXml(xml: string, options: XmlFormattingOptions): string;
  minifyXml(xml: string, options: XmlFormattingOptions): string;
}

export class XmlFormattingOptionsFactory {
  static getXmlFormattingOptions(): XmlFormattingOptions {
    return {
      enforcePrettySelfClosingTagOnFormat: true,
      newLine: "\r\n",
      removeCommentsOnMinify: true,
      splitAttributesOnFormat: false,
      splitXmlnsOnFormat: false,
      initialIndentLevel: 0,
      tabSize: 4,
      preferSpaces: true,
      keepInsignificantWhitespaceOnMinify: false,
    };
  }

  static getALXliffXmlFormattingOptions(newLine = "\n"): XmlFormattingOptions {
    return {
      enforcePrettySelfClosingTagOnFormat: true,
      newLine: newLine,
      removeCommentsOnMinify: true,
      splitAttributesOnFormat: false,
      splitXmlnsOnFormat: false,
      initialIndentLevel: 0,
      tabSize: 2,
      preferSpaces: true,
      keepInsignificantWhitespaceOnMinify: true,
    };
  }
}

export class ClassicXmlFormatter implements XmlFormatter {
  formatXml(xml: string, options: XmlFormattingOptions): string {
    xml = this.minifyXml(xml, options);
    xml = xml.replace(/</g, "~::~<");

    if (options.splitXmlnsOnFormat) {
      xml = xml
        .replace(/xmlns:/g, "~::~xmlns:")
        .replace(/xmlns=/g, "~::~xmlns=");
    }

    const parts: string[] = xml.split("~::~");
    let inComment = false;
    let level = 0;
    let output = "";

    for (let i = 0; i < parts.length; i++) {
      // <!
      if (parts[i].search(/<!/) > -1) {
        output += this._getIndent(options, level, parts[i]);
        inComment = true;

        // end <!
        if (
          parts[i].search(/-->/) > -1 ||
          parts[i].search(/\]>/) > -1 ||
          parts[i].search(/!DOCTYPE/) > -1
        ) {
          inComment = false;
        }
      } else if (parts[i].search(/-->/) > -1 || parts[i].search(/\]>/) > -1) {
        output += parts[i];
        inComment = false;
      } else if (
        /^<(\w|:)/.test(parts[i - 1]) &&
        /^<\/(\w|:)/.test(parts[i]) &&
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore Handle "Object is possibly null" warning
        /^<[\w:\-.,/]+/.exec(parts[i - 1])[0] ===
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore Handle "Object is possibly null" warning
          /^<\/[\w:\-.,]+/.exec(parts[i])[0].replace("/", "")
      ) {
        output += parts[i];
        if (!inComment) {
          level--;
        }
      } else if (
        parts[i].search(/<(\w|:)/) > -1 &&
        parts[i].search(/<\//) === -1 &&
        parts[i].search(/\/>/) === -1
      ) {
        output = !inComment
          ? (output += this._getIndent(options, level++, parts[i]))
          : (output += parts[i]);
      } else if (
        parts[i].search(/<(\w|:)/) > -1 &&
        parts[i].search(/<\//) > -1
      ) {
        output = !inComment
          ? (output += this._getIndent(options, level, parts[i]))
          : (output += parts[i]);
      } else if (parts[i].search(/<\//) > -1) {
        output = !inComment
          ? (output += this._getIndent(options, --level, parts[i]))
          : (output += parts[i]);
      } else if (
        parts[i].search(/\/>/) > -1 &&
        (!options.splitXmlnsOnFormat || parts[i].search(/xmlns(:|=)/) === -1)
      ) {
        output = !inComment
          ? (output += this._getIndent(options, level, parts[i]))
          : (output += parts[i]);
      } else if (
        parts[i].search(/\/>/) > -1 &&
        parts[i].search(/xmlns(:|=)/) > -1 &&
        options.splitXmlnsOnFormat
      ) {
        output = !inComment
          ? (output += this._getIndent(options, level--, parts[i]))
          : (output += parts[i]);
      } else if (parts[i].search(/<\?/) > -1) {
        output += this._getIndent(options, level, parts[i]);
      } else if (
        options.splitXmlnsOnFormat &&
        (parts[i].search(/xmlns:/) > -1 || parts[i].search(/xmlns=/) > -1)
      ) {
        output += this._getIndent(options, level, parts[i]);
      } else {
        output += parts[i];
      }
    }

    // remove leading newline
    if (output[0] === options.newLine) {
      output = output.slice(1);
    } else if (output.substring(0, 2) === options.newLine) {
      output = output.slice(2);
    }

    return output;
  }

  minifyXml(xml: string, options: XmlFormattingOptions): string {
    xml = this._stripLineBreaks(options, xml); // all line breaks outside of CDATA elements
    xml = options.removeCommentsOnMinify
      ? xml.replace(/<![ \r\n\t]*(--([^-]|[\r\n]|-[^-])*--[ \r\n\t]*)>/g, "")
      : xml;
    xml = !options.keepInsignificantWhitespaceOnMinify
      ? xml.replace(/>\s{0,}</g, "><")
      : xml; // insignificant whitespace between tags
    xml = xml.replace(/"\s+(?=[^\s]+=)/g, '" '); // spaces between attributes
    xml = xml.replace(/"\s+(?=>)/g, '"'); // spaces between the last attribute and tag close (>)
    xml = xml.replace(/"\s*(?=\/>)/g, '" '); // spaces between the last attribute and tag close (/>)
    xml = xml.replace(
      /(<[^>]*?)([^ <>="]\s+)([^ <>="]+=[^>]*>)/g,
      (_match: string, tagStart: string, spacedPart: string, rest: string) => {
        // spaces between the node name and the first attribute - only within XML tags
        const normalizedSpacedPart = spacedPart.replace(/\s+/g, " ");
        return tagStart + normalizedSpacedPart + rest;
      }
    );
    xml = xml.replace(/(<[^>\s]+)\s+>/g, (_match: string, tagName: string) => {
      // spaces between tag name and closing > when there are no attributes
      return tagName + ">";
    });

    return xml;
  }

  private _getIndent(
    options: XmlFormattingOptions,
    level: number,
    trailingValue?: string
  ): string {
    trailingValue = trailingValue || "";

    const indentPattern = options.preferSpaces
      ? " ".repeat(options.tabSize)
      : "\t";

    return `${options.newLine}${indentPattern.repeat(level)}${trailingValue}`;
  }

  private _stripLineBreaks(options: XmlFormattingOptions, xml: string): string {
    let output = "";
    // const inTag = false;
    // const inTagName = false;
    let inCdata = false;
    // const inAttribute = false;

    for (let i = 0; i < xml.length; i++) {
      const char: string = xml.charAt(i);
      const prev: string = xml.charAt(i - 1);
      const next: string = xml.charAt(i + 1);

      if (
        char === "!" &&
        (xml.substr(i, 8) === "![CDATA[" || xml.substr(i, 3) === "!--")
      ) {
        inCdata = true;
      } else if (char === "]" && xml.substr(i, 3) === "]]>") {
        inCdata = false;
      } else if (char === "-" && xml.substr(i, 3) === "-->") {
        inCdata = false;
      } else if (char.search(/[\r\n]/g) > -1 && !inCdata) {
        if (
          /\r/.test(char) &&
          /\S|\r|\n/.test(prev) &&
          /\S|\r|\n/.test(xml.charAt(i + options.newLine.length))
        ) {
          output += char;
        } else if (
          /\n/.test(char) &&
          /\S|\r|\n/.test(xml.charAt(i - options.newLine.length)) &&
          /\S|\r|\n/.test(next)
        ) {
          output += char;
        }

        continue;
      }

      output += char;
    }

    return output;
  }
}
