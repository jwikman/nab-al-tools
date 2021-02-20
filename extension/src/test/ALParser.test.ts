import * as assert from 'assert';
import { ALObject } from '../ALObject/ALObject';
import { ALXmlComment } from '../ALObject/ALXmlComment';
import { ALProcedure, ALVariable, removeGroupNamesFromRegex } from '../ALObject/ALProcedure';
import * as ALObjectTestLibrary from './ALObjectTestLibrary';
import { ALAccessModifier } from '../ALObject/Enums';
import { isNullOrUndefined } from 'util';

suite("Classes.AL Functions Tests", function () {

    test("Codeunit with XML Comments", function () {
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getCodeunitWithXmlComments(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        assert.equal(alObj.xmlComment?.summary, 'The Summary', 'Unexpected summary_');
        assert.equal(alObj.controls[0].xmlComment?.summary, 'The Function Summary', 'Unexpected function summary');
        assert.equal(alObj.controls[0].xmlComment?.parameters[0].name, 'Parameter', 'Unexpected parameter name');
        assert.equal(alObj.controls[0].xmlComment?.parameters[0].description, 'The first parameter', 'Unexpected description');
        assert.equal(alObj.controls[0].xmlComment?.parameters[1].name, 'pvRecRef', 'Unexpected parameter name 2');
        assert.equal(alObj.controls[0].xmlComment?.parameters[1].description, 'The second parameter', 'Unexpected description 2');
        assert.equal(alObj.controls[1].xmlComment?.summary, 'The 2nd Summary', 'Unexpected function summary 2');
        let proc: ALProcedure = <ALProcedure>alObj.controls[1];
        assert.equal(proc.name, 'TheProcedure2', 'Unexpected function name 2');
        assert.equal(proc.parameters[0].name, 'Parameter', 'Unexpected function parameter 2');
        assert.equal(proc.parameters[1].name, 'pvRecRef', 'Unexpected function parameter 3');
        assert.equal(proc.parameters[1].datatype, 'RecordRef', 'Unexpected function parameter datatype 3');

    });


    test("Remove group names from RegEx", function () {
        assert.equal(removeGroupNamesFromRegex('?<test>asdf'), 'asdf', '1. Groups not removed');
        assert.equal(removeGroupNamesFromRegex('(?<test>asdf)(?<wer>qwer)'), '(asdf)(qwer)', '2. Groups not removed');
    });
    test("Procedure parsing", function () {
        testProcedure('procedure MyTest()', ALAccessModifier.public, 'MyTest', 0, 0);
        testProcedure('local procedure MyTest()', ALAccessModifier.local, 'MyTest', 0, 0);
        testProcedure('internal procedure MyTest()', ALAccessModifier.internal, 'MyTest', 0, 0);
        testProcedure('protected procedure MyTest()', ALAccessModifier.protected, 'MyTest', 0, 0);
        testProcedure('procedure MyTest(First: Integer)', ALAccessModifier.public, 'MyTest', 1, 0);
        testProcedure(`[attribute]
        [attribute2]
        [attribute3]
        procedure MyTest(First: Integer)`, ALAccessModifier.public, 'MyTest', 1, 3);
        testProcedure('procedure MyTest(First: Integer; Second: Decimal)', ALAccessModifier.public, 'MyTest', 2, 0);
        testProcedure('procedure MyTest(First: Integer; Second: Decimal) : Integer', ALAccessModifier.public, 'MyTest', 2, 0, 'Integer');
        testProcedure(' procedure MyTest(First: Integer; Second: Decimal) returns : Integer;', ALAccessModifier.public, 'MyTest', 2, 0, 'Integer');
        testProcedure('local procedure MyTest(First: Integer; Second: Decimal; Third: Record "Sales Line") returns : Record "Sales Header"', ALAccessModifier.local, 'MyTest', 3, 0, 'Record', '"Sales Header"');
        testProcedure(`local procedure MyTest(
            First: Integer; 
            Second: Decimal; 
            Third: Record "Sales Line"
        ) returns : Record "Sales Header"`, ALAccessModifier.local, 'MyTest', 3, 0, 'Record', '"Sales Header"');
    });

    function testProcedure(procedureString: string, access: ALAccessModifier, name: string, parameterCount: number, attributeCount: number, returnDataType?: string, returnSubtype?: string) {
        let procedure = ALProcedure.fromString(procedureString);
        assert.equal(procedure.access, access, `Unexpected access (${procedureString})`);
        assert.equal(procedure.name, name, `Unexpected name (${procedureString})`);
        assert.equal(procedure.parameters.length, parameterCount, 'Unexpected number of parameters');
        assert.equal(procedure.attributes.length, attributeCount, 'Unexpected number of attributes');
        if (returnDataType) {
            assert.equal(procedure.returns?.datatype, returnDataType, 'Unexpected return datatype');
            if (returnSubtype) {
                assert.equal(procedure.returns?.subtype, returnSubtype, 'Unexpected return subtype');
            } else {
                assert.equal(isNullOrUndefined(procedure.returns?.subtype), true, 'Unexpected return subtype 2');
            }
        } else {
            assert.equal(isNullOrUndefined(procedure.returns), true, 'Unexpected return');
        }
    }
    test("Parameter parsing", function () {
        testParameter(' myParam: integer ', false, 'myParam', 'integer');
        testParameter('myParam: integer', false, 'myParam', 'integer');
        testParameter('var myParam: integer', true, 'myParam', 'integer');
        testParameter('var myParam: Record Item', true, 'myParam', 'Record', 'Item');
        testParameter('var myParam: Record "Sales Header"', true, 'myParam', 'Record', '"Sales Header"');
        testParameter(' myParam: Record "Sales Header"', false, 'myParam', 'Record', '"Sales Header"');
        testParameter('var myParam: Record "Name [) _0 | ""() []{}"', true, 'myParam', 'Record', '"Name [) _0 | ""() []{}"');
        testParameter('var "myParam with space": integer', true, '"myParam with space"', 'integer');
    });

    function testParameter(paramString: string, byRef: boolean, name: string, datatype: string, subtype?: string) {
        let param = ALVariable.fromString(paramString);
        assert.equal(param.byRef, byRef, `Unexpected byRef (${paramString})`);
        assert.equal(param.name, name, `Unexpected name (${paramString})`);
        assert.equal(param.datatype, datatype, `Unexpected datatype (${paramString})`);
        assert.equal(param.subtype, subtype, `Unexpected subtype (${paramString})`);

    }
    test("ALObject to string", function () {
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getObsoletePage(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        assert.equal(alObj.toString().trimEnd(), ALObjectTestLibrary.getObsoletePage().trimEnd(), 'Object not untouched (Double negations, yey!)');
    });

    test("Obsolete Page", function () {
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getObsoletePage(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        let mlObjects = alObj.getAllMultiLanguageObjects({ onlyForTranslation: true });
        assert.equal(mlObjects.length, 0, 'No translation should be done in an obsolete object');

    });


    test("Access Property", function () {
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getCodeunit(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        assert.equal(alObj.publicAccess, true, 'Unexpected default access');

        alObj = ALObject.getALObject(ALObjectTestLibrary.getCodeunitPublic(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        assert.equal(alObj.publicAccess, true, 'Unexpected public access');

        alObj = ALObject.getALObject(ALObjectTestLibrary.getCodeunitInternal(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        assert.equal(alObj.publicAccess, false, 'Unexpected internal access');
    });

    test("Valid Object Descriptors", function () {
        let objectDescriptorArr = ALObjectTestLibrary.getValidObjectDescriptors();
        for (let index = 0; index < objectDescriptorArr.length; index++) {
            const item = objectDescriptorArr[index];
            let obj = ALObject.getALObject(item.ObjectDescriptor, false);
            if (!obj) {
                assert.fail(`No descriptor found in ${item.ObjectDescriptor}`);
            }
            assert.equal(obj.objectName, item.ObjectName);
        }
    });

    test("Invalid Object Descriptors", function () {
        let objectDescriptorArr = ALObjectTestLibrary.getInvalidObjectDescriptors();
        for (let index = 0; index < objectDescriptorArr.length; index++) {
            const item = objectDescriptorArr[index];
            let obj = null;
            try {
                obj = ALObject.getALObject(item, false);
            } catch (error) {
                // console.log('Item: ', item,'\nError:', error);
            }
            if (obj !== null) {
                assert.fail('Object should fail. Name:' + obj?.objectName);
            }
        }
    });

    test("AL XmlComment", function () {
        const commentAsXml = `
             <summary>
             The Summary
             </summary>
             <param name="FirstParam">The first parameter</param>
             <param name="SecondParam">The second parameter</param>
             <returns>Anything</returns>
             <remarks>Bla bla <paramref name="FirstParam"/></remarks>
             <example>Function('','')</example>

`;
        const commentXmlArr = commentAsXml.split('\n');
        const xmlComment = ALXmlComment.fromString(commentXmlArr);
        assert.equal(xmlComment.summary, 'The Summary', 'Unexpected summary');
        assert.equal(xmlComment.returns, 'Anything', 'Unexpected returns');
        assert.equal(xmlComment.remarks, 'Bla bla <paramref name="FirstParam"/>', 'Unexpected remarks');
        assert.equal(xmlComment.example, "Function('','')", 'Unexpected example');
        assert.equal(xmlComment.parameters[0].name, "FirstParam", 'Unexpected First param name');
        assert.equal(xmlComment.parameters[0].description, "The first parameter", 'Unexpected First param name');
        assert.equal(xmlComment.parameters[1].name, "SecondParam", 'Unexpected First param name');
        assert.equal(xmlComment.parameters[1].description, "The second parameter", 'Unexpected First param description');
    });

    test("AL XmlComment ///", function () {
        const commentAsXml = `
            /// <summary>
            /// The Summary
            /// </summary>
            /// <param name="FirstParam">The first parameter</param>
            /// <param name="SecondParam">The second parameter</param>
            /// <returns>Anything</returns>
            /// <remarks>Bla bla</remarks>
            /// <example>Function('','')</example>

`;
        const commentXmlArr = commentAsXml.split('\n');
        const xmlComment = ALXmlComment.fromString(commentXmlArr);
        assert.equal(xmlComment.summary, 'The Summary', 'Unexpected summary');
        assert.equal(xmlComment.returns, 'Anything', 'Unexpected returns');
        assert.equal(xmlComment.remarks, 'Bla bla', 'Unexpected remarks');
        assert.equal(xmlComment.example, "Function('','')", 'Unexpected example');
        assert.equal(xmlComment.parameters[0].name, "FirstParam", 'Unexpected First param name');
        assert.equal(xmlComment.parameters[0].description, "The first parameter", 'Unexpected First param name');
        assert.equal(xmlComment.parameters[1].name, "SecondParam", 'Unexpected First param name');
        assert.equal(xmlComment.parameters[1].description, "The second parameter", 'Unexpected First param description');
    });
});


