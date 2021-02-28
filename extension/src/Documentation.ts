import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import { ALObject } from './ALObject/ALObject';
import { ALAccessModifier, ALCodeunitSubtype, ALControlType, ALObjectType, ALPropertyType } from './ALObject/Enums';
import { ALProcedure } from './ALObject/ALProcedure';
import { deleteFolderRecursive, mkDirByPathSync } from './Common';
import { isNullOrUndefined } from 'util';
import xmldom = require('xmldom');
import { ALTenantWebService } from './ALObject/ALTenantWebService';
import { Settings, Setting } from "./Settings";
import { ALXmlComment } from './ALObject/ALXmlComment';

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

    await generateWebServicesDocumentation();
    await generateApiDocumentation(objects);


    async function generateApiDocumentation(objects: ALObject[]) {
        let apiObjects = objects.filter(o => ((o.objectType === ALObjectType.Page && o.getPropertyValue(ALPropertyType.PageType)?.toLowerCase() === 'api') || (o.objectType === ALObjectType.Query && o.getPropertyValue(ALPropertyType.QueryType)?.toLowerCase() === 'api')) && o.getPropertyValue(ALPropertyType.EntityName));
        if (apiObjects.length > 0) {
            const wsIndexPath = path.join(docsRootPath, 'api.md');
            let indexContent: string = '';

            apiObjects = apiObjects.sort((a, b) => a.getPropertyValue(ALPropertyType.EntityName) + '' < b.getPropertyValue(ALPropertyType.EntityName) + '' ? -1 : 1).sort((a, b) => a.objectType < b.objectType ? -1 : 1);


            indexContent += `# API\n\n`;

            indexContent += "| Name | Type | Description |\n| ----- | ------ | ------ |\n";
            apiObjects.forEach(object => {
                generateObjectDocumentation(docsRootPath, object);
                indexContent += `| [${object.getPropertyValue(ALPropertyType.EntityName)}](${object.docsFolderName}/index.md) | ${object.objectType} | ${object.xmlComment ? ALXmlComment.formatMarkDown(object.xmlComment.summaryShort) : ''} |\n`;
            });

            indexContent = indexContent.trimEnd() + '\n';

            fs.writeFileSync(wsIndexPath, indexContent);

        }
    }


    async function generateWebServicesDocumentation() {
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
                    indexContent += `| [${ws.serviceName}](${obj.docsFolderName}/index.md) | ${obj.objectType} | ${obj.xmlComment ? ALXmlComment.formatMarkDown(obj.xmlComment.summaryShort) : ''} |\n`;
                }
            });

            indexContent = indexContent.trimEnd() + '\n';

            fs.writeFileSync(wsIndexPath, indexContent);

        }
    }

    async function generateObjectsDocumentation(docsRootPath: string, publicObjects: ALObject[], removeObjectNamePrefixFromDocs: string) {
        if (publicObjects.length > 0) {
            const indexPath = path.join(docsRootPath, 'public-objects.md');
            let indexContent: string = '';

            indexContent += `# Public Objects\n\n`;
            indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.Codeunit, 'Codeunits');
            indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.Table, 'Tables');
            indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.Page, 'Pages');
            indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.Interface, 'Interfaces');
            indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.TableExtension, 'Table Extensions');
            indexContent = generateObjectTypeIndex(publicObjects, indexContent, removeObjectNamePrefixFromDocs, ALObjectType.PageExtension, 'Page Extensions');


            indexContent = indexContent.trimEnd() + '\n';

            fs.writeFileSync(indexPath, indexContent);

            publicObjects.forEach(object => {
                generateObjectDocumentation(docsRootPath, object);
            });
        }

    }

    function generateObjectDocumentation(docsRootPath: string, object: ALObject) {
        let proceduresMap: Map<string, ALProcedure[]> = new Map();
        const objectFolderPath = path.join(docsRootPath, object.docsFolderName);
        if (fs.existsSync(objectFolderPath)) {
            return;// Already created
        }
        createFolderIfNotExist(objectFolderPath);

        const objectIndexPath = path.join(objectFolderPath, 'index.md');
        let objectIndexContent: string = '';
        objectIndexContent += `# ${removePrefix(object.objectName, removeObjectNamePrefixFromDocs)}\n\n`;
        if (object.xmlComment?.summary) {
            objectIndexContent += `${ALXmlComment.formatMarkDown(object.xmlComment.summary)}\n\n`;
        }

        objectIndexContent += `## Object Definition\n\n`;
        objectIndexContent += `| | |\n`;
        objectIndexContent += `| --- | --- |\n`;
        objectIndexContent += `| **Object Type** | ${object.objectType} |\n`;
        if (object.objectId !== 0) {
            // Interfaces has not Object ID
            objectIndexContent += `| **Object ID** | ${object.objectId} |\n`;
        }
        objectIndexContent += `| **Object Name** | ${object.objectName} |\n`;
        if ((object.objectType === ALObjectType.Page && object.getPropertyValue(ALPropertyType.PageType)?.toLowerCase() === 'api') || (object.objectType === ALObjectType.Query && object.getPropertyValue(ALPropertyType.QueryType)?.toLowerCase() === 'api')) {
            objectIndexContent += `\n`;
            objectIndexContent += `## API Definition\n\n`;
            objectIndexContent += `| | |\n`;
            objectIndexContent += `| --- | --- |\n`;
            objectIndexContent += `| **APIPublisher** | ${object.getPropertyValue(ALPropertyType.APIPublisher)} |\n`;
            objectIndexContent += `| **APIGroup** | ${object.getPropertyValue(ALPropertyType.APIGroup)} |\n`;
            objectIndexContent += `| **APIVersion** | ${object.getPropertyValue(ALPropertyType.APIVersion)} |\n`;
            objectIndexContent += `| **EntitySetName** | ${object.getPropertyValue(ALPropertyType.EntitySetName)} |\n`;
            objectIndexContent += `| **EntityName** | ${object.getPropertyValue(ALPropertyType.EntityName)} |\n`;
        }
        objectIndexContent += '\n';
        let publicProcedures: ALProcedure[] = <ALProcedure[]>object.controls.filter(x => x.type === ALControlType.Procedure && (<ALProcedure>x).access === ALAccessModifier.public && !x.isObsolete() && !(<ALProcedure>x).event).sort();
        let publicEvents: ALProcedure[] = <ALProcedure[]>object.controls.filter(x => x.type === ALControlType.Procedure && !x.isObsolete() && (<ALProcedure>x).event).sort();


        objectIndexContent += getProcedureTable("Methods", publicProcedures, proceduresMap);
        objectIndexContent += getProcedureTable("Events", publicEvents, proceduresMap);

        if (object.xmlComment?.remarks) {
            objectIndexContent += `## Remarks\n\n`;
            objectIndexContent += `${ALXmlComment.formatMarkDown(object.xmlComment?.remarks)}\n\n`;
        }
        objectIndexContent = objectIndexContent.trimEnd() + '\n';

        fs.writeFileSync(objectIndexPath, objectIndexContent);

        createProcedurePages(proceduresMap, object, objectFolderPath);

    }

    function getProcedureTable(header: string, procedures: ALProcedure[], proceduresMap: Map<string, ALProcedure[]>): string {
        let tableContent = '';
        if (procedures.length > 0) {
            tableContent += `## ${header}\n\n`;
            tableContent += "| Name | Description |\n|-----|------|\n";
        }
        procedures.forEach(procedure => {
            tableContent += `| [${procedure.toString(false)}](${procedure.docsLink}) |${procedure.xmlComment ? ALXmlComment.formatMarkDown(procedure.xmlComment.summaryShort) : ''} |\n`;

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
                if (firstProcWithSummary?.xmlComment?.summary) {
                    if (firstProcWithSummary.xmlComment.summary !== '') {
                        procedureFileContent += `${ALXmlComment.formatMarkDown(firstProcWithSummary.xmlComment.summary)}\n\n`;
                    }
                }

                procedureFileContent += `## Overloads\n\n`;
                procedureFileContent += "| Name | Description |\n| ----- | ------ |\n";
                procedures.forEach(procedure => {
                    procedureFileContent += `| [${procedure.toString(false)}](#${procedure.docsAnchor}) | ${procedure.xmlComment?.summary ? ALXmlComment.formatMarkDown(procedure.xmlComment.summaryShort) : ''} |\n`;
                });
                procedureFileContent += `\n`;
                procedureFileContent += `<!-- markdownlint-disable MD024 -->\n`;
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
                    procedureFileContent += `${ALXmlComment.formatMarkDown(procedure.xmlComment.summary)}\n\n`;
                }
                // Signature
                procedureFileContent += codeBlock(procedure.toString(true));

                // Parameters
                if (procedure.parameters.length > 0) {
                    procedureFileContent += `### Parameters\n\n`;
                    procedure.parameters.forEach(param => {
                        procedureFileContent += `#### <a name="${param.name}"></a>${param.byRef ? 'var ' : ''}\`${param.name}\`  ${param.fullDataType}\n\n`;
                        let paramXmlDoc = procedure.xmlComment?.parameters.filter(p => p.name === param.name)[0];
                        if (paramXmlDoc) {
                            if (paramXmlDoc.description.trim().length > 0) {
                                procedureFileContent += `${ALXmlComment.formatMarkDown(paramXmlDoc.description)}\n\n`;
                            }
                        }
                    });
                }
                // Return value
                if (procedure.returns) {
                    procedureFileContent += `### Returns\n\n`;
                    procedureFileContent += `${procedure.returns.fullDataType}\n\n`;
                    if (procedure.xmlComment?.returns) {
                        procedureFileContent += `${ALXmlComment.formatMarkDown(procedure.xmlComment.returns)}\n\n`;
                    }
                }
                // Remarks
                if (procedure.xmlComment?.remarks) {
                    procedureFileContent += `### Remarks\n\n`;
                    procedureFileContent += `${ALXmlComment.formatMarkDown(procedure.xmlComment?.remarks)}\n\n`;
                }
                // Example
                if (procedure.xmlComment?.example) {
                    procedureFileContent += `### Example\n\n`;
                    procedureFileContent += ALXmlComment.formatMarkDown(procedure.xmlComment?.example);
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
            indexContent += "| Name | Description |\n| ----- | ------ |\n";
            filteredObjects.forEach(object => {
                indexContent += `| [${removePrefix(object.name, removeObjectNamePrefixFromDocs)}](${object.docsFolderName}/index.md) |${object.xmlComment?.summary ? ALXmlComment.formatMarkDown(object.xmlComment.summaryShort) : ''} |\n`;
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

