import * as path from 'path';
import * as assert from 'assert';
import * as SymbolReferenceReader from '../SymbolReference/SymbolReferenceReader';
import { ALControlType } from '../ALObject/Enums';
import { ALTableField } from '../ALObject/ALTableField';


const testResourcesPath = '../../src/test/resources/.alpackages';

let baseAppPath = path.resolve(__dirname, testResourcesPath, 'Microsoft_Base Application_18.0.23013.23320.app');
let testAppPath = path.resolve(__dirname, testResourcesPath, 'Default publisher_Al_1.0.0.0.app');


suite("Symbol Parsing", function () {
    test.only("TestApp", function () {
        const appPackage = SymbolReferenceReader.getObjectsFromAppFile(testAppPath);
        assert.deepEqual(appPackage.manifest?.App[0]._attributes.Name, 'Al');
        assert.deepEqual(appPackage.packageId, "3af0cee6-88bb-4539-835d-60115121a0c5", 'unexpected packageId');
        if (appPackage.objects) {
            assert.deepEqual(appPackage.objects.length, 6, 'unexpected number of objects');
            assert.deepEqual(appPackage.objects[0].name, 'NAB Test Table', 'unexpected table name');
        } else {
            assert.fail('No objects found')
        }
    });
    test.only("BaseApp Package", function () {
        const appPackage = SymbolReferenceReader.getAppPackage(baseAppPath, false);
        assert.deepEqual(appPackage.manifest?.App[0]._attributes.Name, 'Base Application');
        assert.deepEqual(appPackage.packageId, "9ffe35d4-3d02-498d-903e-65c48acd46f5", 'unexpected packageId');
    });
    test.only("BaseApp", function () {
        this.timeout(10000);
        testBaseApp();
    });
    test.only("BaseApp from cache", function () {
        // Cached by previous test
        testBaseApp();
    });

});

function testBaseApp() {
    const appPackage = SymbolReferenceReader.getObjectsFromAppFile(baseAppPath);
    assert.deepEqual(appPackage.manifest?.App[0]._attributes.Name, 'Base Application');
    assert.deepEqual(appPackage.packageId, "9ffe35d4-3d02-498d-903e-65c48acd46f5", 'unexpected packageId');
    if (appPackage.objects) {
        assert.deepEqual(appPackage.objects.length, 4122, 'unexpected number of objects');
        assert.deepEqual(appPackage.objects[0].name, 'AAD Application', 'unexpected table name');
        let fields = appPackage.objects[0].getAllControls(ALControlType.TableField) as ALTableField[];
        assert.deepEqual(fields[0].id, 1, 'unexpected field id');
        assert.deepEqual(fields[0].name, 'Client Id', 'unexpected field name');
        assert.deepEqual(fields[0].caption, 'Client Id', 'unexpected field caption');
        assert.deepEqual(fields[0].dataType, 'Guid', 'unexpected field dataType');
    } else {
        assert.fail('No objects found');
    }
}

