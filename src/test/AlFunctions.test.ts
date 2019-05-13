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
    test("AL Fnv", function () {
        assert.equal(AlFunctions.AlFnv('MyPage'), 2931038265, 'Value: MyPage');
        assert.equal(AlFunctions.AlFnv('ActionName'), 1692444235, 'Value: ActionName');
        assert.equal(AlFunctions.AlFnv('OnAction'), 1377591017, 'Value: OnAction');
        assert.equal(AlFunctions.AlFnv('TestOnActionErr'), 2384180296, 'Value: TestOnActionErr');
        assert.equal(AlFunctions.AlFnv('TestProcLocal'), 1531128287, 'Value: TestProcLocal');
        assert.equal(AlFunctions.AlFnv('MyFieldOption'), 2443090863, 'Value: MyFieldOption');
        assert.equal(AlFunctions.AlFnv('OptionCaption'), 62802879, 'Value: OptionCaption');
        assert.equal(AlFunctions.AlFnv('MyTable'), 2328808854, 'Value: MyTable');
        assert.equal(AlFunctions.AlFnv('MyField'), 1296262074, 'Value: MyField');
        // assert.equal(, AlFunctions.AlFnv(''),'Value: ');
    });

    test("AL Table Xliff", function () {
        let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.GetTable(), true);
        let linesWithTranslation = alObj.codeLines.filter(line => line.XliffIdWithNames);
        assert.equal(linesWithTranslation[0].GetXliffId(), 'Table 2328808854 - Field 1296262074 - Property 2879900210', 'Table MyTable - Field MyField - Property Caption');
        assert.equal(linesWithTranslation[1].GetXliffId(), 'Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064', 'Table MyTable - Field MyField - Method OnValidate - NamedType TestOnValidateErr');
        assert.equal(linesWithTranslation[2].GetXliffId(), 'Table 2328808854 - Field 3945078064 - Property 2879900210', 'Table MyTable - Field MyField2 - Property Caption');
        assert.equal(linesWithTranslation[3].GetXliffId(), 'Table 2328808854 - Field 2443090863 - Property 2879900210', 'Table MyTable - Field MyFieldOption - Property Caption');
        assert.equal(linesWithTranslation[4].GetXliffId(), 'Table 2328808854 - Field 2443090863 - Property 62802879', 'Table MyTable - Field MyFieldOption - Property OptionCaption');
        assert.equal(linesWithTranslation[5].GetXliffId(), 'Table 2328808854 - NamedType 12557645', 'Table MyTable - NamedType TestErr');
        // for (let index = 0; index < linesWithTranslation.length; index++) {
        //     const item = linesWithTranslation[index];
        //     console.log(`${item.Code}: ${item.GetXliffId()}`);
        // }


    });

    test("XliffIdToken from Text", function () {
        const idConst = 'Table 3999920088 - Field 1446865707 - Property 2879900210';
        const noteConst = 'Table QWESP Chargeab. Chart Setup - Field Period Length - Property Caption';
        let result = ALObject.XliffIdToken.GetXliffIdTokenArray(idConst, noteConst);
        let fullIdArr = idConst.split(' ');
        fullIdArr = fullIdArr.filter(x => x !== '-');
        let typeArr = fullIdArr.filter(x => isNaN(Number(x)));
        let idArr = fullIdArr.filter(x => !isNaN(Number(x)));

        for (let index = 0; index < result.length; index++) {
            const token = result[index];
            assert.equal(typeArr[index], token.Type, 'Type not the same');
            assert.equal(idArr[index], token.Id, 'Id not the same');
        }

    });
});