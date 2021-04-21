import * as path from 'path';
import * as assert from 'assert';
import * as SymbolReferenceReader from '../SymbolReference/SymbolReferenceReader';

const testResourcesPath = '../../src/test/resources/.alpackages';

let baseAppPath = path.resolve(__dirname, testResourcesPath, 'Microsoft_Base Application_18.0.23013.23320.app');
let testAppPath = path.resolve(__dirname, testResourcesPath, 'Default publisher_Al_1.0.0.0.app');


suite("Symbol Parsing", function () {
    test.only("TestApp", function () {
        const appPackage = SymbolReferenceReader.getObjectsFromAppFile(testAppPath);
        assert.equal(appPackage.manifest.App[0]._attributes.Name, 'Al');
        if (appPackage.objects) {
            assert.equal(appPackage.objects.length, 2, 'unexpected number of objects');
            assert.equal(appPackage.objects[0].name, 'NAB Test Table', 'unexpected table name');
        } else {
            assert.fail('No objects found')
        }
    });
    test.only("BaseApp", function () {
        const appPackage = SymbolReferenceReader.getObjectsFromAppFile(baseAppPath);
        assert.equal(appPackage.manifest.App[0]._attributes.Name, 'Base Application');
        if (appPackage.objects) {
            assert.equal(appPackage.objects.length, 1468, 'unexpected number of objects');
            assert.equal(appPackage.objects[0].name, 'AAD Application', 'unexpected table name');
        } else {
            assert.fail('No objects found')
        }
    });

});


