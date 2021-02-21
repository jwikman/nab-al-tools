import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as WorkspaceFunctions from './WorkspaceFunctions';
import { ALObject } from './ALObject/ALObject';
import { ALAccessModifier, ALControlType, ALObjectType } from './ALObject/Enums';
import { ALProcedure } from './ALObject/ALProcedure';

export async function generateExternalDocumentation() {
    let objects: ALObject[] = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(true);
    // let text = getToolTipDocumentation(objects);(
    let workspaceFolder = WorkspaceFunctions.getWorkspaceFolder();
    const docsRootPath = path.join(workspaceFolder.uri.fsPath, 'docs');
    createFolderIfNotExist(docsRootPath); // TODO: Radera mapp om den finns

    const codeunitDocsPath = path.join(docsRootPath, 'codeunit');
    createFolderIfNotExist(codeunitDocsPath);
    const publicCodeunits = objects.filter(x => x.objectType === ALObjectType.Codeunit && x.publicAccess);

    publicCodeunits.forEach(object => {
        const objectFolderPath = path.join(codeunitDocsPath, _.kebabCase(object.objectName));
        createFolderIfNotExist(objectFolderPath);

        const indexPath = path.join(objectFolderPath, 'index.md');
        let indexContent: string = '';
        indexContent += `# ${object.objectName}\n\n`;
        if (object.xmlComment?.summary) {
            indexContent += `${object.xmlComment?.summary}\n\n`;
        }
        indexContent += `## Object ID\n\n`;
        indexContent += `${object.objectId}\n\n`;

        let publicProcedures: ALProcedure[] = <ALProcedure[]>object.controls.filter(x => x.type === ALControlType.Procedure && (<ALProcedure>x).access === ALAccessModifier.public && !(<ALProcedure>x).event).sort();

        if (publicProcedures.length > 0) {
            indexContent += "## Methods\n\n";
            indexContent += "| Name | Description |\n|-----|------|\n";
        }
        publicProcedures.forEach(procedure => {
            indexContent += `| [${procedure.toString(false)}](${procedure.filename}) |${procedure.xmlComment?.summary}|\n`;
            // TODO: append overloads on same page
            // Write procedure page
            let procedureContent = '';
            procedureContent += `# ${procedure.name} Method\n\n`;
            procedureContent += `[${object.objectType} ${object.objectName}](index.md)\n\n`;
            if (procedure.xmlComment?.summary) {
                procedureContent += `${procedure.xmlComment.summary}\n\n`;
            }
            // Signature
            procedureContent += codeBlock(procedure.toString(true));

            // Parameters
            if (procedure.parameters.length > 0) {
                procedureContent += `## Parameters\n\n`;
                procedure.parameters.forEach(param => {
                    procedureContent += `**${param.name}** ${param.fullDataType}\n`;
                    let paramXmlDoc = procedure.xmlComment?.parameters.filter(p => p.name === param.name)[0];
                    if (paramXmlDoc) {
                        procedureContent += `${paramXmlDoc.description}\n\n`;
                    }

                });
            }
            // Return value
            if (procedure.returns) {
                procedureContent += `## Returns\n\n`;
                procedureContent += `${procedure.returns.fullDataType}\n\n`;
                if (procedure.xmlComment?.returns) {
                    procedureContent += `${procedure.xmlComment.returns}\n\n`;
                }
            }
            // Remarks
            if (procedure.xmlComment?.remarks) {
                procedureContent += `## Remarks\n\n`;
                procedureContent += `${procedure.xmlComment?.remarks}\n\n`;
            }
            // Example
            if (procedure.xmlComment?.example) {
                procedureContent += `## Example\n\n`;
                procedureContent += codeBlock(procedure.xmlComment?.example);
            }

            const procedureFilepath = path.join(objectFolderPath, procedure.filename);
            fs.writeFileSync(procedureFilepath, procedureContent);
        });

        if (object.xmlComment?.remarks) {
            indexContent += `## Remarks\n\n`;
            indexContent += `${object.xmlComment?.remarks}\n\n`;
        }
        fs.writeFileSync(indexPath, indexContent);

    });
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

