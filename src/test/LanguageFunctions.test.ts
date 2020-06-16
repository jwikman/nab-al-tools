import * as assert from 'assert';

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as xmldom from 'xmldom';

import * as ALObjectTestLibrary from './ALObjectTestLibrary';
import * as LanguageFunctions from '../LanguageFunctions';

const xmlns = 'urn:oasis:names:tc:xliff:document:1.2';
const testResourcesPath = '../../src/test/resources/';
const dom = xmldom.DOMParser;
let gXlfUri: vscode.Uri = vscode.Uri.file(path.resolve(__dirname, testResourcesPath, 'NAB_AL_Tools.g.xlf'));
let gXlfDom = new dom().parseFromString(fs.readFileSync(gXlfUri.fsPath, 'UTF8'));
let testFiles = [
    // 'Base Application.sv-SE.xlf',
    'NAB_AL_Tools.da-DK.xlf',
    'NAB_AL_Tools.sv-SE.xlf',
];
let langFilesUri: vscode.Uri[] = [];
testFiles.forEach(f => {
    let fromPath = path.resolve(__dirname, testResourcesPath, f);
    let toPath = path.resolve(__dirname, testResourcesPath, 'temp', f);
    fs.copyFileSync(fromPath, toPath);
    langFilesUri.push(vscode.Uri.file(toPath));
});

suite("Language Functions Tests", function () {

    test("LoadMatchXlfIntoMap()", function () {
        /* 
        *   - Test with Xlf that has [NAB:* ] tokens 
        *   - Assert matchMap does not contain [NAB: *] tokens
        */
        let dom = xmldom.DOMParser;
        let matchMap = LanguageFunctions.LoadMatchXlfIntoMap(new dom().parseFromString(ALObjectTestLibrary.GetXlfHasNABTokens()),xmlns);
        assert.notEqual(matchMap.size, 0, 'matchMap.size should not equal 0.');
        assert.equal(matchMap.size, 1, 'matchMap.size should equal 1.');
        assert.equal(matchMap.get("No Token")?.values().next().value, "No Token");
        assert.notEqual(matchMap.get('Has Token')?.values().next().value, '[NAB: SUGGESTION]Has Token');
    });

    test("Run __RefreshXlfFilesFromGXlf() x2", async function () {
        /**
         * Tests:
         *  - Trans-units has been inserted.
         *  - Trans-units has been removed.
         */
        let useExternalTranslationTool = false;
        let useMatching = true;
        let sortOnly = false;
        
        let refreshResult1 = await LanguageFunctions.__RefreshXlfFilesFromGXlf(gXlfUri, langFilesUri, useExternalTranslationTool, useMatching, sortOnly);
        assert.equal(refreshResult1.NumberOfAddedTransUnitElements, 26, 'Unexpected NumberOfAddedTransUnitElements.'); // 1. trans-units has been inserted
        assert.equal(refreshResult1.NumberOfCheckedFiles, langFilesUri.length, 'NumberOfCheckedFiles should equal the length of langFiles[].');
        assert.equal(refreshResult1.NumberOfRemovedTransUnits, 0, 'NumberOfRemovedTransUnits should equal 0.');
        assert.equal(refreshResult1.NumberOfUpdatedMaxWidths, 0, 'NumberOfUpdatedMaxWidths should equal 0.');
        assert.equal(refreshResult1.NumberOfUpdatedNotes, 0, 'NumberOfUpdatedNotes should equal 0.');
        assert.equal(refreshResult1.NumberOfUpdatedSources, 4, 'Unexpected NumberOfUpdatedSources.'); // 2. trans-units has been removed

        // The function so nice you test it twice
        let refreshResult2 = await LanguageFunctions.__RefreshXlfFilesFromGXlf(gXlfUri, langFilesUri, useExternalTranslationTool, useMatching, sortOnly);
        assert.equal(refreshResult2.NumberOfAddedTransUnitElements, 0, 'No new trans-units should have been inserted.');
        assert.equal(refreshResult2.NumberOfCheckedFiles, refreshResult1.NumberOfCheckedFiles, 'NumberOfCheckedFiles should be the same as last run.');
        assert.equal(refreshResult2.NumberOfRemovedTransUnits, 0, 'NumberOfRemovedTransUnits should equal 0.');
        assert.equal(refreshResult2.NumberOfUpdatedMaxWidths, 0, 'NumberOfUpdatedMaxWidths should equal 0.');
        assert.equal(refreshResult2.NumberOfUpdatedNotes, 0, 'NumberOfUpdatedNotes should equal 0.');
        assert.equal(refreshResult2.NumberOfUpdatedSources, 0, 'NumberOfUpdatedSources should equal 0.');
    });
    
    test("No multiple NAB-tokens in refreshed files", function() {
        assert.equal(NoMultipleNABTokensInXliff(ALObjectTestLibrary.GetXlfMultipleNABTokens()), false, 'Fail check for multiple [NAB: *] tokens.');
        langFilesUri.forEach(lf => {
            assert.equal(NoMultipleNABTokensInXliff(fs.readFileSync(lf.fsPath, 'UTF8')), true, 'There should never be more than 1 [NAB: * ] token in target.');
        });
    });

    test("Trans-units are sorted", function () {
        /**
         * Tests;
         *  - Trans-units has been sorted.
         */
        langFilesUri.forEach(lf => {
            TransUnitsAreSorted(new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8')));
        });
    });

    test("translate=no has been skipped", function () {
        /**
         * Tests:
         *  - Trans-units with attribute translate=no has been skipped.
         */
        //TODO: Loop gXlf?
        let transUnitId = 'Table 2328808854 - Field 1296262074 - Property 2879900210';
        langFilesUri.forEach(lf => {
            let targetLangDom = new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8'));
            assert.equal(targetLangDom.getElementById(transUnitId), null);
        });
    });

    test("Blank source", function () {
        /**
        * Tests:
        *  - Trans-units: Blank source.
        */
       let transUnitId = 'Table 2328808854 - Field 3945078064 - Property 2879900210';
       langFilesUri.forEach(lf => {
           let targetLangDom = new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8'));
           let transUnit = targetLangDom.getElementById(transUnitId);
           assert.equal(transUnit?.getElementsByTagName('source')[0].textContent, transUnit?.getElementsByTagName('target')[0].textContent, 'Unexpected behaviour with blank source element.');
       });
    });
    test("Targets are inserted before notes", function () {
        /**
        * Tests:
        *  - Trans-units: Targets are inserted before notes.
        */
       
       langFilesUri.forEach(lf => {
            let targetLangDom = new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8'));
            let targetTransUnits = targetLangDom.getElementsByTagNameNS(xmlns, 'trans-unit');
            for (let i = 0; i < targetTransUnits.length; i++) {
                let unitElementNames = [];
                let unitNodes = targetTransUnits[i].childNodes;
                for (let n = 0; n < unitNodes.length; n++) {
                    // Could not find a reliable way to skip #text and #comments
                    let node = unitNodes[n];
                    if (node.nodeType !== node.TEXT_NODE && node.nodeType !== node.COMMENT_NODE) {
                        unitElementNames.push(unitNodes[n].nodeName);
                    }
                }
                assert.equal(unitElementNames[0], 'source');
                assert.equal(unitElementNames[1], 'target');
            }
       });
    });
    test("Missing targets are inserted", function () {
        /**
        * Tests:
        *  - Trans-units with missing targets are inserted.
        */
        let transUnitId = 'Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064';
        langFilesUri.forEach(lf => {
            let targetLangDom = new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8'));
            let transUnit = targetLangDom.getElementById(transUnitId);
            assert.notEqual(transUnit?.getElementsByTagName('target'), null, 'Missing <target> should be inserted.');
        });
    });
    test("Change in <source> inserts review", function () {
        /**
        * Tests:
        *  - Change in <source> from g.xlf gets [NAB: Review] token.
        */
       let transUnitId = 'Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064';
       langFilesUri.forEach(lf => {
           let targetLangDom = new dom().parseFromString(fs.readFileSync(lf.fsPath, 'UTF8'));
           let transUnit = targetLangDom.getElementById(transUnitId);
           assert.equal(transUnit?.getElementsByTagName('target')[0].textContent?.includes(LanguageFunctions.GetReviewToken()), true, 'Change in source should insert review token.');
       });
    });
});

function NoMultipleNABTokensInXliff(xliff: string): boolean {
    const token_re = /\[NAB:/gm;
    let targetLangDom = new dom().parseFromString(xliff);
    let transUnitNodes = targetLangDom.getElementsByTagNameNS(xmlns, 'trans-unit');
    for (let i = 0; i < transUnitNodes.length; i++) {
        const targetElm = <Element>transUnitNodes[i].getElementsByTagName('target')[0];
        if (targetElm.textContent !== null) {
            let found_tokens = targetElm.textContent.match(token_re);
            if (found_tokens === null) { continue; }
            if(found_tokens.length > 1) { 
                return false; 
            }
        }
    }
    return true;
}
function TransUnitsAreSorted(xlfDom: Document) {
    let gXlfTransUnits: Element[] = [];
    let targetTransUnits = xlfDom.getElementsByTagNameNS(xmlns, 'trans-unit');
    // Remove Translate = No. There must be a better way?!
    for (let i = 0; i < gXlfDom.getElementsByTagNameNS(xmlns, 'trans-unit').length; i++) {
        if (gXlfDom.getElementsByTagNameNS(xmlns, 'trans-unit')[i].attributes.getNamedItem('translate')?.nodeValue?.toLowerCase() !== 'no') {
            gXlfTransUnits.push(gXlfDom.getElementsByTagNameNS(xmlns, 'trans-unit')[i]);
        }
    }
    for (let i = 0; i < gXlfTransUnits.length; i++) {
        let gTU = gXlfTransUnits[i];        
        let targetTU = targetTransUnits[i];
        assert.equal(gTU.attributes.getNamedItem('id')?.nodeValue, targetTU.attributes.getNamedItem('id')?.nodeValue);
    }
}
