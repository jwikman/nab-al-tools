import * as assert from 'assert';
import * as ToolTipsFunctions from '../ToolTipsFunctions';
import * as vscode from 'vscode';
import { ALObject } from '../ALObject/ALObject';
import * as ToolTipLibrary from './ToolTipLibrary';
import * as fs from 'fs';
import * as path from 'path';
import { MultiLanguageType } from '../ALObject/Enums';
const testResourcesPath = '../../src/test/resources/';
const tempResourcePath = path.resolve(__dirname, testResourcesPath, 'temp/');

suite("ToolTip", function () {
    test("Generate ToolTip Docs", function () {
        let alObjects: ALObject[] = new Array();
        addObjectToArray(alObjects, ToolTipLibrary.getTable());
        addObjectToArray(alObjects, ToolTipLibrary.getTableExtension());
        addObjectToArray(alObjects, ToolTipLibrary.getPageExt());
        addObjectToArray(alObjects, ToolTipLibrary.getPagePart());
        addObjectToArray(alObjects, ToolTipLibrary.getPagePart2());
        addObjectToArray(alObjects, ToolTipLibrary.getPage());
        let text = ToolTipsFunctions.getToolTipDocumentation(alObjects);
        text = text.replace(/(\r\n|\n)/gm, '\n');
        assert.equal(text, `# Pages Overview

## Pages

### NAB ToolTip Part 2

| Type | Caption | Description |
| ----- | --------- | ------- |
| Field | Field 1 | Specifies the value of the Field 1 field |
| Field | Field 2 | Specifies the value of the Field 2 field |
| Field | Field 3 | Specifies the value of the Field 3 field |

### NAB ToolTips

| Type | Caption | Description |
| ----- | --------- | ------- |
| Field | PK | Specifies the value of the PK field |
| Field | Field 1 | Specifies the value of the Field 1 field |
| Field | Field 2 | Specifies the value of the Field 2 field |
| Field | Field 3 | Specifies the value of the Field 3 |
| Sub page | NAB ToolTip Part 2 | [NAB ToolTip Part 2](#nab-tooltip-part-2) |
`);
    });

    test("Suggest ToolTip", async function () {
        this.timeout(10000);
        const pageContent = getPageWithoutToolTips();
        const tempFilePath = path.resolve(tempResourcePath, 'page.al');

        const documentUri = vscode.Uri.file(tempFilePath);
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        fs.writeFileSync(tempFilePath, pageContent, "utf8");
        await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(documentUri));
        await ToolTipsFunctions.suggestToolTips();
        await vscode.window.activeTextEditor?.document.save();
        const newPageContent = fs.readFileSync(tempFilePath, 'utf8');
        const newPage = ALObject.getALObject(newPageContent, true);
        if (!newPage) {
            assert.fail('Updated page is not a valid AL Object');
        } else {
            assert.equal(newPage.getAllMultiLanguageObjects({ onlyForTranslation: true }).filter(x => x.name === MultiLanguageType[MultiLanguageType.ToolTip]).length, 0, 'wrong number of tooltips');
            assert.equal(newPage.getAllMultiLanguageObjects({ onlyForTranslation: true, includeCommentedOut: true }).filter(x => x.name === MultiLanguageType[MultiLanguageType.ToolTip]).length, 3, 'wrong number of commented out tooltips');
        }

    });


});

function addObjectToArray(alObjects: ALObject[], objectAsText: string) {
    let alObj = ALObject.getALObject(objectAsText, true, undefined, alObjects);
    if (!alObj) {
        assert.fail(`Could not find object. ${objectAsText}`);
    }
    alObjects.push(alObj);
}


function getPageWithoutToolTips() {
    return `
page 50000 "NAB Test Table"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Administration;
    SourceTable = "NAB Test Table";
    Caption = 'Page Caption';
    InstructionalText = 'Instructions';
    PromotedActionCategories = 'asdf,erewf';

    layout
    {
        area(Content)
        {
            group(GroupName)
            {
                Caption = 'Grp';
                InstructionalText = 'Instruction';
                field(Name; "asdf")
                {
                    ApplicationArea = All;
                    Caption = 'Field';
                    OptionCaption = 'asdf,sadf,____ASADF';

                    trigger OnAssistEdit()
                    var
                        LocalTestLabelTxt: Label 'Local Test Label';

                    begin

                    end;
                }
                field(MyField; "MyField")
                {
                    Caption = 'MyField';
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(ActionName)
            {
                Caption = 'Action';
                ApplicationArea = All;

                trigger OnAction()
                var
                    LocalTestLabelTxt: Label 'Local Test Label';
                begin

                end;
            }
        }
    }
    procedure TestMethodPage()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    var
        GlobalTestLabelTxt: Label 'Global Test Label';
        asdf: Option;
}`;
}