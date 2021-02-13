import * as assert from 'assert';
import { ALObject } from '../ALObject/ALObject';
import * as ALObjectTestLibrary from './ALObjectTestLibrary';

suite("Classes.AL Functions Tests", function () {
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
});


