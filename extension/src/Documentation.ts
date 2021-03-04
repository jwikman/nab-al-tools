import * as fs from 'fs';
import * as path from 'path';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import { ALObject } from './ALObject/ALObject';
import { ALAccessModifier, ALCodeunitSubtype, ALControlType, ALObjectType, ALPropertyType, DocsType } from './ALObject/Enums';
import { ALProcedure } from './ALObject/ALProcedure';
import { deleteFolderRecursive, mkDirByPathSync, replaceAll } from './Common';
import { isNullOrUndefined } from 'util';
import xmldom = require('xmldom');
import { ALTenantWebService } from './ALObject/ALTenantWebService';
import { Settings, Setting } from "./Settings";
import { ALXmlComment } from './ALObject/ALXmlComment';
import { YamlItem } from './markdown/YamlItem';
import { generateToolTipDocumentation } from './ToolTipsFunctions';
import { kebabCase } from 'lodash';

export async function generateExternalDocumentation() {
    let workspaceFolder = WorkspaceFunctions.getWorkspaceFolder();
    let removeObjectNamePrefixFromDocs = Settings.getConfigSettings()[Setting.RemoveObjectNamePrefixFromDocs];
    let docsRootPathSetting: string = Settings.getConfigSettings()[Setting.DocsRootPath];
    let createTocSetting: boolean = Settings.getConfigSettings()[Setting.CreateTocFilesForDocs];
    let GenerateTooltipDocsWithExternalDocs: boolean = Settings.getConfigSettings()[Setting.GenerateTooltipDocsWithExternalDocs];
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
    const tocPath = path.join(docsRootPath, 'TOC.yml');
    let tocItems: YamlItem[] = [];

    let objects: ALObject[] = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(true, true);
    const publicObjects = objects.filter(x => x.publicAccess && x.subtype === ALCodeunitSubtype.Normal
        && x.controls.filter(p => p.type === ALControlType.Procedure
            && ((<ALProcedure>p).access === ALAccessModifier.public)
            || (<ALProcedure>p).event).length > 0);

    await generateObjectsDocumentation(docsRootPath, tocItems, publicObjects, removeObjectNamePrefixFromDocs, createTocSetting);

    await generateWebServicesDocumentation(tocItems, createTocSetting);
    await generateApiDocumentation(objects, tocItems);

    if (createTocSetting) {
        let tocContent = YamlItem.arrayToString(tocItems);
        saveContentToFile(tocPath, tocContent);
    }

    if (GenerateTooltipDocsWithExternalDocs) {
        generateToolTipDocumentation(objects);
    }

    async function generateApiDocumentation(objects: ALObject[], toc: YamlItem[]) {
        let apiObjects = objects.filter(o => ((o.objectType === ALObjectType.Page && o.getPropertyValue(ALPropertyType.PageType)?.toLowerCase() === 'api') || (o.objectType === ALObjectType.Query && o.getPropertyValue(ALPropertyType.QueryType)?.toLowerCase() === 'api')) && o.getPropertyValue(ALPropertyType.EntityName));
        if (apiObjects.length > 0) {
            const filename = "api-objects.md";
            const wsIndexPath = path.join(docsRootPath, filename);
            let headerItem: YamlItem = new YamlItem({ name: 'API Objects', href: filename });
            headerItem.items = [];
            toc.push(headerItem);

            apiObjects = apiObjects.sort((a, b) => a.getPropertyValue(ALPropertyType.EntityName) + '' < b.getPropertyValue(ALPropertyType.EntityName) + '' ? -1 : 1).sort((a, b) => a.objectType < b.objectType ? -1 : 1);


            let indexContent = `# API Objects\n\n`;

            indexContent = generateApiObjectTypeTable(ALObjectType.Page, 'Pages', indexContent, apiObjects, createTocSetting, headerItem.items);
            indexContent = generateApiObjectTypeTable(ALObjectType.Query, 'Queries', indexContent, apiObjects, createTocSetting, headerItem.items);

            saveContentToFile(wsIndexPath, indexContent);

        }

        function generateApiObjectTypeTable(alObjectType: ALObjectType, header: string, indexContent: string, apiObjects: ALObject[], createTocSetting: boolean, toc: YamlItem[]) {
            const filteredObjects = apiObjects.filter(x => x.objectType === alObjectType);
            let tableContent = "";
            if (filteredObjects.length > 0) {
                const tableFilename = `api-${kebabCase(header)}.md`;
                let objectTypeTocItem: YamlItem = new YamlItem({ name: header, href: tableFilename, items: [] });
                toc.push(objectTypeTocItem);


                if (alObjectType === ALObjectType.Page) {
                    tableContent += "| Name | Source Table | Read-only |\n| ----- | ------ | ------ |\n";
                } else {
                    tableContent += "| Name | Description |\n| ----- | ------ |\n";
                }
                filteredObjects.forEach(object => {
                    generateObjectDocumentation(DocsType.API, docsRootPath, object, createTocSetting);
                    const entityName = object.getPropertyValue(ALPropertyType.EntityName);
                    const entityNameText: string = entityName ? entityName : "(N/A)";
                    if (alObjectType === ALObjectType.Page) {
                        tableContent += `| [${entityNameText}](${object.getDocsFolderName(DocsType.API)}/index.md) | ${object.sourceTable} | ${boolToText(object.readOnly)} |\n`;
                    } else {
                        tableContent += `| [${entityNameText}](${object.getDocsFolderName(DocsType.API)}/index.md) | ${object.xmlComment ? ALXmlComment.formatMarkDown(object.xmlComment.summaryShort, true) : ''} |\n`;
                    }

                    let tocItem: YamlItem = new YamlItem({ name: entityNameText, href: `${object.getDocsFolderName(DocsType.API)}/TOC.yml`, topicHref: `${object.getDocsFolderName(DocsType.API)}/index.md` });
                    objectTypeTocItem.items?.push(tocItem);
                });
                tableContent += '\n';

                const tableFilePath = path.join(docsRootPath, tableFilename);
                saveContentToFile(tableFilePath, `# API ${header}\n\n` + tableContent);
                tableContent = `## ${header}\n\n` + tableContent;
            }
            return indexContent + tableContent;
        }
    }

    async function generateWebServicesDocumentation(toc: YamlItem[], createTocSetting: boolean) {
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
            const filename = 'web-services.md';
            const wsIndexPath = path.join(docsRootPath, filename);
            let headerItem: YamlItem = new YamlItem({ name: 'Web Services', href: filename });
            headerItem.items = [];
            toc.push(headerItem);

            webServices = webServices.sort((a, b) => a.serviceName < b.serviceName ? -1 : 1).sort((a, b) => a.objectType < b.objectType ? -1 : 1);


            let indexContent = `# Web Services\n\n`;

            indexContent = generateWebServicesObjectTypeTable(ALObjectType.Codeunit, 'Codeunits', indexContent, webServices, createTocSetting, headerItem.items);
            indexContent = generateWebServicesObjectTypeTable(ALObjectType.Page, 'Pages', indexContent, webServices, createTocSetting, headerItem.items);
            indexContent = generateWebServicesObjectTypeTable(ALObjectType.Query, 'Queries', indexContent, webServices, createTocSetting, headerItem.items);

            saveContentToFile(wsIndexPath, indexContent);

        }

        function generateWebServicesObjectTypeTable(alObjectType: ALObjectType, header: string, indexContent: string, webServices: ALTenantWebService[], createTocSetting: boolean, toc: YamlItem[]) {
            const filteredObjects = webServices.filter(x => x.objectType === alObjectType);
            let tableContent = "";
            if (filteredObjects.length > 0) {
                const tableFilename = `ws-${kebabCase(header)}.md`;
                let objectTypeTocItem: YamlItem = new YamlItem({ name: header, href: tableFilename, items: [] });
                toc.push(objectTypeTocItem);

                if (alObjectType === ALObjectType.Page) {
                    tableContent += "| Name | Source Table | Read-only |\n| ----- | ------ | ------ |\n";
                } else {
                    tableContent += "| Name | Description |\n| ----- | ------ |\n";
                }
                filteredObjects.forEach(ws => {
                    let object = objects.filter(o => o.objectType === ws.objectType && o.objectId === ws.objectId)[0];
                    if (object) {
                        generateObjectDocumentation(DocsType.WS, docsRootPath, object, createTocSetting);
                        if (alObjectType === ALObjectType.Page) {
                            tableContent += `| [${ws.serviceName}](${object.getDocsFolderName(DocsType.WS)}/index.md) | ${object.sourceTable} | ${boolToText(object.readOnly)} |\n`;
                        } else {
                            tableContent += `| [${ws.serviceName}](${object.getDocsFolderName(DocsType.WS)}/index.md) | ${object.xmlComment ? ALXmlComment.formatMarkDown(object.xmlComment.summaryShort, true) : ''} |\n`;
                        }

                        let tocItem: YamlItem = new YamlItem({ name: ws.serviceName, href: `${object.getDocsFolderName(DocsType.WS)}/TOC.yml`, topicHref: `${object.getDocsFolderName(DocsType.WS)}/index.md` });
                        objectTypeTocItem.items?.push(tocItem);
                    }
                });
                tableContent += '\n';

                const tableFilePath = path.join(docsRootPath, tableFilename);
                saveContentToFile(tableFilePath, `# Web Service ${header}\n\n` + tableContent);
                tableContent = `## ${header}\n\n` + tableContent;
            }
            return indexContent + tableContent;
        }
    }

    async function generateObjectsDocumentation(docsRootPath: string, toc: YamlItem[], publicObjects: ALObject[], removeObjectNamePrefixFromDocs: string, createTocSetting: boolean) {
        if (publicObjects.length > 0) {
            const filename = 'public-objects.md';
            const indexPath = path.join(docsRootPath, filename);
            let indexContent = "";
            let headerItem: YamlItem = new YamlItem({ name: 'Public Objects', href: filename });
            headerItem.items = [];
            toc.push(headerItem);

            indexContent += `# Public Objects\n\n`;
            indexContent = generateObjectTypeIndex(docsRootPath, publicObjects, indexContent, headerItem.items, removeObjectNamePrefixFromDocs, ALObjectType.Codeunit, 'Codeunits');
            indexContent = generateObjectTypeIndex(docsRootPath, publicObjects, indexContent, headerItem.items, removeObjectNamePrefixFromDocs, ALObjectType.Table, 'Tables');
            indexContent = generateObjectTypeIndex(docsRootPath, publicObjects, indexContent, headerItem.items, removeObjectNamePrefixFromDocs, ALObjectType.TableExtension, 'Table Extensions');
            indexContent = generateObjectTypeIndex(docsRootPath, publicObjects, indexContent, headerItem.items, removeObjectNamePrefixFromDocs, ALObjectType.Page, 'Pages');
            indexContent = generateObjectTypeIndex(docsRootPath, publicObjects, indexContent, headerItem.items, removeObjectNamePrefixFromDocs, ALObjectType.PageExtension, 'Page Extensions');
            indexContent = generateObjectTypeIndex(docsRootPath, publicObjects, indexContent, headerItem.items, removeObjectNamePrefixFromDocs, ALObjectType.Interface, 'Interfaces');

            saveContentToFile(indexPath, indexContent);

            publicObjects.forEach(object => {
                generateObjectDocumentation(DocsType.Public, docsRootPath, object, createTocSetting);
            });
        }

        function generateObjectTypeIndex(docsRootPath: string, publicObjects: ALObject[], indexContent: string, toc: YamlItem[], removeObjectNamePrefixFromDocs: string, alObjectType: ALObjectType, header: string) {
            const filteredObjects = publicObjects.filter(x => x.objectType === alObjectType);
            let tableContent = "";
            if (filteredObjects.length > 0) {
                const tableFilename = `${kebabCase(header)}.md`;
                let objectTypeTocItem: YamlItem = new YamlItem({ name: header, href: tableFilename, items: [] });
                toc.push(objectTypeTocItem);

                if (alObjectType === ALObjectType.Page) {
                    tableContent += "| Name | Source Table | Read-only |\n| ----- | ------ | ------ |\n";
                } else {
                    tableContent += "| Name | Description |\n| ----- | ------ |\n";
                }
                filteredObjects.forEach(object => {
                    if (alObjectType === ALObjectType.Page) {
                        tableContent += `| [${removePrefix(object.name, removeObjectNamePrefixFromDocs)}](${object.getDocsFolderName(DocsType.Public)}/index.md) | ${object.sourceTable} | ${boolToText(object.readOnly)} |\n`;
                    } else {
                        tableContent += `| [${removePrefix(object.name, removeObjectNamePrefixFromDocs)}](${object.getDocsFolderName(DocsType.Public)}/index.md) | ${object.xmlComment?.summary ? ALXmlComment.formatMarkDown(object.xmlComment.summaryShort, true) : ''} |\n`;
                    }
                    let tocItem: YamlItem = new YamlItem({ name: removePrefix(object.name, removeObjectNamePrefixFromDocs), href: `${object.getDocsFolderName(DocsType.Public)}/TOC.yml`, topicHref: `${object.getDocsFolderName(DocsType.Public)}/index.md` });
                    objectTypeTocItem.items?.push(tocItem);
                });
                tableContent += `\n`;

                const tableFilePath = path.join(docsRootPath, tableFilename);
                saveContentToFile(tableFilePath, tableContent);
                saveContentToFile(tableFilePath, `# Public ${header}\n\n` + tableContent);
                tableContent = `## ${header}\n\n` + tableContent;
            }
            return indexContent + tableContent;
        }

    }

    function generateObjectDocumentation(pageType: DocsType, docsRootPath: string, object: ALObject, createTocSetting: boolean) {
        let proceduresMap: Map<string, ALProcedure[]> = new Map();
        let objDocsFolderName = object.getDocsFolderName(pageType);
        const objectFolderPath = path.join(docsRootPath, objDocsFolderName);

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
        if (object.objectType === ALObjectType.Page) {
            objectIndexContent += `| **Source Table** | ${object.sourceTable} |\n`;
            objectIndexContent += `| **Read-only** | ${boolToText(object.readOnly)} |\n`;
        }
        if (pageType === DocsType.API) {
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

        if (object.xmlComment?.example) {
            objectIndexContent += `## Example\n\n`;
            objectIndexContent += `${ALXmlComment.formatMarkDown(object.xmlComment?.example)}\n\n`;
        }



        saveContentToFile(objectIndexPath, objectIndexContent);

        generateProcedurePages(proceduresMap, object, objectFolderPath, createTocSetting);

        function getProcedureTable(header: string, procedures: ALProcedure[], proceduresMap: Map<string, ALProcedure[]>): string {
            let tableContent = '';
            if (procedures.length > 0) {
                tableContent += `## ${header}\n\n`;
                tableContent += "| Name | Description |\n| ----- | ------ |\n";
            }
            procedures.forEach(procedure => {
                tableContent += `| [${procedure.toString(false)}](${procedure.docsLink}) | ${procedure.xmlComment ? ALXmlComment.formatMarkDown(procedure.xmlComment.summaryShort, true) : ''} |\n`;

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

        function generateProcedurePages(proceduresMap: Map<string, ALProcedure[]>, object: ALObject, objectFolderPath: string, createTocSetting: boolean) {
            let tocContent = "items:\n";
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
                        procedureFileContent += `| [${procedure.toString(false)}](#${procedure.docsAnchor}) | ${procedure.xmlComment?.summary ? ALXmlComment.formatMarkDown(procedure.xmlComment.summaryShort, true) : ''} |\n`;
                    });
                    procedureFileContent += `\n`;
                }
                procedures.forEach(procedure => {

                    // Overload sample: https://docs.microsoft.com/en-us/dotnet/api/system.array.binarysearch?view=net-5.0#System_Array_BinarySearch_System_Array_System_Object_
                    let anchorPrefix = "";
                    // Write procedure page
                    if (overloads) {
                        anchorPrefix = `${procedure.docsAnchor}_`;
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
                        procedureFileContent += `${overloads ? "#" : ""}## <a name="${anchorPrefix}parameters"></a>Parameters\n\n`;
                        procedure.parameters.forEach(param => {
                            procedureFileContent += `${overloads ? "#" : ""}### <a name="${anchorPrefix}${param.name}"></a>${param.byRef ? 'var ' : ''}\`${param.name}\`  ${param.fullDataType}\n\n`;
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
                        procedureFileContent += `${overloads ? "#" : ""}## <a name="${anchorPrefix}returns">Returns\n\n`;
                        procedureFileContent += `${procedure.returns.fullDataType}\n\n`;
                        if (procedure.xmlComment?.returns) {
                            procedureFileContent += `${ALXmlComment.formatMarkDown(procedure.xmlComment.returns)}\n\n`;
                        }
                    }
                    // Remarks
                    if (procedure.xmlComment?.remarks) {
                        procedureFileContent += `${overloads ? "#" : ""}## <a name="${anchorPrefix}remarks">Remarks\n\n`;
                        procedureFileContent += `${ALXmlComment.formatMarkDown(procedure.xmlComment?.remarks)}\n\n`;
                    }
                    // Example
                    if (procedure.xmlComment?.example) {
                        procedureFileContent += `${overloads ? "#" : ""}## <a name="${anchorPrefix}example">Example\n\n`;
                        procedureFileContent += `${ALXmlComment.formatMarkDown(procedure.xmlComment?.example)}\n\n`;
                    }
                });

                const procedureFilepath = path.join(objectFolderPath, filename);

                saveContentToFile(procedureFilepath, procedureFileContent);
                tocContent += `  - name: ${procedures[0].name}\n    href: ${filename}\n`;
            });
            if (createTocSetting) {
                const tocFilepath = path.join(objectFolderPath, 'TOC.yml');
                saveContentToFile(tocFilepath, tocContent);
            }
        }
    }
}
function boolToText(bool: boolean) {
    return bool ? 'Yes' : '';
}

function saveContentToFile(filePath: string, fileContent: string) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
    fileContent = fileContent.trimEnd() + '\n';
    fileContent = replaceAll(fileContent, `\n`, '\r\n');
    fs.writeFileSync(filePath, fileContent);
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

