import * as assert from 'assert';
import { ALObject } from '../ALObject/ALObject';
import { ALXmlComment } from '../ALObject/ALXmlComment';
import { ALProcedure } from '../ALObject/ALProcedure';
import * as ALObjectTestLibrary from './ALObjectTestLibrary';
suite("Classes.AL Functions Tests", function () {
    test("XML Comments No Line Breaks formatting", function () {
        assert.equal(ALXmlComment.formatMarkDown({ text: 'asfd <para>bold 1</para> sadf <para>bold 2</para> asdf', inTableCell: true }), `asfd   bold 1   sadf   bold 2   asdf`, 'Unexpected paragraph');
        assert.equal(ALXmlComment.formatMarkDown({ text: 'asfd <b>bold 1</b> sadf <b>bold 2</b> asdf', inTableCell: true }), 'asfd **bold 1** sadf **bold 2** asdf', 'Unexpected bold');
        assert.equal(ALXmlComment.formatMarkDown({ text: 'asfd <i>italic 1</i> sadf <i>italic 2</i> asdf', inTableCell: true }), 'asfd *italic 1* sadf *italic 2* asdf', 'Unexpected italic');
        assert.equal(ALXmlComment.formatMarkDown({ text: 'asfd <c>code 1</c> sadf <c>code 2</c> asdf', inTableCell: true }), 'asfd \`code 1\` sadf \`code 2\` asdf', 'Unexpected code');
        assert.equal(ALXmlComment.formatMarkDown({
            text: `asfd <code>code block 1
asdf afd</code>
sadf
<code>code block 2</code>
asdf`, inTableCell: true
        }), `asfd \`code block 1`, 'Unexpected code block');
    });

    test("XML Comments formatting", function () {
        assert.equal(ALXmlComment.formatMarkDown({ text: 'asfd <para>bold 1</para> sadf <para>bold 2</para> asdf' }), `asfd 

bold 1

 sadf 

bold 2

 asdf`, 'Unexpected paragraph');
        assert.equal(ALXmlComment.formatMarkDown({ text: 'asfd <b>bold 1</b> sadf <b>bold 2</b> asdf' }), 'asfd **bold 1** sadf **bold 2** asdf', 'Unexpected bold');
        assert.equal(ALXmlComment.formatMarkDown({ text: 'asfd <i>italic 1</i> sadf <i>italic 2</i> asdf' }), 'asfd *italic 1* sadf *italic 2* asdf', 'Unexpected italic');
        assert.equal(ALXmlComment.formatMarkDown({ text: 'asfd <c>code 1</c> sadf <c>code 2</c> asdf' }), 'asfd \`code 1\` sadf \`code 2\` asdf', 'Unexpected code');
        assert.equal(ALXmlComment.formatMarkDown({
            text: `asfd 
<code>code block 1
asdf afd</code>
sadf
<code>code block 2</code>
asdf` }), `asfd 

\`\`\`javascript
code block 1
asdf afd
\`\`\`
sadf

\`\`\`javascript
code block 2
\`\`\`
asdf`, 'Unexpected code block');
    });

    test("Interface with XML Comments", function () {
        const alObj = ALObject.getALObject(ALObjectTestLibrary.getInterfaceWithXmlComments(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        let proc: ALProcedure;
        proc = <ALProcedure>alObj.controls[0];
        assert.equal(alObj.controls.length, 3, 'Unexpected number of procedures');
        assert.equal(alObj.xmlComment?.summary, 'The Summary', 'Unexpected summary_');
        assert.equal(proc.xmlComment?.summary, 'The Function Summary', 'Unexpected function summary');
        assert.equal(proc.xmlComment?.parameters[0].name, 'Parameter', 'Unexpected parameter name');
        assert.equal(proc.xmlComment?.parameters[0].description, 'The first parameter', 'Unexpected description');
        assert.equal(proc.xmlComment?.parameters[1].name, 'pvRecRef', 'Unexpected parameter name 2');
        assert.equal(proc.xmlComment?.parameters[1].description, 'The second parameter', 'Unexpected description 2');
        proc = <ALProcedure>alObj.controls[1];
        assert.equal(proc.xmlComment?.summary, 'The 2nd Summary', 'Unexpected function summary 2');
        assert.equal(proc.name, 'TheProcedure2', 'Unexpected function name 2');
        assert.equal(proc.parameters[0].name, 'Parameter', 'Unexpected function parameter 2');
        assert.equal(proc.parameters[1].name, 'pvRecRef', 'Unexpected function parameter 3');
        assert.equal(proc.parameters[1].datatype, 'RecordRef', 'Unexpected function parameter datatype 3');
        assert.equal(proc.parameters[2].name, 'pvParameter', 'Unexpected function parameter 4');
        assert.equal(proc.parameters[2].fullDataType, 'Record "Table" temporary', 'Unexpected function parameter datatype 4');
        proc = <ALProcedure>alObj.controls[2];
        assert.equal(proc.xmlComment?.summary, 'The 3rd Summary', 'Unexpected function summary 3');
        assert.equal(proc.name, 'TheProcedure2', 'Unexpected function name 3');
        assert.equal(proc.parameters[0].name, 'pvParameter', 'Unexpected function parameter 3.1');
        assert.equal(proc.parameters[0].fullDataType, 'Record "Table" temporary', 'Unexpected function parameter datatype 2.1');

    });

    test("Codeunit with XML Comments", function () {
        const alObj = ALObject.getALObject(ALObjectTestLibrary.getCodeunitWithXmlComments(), true);
        if (!alObj) {
            assert.fail('Could not find object');
        }
        assert.equal(alObj.xmlComment?.summary, 'The Summary', 'Unexpected summary_');
        assert.equal(alObj.controls[0].xmlComment?.summary, 'The Function Summary', 'Unexpected function summary');
        assert.equal(alObj.controls[0].xmlComment?.parameters[0].name, 'Parameter', 'Unexpected parameter name');
        assert.equal(alObj.controls[0].xmlComment?.parameters[0].description, 'The <c>first</c> parameter', 'Unexpected description');
        assert.equal(alObj.controls[0].xmlComment?.parameters[1].name, 'pvRecRef', 'Unexpected parameter name 2');
        assert.equal(alObj.controls[0].xmlComment?.parameters[1].description, 'The second parameter', 'Unexpected description 2');
        assert.equal(alObj.controls[1].xmlComment?.summary, 'The 2nd Summary', 'Unexpected function summary 2');
        const proc: ALProcedure = <ALProcedure>alObj.controls[1];
        assert.equal(proc.name, 'TheProcedure2', 'Unexpected function name 2');
        assert.equal(proc.parameters[0].name, 'Parameter', 'Unexpected function parameter 2');
        assert.equal(proc.parameters[1].name, 'pvRecRef', 'Unexpected function parameter 3');
        assert.equal(proc.parameters[1].datatype, 'RecordRef', 'Unexpected function parameter datatype 3');
        assert.equal(proc.parameters[2].name, 'pvParameter', 'Unexpected function parameter 4');
        assert.equal(proc.parameters[2].fullDataType, 'Record "Table" temporary', 'Unexpected function parameter datatype 4');

    });


});


