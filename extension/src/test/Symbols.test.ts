import * as assert from 'assert';
import * as SymbolReader from '../SymbolReader';

suite("Symbol Parsing", function () {
    test.only("Spider", function () {
        const testApp = JSON.parse(SymbolReader.getSymbolReferenceFromAppFile('D:\VSCode\Git\GitHub\nab-al-tools\test-app\Xliff-test\Default publisher_Al_1.0.0.0.app'))
        const symbolData = JSON.parse(SymbolReader.getSymbolReferenceFromAppFile('D:\\VSCode\\Git\\NAB\\Spider\\App\\.alpackages\\SmartApps_Spider_18.0.21356.0.app'));
        assert.equal(symbolData.Name, 'Spider');
    });

});


