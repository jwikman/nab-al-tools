import * as assert from 'assert';
import { Xliff, TransUnit, Target, Note, SizeUnit } from '../XLIFFDocument';
import { XmlFormattingOptionsFactory, ClassicXmlFormatter} from '../XmlFormatter';
import { GetSmallXliffXml } from './XLIFFTypes.test';

suite("XML Formatting", function () {

    test("Format Xliff Document", function () {
        const sourceXml = GetSmallXliffXml();
        let parsedXliff = Xliff.fromString(sourceXml);
        assert.equal(parsedXliff.sourceLanguage, 'en-US', 'Unexpected source language');
        assert.equal(parsedXliff.targetLanguage, 'sv-SE', 'Unexpected target language');
        assert.equal(parsedXliff.transunit.length, 2, 'Unexpected number of trans-units');
        let manualXliff = new Xliff('xml', 'en-US', 'sv-SE', 'AlTestApp');
        let manualNotes = [
            new Note('Developer', 'general', 2, ''),
            new Note('Xliff Generator', 'general', 3, 'Table MyTable - NamedType TestErr')
        ];

        let transUnit = new TransUnit('Table 2328808854 - NamedType 12557645', true, 'This is a test ERROR in table', new Target('This is a test ERROR in table', null), SizeUnit.char, 'preserve', manualNotes);
        manualXliff.transunit.push(transUnit);
        let manualNotes2 = [
            new Note('Developer', 'general', 2, ''),
            new Note('Xliff Generator', 'general', 3,'Page MyPage - NamedType TestErr')
        ];
        let transUnit2 = new TransUnit('Page 2931038265 - NamedType 12557645', true, 'This is a test ERROR', new Target('This is a test ERROR', null), SizeUnit.char, 'preserve', manualNotes2);
        manualXliff.transunit.push(transUnit2);
        assert.deepEqual(parsedXliff, manualXliff);
        let xmlFormatter = new ClassicXmlFormatter();
        let formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();
        const formatedXml = xmlFormatter.formatXml(manualXliff.toString(), formattingOptions);
        assert.equal(formatedXml.length, sourceXml.length, 'Formatted string length does match string length of source.');
        assert.equal(formatedXml, sourceXml, 'Formatted string does match source.');
    });

    test("Minify Xml", function() {
        let xmlFormatter = new ClassicXmlFormatter();
        let formattingOptions = XmlFormattingOptionsFactory.getALXliffXmlFormattingOptions();
        const xml = GetSmallXliffXml();
        const minifiedXml = xmlFormatter.minifyXml(xml, formattingOptions);
        assert.ok(minifiedXml);
        assert.equal(minifiedXml.split(formattingOptions.newLine).length, 1, 'Whoops! Minified XML contains to many line breaks');
    });
});