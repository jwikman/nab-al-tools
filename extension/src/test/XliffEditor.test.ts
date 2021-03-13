import * as assert from 'assert';
import * as html from '../XliffEditor/HTML';

suite("Xliff Editor Tests", function () {


    test("html.attributeString()", async function () {
        const attributes: html.HTMLAttributes = {
            id: "test-id",
            class: "test-class",
            name: "test-name",
            onClick: "testOnClick()",
            type: "text",
            checked: true,
            disabled: true,
            title: "cool title",
            align: "center",
        };
        assert.equal(html.attributeString(attributes), `id="test-id" class="test-class" name="test-name" onClick="testOnClick()" type="text" checked disabled title="cool title" align="center"`, "Unexpted attribute string");
    });

});
