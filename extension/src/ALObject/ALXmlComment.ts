import * as xmldom from 'xmldom';

// Docs at https://docs.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-xml-comments
export class ALXmlComment {
    summary: string | undefined = undefined;
    parameters: ALXmlCommentParameter[] = [];
    returns: string | undefined = undefined;
    example: string | undefined = undefined;
    remarks: string | undefined = undefined;
    constructor() {
    }


    public get summaryShort(): string {
        let summary = this.summary ? this.summary : '';
        let summaryArr = summary.split('\n');
        summary = summaryArr[0];
        summary = summary.replace(/<paramref\s*name\s*=\s*"(.*?)"\s*\/>/gi, '$1');
        return summary;
    }


    static fromString(xmlComment: string[]): ALXmlComment {

        let xml: string;
        if (xmlComment.filter(x => x !== '')[0].trim().startsWith('/// ')) {
            xml = xmlComment.map(x => {
                return x.trim().substr(4);
            }).join('\n');
        } else {
            xml = xmlComment.join('\n');
        }

        let dom = xmldom.DOMParser;
        let xlfDom = new dom().parseFromString(xml);
        let alXmlComment = ALXmlComment.fromDocument(xlfDom);
        return alXmlComment;
    }

    static fromDocument(xmlDoc: Document): ALXmlComment {
        let xmlComment = new ALXmlComment();
        let _summary = xmlDoc.getElementsByTagName('summary')[0];
        if (_summary?.textContent) {
            xmlComment.summary = _summary.childNodes.toString()?.trim();
        }
        let _returns = xmlDoc.getElementsByTagName('returns')[0];
        if (_returns?.textContent) {
            xmlComment.returns = _returns.childNodes.toString()?.trim();
        }
        let _remarks = xmlDoc.getElementsByTagName("remarks")[0];
        if (_remarks?.textContent) {
            xmlComment.remarks = _remarks.childNodes.toString()?.trim();
        }
        let _example = xmlDoc.getElementsByTagName('example')[0];
        if (_example?.textContent) {
            xmlComment.example = _example.childNodes.toString().trim();
        }
        let _parameters = xmlDoc.getElementsByTagName('param');
        if (_parameters) {
            for (let i = 0; i < _parameters.length; i++) {
                const _param = _parameters[i];
                const _name = _param.getAttribute('name')?.trim();
                const _description = _param?.childNodes.toString().trim();
                xmlComment.parameters.push(new ALXmlCommentParameter(_name ? _name : '', _description ? _description : ''));
            }
        }
        return xmlComment;
    }
    static formatMarkDown({ text, inTableCell = false, anchorPrefix }: { text: string; inTableCell?: boolean; anchorPrefix?: string; }): string {
        if (inTableCell) {
            // Paragraph
            text = text.replace(/<para>\s*(.*?)\s*<\/para>/gi, "  $1  ");
            // Code block
            text = text.replace(/<code>\s*(.*?)\s*<\/code>/gis, "`$1`");
            // Parameter ref.
            text = text.replace(/<paramref\s*name\s*=\s*"(.*?)"\s*\/>/gi, `$1`);
        } else {
            // Paragraph
            text = text.replace(/<para>\s*(.*?)\s*<\/para>/gi, "\n\n$1\n\n"); // .*? = non-greedy match all
            // Code block
            text = text.replace(/<code>\s*(.*?)\s*<\/code>/gis, "\n```javascript\n$1\n```");
            // Parameter ref.
            text = text.replace(/<paramref\s*name\s*=\s*"(.*?)"\s*\/>/gi, `[$1](#${anchorPrefix}$1)`);
        }
        // Bold
        text = text.replace(/<b>(.*?)<\/b>/gi, "**$1**");
        // Italic
        text = text.replace(/<i>(.*?)<\/i>/gi, "*$1*");
        // Inline code
        text = text.replace(/<c>(.*?)<\/c>/gi, "`$1`");

        if (inTableCell) {
            text = text.split('\n')[0];
        }
        return text;
    }

}

export class ALXmlCommentParameter {
    name: string;
    description: string;
    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
    }
}

