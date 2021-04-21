import * as assert from 'assert';
import { ALObject } from '../ALObject/ALObject';
import { ALXmlComment } from '../ALObject/ALXmlComment';
import { ALProcedure } from '../ALObject/ALProcedure';
import * as ALObjectTestLibrary from './ALObjectTestLibrary';
import { ALAccessModifier, ALControlType, ALPropertyType, MultiLanguageType } from '../ALObject/Enums';
import { isNullOrUndefined } from 'util';
import { ALVariable } from '../ALObject/ALVariable';
import { removeGroupNamesFromRegex } from '../constants';

suite("Classes.AL Functions Tests", function () {

    test("SpecialCharacters XLIFF", function () {
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getTableWithSpecialCharacters(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        let fld = alObj.getAllControls(ALControlType.TableField).filter(c => c.name === 'My <> & Field')[0];
        let caption = fld.getAllMultiLanguageObjects().filter(x => x.name === MultiLanguageType[MultiLanguageType.Caption])[0];
        let xliffId = caption.xliffId();
        assert.equal(xliffId, 'Table 596208023 - Field 1942294334 - Property 2879900210', 'unexpected XliffId');
    });


    test("Obsolete Page Controls", function () {
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getPageWithObsoleteControls(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }

        let control = alObj.getControl(ALControlType.PageField, 'Name');
        if (!control) {
            assert.fail('Could not find Name');
        }
        assert.equal(control.name, 'Name', 'Unexpected name 1');
        assert.equal(control.getObsoletePendingInfo()?.obsoleteState, 'Pending', 'Unexpected State 1');
        assert.equal(control.getObsoletePendingInfo()?.obsoleteReason, 'The Reason', 'Unexpected Reason 1');
        assert.equal(control.getObsoletePendingInfo()?.obsoleteTag, 'The Tag', 'Unexpected Tag 1');

        control = alObj.getControl(ALControlType.Action, 'ActionName');
        if (!control) {
            assert.fail('Could not find ActionName');
        }
        assert.equal(control.name, 'ActionName', 'Unexpected name 2');
        assert.equal(control.getObsoletePendingInfo()?.obsoleteState, 'Pending', 'Unexpected State 2');
        assert.equal(control.getObsoletePendingInfo()?.obsoleteReason, 'The Action Reason', 'Unexpected Reason 2');
        assert.equal(control.getObsoletePendingInfo()?.obsoleteTag, 'The Action Tag', 'Unexpected Tag 2');
    });

    test("Obsolete Codeunit Procedures", function () {
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getCodeunitWithObsoletedMethods(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }

        let method = alObj.getControl(ALControlType.Procedure, 'TestMethod') as ALProcedure;
        if (!method) {
            assert.fail('Could not find TestMethod');
        }
        assert.equal(method.name, 'TestMethod', 'Unexpected name 1');
        assert.equal(method.getObsoletePendingInfo()?.obsoleteState, 'Pending', 'Unexpected State 1');
        assert.equal(method.getObsoletePendingInfo()?.obsoleteReason, 'The reason', 'Unexpected Reason 1');
        assert.equal(method.getObsoletePendingInfo()?.obsoleteTag, 'The Tag', 'Unexpected Tag 1');

        method = alObj.getControl(ALControlType.Procedure, 'OnBeforeWhatever') as ALProcedure;
        if (!method) {
            assert.fail('Could not find OnBeforeWhatever');
        }
        assert.equal(method.name, 'OnBeforeWhatever', 'Unexpected name 2');
        assert.equal(method.getObsoletePendingInfo()?.obsoleteState, 'Pending', 'Unexpected State 2');
        assert.equal(method.getObsoletePendingInfo()?.obsoleteReason, 'The Event reason', 'Unexpected Reason 2');
        assert.equal(method.getObsoletePendingInfo()?.obsoleteTag, 'The Event Tag', 'Unexpected Tag 2');
        assert.equal(method.attributes[0].startsWith('IntegrationEvent('), true, 'Unexpected IntegrationEvent attribute 2');
        assert.equal(method.attributes[1].startsWith('Obsolete('), true, 'Unexpected Obsolete attribute 2');
    });

    test("Obsolete Procedure", function () {
        testObsoleteProcedure(`
        [Obsolete('Reason','Tag')]
        procedure MyTest1(First: Integer)`, true, 'Reason', 'Tag');

        testObsoleteProcedure(`
        [Obsolete('Reason')]
        procedure MyTest2(First: Integer)`, true, 'Reason', '');

        testObsoleteProcedure(`
        [Obsolete()]
        procedure MyTest3(First: Integer)`, true, '', '');

        testObsoleteProcedure(`
        [Obsolete]
        procedure MyTest4(First: Integer)`, true, '', '');

        testObsoleteProcedure(`
        [AnyOtherAttribute]
        procedure MyTest5(First: Integer)`, false, '', '');

        testObsoleteProcedure(`
        [Obsolete('Reason with a "lot" of text wi''th double '' in it ', 'Tag')]
        procedure MyTest6(First: Integer)`, true, 'Reason with a "lot" of text wi\'\'th double \'\' in it ', 'Tag');
    });

    function testObsoleteProcedure(procedureString: string, obsolete: boolean, obsoleteReason: string, obsoleteTag: string) {
        let procedure = ALProcedure.fromString(procedureString);

        let obsoleteInfo = procedure.getObsoletePendingInfo();
        if (obsolete) {
            if (!obsoleteInfo) {
                assert.notEqual(obsoleteInfo, undefined, `Not obsoleted ${procedure.name}`);
            } else {
                assert.equal(obsoleteInfo.obsoleteReason, obsoleteReason, `Unexpected obsoleteReason ${procedure.name}`);
                assert.equal(obsoleteInfo.obsoleteTag, obsoleteTag, `Unexpected obsoleteTag ${procedure.name}`);
            }
        } else {
            assert.equal(obsoleteInfo, undefined, `Unexpected obsolete ${procedure.name}`);
        }

    }
    test("API Page", function () {
        let alObj = ALObject.getALObject(ALObjectTestLibrary.getApiPage(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        assert.equal(alObj.getPropertyValue(ALPropertyType.APIGroup), 'appName', 'Unexpected APIGroup');
        assert.equal(alObj.getPropertyValue(ALPropertyType.APIPublisher), 'publisher', 'Unexpected APIPublisher');
        assert.equal(alObj.getPropertyValue(ALPropertyType.APIVersion), 'v1.0', 'Unexpected APIVersion');
        assert.equal(alObj.getPropertyValue(ALPropertyType.EntityName), 'customer', 'Unexpected EntityName');
        assert.equal(alObj.getPropertyValue(ALPropertyType.EntitySetName), 'customers', 'Unexpected EntitySetName');
    });

    test("Remove group names from RegEx", function () {
        assert.equal(removeGroupNamesFromRegex('?<test>asdf'), 'asdf', '1. Groups not removed');
        assert.equal(removeGroupNamesFromRegex('(?<test>asdf)(?<wer>qwer)'), '(asdf)(qwer)', '2. Groups not removed');
    });

    test("Procedure parsing", function () {
        testProcedure('procedure GetBCUrl(var pvRec: Variant; pClientType: Option Current,Default,Windows,Web,SOAP,OData,NAS,Background,Management; pPageId: Integer; pUseFilter: Boolean): Text;', ALAccessModifier.public, 'GetBCUrl', 4, 0, 'Text');
        testProcedure('procedure MyTest()', ALAccessModifier.public, 'MyTest', 0, 0);
        testProcedure('local procedure MyTest()', ALAccessModifier.local, 'MyTest', 0, 0);
        testProcedure('internal procedure MyTest()', ALAccessModifier.internal, 'MyTest', 0, 0);
        testProcedure('protected procedure MyTest()', ALAccessModifier.protected, 'MyTest', 0, 0);
        testProcedure('procedure MyTest(First: Integer)', ALAccessModifier.public, 'MyTest', 1, 0);
        testProcedure(`[attribute]
        [attribute2]
        [attribute3]
        procedure MyTest(First: Integer)`, ALAccessModifier.public, 'MyTest', 1, 3);
        testProcedure(`[attribute]
        [attribute2]
        #pragma warning disable AL0432 // whatever
        // whatever
        [attribute3]
        procedure MyTest(First: Integer)`, ALAccessModifier.public, 'MyTest', 1, 3);
        testProcedure('procedure MyTest(First: Integer; Second: Decimal)', ALAccessModifier.public, 'MyTest', 2, 0);
        testProcedure('procedure MyTest(First: Integer; Second: Decimal) : Integer', ALAccessModifier.public, 'MyTest', 2, 0, 'Integer');
        testProcedure('procedure MyTest(First: Integer; Second: Decimal) : List of [Text]', ALAccessModifier.public, 'MyTest', 2, 0, 'List of [Text]');
        testProcedure('procedure MyTest(First: Integer; Second: Decimal) : Dictionary of [Integer, Text]', ALAccessModifier.public, 'MyTest', 2, 0, 'Dictionary of [Integer, Text]');
        testProcedure('procedure MyTest(First: Integer; Second: Decimal) : Dictionary of [Integer, Dictionary of [Integer, Text]]', ALAccessModifier.public, 'MyTest', 2, 0, 'Dictionary of [Integer, Dictionary of [Integer, Text]]');
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
        testParameter(' myParam: Code[20]', false, 'myParam', 'Code[20]');
        testParameter(' myParam: integer ', false, 'myParam', 'integer');
        testParameter('myParam: integer', false, 'myParam', 'integer');
        testParameter('myParam: List of [Text]', false, 'myParam', 'List of [Text]');
        testParameter('myParam: List of [Text[100]]', false, 'myParam', 'List of [Text[100]]');
        testParameter('myParam: Dictionary of [Integer, Text]', false, 'myParam', 'Dictionary of [Integer, Text]');
        testParameter('myParam: Dictionary of [Integer, Code[20]]', false, 'myParam', 'Dictionary of [Integer, Code[20]]');
        testParameter('var myParam: integer', true, 'myParam', 'integer');
        testParameter('var myParam: Record Item temporary', true, 'myParam', 'Record Item temporary', 'Item');
        testParameter('var myParam: Record Item', true, 'myParam', 'Record Item', 'Item');
        testParameter('var myParam: Record "Sales Header"', true, 'myParam', 'Record "Sales Header"', '"Sales Header"');
        testParameter(' myParam: Record "Sales Header"', false, 'myParam', 'Record "Sales Header"', '"Sales Header"');
        testParameter('var myParam: Record "Name [) _0 | ""() []{}"', true, 'myParam', 'Record "Name [) _0 | ""() []{}"', '"Name [) _0 | ""() []{}"');
        testParameter('var "myParam with space": integer', true, '"myParam with space"', 'integer');
    });

    function testParameter(paramString: string, byRef: boolean, name: string, fullDataType: string, subtype?: string) {
        let param = ALVariable.fromString(paramString);
        assert.equal(param.byRef, byRef, `Unexpected byRef (${paramString})`);
        assert.equal(param.name, name, `Unexpected name (${paramString})`);
        assert.equal(param.fullDataType, fullDataType, `Unexpected datatype (${paramString})`);
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


