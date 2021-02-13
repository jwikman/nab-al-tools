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


    static fromString(xmlComment: string[]): ALXmlComment {

        let xml: string;
        if (xmlComment.filter(x => x !== '')[0].trim().startsWith('///')) {
            xml = xmlComment.map(x => {
                return x.trim().substr(3);
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
            xmlComment.example = _example.textContent.trim();
        }
        let _parameters = xmlDoc.getElementsByTagName('param');
        if (_parameters) {
            for (let i = 0; i < _parameters.length; i++) {
                const _param = _parameters[i];
                const _name = _param.getAttribute('name')?.trim();
                const _description = _param?.textContent?.trim();
                xmlComment.parameters.push(new ALXmlCommentParameter(_name ? _name : '', _description ? _description : ''));
            }
        }
        return xmlComment;
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

