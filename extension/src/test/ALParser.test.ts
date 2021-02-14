import * as assert from 'assert';
import { ALObject } from '../ALObject/ALObject';
import { ALXmlComment } from '../ALObject/ALXmlComment';
import { ALParameter } from '../ALObject/ALProcedure';
import * as ALObjectTestLibrary from './ALObjectTestLibrary';

suite("Classes.AL Functions Tests", function () {
    test("Parameter parsing", function () {
        testParameter(' myParam: integer ', false, 'myParam', 'integer');
        testParameter('myParam: integer', false, 'myParam', 'integer');
        testParameter('var myParam: integer', true, 'myParam', 'integer');
        testParameter('var myParam: Record Item', true, 'myParam', 'Record', 'Item');
        testParameter('var myParam: Record "Sales Header"', true, 'myParam', 'Record', '"Sales Header"');
        testParameter('var myParam: Record "Name [) _0 | ""() []{}"', true, 'myParam', 'Record', '"Name [) _0 | ""() []{}"');
        testParameter('var "myParam with space": integer', true, '"myParam with space"', 'integer');
    });

    function testParameter(paramString: string, byRef: boolean, name: string, datatype: string, subtype?: string) {
        let param = ALParameter.fromString(paramString);
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


