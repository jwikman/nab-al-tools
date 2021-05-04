import * as path from 'path';
import * as assert from 'assert';
import * as SymbolReferenceReader from '../SymbolReference/SymbolReferenceReader';
import { ALControlType } from '../ALObject/Enums';
import { ALTableField } from '../ALObject/ALTableField';


const testResourcesPath = '../../src/test/resources/.alpackages';

const baseAppPath = path.resolve(__dirname, testResourcesPath, 'Microsoft_Base Application_18.0.23013.23320.app');
const testAppPath = path.resolve(__dirname, testResourcesPath, 'Default publisher_Al_1.0.0.0.app');
const runtimePackagePath = path.resolve(__dirname, testResourcesPath, 'Default publisher_AlRuntimePackage_18.3.24557.0.app');


suite("Symbol Parsing", function () {
    test("TestApp", function () {
        const appPackage = SymbolReferenceReader.getObjectsFromAppFile(testAppPath);
        assert.deepEqual(appPackage.manifest?.App[0]._attributes.Name, 'Al');
        assert.deepEqual(appPackage.packageId, "3af0cee6-88bb-4539-835d-60115121a0c5", 'unexpected packageId');
        if (appPackage.objects) {
            assert.deepEqual(appPackage.objects.length, 6, 'unexpected number of objects');
            assert.deepEqual(appPackage.objects[0].name, 'NAB Test Table', 'unexpected table name');
        } else {
            assert.fail('No objects found');
        }
    });
    test("BaseApp Package", function () {
        this.timeout(10000);
        const appPackage = SymbolReferenceReader.getAppPackage(baseAppPath, false);
        assert.deepEqual(appPackage.manifest?.App[0]._attributes.Name, 'Base Application');
        assert.deepEqual(appPackage.packageId, "9ffe35d4-3d02-498d-903e-65c48acd46f5", 'unexpected packageId');
    });
    test("BaseApp with objects", function () {
        this.timeout(10000);
        testBaseApp();
    });
    test("BaseApp with objects from cache", function () {
        // Cached by previous test
        testBaseApp();
    });

    test("Runtime Package", function () {
        try {
            const appPackage = SymbolReferenceReader.getObjectsFromAppFile(runtimePackagePath);
            assert.fail(`Unexpected success of parsing ${appPackage.name}`);
        } catch (error) {
            assert.equal(error.message.startsWith('Runtime Packages'), true, `Unexpected error message (${error.message}`);
        }
    });

});

function testBaseApp(): void {
    const appPackage = SymbolReferenceReader.getObjectsFromAppFile(baseAppPath);
    assert.deepEqual(appPackage.manifest?.App[0]._attributes.Name, 'Base Application');
    assert.deepEqual(appPackage.packageId, "9ffe35d4-3d02-498d-903e-65c48acd46f5", 'unexpected packageId');
    if (appPackage.objects) {
        assert.deepEqual(appPackage.objects.length, 4122, 'unexpected number of objects');
        assert.deepEqual(appPackage.objects[0].name, 'AAD Application', 'unexpected table name');
        const fields = appPackage.objects[0].getAllControls(ALControlType.tableField) as ALTableField[];
        assert.deepEqual(fields[0].id, 1, 'unexpected field id');
        assert.deepEqual(fields[0].name, 'Client Id', 'unexpected field name');
        assert.deepEqual(fields[0].caption, 'Client Id', 'unexpected field caption');
        assert.deepEqual(fields[0].dataType, 'Guid', 'unexpected field dataType');
    } else {
        assert.fail('No objects found');
    }
}

