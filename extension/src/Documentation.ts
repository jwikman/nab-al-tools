import * as fs from 'fs';
import * as path from 'path';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import { ALObject } from './ALObject/ALObject';
import { ALAccessModifier, ALCodeunitSubtype, ALControlType, ALObjectType, ALPropertyType, DocsType } from './ALObject/Enums';
import { ALProcedure } from './ALObject/ALProcedure';
import { createFolderIfNotExist, deleteFolderRecursive, formatToday, replaceAll } from './Common';
import { isNullOrUndefined } from 'util';
import xmldom = require('xmldom');
import { ALTenantWebService } from './ALObject/ALTenantWebService';
import { Settings, Setting } from "./Settings";
import { ALXmlComment } from './ALObject/ALXmlComment';
import { YamlItem } from './markdown/YamlItem';
import { generateToolTipDocumentation, getAlControlsToPrint, getPagePartText } from './ToolTipsFunctions';
import { kebabCase, snakeCase } from 'lodash';
import { ALControl } from './ALObject/ALControl';
import { ALPagePart } from './ALObject/ALPagePart';
import { ALTableField } from './ALObject/ALTableField';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appPackage = require('../package.json');
const extensionVersion = appPackage.version;
const extensionName = appPackage.displayName;

const objectTypeHeaderMap = new Map<ALObjectType, string>([
    [ALObjectType.codeunit, 'Codeunits'],
    [ALObjectType.table, 'Tables'],
    [ALObjectType.tableExtension, 'Table Extensions'],
    [ALObjectType.page, 'Pages'],
    [ALObjectType.pageExtension, 'Page Extensions'],
    [ALObjectType.report, 'Reports'],
    [ALObjectType.reportExtension, 'Report Extensions'],
    [ALObjectType.interface, 'Interfaces'],
    [ALObjectType.xmlPort, 'XmlPorts'],
    [ALObjectType.query, 'Queries']
]);

export async function generateExternalDocumentation(): Promise<void> {
    const appVersion: string = (Settings.getAppSettings())[Setting.appVersion];
    const createInfoFile: boolean = Settings.getConfigSettings()[Setting.createInfoFileForDocs];
    const createUidForDocs: boolean = Settings.getConfigSettings()[Setting.createUidForDocs];

    const workspaceFolder = WorkspaceFunctions.getWorkspaceFolder();
    const removeObjectNamePrefixFromDocs = Settings.getConfigSettings()[Setting.removeObjectNamePrefixFromDocs];
    let docsRootPathSetting: string = Settings.getConfigSettings()[Setting.docsRootPath];
    const createTocSetting: boolean = Settings.getConfigSettings()[Setting.createTocFilesForDocs];
    const includeTablesAndFieldsSetting: boolean = Settings.getConfigSettings()[Setting.includeTablesAndFieldsInDocs];
    const generateTooltipDocsWithExternalDocsSetting: boolean = Settings.getConfigSettings()[Setting.generateTooltipDocsWithExternalDocs];
    const generateDeprecatedFeaturesPageWithExternalDocsSetting: boolean = Settings.getConfigSettings()[Setting.generateDeprecatedFeaturesPageWithExternalDocs];
    const ignoreTransUnitsSetting: string[] = Settings.getConfigSettings()[Setting.ignoreTransUnitInGeneratedDocumentation];
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

    if (createInfoFile) {
        const infoFilePath = path.join(docsRootPath, 'info.json');
        const info = {
            "generated-date": formatToday(),
            "generator": `${extensionName} v${extensionVersion}`,
            "app-version": appVersion
        };

        const infoJson = JSON.stringify(info, null, 2);
        fs.writeFileSync(infoFilePath, infoJson);
    }


    const tocPath = path.join(docsRootPath, 'TOC.yml');
    const tocItems: YamlItem[] = [];

    let objects: ALObject[] = (await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(true, true, true)).sort((a, b) => {
        if (a.objectType !== b.objectType) {
            return a.objectType.localeCompare(b.objectType);
        }
        return a.objectName.localeCompare(b.objectName);
    });
    objects = objects.filter(obj => !obj.generatedFromSymbol);

    const publicObjects = objects.filter(obj => obj.publicAccess && obj.subtype === ALCodeunitSubtype.normal
        && (((obj.controls.filter(proc => proc.type === ALControlType.procedure
            && ((<ALProcedure>proc).access === ALAccessModifier.public)
            || (<ALProcedure>proc).event).length > 0))
            || (includeTablesAndFieldsSetting && ([ALObjectType.table, ALObjectType.tableExtension].includes(obj.getObjectType()))))
        || ([ALObjectType.page, ALObjectType.pageExtension].includes(obj.getObjectType()) && (!obj.apiObject))
    );

    await generateObjectsDocumentation(docsRootPath, tocItems, publicObjects, removeObjectNamePrefixFromDocs, createTocSetting, ignoreTransUnitsSetting);

    const webServices = await generateWebServicesDocumentation(docsRootPath, objects, tocItems, createTocSetting);
    const apiObjects = await generateApiDocumentation(docsRootPath, objects, tocItems);


    if (generateDeprecatedFeaturesPageWithExternalDocsSetting) {
        generateDeprecatedFeaturesPage(docsRootPath, objects, publicObjects, webServices, apiObjects, tocItems);
    }

    if (createTocSetting) {
        const tocContent = YamlItem.arrayToString(tocItems);
        saveContentToFile(tocPath, tocContent);
    }

    if (generateTooltipDocsWithExternalDocsSetting) {
        generateToolTipDocumentation(objects);
    }

    function generateDeprecatedFeaturesPage(docsRootPath: string, objects: ALObject[], objectsWithPage: ALObject[], webServices: ALTenantWebService[], apiObjects: ALObject[], toc: YamlItem[]): void {
        const filename = "deprecated-features.md";
        const obsoleteIndexPath = path.join(docsRootPath, filename);
        const publicObjects = objects.filter(x => x.publicAccess && (!x.apiObject)).sort((a, b) => {
            if (a.objectType !== b.objectType) {
                return a.objectType.localeCompare(b.objectType);
            }
            return a.name.localeCompare(b.name);
        });
        const headerItem: YamlItem = new YamlItem({ name: 'Deprecated Features', href: filename });
        const subItems: YamlItem[] = [];
        headerItem.items = subItems;
        toc.push(headerItem);
        const header = `# Deprecated Features`;
        let indexContent = '';

        objectTypeHeaderMap.forEach((header: string, type: ALObjectType) => {
            indexContent = generateDeprecatedTable(docsRootPath, type, header, DocsType.public, indexContent, publicObjects, objectsWithPage, subItems);
        });
        const wsObjects: ALObject[] = [];
        webServices.forEach(x => {
            if (!isNullOrUndefined(x.object)) {
                wsObjects.push(x.object);
            }
        });

        objectTypeHeaderMap.forEach((header: string, type: ALObjectType) => {
            indexContent = generateDeprecatedTable(docsRootPath, type, `Web Services ${header}`, DocsType.ws, indexContent, wsObjects, objectsWithPage, subItems, webServices);
        });

        objectTypeHeaderMap.forEach((header: string, type: ALObjectType) => {
            indexContent = generateDeprecatedTable(docsRootPath, type, `API ${header}`, DocsType.api, indexContent, apiObjects, objectsWithPage, subItems, webServices);
        });

        if (indexContent.length === 0) {
            indexContent = `${header}\n\nThere are no deprecated features.\n`;
        } else {
            indexContent = `${header}\n\n${indexContent}`;
        }

        saveContentToFile(obsoleteIndexPath, indexContent);


        function generateDeprecatedTable(docsRootPath: string, alObjectType: ALObjectType, header: string, docsType: DocsType, indexContent: string, objects: ALObject[], objectsWithPage: ALObject[], toc: YamlItem[], webServices?: ALTenantWebService[]): string {
            const filteredObjects = objects.filter(x => x.objectType === alObjectType);
            let tableContent = "";
            let obsoleteControls: ALControl[] = [];
            filteredObjects.forEach(obj => {
                const allControls = obj.getAllControls();
                obsoleteControls = obsoleteControls.concat(allControls.filter(x => x.isObsoletePending(false)));
            });
            if (obsoleteControls.length > 0) {
                const tableFilename = `deprecated-${kebabCase(header)}.md`;
                const objectTypeTocItem: YamlItem = new YamlItem({ name: header, href: tableFilename, items: [] });
                toc.push(objectTypeTocItem);

                tableContent += `| Object | Type | Name | Reason | Deprecated since |\n`;
                tableContent += `| ------ | ---- | ---- | ------ | ---------------- |\n`;
                obsoleteControls.forEach(control => {
                    const object = control.getObject();
                    let entityName;
                    let entityNameText: string;
                    let objText = `${removePrefix(object.name, removeObjectNamePrefixFromDocs)}`;
                    switch (docsType) {
                        case DocsType.api:
                            entityName = object.getPropertyValue(ALPropertyType.entityName);
                            entityNameText = entityName ? entityName : object.name;
                            objText = `[${entityNameText}](${object.getDocsFolderName(docsType)}/index.md)`;
                            break;
                        case DocsType.ws:
                            const ws = webServices?.filter(ws => ws.objectId === object.objectId && ws.objectType === object.objectType)[0];
                            if (!isNullOrUndefined(ws)) {
                                objText = `[${ws.serviceName}](${object.getDocsFolderName(docsType)}/index.md)`;
                            }
                            break;
                        case DocsType.public:
                            if (objectsWithPage.filter(x => x.objectType === object.objectType && x.objectId === object.objectId)[0]) {
                                objText = `[${objText}](${object.getDocsFolderName(docsType)}/index.md)`;
                            }
                            break;
                        default:
                            break;
                    }
                    const obsoleteInfo = control.getObsoletePendingInfo();
                    if (obsoleteInfo) {
                        tableContent += `| ${objText} | ${controlTypeToText(control)} | ${control.name} | ${obsoleteInfo.obsoleteReason} | ${obsoleteInfo.obsoleteTag} |\n`;
                    }
                });
                tableContent += '\n';

                const tableFilePath = path.join(docsRootPath, tableFilename);
                saveContentToFile(tableFilePath, `# Deprecated Features - ${header}\n\n` + tableContent);
                tableContent = `## ${header}\n\n` + tableContent;
            }
            return indexContent + tableContent;
        }

    }
    function controlTypeToText(control: ALControl): string {
        switch (control.type) {
            case ALControlType.pageField:
            case ALControlType.tableField:
            case ALControlType.modifiedPageField:
            case ALControlType.modifiedTableField:
                return 'Field';
            case ALControlType.area:
                return 'Action Group';
            case ALControlType.part:
                return 'Sub page';
            case ALControlType.procedure:
                return (<ALProcedure>control).event ? 'Event' : 'Procedure';
            default:
                return control.type;
        }
    }


    async function generateApiDocumentation(docsRootPath: string, objects: ALObject[], toc: YamlItem[]): Promise<ALObject[]> {
        let apiObjects = objects.filter(o => o.apiObject);
        if (apiObjects.length > 0) {
            const filename = "api-objects.md";
            const wsIndexPath = path.join(docsRootPath, filename);
            const headerItem: YamlItem = new YamlItem({ name: 'API Objects', href: filename });
            const subItems: YamlItem[] = [];
            headerItem.items = subItems;
            toc.push(headerItem);

            apiObjects = apiObjects.sort((a, b) => a.getPropertyValue(ALPropertyType.entityName) + '' < b.getPropertyValue(ALPropertyType.entityName) + '' ? -1 : 1).sort((a, b) => a.objectType < b.objectType ? -1 : 1);


            let indexContent = `# API Objects\n\n`;

            objectTypeHeaderMap.forEach((header: string, type: ALObjectType) => {
                indexContent = generateApiObjectTypeTable(docsRootPath, type, header, indexContent, apiObjects, createTocSetting, subItems);
            });

            saveContentToFile(wsIndexPath, indexContent);

        }
        return apiObjects;

        function generateApiObjectTypeTable(docsRootPath: string, alObjectType: ALObjectType, header: string, indexContent: string, apiObjects: ALObject[], createTocSetting: boolean, toc: YamlItem[]): string {
            const filteredObjects = apiObjects.filter(x => x.objectType === alObjectType);
            let tableContent = "";
            if (filteredObjects.length > 0) {
                const tableFilename = `api-${kebabCase(header)}.md`;
                const objectTypeTocItem: YamlItem = new YamlItem({ name: header, href: tableFilename, items: [] });
                toc.push(objectTypeTocItem);


                if (alObjectType === ALObjectType.page) {
                    tableContent += "| Name | Source Table | Read-only |\n| ----- | ------ | ------ |\n";
                } else {
                    tableContent += "| Name | Description |\n| ----- | ------ |\n";
                }
                filteredObjects.forEach(object => {
                    generateObjectDocumentation(DocsType.api, docsRootPath, object, createTocSetting, ignoreTransUnitsSetting);
                    const entityName = object.getPropertyValue(ALPropertyType.entityName);
                    const entityNameText: string = entityName ? entityName : "(N/A)";
                    if (alObjectType === ALObjectType.page) {
                        tableContent += `| [${entityNameText}](${object.getDocsFolderName(DocsType.api)}/index.md) | ${object.sourceTable} | ${boolToText(object.readOnly)} |\n`;
                    } else {
                        tableContent += `| [${entityNameText}](${object.getDocsFolderName(DocsType.api)}/index.md) | ${object.xmlComment ? ALXmlComment.formatMarkDown({ text: object.xmlComment.summaryShort, inTableCell: true }) : ''} |\n`;
                    }

                    const tocItem: YamlItem = new YamlItem({ name: entityNameText, href: `${object.getDocsFolderName(DocsType.api)}/TOC.yml`, topicHref: `${object.getDocsFolderName(DocsType.api)}/index.md` });
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

    async function generateWebServicesDocumentation(docsRootPath: string, objects: ALObject[], toc: YamlItem[], createTocSetting: boolean): Promise<ALTenantWebService[]> {
        const webServicesFiles = await WorkspaceFunctions.getWebServiceFiles();
        let webServices: ALTenantWebService[] = [];
        webServicesFiles.forEach(w => {
            const dom = xmldom.DOMParser;
            const xml = fs.readFileSync(w.fsPath, "utf8");
            const xmlDom = new dom().parseFromString(xml);
            const tenantWebServices: Element[] = Array.from(xmlDom.getElementsByTagName('TenantWebService'));

            for (let index = 0; index < tenantWebServices.length; index++) {
                const ws = tenantWebServices[index];
                const newWS = ALTenantWebService.fromElement(ws);
                if (newWS) {
                    webServices.push(newWS);
                }
            }
        });
        if (webServices.length > 0) {
            const filename = 'web-services.md';
            const wsIndexPath = path.join(docsRootPath, filename);
            const headerItem: YamlItem = new YamlItem({ name: 'Web Services', href: filename });
            const subItems: YamlItem[] = [];
            headerItem.items = subItems;
            toc.push(headerItem);

            webServices = webServices.sort((a, b) => a.serviceName < b.serviceName ? -1 : 1).sort((a, b) => a.objectType < b.objectType ? -1 : 1);


            let indexContent = `# Web Services\n\n`;
            objectTypeHeaderMap.forEach((header: string, type: ALObjectType) => {
                indexContent = generateWebServicesObjectTypeTable(docsRootPath, objects, type, header, indexContent, webServices, createTocSetting, subItems);
            });

            saveContentToFile(wsIndexPath, indexContent);

        }
        return webServices;

        function generateWebServicesObjectTypeTable(docsRootPath: string, objects: ALObject[], alObjectType: ALObjectType, header: string, indexContent: string, webServices: ALTenantWebService[], createTocSetting: boolean, toc: YamlItem[]): string {
            const filteredWebServices = webServices.filter(x => x.objectType === alObjectType);
            let tableContent = "";
            if (filteredWebServices.length > 0) {
                const tableFilename = `ws-${kebabCase(header)}.md`;
                const objectTypeTocItem: YamlItem = new YamlItem({ name: header, href: tableFilename, items: [] });
                toc.push(objectTypeTocItem);

                if (alObjectType === ALObjectType.page) {
                    tableContent += "| Name | Source Table | Read-only |\n| ----- | ------ | ------ |\n";
                } else {
                    tableContent += "| Name | Description |\n| ----- | ------ |\n";
                }
                filteredWebServices.forEach(ws => {
                    const object = objects.filter(o => o.objectType === ws.objectType && o.objectId === ws.objectId)[0];
                    if (object) {
                        ws.object = object;
                        generateObjectDocumentation(DocsType.ws, docsRootPath, object, createTocSetting, ignoreTransUnitsSetting);
                        if (alObjectType === ALObjectType.page) {
                            tableContent += `| [${ws.serviceName}](${object.getDocsFolderName(DocsType.ws)}/index.md) | ${object.sourceTable} | ${boolToText(object.readOnly)} |\n`;
                        } else {
                            tableContent += `| [${ws.serviceName}](${object.getDocsFolderName(DocsType.ws)}/index.md) | ${object.xmlComment ? ALXmlComment.formatMarkDown({ text: object.xmlComment.summaryShort, inTableCell: true }) : ''} |\n`;
                        }

                        const tocItem: YamlItem = new YamlItem({ name: ws.serviceName, href: `${object.getDocsFolderName(DocsType.ws)}/TOC.yml`, topicHref: `${object.getDocsFolderName(DocsType.ws)}/index.md` });
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

    async function generateObjectsDocumentation(docsRootPath: string, toc: YamlItem[], publicObjects: ALObject[], removeObjectNamePrefixFromDocs: string, createTocSetting: boolean, ignoreTransUnitsSetting: string[]): Promise<void> {
        if (publicObjects.length > 0) {
            const filename = 'public-objects.md';
            const indexPath = path.join(docsRootPath, filename);
            let indexContent = "";
            const headerItem: YamlItem = new YamlItem({ name: 'Public Objects', href: filename });
            const subItems: YamlItem[] = [];
            headerItem.items = subItems;
            toc.push(headerItem);


            indexContent += `# Public Objects\n\n`;
            objectTypeHeaderMap.forEach((header: string, type: ALObjectType) => {
                indexContent = generateObjectTypeIndex(docsRootPath, publicObjects, indexContent, subItems, removeObjectNamePrefixFromDocs, type, header);
            });
            saveContentToFile(indexPath, indexContent);

            publicObjects.forEach(object => {
                generateObjectDocumentation(DocsType.public, docsRootPath, object, createTocSetting, ignoreTransUnitsSetting);
            });
        }

        function generateObjectTypeIndex(docsRootPath: string, publicObjects: ALObject[], indexContent: string, toc: YamlItem[], removeObjectNamePrefixFromDocs: string, alObjectType: ALObjectType, header: string): string {
            const filteredObjects = publicObjects.filter(x => x.objectType === alObjectType);
            let tableContent = "";
            if (filteredObjects.length > 0) {
                const tableFilename = `${kebabCase(header)}.md`;
                const objectTypeTocItem: YamlItem = new YamlItem({ name: header, href: tableFilename, items: [] });
                toc.push(objectTypeTocItem);

                if (alObjectType === ALObjectType.page) {
                    tableContent += "| Name | Source Table | Read-only |\n| ----- | ------ | ------ |\n";
                } else if ([ALObjectType.pageExtension, ALObjectType.tableExtension].includes(alObjectType)) {
                    tableContent += "| Name | Extends |\n| ----- | ------ |\n";
                } else {
                    tableContent += "| Name | Description |\n| ----- | ------ |\n";
                }
                filteredObjects.forEach(object => {
                    if (alObjectType === ALObjectType.page) {
                        tableContent += `| [${removePrefix(object.name, removeObjectNamePrefixFromDocs)}](${object.getDocsFolderName(DocsType.public)}/index.md) | ${object.sourceTable} | ${boolToText(object.readOnly)} |\n`;
                    } else if ([ALObjectType.pageExtension, ALObjectType.tableExtension].includes(alObjectType)) {
                        tableContent += `| [${removePrefix(object.name, removeObjectNamePrefixFromDocs)}](${object.getDocsFolderName(DocsType.public)}/index.md) | ${object.extendedObjectName} |\n`;
                    } else {
                        tableContent += `| [${removePrefix(object.name, removeObjectNamePrefixFromDocs)}](${object.getDocsFolderName(DocsType.public)}/index.md) | ${object.xmlComment?.summary ? ALXmlComment.formatMarkDown({ text: object.xmlComment.summaryShort, inTableCell: true }) : ''} |\n`;
                    }
                    const tocItem: YamlItem = new YamlItem({ name: removePrefix(object.name, removeObjectNamePrefixFromDocs), href: `${object.getDocsFolderName(DocsType.public)}/TOC.yml`, topicHref: `${object.getDocsFolderName(DocsType.public)}/index.md` });
                    objectTypeTocItem.items?.push(tocItem);
                });
                tableContent += `\n`;

                const tableFilePath = path.join(docsRootPath, tableFilename);
                saveContentToFile(tableFilePath, `# Public ${header}\n\n` + tableContent);
                tableContent = `## ${header}\n\n` + tableContent;
            }
            return indexContent + tableContent;
        }

    }

    function generateObjectDocumentation(pageType: DocsType, docsRootPath: string, object: ALObject, createTocSetting: boolean, ignoreTransUnitsSetting: string[]): void {
        const proceduresMap: Map<string, ALProcedure[]> = new Map();
        const objDocsFolderName = object.getDocsFolderName(pageType);
        const objectFolderPath = path.join(docsRootPath, objDocsFolderName);

        createFolderIfNotExist(objectFolderPath);

        const objectIndexPath = path.join(objectFolderPath, 'index.md');
        let objectIndexContent = '';
        objectIndexContent += `# ${removePrefix(object.objectName, removeObjectNamePrefixFromDocs)}\n\n`;
        if (object.xmlComment?.summary) {
            objectIndexContent += `${ALXmlComment.formatMarkDown({ text: object.xmlComment.summary })}\n\n`;
        }

        // Obsolete Info
        const obsoletePendingInfo = object.getObsoletePendingInfo();
        if (obsoletePendingInfo) {
            objectIndexContent += `## <a name="deprecated"></a>Deprecated\n\n`;
            objectIndexContent += `*This object is deprecated and should not be used.*\n\n`;
            objectIndexContent += `**Reason:** ${obsoletePendingInfo.obsoleteReason?.trimEnd()}  \n`;
            objectIndexContent += `**Deprecated since:** ${obsoletePendingInfo.obsoleteTag?.trimEnd()}\n\n`;
        }

        objectIndexContent += `## Object Definition\n\n`;
        let rowsContent = '';

        rowsContent += tr(td(b('Object Type')) + td(object.objectType));
        if (object.objectId !== 0) {
            // Interfaces has no Object ID
            rowsContent += tr(td(b('Object ID')) + td(object.objectId.toString()));
        }
        rowsContent += tr(td(b('Object Name')) + td(object.objectName));
        if (object.objectType === ALObjectType.page) {
            rowsContent += tr(td(b('Source Table')) + td(object.sourceTable));
            if (object.readOnly) {
                rowsContent += tr(td(b('Read-only')) + td(object.readOnly.toString()));
            }
        }

        if ([ALObjectType.pageExtension, ALObjectType.tableExtension].includes(object.objectType)) {
            rowsContent += tr(td(b('Extends')) + td(object.extendedObjectName || '')); // Hack to convert undefined to string
        }

        objectIndexContent += table(rowsContent);

        if (pageType === DocsType.api) {
            objectIndexContent += `## API Definition\n\n`;
            objectIndexContent += table(
                tr(td(b('APIPublisher')) + td(object.getPropertyValue(ALPropertyType.apiPublisher) || '')) +
                tr(td(b('APIGroup')) + td(object.getPropertyValue(ALPropertyType.apiGroup) || '')) +
                tr(td(b('APIVersion')) + td(object.getPropertyValue(ALPropertyType.apiVersion) || '')) +
                tr(td(b('EntitySetName')) + td(object.getPropertyValue(ALPropertyType.entitySetName) || '')) +
                tr(td(b('EntityName')) + td(object.getPropertyValue(ALPropertyType.entityName) || ''))
            );
            objectIndexContent += '\n';
        }

        const publicProcedures: ALProcedure[] = <ALProcedure[]>object.controls.filter(x => x.type === ALControlType.procedure && (<ALProcedure>x).access === ALAccessModifier.public && !x.isObsolete() && !(<ALProcedure>x).event).sort();
        const publicEvents: ALProcedure[] = <ALProcedure[]>object.controls.filter(x => x.type === ALControlType.procedure && !x.isObsolete() && (<ALProcedure>x).event).sort();


        objectIndexContent += getProcedureTable("Procedures", publicProcedures, proceduresMap);
        objectIndexContent += getProcedureTable("Events", publicEvents, proceduresMap);

        if (object.xmlComment?.remarks) {
            objectIndexContent += `## Remarks\n\n`;
            objectIndexContent += `${ALXmlComment.formatMarkDown({ text: object.xmlComment?.remarks })}\n\n`;
        }

        if (object.xmlComment?.example) {
            objectIndexContent += `## Example\n\n`;
            objectIndexContent += `${ALXmlComment.formatMarkDown({ text: object.xmlComment?.example })}\n\n`;
        }

        if ([ALObjectType.table, ALObjectType.tableExtension].includes(object.objectType)) {
            const fields = (object.controls.filter(o => o.type === ALControlType.tableField) as ALTableField[]).filter(o => !o.isObsoletePending() && !o.isObsolete());
            if (fields.length > 0) {
                objectIndexContent += `## Fields\n\n`;
                objectIndexContent += '| Number | Name | Type |\n';
                objectIndexContent += '| ---- | ------- | ----------- |\n';
                fields.forEach(field => {
                    objectIndexContent += `| ${field.id} | ${field.name} | ${field.dataType} |\n`;
                });
                objectIndexContent += '\n';
            }
        }
        if ([ALObjectType.page, ALObjectType.pageExtension].includes(object.objectType)) {
            let controls = getAlControlsToPrint(object, ignoreTransUnitsSetting);
            controls = controls.filter(c => !c.isObsoletePending(false));

            if (controls.length > 0) {
                objectIndexContent += `## Controls\n\n`;
                objectIndexContent += '| Type | Caption | Description |\n';
                objectIndexContent += '| ---- | ------- | ----------- |\n';
                controls.forEach(control => {
                    const toolTipText = control.toolTip;
                    const controlCaption = control.caption.trim();
                    if (control.type === ALControlType.part) {
                        if (getPagePartText(<ALPagePart>control, true) !== '') {
                            objectIndexContent += `| ${controlTypeToText(control)} | ${controlCaption} | ${getPagePartText(<ALPagePart>control, true)} |\n`;
                        }
                    } else {
                        objectIndexContent += `| ${controlTypeToText(control)} | ${controlCaption} | ${toolTipText} |\n`;
                    }
                });
                objectIndexContent += '\n';
            }

        }

        if (!obsoletePendingInfo) {
            const allControls = object.getAllControls();
            const obsoleteControls = allControls.filter(x => x.isObsoletePending(false) && x.type !== ALControlType.procedure);
            if (obsoleteControls.length > 0) {
                objectIndexContent += `## Deprecated Controls\n\n`;
                objectIndexContent += `| Type | Name | Reason | Deprecated since |\n`;
                objectIndexContent += `| ---- | ---- | ------ | ---------------- |\n`;
                obsoleteControls.forEach(control => {
                    const obsoleteInfo = control.getObsoletePendingInfo();
                    if (obsoleteInfo) {

                        objectIndexContent += `| ${controlTypeToText(control)} | ${control.name} | ${obsoleteInfo.obsoleteReason} | ${obsoleteInfo.obsoleteTag} |\n`;
                    }
                });
            }
            objectIndexContent += '\n';

        }

        saveContentToFile(objectIndexPath, objectIndexContent, objDocsFolderName, `${object.objectType} ${removePrefix(object.objectName, removeObjectNamePrefixFromDocs)}`);

        generateProcedurePages(proceduresMap, object, objectFolderPath, createTocSetting, objDocsFolderName);

        function getProcedureTable(header: string, procedures: ALProcedure[], proceduresMap: Map<string, ALProcedure[]>): string {
            let tableContent = '';
            const activeProcedures = procedures.filter(p => !p.obsoletePending);
            const deprecatedProcedures = procedures.filter(p => p.obsoletePending);
            tableContent = getProcedureTableInner(header, activeProcedures, tableContent);
            tableContent = getProcedureTableInner(`Deprecated ${header}`, deprecatedProcedures, tableContent, 3);

            return tableContent;

            function getProcedureTableInner(header: string, procedures: ALProcedure[], tableContent: string, headerLevel = 2): string {
                if (procedures.length > 0) {
                    tableContent += `${''.padEnd(headerLevel, "#")} ${header}\n\n`;
                    tableContent += "| Name | Description |\n| ----- | ------ |\n";
                }
                procedures.forEach(procedure => {
                    tableContent += `| [${procedure.toString(false)}](${procedure.docsLink}) | ${procedure.xmlComment ? ALXmlComment.formatMarkDown({ text: procedure.xmlComment.summaryShort, inTableCell: true }) : ''} |\n`;

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
        }

        function generateProcedurePages(proceduresMap: Map<string, ALProcedure[]>, object: ALObject, objectFolderPath: string, createTocSetting: boolean, parentUid: string): void {
            let tocContent = "items:\n";
            proceduresMap.forEach((procedures, filename) => {

                let procedureFileContent = '';
                const overloads: boolean = procedures.length > 1;
                if (overloads) {
                    procedureFileContent += `# ${procedures[0].name} Procedure\n\n`;
                    procedureFileContent += `[${object.objectType} ${removePrefix(object.objectName, removeObjectNamePrefixFromDocs)}](index.md)\n\n`;
                    const firstProcWithSummary = procedures.filter(x => !isNullOrUndefined(x.xmlComment?.summary) && x.xmlComment?.summary.trim() !== '')[0];
                    if (firstProcWithSummary?.xmlComment?.summary) {
                        if (firstProcWithSummary.xmlComment.summary !== '') {
                            procedureFileContent += `${ALXmlComment.formatMarkDown({ text: firstProcWithSummary.xmlComment.summary })}\n\n`;
                        }
                    }

                    procedureFileContent += `## Overloads\n\n`;
                    procedureFileContent += "| Name | Description |\n| ----- | ------ |\n";
                    procedures.forEach(procedure => {
                        procedureFileContent += `| [${procedure.toString(false)}](#${procedure.docsAnchor}) | ${procedure.xmlComment?.summary ? ALXmlComment.formatMarkDown({ text: procedure.xmlComment.summaryShort, inTableCell: true }) : ''} |\n`;
                    });
                    procedureFileContent += `\n`;
                }
                procedures.forEach(procedure => {

                    // Overload sample: https://docs.microsoft.com/en-us/dotnet/api/system.array.binarysearch?view=net-5.0#System_Array_BinarySearch_System_Array_System_Object_
                    let anchorPrefix = "";
                    // Write procedure page
                    if (overloads) {
                        anchorPrefix = `${procedure.docsAnchor}_`;
                        procedureFileContent += `## <a name="${procedure.docsAnchor}"></a>${procedure.toString(false, true)} Procedure\n\n`;
                    } else {
                        procedureFileContent += `# <a name="${procedure.docsAnchor}"></a>${procedure.name} ${procedure.event ? 'Event' : 'Procedure'}\n\n`;
                        procedureFileContent += `[${object.objectType} ${removePrefix(object.objectName, removeObjectNamePrefixFromDocs)}](index.md)\n\n`;
                    }
                    if (procedure.xmlComment?.summary) {
                        procedureFileContent += `${ALXmlComment.formatMarkDown({ text: procedure.xmlComment.summary, anchorPrefix: anchorPrefix })}\n\n`;
                    }

                    // Obsolete Info
                    const obsoletePendingInfo = procedure.getObsoletePendingInfo();
                    if (obsoletePendingInfo) {
                        procedureFileContent += `${overloads ? "#" : ""}## <a name="${anchorPrefix}deprecated"></a>Deprecated\n\n`;
                        procedureFileContent += `*This ${procedure.event ? 'event' : 'procedure'} is deprecated and should not be used.*\n\n`;
                        procedureFileContent += `**Reason:** ${obsoletePendingInfo.obsoleteReason?.trimEnd()}  \n`;
                        procedureFileContent += `**Deprecated since:** ${obsoletePendingInfo.obsoleteTag?.trimEnd()}\n\n`;
                    }
                    // Signature
                    procedureFileContent += `${overloads ? "#" : ""}## <a name="${anchorPrefix}signature"></a>Signature\n\n`;
                    procedureFileContent += codeBlock(procedure.toString(true));

                    // Parameters
                    if (procedure.parameters.length > 0) {
                        procedureFileContent += `${overloads ? "#" : ""}## <a name="${anchorPrefix}parameters"></a>Parameters\n\n`;
                        procedure.parameters.forEach(param => {
                            procedureFileContent += `${overloads ? "#" : ""}### <a name="${anchorPrefix}${param.name}"></a>${param.byRef ? 'var ' : ''}\`${param.name}\`  ${param.fullDataType}\n\n`;
                            const paramXmlDoc = procedure.xmlComment?.parameters.filter(p => p.name === param.name)[0];
                            if (paramXmlDoc) {
                                if (paramXmlDoc.description.trim().length > 0) {
                                    procedureFileContent += `${ALXmlComment.formatMarkDown({ text: paramXmlDoc.description, anchorPrefix: anchorPrefix })}\n\n`;
                                }
                            }
                        });
                    }
                    // Return value
                    if (procedure.returns) {
                        procedureFileContent += `${overloads ? "#" : ""}## <a name="${anchorPrefix}returns"></a>Returns\n\n`;
                        procedureFileContent += `${procedure.returns.fullDataType}\n\n`;
                        if (procedure.xmlComment?.returns) {
                            procedureFileContent += `${ALXmlComment.formatMarkDown({ text: procedure.xmlComment.returns, anchorPrefix: anchorPrefix })}\n\n`;
                        }
                    }
                    // Remarks
                    if (procedure.xmlComment?.remarks) {
                        procedureFileContent += `${overloads ? "#" : ""}## <a name="${anchorPrefix}remarks"></a>Remarks\n\n`;
                        procedureFileContent += `${ALXmlComment.formatMarkDown({ text: procedure.xmlComment?.remarks, anchorPrefix: anchorPrefix })}\n\n`;
                    }
                    // Example
                    if (procedure.xmlComment?.example) {
                        procedureFileContent += `${overloads ? "#" : ""}## <a name="${anchorPrefix}example"></a>Example\n\n`;
                        procedureFileContent += `${ALXmlComment.formatMarkDown({ text: procedure.xmlComment?.example, anchorPrefix: anchorPrefix })}\n\n`;
                    }

                });

                const procedureFilepath = path.join(objectFolderPath, filename);
                const uid = `${parentUid}-${kebabCase(procedures[0].name)}`;
                saveContentToFile(procedureFilepath, procedureFileContent, uid);
                tocContent += `  - name: ${procedures[0].name}\n    href: ${filename}\n`;
            });
            if (createTocSetting) {
                const tocFilepath = path.join(objectFolderPath, 'TOC.yml');
                saveContentToFile(tocFilepath, tocContent);
            }
        }
    }

    function saveContentToFile(filePath: string, fileContent: string, uid?: string, title?: string): void {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        const createUid: boolean = createUidForDocs && !isNullOrUndefined(uid);
        const createHeader = (createUid || !isNullOrUndefined(title)) && filePath.toLowerCase().endsWith('.md');
        let headerValue = '';
        if (createHeader) {
            headerValue = '---\n';
        }
        if (createUid) {
            headerValue += `uid: ${snakeCase(uid)}\n`; // snake_case since it's being selected on double-click in VSCode
        }
        if (!isNullOrUndefined(title)) {
            headerValue += `title: ${title}\n`;
        }
        if (createHeader) {
            headerValue += '---\n';
            fileContent = headerValue + fileContent;
        }

        fileContent = fileContent.trimEnd() + '\n';
        fileContent = replaceAll(fileContent, `\n`, '\r\n');
        fs.writeFileSync(filePath, fileContent);
    }
}
function boolToText(bool: boolean): string {
    return bool ? 'Yes' : '';
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


function codeBlock(code: string): string {
    let result = '```javascript\n';
    result += code;
    result += '\n```\n\n';
    return result;
}

function table(innerHtml: string): string {
    return `${tag('table', innerHtml, true)}\n`;
}
function tr(innerHtml: string): string {
    return `${tag('tr', innerHtml)}\n`;
}
function td(innerHtml: string): string {
    return tag('td', innerHtml);
}
function b(innerHtml: string): string {
    return tag('b', innerHtml);
}

function tag(tag: string, innerHtml: string, addNewLines = false): string {
    const newLine = addNewLines ? '\n' : '';
    return `<${tag}>${newLine}${innerHtml}</${tag}>${newLine}`;
}