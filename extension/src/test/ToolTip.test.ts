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
            const toolTips = newPage.getAllMultiLanguageObjects({ onlyForTranslation: true, includeCommentedOut: true }).filter(x => x.name === MultiLanguageType[MultiLanguageType.ToolTip]);
            assert.equal(newPage.getAllMultiLanguageObjects({ onlyForTranslation: true }).filter(x => x.name === MultiLanguageType[MultiLanguageType.ToolTip]).length, 0, 'wrong number of tooltips');
            assert.equal(toolTips.length, 7, 'wrong number of commented out tooltips');
            assert.equal(toolTips[0].text, 'Specifies the page field caption', 'Wrong ToolTip 1');
            assert.equal(toolTips[1].text, 'Specifies the myfield', 'Wrong ToolTip 2');
            assert.equal(toolTips[2].text, 'Specifies the functionasfield', 'Wrong ToolTip 3');
            assert.equal(toolTips[3].text, 'Specifies the field no caption', 'Wrong ToolTip 4');
            assert.equal(toolTips[4].text, 'Specifies the my <> & field', 'Wrong ToolTip 4');
            assert.equal(toolTips[5].text, 'Action Caption', 'Wrong ToolTip 5');
            assert.equal(toolTips[6].text, 'ActionNameNoCaption', 'Wrong ToolTip 6');
        }

    });
    test("Suggest ToolTip with Table", async function () {
        this.timeout(10000);
        let alObjects: ALObject[] = new Array();
        addObjectToArray(alObjects, getTable());
        let pageObj = addObjectToArray(alObjects, getPageWithoutToolTips());

        ToolTipsFunctions.addSuggestedTooltips(pageObj);
        if (!pageObj) {
            assert.fail('Updated page is not a valid AL Object');
        } else {
            const toolTips = pageObj.getAllMultiLanguageObjects({ onlyForTranslation: true, includeCommentedOut: true }).filter(x => x.name === MultiLanguageType[MultiLanguageType.ToolTip]);
            assert.equal(pageObj.getAllMultiLanguageObjects({ onlyForTranslation: true }).filter(x => x.name === MultiLanguageType[MultiLanguageType.ToolTip]).length, 0, 'wrong number of tooltips');
            assert.equal(toolTips.length, 7, 'wrong number of commented out tooltips');
            assert.equal(toolTips[0].text, 'Specifies the page field caption', 'Wrong ToolTip 1');
            assert.equal(toolTips[1].text, 'Specifies the my field table caption', 'Wrong ToolTip 2');
            assert.equal(toolTips[2].text, 'Specifies the functionasfield', 'Wrong ToolTip 3');
            assert.equal(toolTips[3].text, 'Specifies the field no caption', 'Wrong ToolTip 4');
            assert.equal(toolTips[4].text, 'Specifies the my <> & field\'\'s', 'Wrong ToolTip 4');
            assert.equal(toolTips[5].text, 'Action Caption', 'Wrong ToolTip 5');
            assert.equal(toolTips[6].text, 'ActionNameNoCaption', 'Wrong ToolTip 6');
        }
    });

});

function addObjectToArray(alObjects: ALObject[], objectAsText: string) {
    let alObj = ALObject.getALObject(objectAsText, true, undefined, alObjects);
    if (!alObj) {
        assert.fail(`Could not find object. ${objectAsText}`);
    }
    alObjects.push(alObj);
    return alObj;
}


function getTable() {
    return `table 50000 "NAB Test Table"
{
    DataClassification = CustomerContent;
    Caption = 'Table', Comment = 'TableComment', MaxLength = 23;

    fields
    {
        field(1; "Test Field"; Option)
        {
            DataClassification = CustomerContent;
            OptionMembers = asdf,er;
            OptionCaption = 'asdf,er', Locked = true;
            Caption = 'Test Field';
        }
        field(2; MyField; Blob)
        {
            Caption = 'My Field Table Caption';
            DataClassification = ToBeClassified;
        }
        field(3; "My <> & Field"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'My <> & Field''s';
        }
        field(4; "Field no Caption"; Decimal)
        {
        }
    }

    keys
    {
        key(PK; "Test Field")
        {
            Clustered = true;
        }
    }
}`;
}
function getPageWithoutToolTips() {
    return `
page 50000 "NAB Test Table Card"
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
                    Caption = 'Page Field Caption';
                    OptionCaption = 'asdf,sadf,____ASADF';

                    trigger OnAssistEdit()
                    var
                        LocalTestLabelTxt: Label 'Local Test Label';

                    begin

                    end;
                }
                field(MyField; "MyField")
                {
                }
                field(FunctionAsField; GetTheValue())
                {
                }
                field(FieldNoCaption; "Field no Caption")
                {
                }
                field(LtGtAmpField; "My <> & Field")
                {
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
                Caption = 'Action Caption';
                ApplicationArea = All;

                trigger OnAction()
                var
                    LocalTestLabelTxt: Label 'Local Test Label';
                begin

                end;
            }
            action(ActionNameNoCaption)
            {
                ApplicationArea = All;
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