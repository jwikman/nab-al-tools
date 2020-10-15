//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from 'vscode';
import * as AlFunctions from '../AlFunctions';
import * as ALObject from '../ALObject';
import * as ALObjectTestLibrary from './ALObjectTestLibrary';


// Defines a Mocha test suite to group tests of similar kind together
suite("AL Functions Tests", function () {

    // Defines a Mocha unit test
    test("Valid Object Desriptors", function () {
        let objectDescriptorArr = ALObjectTestLibrary.getValidObjectDescriptors();
        for (let index = 0; index < objectDescriptorArr.length; index++) {
            const item = objectDescriptorArr[index];
            let obj = new ALObject.ALObject(item.ObjectDescriptor,false);
            assert.equal(obj.objectName,item.ObjectName);
            
        }
    });
    test("Invalid Object Desriptors", function () {
        let objectDescriptorArr = ALObjectTestLibrary.getInvalidObjectDescriptors();
        for (let index = 0; index < objectDescriptorArr.length; index++) {
            const item = objectDescriptorArr[index];
            let obj = null;
            try {
                obj = new ALObject.ALObject(item,false);
            } catch (error) {
                // console.log('Item: ', item,'\nError:', error);
            }
            if (obj !== null) {
                assert.fail('Object should fail. Name:' + obj.objectName);
            }
        }
    });

    test("AL Fnv", function () {
        assert.equal(AlFunctions.alFnv('MyPage'), 2931038265, 'Value: MyPage');
        assert.equal(AlFunctions.alFnv('ActionName'), 1692444235, 'Value: ActionName');
        assert.equal(AlFunctions.alFnv('OnAction'), 1377591017, 'Value: OnAction');
        assert.equal(AlFunctions.alFnv('TestOnActionErr'), 2384180296, 'Value: TestOnActionErr');
        assert.equal(AlFunctions.alFnv('TestProcLocal'), 1531128287, 'Value: TestProcLocal');
        assert.equal(AlFunctions.alFnv('MyFieldOption'), 2443090863, 'Value: MyFieldOption');
        assert.equal(AlFunctions.alFnv('OptionCaption'), 62802879, 'Value: OptionCaption');
        assert.equal(AlFunctions.alFnv('MyTable'), 2328808854, 'Value: MyTable');
        assert.equal(AlFunctions.alFnv('MyField'), 1296262074, 'Value: MyField');
        // assert.equal(, AlFunctions.AlFnv(''),'Value: ');
    });

    test("XliffIdToken from Text", function () {
        const idConst = 'Table 3999920088 - Field 1446865707 - Property 2879900210';
        const noteConst = 'Table QWESP Chargeab. Chart Setup - Field Period Length - Property Caption';
        let result = ALObject.XliffIdToken.getXliffIdTokenArray(idConst, noteConst);
        let fullIdArr = idConst.split(' ');
        fullIdArr = fullIdArr.filter(x => x !== '-');
        let typeArr = fullIdArr.filter(x => isNaN(Number(x)));
        let idArr = fullIdArr.filter(x => !isNaN(Number(x)));

        for (let index = 0; index < result.length; index++) {
            const token = result[index];
            assert.equal(typeArr[index], token.type, 'Type not the same');
            assert.equal(idArr[index], token.id, 'Id not the same');
        }

    });


    test("AL Table Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getTable(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);
        let i: { i: number } = { i: 0 };

        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854', 'Table MyTable');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Field 1296262074', 'Table MyTable - Field MyField');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Field 1296262074 - Property 2879900210', 'Table MyTable - Field MyField - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Field 1296262074 - Method 2126772001', 'Table MyTable - Field MyField - Method OnValidate');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064', 'Table MyTable - Field MyField - Method OnValidate - NamedType TestOnValidateErr');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Field 3945078064', 'Table MyTable - Field MyField2');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Field 3945078064 - Property 2879900210', 'Table MyTable - Field MyField2 - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Field 2443090863', 'Table MyTable - Field MyFieldOption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Field 2443090863 - Property 2879900210', 'Table MyTable - Field MyFieldOption - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Field 2443090863 - Property 62802879', 'Table MyTable - Field MyFieldOption - Property OptionCaption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - NamedType 12557645', 'Table MyTable - NamedType TestErr');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Method 2451657066', 'Table MyTable - Method OnInsert');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Method 1262666395', 'Table MyTable - Method OnModify');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Method 3152277940', 'Table MyTable - Method OnDelete');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Method 804474859', 'Table MyTable - Method OnRename');
    });

    test("AL Page Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getPage(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);
        let i: { i: number } = { i: 0 };
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265', 'Page MyPage');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265', 'Page MyPage');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Control 4105281732', 'Page MyPage - Control GroupName');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Control 4105281732 - Property 2879900210', 'Page MyPage - Control GroupName - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Control 4105281732 - Property 1968111052', 'Page MyPage - Control GroupName - Property InstructionalText');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Control 2961552353', 'Page MyPage - Control Name');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Control 2961552353 - Property 2879900210', 'Page MyPage - Control Name - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Control 2961552353 - Property 1295455071', 'Page MyPage - Control Name - Property ToolTip');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Control 3945078064', 'Page MyPage - Control MyField2');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Control 2443090863', 'Page MyPage - Control MyFieldOption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Control 2443090863 - Property 62802879', 'Page MyPage - Control MyFieldOption - Property OptionCaption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265', 'Page MyPage');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Action 1692444235', 'Page MyPage - Action ActionName');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Action 1692444235 - Method 1377591017', 'Page MyPage - Action ActionName - Method OnAction');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Action 1692444235 - Method 1377591017 - NamedType 2384180296', 'Page MyPage - Action ActionName - Method OnAction - NamedType TestOnActionErr');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - NamedType 12557645', 'Page MyPage - NamedType TestErr');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Method 3998599243', 'Page MyPage - Method MyProcedure');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2931038265 - Method 3998599243 - NamedType 1531128287', 'Page MyPage - Method MyProcedure - NamedType TestProcLocal');
    });



    test("AL Codeunit Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getCodeunit(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);
        let i: { i: number } = { i: 0 };
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Codeunit 456387620', 'Codeunit NAB Test Codeunit');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Codeunit 456387620 - Method 1665861916', 'Codeunit NAB Test Codeunit - Method OnRun');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Codeunit 456387620 - Method 1665861916 - NamedType 1061650423', 'Codeunit NAB Test Codeunit - Method OnRun - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Codeunit 456387620 - Method 1968185403', 'Codeunit NAB Test Codeunit - Method TestMethod');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Codeunit 456387620 - Method 1968185403 - NamedType 1061650423', 'Codeunit NAB Test Codeunit - Method TestMethod - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Codeunit 456387620 - NamedType 2688233357', 'Codeunit NAB Test Codeunit - NamedType GlobalTestLabelTxt');
    });

    test("AL Query Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getQuery(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);
        let i: { i: number } = { i: 0 };
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Query 3258925707', 'Query NAB Test Query');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Query 3258925707 - Property 2879900210', 'Query NAB Test Query - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Query 3258925707 - QueryDataItem 205381422', 'Query NAB Test Query - QueryDataItem DataItemName');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Query 3258925707 - QueryColumn 967337907', 'Query NAB Test Query - QueryColumn ColumnName');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Query 3258925707 - QueryColumn 967337907 - Property 2879900210', 'Query NAB Test Query - QueryColumn ColumnName - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Query 3258925707 - Method 1336600528', 'Query NAB Test Query - Method OnBeforeOpen');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Query 3258925707 - Method 1336600528 - NamedType 1061650423', 'Query NAB Test Query - Method OnBeforeOpen - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Query 3258925707 - Method 1968185403', 'Query NAB Test Query - Method TestMethod');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Query 3258925707 - Method 1968185403 - NamedType 1061650423', 'Query NAB Test Query - Method TestMethod - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Query 3258925707 - NamedType 2688233357', 'Query NAB Test Query - NamedType GlobalTestLabelTxt');
    });

    test("AL Report Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getReport(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);
        let i: { i: number } = { i: 0 };
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455', 'Report NAB Test Report');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Property 2879900210', 'Report NAB Test Report - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - ReportDataItem 205381422', 'Report NAB Test Report - ReportDataItem DataItemName');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - ReportDataItem 205381422 - Property 1806354803', 'Report NAB Test Report - ReportDataItem DataItemName - Property RequestFilterHeading');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - ReportColumn 967337907', 'Report NAB Test Report - ReportColumn ColumnName');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - ReportColumn 967337907 - Property 2879900210', 'Report NAB Test Report - ReportColumn ColumnName - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - ReportColumn 967337907 - Property 62802879', 'Report NAB Test Report - ReportColumn ColumnName - Property OptionCaption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455', 'Report NAB Test Report');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Control 4105281732', 'Report NAB Test Report - Control GroupName');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Control 4105281732 - Property 2879900210', 'Report NAB Test Report - Control GroupName - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Control 4105281732 - Property 1968111052', 'Report NAB Test Report - Control GroupName - Property InstructionalText');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Control 3731481282', 'Report NAB Test Report - Control Fld');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Control 3731481282 - Property 2879900210', 'Report NAB Test Report - Control Fld - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Control 3731481282 - Property 62802879', 'Report NAB Test Report - Control Fld - Property OptionCaption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Control 3731481282 - Property 1295455071', 'Report NAB Test Report - Control Fld - Property ToolTip');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Control 3731481282 - Method 2699620902', 'Report NAB Test Report - Control Fld - Method OnAssistEdit');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Control 3731481282 - Method 2699620902 - NamedType 1061650423', 'Report NAB Test Report - Control Fld - Method OnAssistEdit - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Control 3731481282 - Method 2699620902 - NamedType 725422852', 'Report NAB Test Report - Control Fld - Method OnAssistEdit - NamedType HelloWorldTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455', 'Report NAB Test Report');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Action 1692444235', 'Report NAB Test Report - Action ActionName');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Action 1692444235 - Method 1377591017', 'Report NAB Test Report - Action ActionName - Method OnAction');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Action 1692444235 - Method 1377591017 - NamedType 1061650423', 'Report NAB Test Report - Action ActionName - Method OnAction - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Method 1968185403', 'Report NAB Test Report - Method TestMethod');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - Method 1968185403 - NamedType 1061650423', 'Report NAB Test Report - Method TestMethod - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Report 529985455 - NamedType 2688233357', 'Report NAB Test Report - NamedType GlobalTestLabelTxt');
    });

    test("AL TableExt Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getTableExt(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);
        let i: { i: number } = { i: 0 };
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'TableExtension 3999646232', 'TableExtension NAB Test Table Ext');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'TableExtension 3999646232 - Field 4159685971', 'TableExtension NAB Test Table Ext - Field NAB Test Field');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'TableExtension 3999646232 - Field 4159685971 - Property 62802879', 'TableExtension NAB Test Table Ext - Field NAB Test Field - Property OptionCaption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'TableExtension 3999646232 - Field 4159685971 - Property 2879900210', 'TableExtension NAB Test Table Ext - Field NAB Test Field - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'TableExtension 3999646232 - Field 4159685971 - Method 1213635141', 'TableExtension NAB Test Table Ext - Field NAB Test Field - Method OnLookup');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'TableExtension 3999646232 - Field 4159685971 - Method 1213635141 - NamedType 1061650423', 'TableExtension NAB Test Table Ext - Field NAB Test Field - Method OnLookup - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'TableExtension 3999646232 - Method 1968185403', 'TableExtension NAB Test Table Ext - Method TestMethod');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'TableExtension 3999646232 - Method 1968185403 - NamedType 1061650423', 'TableExtension NAB Test Table Ext - Method TestMethod - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'TableExtension 3999646232 - NamedType 1399329827', 'TableExtension NAB Test Table Ext - NamedType TableExtLabel');
    });

    test("AL PageExt Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getPageExt(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);
        let i: { i: number } = { i: 0 };
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579', 'PageExtension NAB Test PageExt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579', 'PageExtension NAB Test PageExt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Control 2763289416', 'PageExtension NAB Test PageExt - Control NAB MyFieldGroup');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Control 3146432722', 'PageExtension NAB Test PageExt - Control NAB Blocked3');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Control 3146432722 - Property 2879900210', 'PageExtension NAB Test PageExt - Control NAB Blocked3 - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Control 3146432722 - Property 1295455071', 'PageExtension NAB Test PageExt - Control NAB Blocked3 - Property ToolTip');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Control 3146432722 - Property 62802879', 'PageExtension NAB Test PageExt - Control NAB Blocked3 - Property OptionCaption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579', 'PageExtension NAB Test PageExt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Action 3144175164', 'PageExtension NAB Test PageExt - Action NAB Grp');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Action 3144175164 - Property 2879900210', 'PageExtension NAB Test PageExt - Action NAB Grp - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Action 3144175164 - Property 1295455071', 'PageExtension NAB Test PageExt - Action NAB Grp - Property ToolTip');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Action 1483499693', 'PageExtension NAB Test PageExt - Action NAB Act');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Action 1483499693 - Property 2879900210', 'PageExtension NAB Test PageExt - Action NAB Act - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Action 1483499693 - Property 1295455071', 'PageExtension NAB Test PageExt - Action NAB Act - Property ToolTip');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Action 1483499693 - Method 1377591017', 'PageExtension NAB Test PageExt - Action NAB Act - Method OnAction');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Action 1483499693 - Method 1377591017 - NamedType 1061650423', 'PageExtension NAB Test PageExt - Action NAB Act - Method OnAction - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579', 'PageExtension NAB Test PageExt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Method 3244334789', 'PageExtension NAB Test PageExt - Method TestMethodPageExt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - Method 3244334789 - NamedType 1061650423', 'PageExtension NAB Test PageExt - Method TestMethodPageExt - NamedType LocalTestLabelTxt');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'PageExtension 3795862579 - NamedType 2688233357', 'PageExtension NAB Test PageExt - NamedType GlobalTestLabelTxt');
    });

    test("AL Enum Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getEnum(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);
        let i: { i: number } = { i: 0 };
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Enum 3133857684', 'Enum NAB TestEnum');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Enum 3133857684 - EnumValue 1445202145', 'Enum NAB TestEnum - EnumValue MyValue');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Enum 3133857684 - EnumValue 1445202145 - Property 2879900210', 'Enum NAB TestEnum - EnumValue MyValue - Property Caption');
    });



    // test("CodeGenerator", function () {
    //     //let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.GetTable(), true);
    //     let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.GetEnum(), true);
    //     let linesWithTranslation = alObj.codeLines.filter(line => line.XliffIdWithNames);
    //     for (let index = 0; index < linesWithTranslation.length; index++) {
    //         const line = linesWithTranslation[index];
    //         console.log(`assert.equal(getNextLine(i, linesWithTranslation).GetXliffId(), '${line.GetXliffId()}', '${line.GetXliffIdWithNames()}');`)
    //     }
    // });

});
function getNextLine(i: { i: number }, linesWithTranslation: Array<ALObject.NAVCodeLine>) {
    i.i++;
    return linesWithTranslation[i.i - 1];
}


