import * as assert from 'assert';
import * as SymbolReferenceReader from '../SymbolReference/SymbolReferenceReader';

suite("Symbol Parsing", function () {
    test.only("Spider", function () {
        const appFilePath = 'D:\\VSCode\\Git\\GitHub\\nab-al-tools\\test-app\\Xliff-test\\Default publisher_Al_1.0.0.0.app';
        const testAppSymbols = JSON.parse(SymbolReferenceReader.getSymbolReferenceFromAppFile(appFilePath))
        // const symbolData = JSON.parse(SymbolReader.getSymbolReferenceFromAppFile('D:\\VSCode\\Git\\NAB\\Spider\\App\\.alpackages\\SmartApps_Spider_18.0.21356.0.app'));
        // assert.equal(symbolData.Name, 'Spider');
        assert.equal(testAppSymbols.Name, 'Al');
        const objects = SymbolReferenceReader.getObjectsFromAppFile(appFilePath);
        assert.equal(objects.length, 2, 'unexpected number of objects');
        assert.equal(objects[0].name, 'NAB Test Table', 'unexpected name');
    });

});


