import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import { ALObject } from './ALObject/ALObject';
import { ALAccessModifier, ALCodeunitSubtype, ALControlType, ALObjectType } from './ALObject/Enums';
import { ALProcedure } from './ALObject/ALProcedure';
import { convertLinefeedToBR, deleteFolderRecursive } from './Common';
import { isNullOrUndefined } from 'util';
import xmldom = require('xmldom');
import { ALTenantWebService } from './ALObject/ALTenantWebService';

export async function generateExternalDocumentation() {
    let workspaceFolder = WorkspaceFunctions.getWorkspaceFolder();
    const docsRootPath = path.join(workspaceFolder.uri.fsPath, 'docs');
    if (fs.existsSync(docsRootPath)) {
        deleteFolderRecursive(docsRootPath);
    }
    createFolderIfNotExist(docsRootPath);
    let objects: ALObject[] = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(true);

    await generateObjectDocumentation(docsRootPath, objects);

    let webServicesFiles = await WorkspaceFunctions.getWebServiceFiles();
    let webServices: ALTenantWebService[] = [];
    webServicesFiles.forEach(w => {
        let dom = xmldom.DOMParser;
        let xml = fs.readFileSync(w.fsPath, "utf8");
        let xmlDom = new dom().parseFromString(xml);
        let tenantWebServices = xmlDom.getElementsByTagName('TenantWebService');
        for (let index = 0; index < tenantWebServices.length; index++) {
            const ws = tenantWebServices[index];
            let newWS = ALTenantWebService.fromElement(ws);
            if (newWS) {
                webServices.push(newWS);
            }
        }
    });
    if (webServices.length > 0) {
        const wsIndexPath = path.join(docsRootPath, 'ws.md');
        let indexContent: string = '';

        indexContent += `# Web Services\n\n`;

        indexContent += "| Name | Description |\n|-----|------|\n";
        webServices.forEach(ws => {
            let obj = objects.filter(o => o.objectType === ws.objectType && o.objectId === ws.objectId)[0];
            if (obj) {
                indexContent += `| [${ws.serviceName}](${obj.objectType.toLowerCase()}/${obj.docsFolderName}/index.md) |${obj.xmlComment?.summary ? convertLinefeedToBR(obj.xmlComment?.summary) : ' '}|\n`;
            }
        });

        indexContent = indexContent.trimEnd() + '\n';

        fs.writeFileSync(wsIndexPath, indexContent);

    }

    async function generateObjectDocumentation(docsRootPath: string, objects: ALObject[]) {
        const indexPath = path.join(docsRootPath, 'index.md');
        let indexContent: string = '';

        const publicObjects = objects.filter(x => x.publicAccess && x.subtype === ALCodeunitSubtype.Normal
            && x.controls.filter(p => p.type === ALControlType.Procedure
                && ((<ALProcedure>p).access === ALAccessModifier.public)
                || (<ALProcedure>p).event).length > 0);

        indexContent += `# API Documentation\n\n`;
        indexContent = generateObjectTypeIndex(publicObjects, indexContent, ALObjectType.Codeunit, 'Codeunits');
        indexContent = generateObjectTypeIndex(publicObjects, indexContent, ALObjectType.Table, 'Tables');
        indexContent = generateObjectTypeIndex(publicObjects, indexContent, ALObjectType.Page, 'Pages');
        indexContent = generateObjectTypeIndex(publicObjects, indexContent, ALObjectType.Interface, 'Interfaces');


        indexContent = indexContent.trimEnd() + '\n';

        fs.writeFileSync(indexPath, indexContent);

        publicObjects.forEach(object => {
            const objectTypeDocsPath = path.join(docsRootPath, object.objectType.toLowerCase());
            createFolderIfNotExist(objectTypeDocsPath);
            const objectFolderPath = path.join(objectTypeDocsPath, object.docsFolderName);
            createFolderIfNotExist(objectFolderPath);

            const objectIndexPath = path.join(objectFolderPath, 'index.md');
            let objectIndexContent: string = '';
            objectIndexContent += `# ${object.objectName}\n\n`;
            if (object.xmlComment?.summary) {
                objectIndexContent += `${object.xmlComment?.summary}\n\n`;
            }

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

            createProcedurePages(proceduresMap, object, objectFolderPath);
        });
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
                procedureFileContent += `[${object.objectType} ${object.objectName}](index.md)\n\n`;
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
                    procedureFileContent += `[${object.objectType} ${object.objectName}](index.md)\n\n`;
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
    function generateObjectTypeIndex(publicObjects: ALObject[], indexContent: string, alObjectType: ALObjectType, header: string) {
        const filteredObjects = publicObjects.filter(x => x.objectType === alObjectType);
        if (filteredObjects.length > 0) {
            indexContent += `## ${header}\n\n`;
            indexContent += "| Name | Description |\n|-----|------|\n";
            filteredObjects.forEach(object => {
                indexContent += `| [${object.name}](${object.objectType.toLowerCase()}/${object.docsFolderName}/index.md) |${object.xmlComment?.summary ? convertLinefeedToBR(object.xmlComment?.summary) : ' '}|\n`;
            });
            indexContent += `\n`;
        }
        return indexContent;
    }
}


function createFolderIfNotExist(folderPath: string) {
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath);
    }
}

function codeBlock(code: string): string {
    let result = '```javascript\n';
    result += code;
    result += '\n```\n\n';
    return result;
}

