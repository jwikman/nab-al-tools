import * as assert from 'assert';
import * as AlFunctions from '../AlFunctions';
import * as ALObject from '../ALObject';
import * as ALObjectTestLibrary from './ALObjectTestLibrary';

suite("AL Functions Tests", function () {

    test("Valid Object Desriptors", function () {
        let objectDescriptorArr = ALObjectTestLibrary.getValidObjectDescriptors();
        for (let index = 0; index < objectDescriptorArr.length; index++) {
            const item = objectDescriptorArr[index];
            let obj = new ALObject.ALObject(item.ObjectDescriptor, false);
            assert.equal(obj.objectName, item.ObjectName);

        }
    });
    test("Invalid Object Desriptors", function () {
        let objectDescriptorArr = ALObjectTestLibrary.getInvalidObjectDescriptors();
        for (let index = 0; index < objectDescriptorArr.length; index++) {
            const item = objectDescriptorArr[index];
            let obj = null;
            try {
                obj = new ALObject.ALObject(item, false);
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


    test("AL Codeunit procedure(param with parenthesis) Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getCodeunitWithFunctionsWithParenthesisParam(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line.isML);
        let i: { i: number } = { i: 0 };

        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Codeunit 456387620 - Method 481402784 - NamedType 2350589126', 'Codeunit NAB Test Codeunit - Method TheProcedure - NamedType MyLabel');
        assert.equal(linesWithTranslation[i.i - 1].transUnit?.toString(), '<trans-unit id="Codeunit 456387620 - Method 481402784 - NamedType 2350589126" size-unit="char" translate="yes" xml:space="preserve"><source>The text</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Codeunit - Method TheProcedure - NamedType MyLabel</note></trans-unit>', 'Codeunit NAB Test Codeunit - Method TheProcedure - NamedType MyLabel');
    });

    test("AL Page with groups and repeater Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getPageWithGroupsAndRepeater(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line.isML);
        let i: { i: number } = { i: 0 };

        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2975601355 - Property 2879900210', 'Page Page with repeater - Property Caption');
        assert.equal(linesWithTranslation[i.i - 1].transUnit?.toString(), '<trans-unit id="Page 2975601355 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>Page with repeater</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Property Caption</note></trans-unit>', 'Page Page with repeater - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2975601355 - Control 459968125 - Property 1968111052', 'Page Page with repeater - Control InstructionNonStripeGrp - Property InstructionalText');
        assert.equal(linesWithTranslation[i.i - 1].transUnit?.toString(), '<trans-unit id="Page 2975601355 - Control 459968125 - Property 1968111052" size-unit="char" translate="yes" xml:space="preserve"><source>This is an instruction</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Control InstructionNonStripeGrp - Property InstructionalText</note></trans-unit>', 'Page Page with repeater - Control InstructionNonStripeGrp - Property InstructionalText');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2975601355 - Control 4083082504 - Property 1968111052', 'Page Page with repeater - Control Instruction1Grp - Property InstructionalText');
        assert.equal(linesWithTranslation[i.i - 1].transUnit?.toString(), '<trans-unit id="Page 2975601355 - Control 4083082504 - Property 1968111052" size-unit="char" translate="yes" xml:space="preserve"><source>This is another instruction</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Control Instruction1Grp - Property InstructionalText</note></trans-unit>', 'Page Page with repeater - Control Instruction1Grp - Property InstructionalText');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2975601355 - Control 739346273 - Property 2879900210', 'Page Page with repeater - Control Group - Property Caption');
        assert.equal(linesWithTranslation[i.i - 1].transUnit?.toString(), '<trans-unit id="Page 2975601355 - Control 739346273 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>My repeater</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Control Group - Property Caption</note></trans-unit>', 'Page Page with repeater - Control Group - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2975601355 - Control 3461834954 - Property 1295455071', 'Page Page with repeater - Control Description - Property ToolTip');
        assert.equal(linesWithTranslation[i.i - 1].transUnit?.toString(), '<trans-unit id="Page 2975601355 - Control 3461834954 - Property 1295455071" size-unit="char" translate="yes" xml:space="preserve"><source>Specifies the description.</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Control Description - Property ToolTip</note></trans-unit>', 'Page Page with repeater - Control Description - Property ToolTip');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 2975601355 - Control 2491558131 - Property 1968111052', 'Page Page with repeater - Control EvaluationGroup - Property InstructionalText');
        assert.equal(linesWithTranslation[i.i - 1].transUnit?.toString(), '<trans-unit id="Page 2975601355 - Control 2491558131 - Property 1968111052" size-unit="char" translate="yes" xml:space="preserve"><source>Another instruction...</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Control EvaluationGroup - Property InstructionalText</note></trans-unit>', 'Page Page with repeater - Control EvaluationGroup - Property InstructionalText');
    });


    test("AL Table Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getTable(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);
        let i: { i: number } = { i: 0 };

        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854', 'Table MyTable');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Table 2328808854 - Property 2879900210', 'Table MyTable - Property Caption');
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

    test("AL RoleCenterPage Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getRoleCenterPage(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);

        let i: { i: number } = { i: 0 };
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741', 'Page My Role Center');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Property 2879900210', 'Page My Role Center - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741', 'Page My Role Center');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 3661919152', 'Page My Role Center - Action Jobs');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 3661919152 - Property 2879900210', 'Page My Role Center - Action Jobs - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 2273701615', 'Page My Role Center - Action Job List');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 2273701615 - Property 2879900210', 'Page My Role Center - Action Job List - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 844797923', 'Page My Role Center - Action Job Tasks');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 844797923 - Property 2879900210', 'Page My Role Center - Action Job Tasks - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 369017905', 'Page My Role Center - Action Job Print Layouts');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 369017905 - Property 2879900210', 'Page My Role Center - Action Job Print Layouts - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 3504687331', 'Page My Role Center - Action Resources');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 3504687331 - Property 2879900210', 'Page My Role Center - Action Resources - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 4265073908', 'Page My Role Center - Action Resource List');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 4265073908 - Property 2879900210', 'Page My Role Center - Action Resource List - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 3512836922', 'Page My Role Center - Action Resource Capacity');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1933621741 - Action 3512836922 - Property 2879900210', 'Page My Role Center - Action Resource Capacity - Property Caption');
    });


    test("AL CueGroup page Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getCueGroupPage(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line._xliffIdWithNames);
        let i: { i: number } = { i: 0 };
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1018816708', 'Page My Cue Part');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1018816708 - Property 2879900210', 'Page My Cue Part - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1018816708', 'Page My Cue Part');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1018816708 - Control 1494066971', 'Page My Cue Part - Control Time Sheet Manager');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1018816708 - Control 1494066971 - Property 2879900210', 'Page My Cue Part - Control Time Sheet Manager - Property Caption');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1018816708 - Control 3616567109', 'Page My Cue Part - Control Field1');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1018816708 - Control 3616567109 - Property 1295455071', 'Page My Cue Part - Control Field1 - Property ToolTip');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1018816708 - Property 1295455071', 'Page My Cue Part - Property ToolTip');
        assert.equal(getNextLine(i, linesWithTranslation).xliffId(), 'Page 1018816708 - Property 2879900210', 'Page My Cue Part - Property Caption');
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
    //     let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.getCodeunitWithHtmlTags(), true);
    //     let linesWithTranslation = alObj.codeLines.filter(line => line.isML);
    //     for (let index = 0; index < linesWithTranslation.length; index++) {
    //         const line = linesWithTranslation[index];
    //         console.log(`assert.equal(getNextLine(i, linesWithTranslation).xliffId(), '${line.xliffId()}', '${line.xliffIdWithNames()}');`);
    //         console.log(`assert.equal(linesWithTranslation[i.i - 1].transUnit?.toString(), '${line.transUnit?.toString()}', '${line.xliffIdWithNames()}');`);
    //     }
    // });

});
function getNextLine(i: { i: number }, linesWithTranslation: Array<ALObject.NAVCodeLine>) {
    i.i++;
    return linesWithTranslation[i.i - 1];
}


