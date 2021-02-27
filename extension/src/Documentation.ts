import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import { ALObject } from './ALObject/ALObject';
import { ALAccessModifier, ALCodeunitSubtype, ALControlType, ALObjectType } from './ALObject/Enums';
import { ALProcedure } from './ALObject/ALProcedure';
import { convertLinefeedToBR, deleteFolderRecursive, mkDirByPathSync } from './Common';
import { isNullOrUndefined } from 'util';
import xmldom = require('xmldom');
import { ALTenantWebService } from './ALObject/ALTenantWebService';
import { Settings, Setting } from "./Settings";

export async function generateExternalDocumentation() {
    let workspaceFolder = WorkspaceFunctions.getWorkspaceFolder();
    let removeObjectNamePrefixFromDocs = Settings.getConfigSettings()[Setting.RemoveObjectNamePrefixFromDocs];
    let docsRootPathSetting: string = Settings.getConfigSettings()[Setting.DocsRootPath];
    let docsRootPath: string;
    let relativePath = true;
    if (docsRootPathSetting === '') {
        docsRootPathSetting = 'docs';
    } else {
        relativePath = !path.isAbsolute(docsRootPathSetting);
    }

    if (relativePath) {
        docsRootPath = path.normalize(path.join(workspaceFolder.uri.fsPath, docsRootPathSetting));
    } else {
        docsRootPath = docsRootPathSetting;
    }
    if (fs.existsSync(docsRootPath)) {
        deleteFolderRecursive(docsRootPath);
    }
    createFolderIfNotExist(docsRootPath);
    let objects: ALObject[] = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(true, true);
    const publicObjects = objects.filter(x => x.publicAccess && x.subtype === ALCodeunitSubtype.Normal
        && x.controls.filter(p => p.type === ALControlType.Procedure
            && ((<ALProcedure>p).access === ALAccessModifier.public)
            || (<ALProcedure>p).event).length > 0);

    await generateObjectsDocumentation(docsRootPath, publicObjects, removeObjectNamePrefixFromDocs);

    let webServicesFiles = await WorkspaceFunctions.getWebServiceFiles();
    let webServices: ALTenantWebService[] = [];
    webServicesFiles.forEach(w => {
        let dom = xmldom.DOMParser;
        let xml = fs.readFileSync(w.fsPath, "utf8");
        let xmlDom = new dom().parseFromString(xml);
        let tenantWebServices: Element[] = Array.from(xmlDom.getElementsByTagName('TenantWebService'));

        for (let index = 0; index < tenantWebServices.length; index++) {
            const ws = tenantWebServices[index];
            let newWS = ALTenantWebService.fromElement(ws);
            if (newWS) {
                webServices.push(newWS);
            }
        }
    });
    if (webServices.length > 0) {
        const wsIndexPath = path.join(docsRootPath, 'web-services.md');
        let indexContent: string = '';

        webServices = webServices.sort((a, b) => a.serviceName < b.serviceName ? -1 : 1).sort((a, b) => a.objectType < b.objectType ? -1 : 1);


        indexContent += `# Web Services\n\n`;

        indexContent += "| Name | Type | Description |\n| ----- | ------ | ------ |\n";
        webServices.forEach(ws => {
            let obj = publicObjects.filter(o => o.objectType === ws.objectType && o.objectId === ws.objectId)[0];
            if (!obj) {
                obj = objects.filter(o => o.objectType === ws.objectType && o.objectId === ws.objectId)[0];
                if (obj) {
                    generateObjectDocumentation(docsRootPath, obj);
                }
            }
            if (obj) {
                indexContent += `| [${ws.serviceName}](${obj.objectType.toLowerCase()}/${obj.docsFolderName}/index.md) | ${obj.objectType} | ${obj.xmlComment?.summary ? convertLinefeedToBR(obj.xmlComment?.summary) : ''} |\n`;
            }
        });

        indexContent = indexContent.trimEnd() + '\n';

        fs.writeFileSync(wsIndexPath, indexContent);

    }

    async function generateObjectsDocumentation(docsRootPath: string, publicObjects: ALObject[], removeObjectNamePrefixFromDocs: string) {
        const indexPath = path.join(docsRootPath, 'index.md');
        let indexContent: string = '';

        indexContent += `# API Documentation\n\n`;
        indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.Codeunit, 'Codeunits');
        indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.Table, 'Tables');
        indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.Page, 'Pages');
        indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.Interface, 'Interfaces');
        indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.TableExtension, 'Table Extensions');
        indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.PageExtension, 'Page Extensions');


        indexContent = indexContent.trimEnd() + '\n';

        fs.writeFileSync(indexPath, indexContent);

        publicObjects.forEach(object => {
            var { proceduresMap, objectFolderPath }: { proceduresMap: Map<string, ALProcedure[]>; objectFolderPath: string; } = generateObjectDocumentation(docsRootPath, object);

            createProcedurePages(proceduresMap, object, objectFolderPath);
        });
    }

    function generateObjectDocumentation(docsRootPath: string, object: ALObject) {
        const objectTypeDocsPath = path.join(docsRootPath, object.objectType.toLowerCase());
        createFolderIfNotExist(objectTypeDocsPath);
        const objectFolderPath = path.join(objectTypeDocsPath, object.docsFolderName);
        createFolderIfNotExist(objectFolderPath);

        const objectIndexPath = path.join(objectFolderPath, 'index.md');
        let objectIndexContent: string = '';
        objectIndexContent += `# ${removePrefix(object.objectName, removeObjectNamePrefixFromDocs)}\n\n`;
        if (object.xmlComment?.summary) {
            objectIndexContent += `${object.xmlComment?.summary}\n\n`;
        }

        objectIndexContent += `## Object Definition\n\n`;
        objectIndexContent += `| | |\n`;
        objectIndexContent += `| --- | --- |\n`;
        objectIndexContent += `| **Object Type** | ${object.objectType} |\n`;
        if (object.objectId !== 0) {
            // Interfaces has not Object ID
            objectIndexContent += `| **Object ID** | ${object.objectId} |\n`;
        }
        objectIndexContent += `| **Object Name** | ${object.objectName} |\n\n`;

        let publicProcedures: ALProcedure[] = <ALProcedure[]>object.controls.filter(x => x.type === ALControlType.Procedure && (<ALProcedure>x).access === ALAccessModifier.public && !x.isObsolete() && !(<ALProcedure>x).event).sort();
        let publicEvents: ALProcedure[] = <ALProcedure[]>object.controls.filter(x => x.type === ALControlType.Procedure && !x.isObsolete() && (<ALProcedure>x).event).sort();

        let proceduresMap: Map<string, ALProcedure[]> = new Map();

        objectIndexContent += getProcedureTable("Methods", publicProcedures, proceduresMap);
        objectIndexContent += getProcedureTable("Events", publicEvents, proceduresMap);

        if (object.xmlComment?.remarks) {
            objectIndexContent += `## Remarks\n\n`;
            objectIndexContent += `${convertLinefeedToBR(object.xmlComment?.remarks)}\n\n`;
        }
        objectIndexContent = objectIndexContent.trimEnd() + '\n';

        fs.writeFileSync(objectIndexPath, objectIndexContent);
        return { proceduresMap, objectFolderPath };
    }

    function getProcedureTable(header: string, procedures: ALProcedure[], proceduresMap: Map<string, ALProcedure[]>): string {
        let tableContent = '';
        if (procedures.length > 0) {
            tableContent += `## ${header}\n\n`;
            tableContent += "| Name | Description |\n|-----|------|\n";
        }
        procedures.forEach(procedure => {
            tableContent += `| [${procedure.toString(false)}](${procedure.docsLink}) |${procedure.xmlComment?.summary ? convertLinefeedToBR(procedure.xmlComment?.summary) : ' '}|\n`;

            let procedureArr: ALProcedure[] = [];
            if (proceduresMap.has(procedure.docsFilename)) {
                procedureArr = <ALProcedure[]>proceduresMap.get(procedure.docsFilename);
            }
            procedureArr.push(procedure);
            proceduresMap.set(procedure.docsFilename, procedureArr);
        });
        if (procedures.length > 0) {
            tableContent += `\n`;
        }

        return tableContent;
    }

    function createProcedurePages(proceduresMap: Map<string, ALProcedure[]>, object: ALObject, objectFolderPath: string) {
        proceduresMap.forEach((procedures, filename) => {

            let procedureFileContent = '';
            const overloads: boolean = procedures.length > 1;
            if (overloads) {
                procedureFileContent += `# ${procedures[0].name} Method\n\n`;
                procedureFileContent += `[${object.objectType} ${removePrefix(object.objectName, removeObjectNamePrefixFromDocs)}](index.md)\n\n`;
                let firstProcWithSummary = procedures.filter(x => !isNullOrUndefined(x.xmlComment?.summary) && x.xmlComment?.summary.trim() !== '')[0];
                if (!isNullOrUndefined(firstProcWithSummary?.xmlComment?.summary)) {
                    if (firstProcWithSummary?.xmlComment?.summary !== '') {
                        procedureFileContent += `${firstProcWithSummary?.xmlComment?.summary}\n\n`;
                    }
                }

                procedureFileContent += `## Overloads\n\n`;
                procedureFileContent += "| Name | Description |\n|-----|------|\n";
                procedures.forEach(procedure => {
                    procedureFileContent += `| [${procedure.toString(false)}](#${procedure.docsAnchor}) |${procedure.xmlComment?.summary ? procedure.xmlComment?.summary : ' '}|\n`;
                });
                procedureFileContent += `\n`;
            }
            procedures.forEach(procedure => {

                // Overload sample: https://docs.microsoft.com/en-us/dotnet/api/system.array.binarysearch?view=net-5.0#System_Array_BinarySearch_System_Array_System_Object_
                // Write procedure page
                if (overloads) {
                    procedureFileContent += `## <a name="${procedure.docsAnchor}"></a>${procedure.toString(false, true)} Method\n\n`;
                } else {
                    procedureFileContent += `# <a name="${procedure.docsAnchor}"></a>${procedure.name} ${procedure.event ? 'Event' : 'Method'}\n\n`;
                    procedureFileContent += `[${object.objectType} ${removePrefix(object.objectName, removeObjectNamePrefixFromDocs)}](index.md)\n\n`;
                }
                if (procedure.xmlComment?.summary) {
                    procedureFileContent += `${procedure.xmlComment.summary}\n\n`;
                }
                // Signature
                procedureFileContent += codeBlock(procedure.toString(true));

                // Parameters
                if (procedure.parameters.length > 0) {
                    procedureFileContent += `### Parameters\n\n`;
                    procedure.parameters.forEach(param => {
                        procedureFileContent += `#### ${param.byRef ? 'var ' : ''}\`${param.name}\`  ${param.fullDataType}\n\n`;
                        let paramXmlDoc = procedure.xmlComment?.parameters.filter(p => p.name === param.name)[0];
                        if (paramXmlDoc) {
                            if (paramXmlDoc.description.trim().length > 0) {
                                procedureFileContent += `${paramXmlDoc.description}\n\n`;
                            }
                        }
                    });
                }
                // Return value
                if (procedure.returns) {
                    procedureFileContent += `### Returns\n\n`;
                    procedureFileContent += `${procedure.returns.fullDataType}\n\n`;
                    if (procedure.xmlComment?.returns) {
                        procedureFileContent += `${procedure.xmlComment.returns}\n\n`;
                    }
                }
                // Remarks
                if (procedure.xmlComment?.remarks) {
                    procedureFileContent += `### Remarks\n\n`;
                    procedureFileContent += `${convertLinefeedToBR(procedure.xmlComment?.remarks)}\n\n`;
                }
                // Example
                if (procedure.xmlComment?.example) {
                    procedureFileContent += `### Example\n\n`;
                    procedureFileContent += codeBlock(procedure.xmlComment?.example);
                }
            });

            procedureFileContent = procedureFileContent.trimEnd() + '\n';
            const procedureFilepath = path.join(objectFolderPath, filename);
            fs.writeFileSync(procedureFilepath, procedureFileContent);
        });
    }
    function generateObjectTypeIndex(publicObjects: ALObject[], indexContent: string, removeObjectNamePrefixFromDocs: string, alObjectType: ALObjectType, header: string) {
        const filteredObjects = publicObjects.filter(x => x.objectType === alObjectType);
        if (filteredObjects.length > 0) {
            indexContent += `## ${header}\n\n`;
            indexContent += "| Name | Description |\n|-----|------|\n";
            filteredObjects.forEach(object => {
                indexContent += `| [${removePrefix(object.name, removeObjectNamePrefixFromDocs)}](${object.objectType.toLowerCase()}/${object.docsFolderName}/index.md) |${object.xmlComment?.summary ? convertLinefeedToBR(object.xmlComment?.summary) : ' '}|\n`;
            });
            indexContent += `\n`;
        }
        return indexContent;
    }
}
function removePrefix(text: string, removeObjectNamePrefixFromDocs: string): string {
    if (removeObjectNamePrefixFromDocs === '') {
        return text;
    }
    if (text.startsWith(removeObjectNamePrefixFromDocs)) {
        text = text.substr(removeObjectNamePrefixFromDocs.length).trim();
    }

    return text;
}

function createFolderIfNotExist(folderPath: string) {
    if (!fs.existsSync(folderPath)) {
        mkDirByPathSync(folderPath);
    }
}

function codeBlock(code: string): string {
    let result = '```javascript\n';
    result += code;
    result += '\n```\n\n';
    return result;
}

