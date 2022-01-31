import * as HTML from "../XliffEditor/HTML";
import * as assert from "assert";

suite("HTML Tests", function () {
  test("checkbox", function () {
    const checkbox = HTML.checkbox({ id: "1", checked: true });
    assert.deepStrictEqual(checkbox, '<input id="1" checked type="checkbox">');
  });

  test("table", function () {
    const columns = [
      { a: { id: "1" }, content: "Col 1" },
      { a: { id: "2" }, content: "Col 2" },
    ];
    const table = HTML.table({ id: "1" }, columns);
    assert.deepStrictEqual(
      table,
      '<table id="1"><tr ><td id="1">Col 1</td><td id="2">Col 2</td></tr></table>'
    );
  });

  test("tableHeader", function () {
    const tableHeader = HTML.tableHeader(["Header 1", "Header 2"]);
    assert.deepStrictEqual(
      tableHeader,
      '<thead><tr><th class="header-1">Header 1</th><th class="header-2">Header 2</th></tr></thead>'
    );
  });

  test("tr", function () {
    const tr = HTML.tr({ id: "row-1" }, [
      { content: "Prisoner 1", a: { id: "1" } },
      { content: "Prisoner 2", a: { id: "2" } },
    ]);
    assert.deepStrictEqual(
      tr,
      '<tr id="row-1"><td id="1">Prisoner 1</td><td id="2">Prisoner 2</td></tr>'
    );
  });

  test("div", function () {
    const div = HTML.div({ id: "1" }, "This is content");
    assert.deepStrictEqual(div, '<div id="1">This is content</div>');
  });

  test("textArea", function () {
    const textArea = HTML.textArea({ id: "1", class: "tArea" }, "I Am Text");
    assert.deepStrictEqual(
      textArea,
      `<textarea id="1" class="tArea">I Am Text</textarea>`
    );
  });

  test("button", function () {
    const button = HTML.button(
      { id: "1", class: "btn", onClick: "btnOnClick()" },
      "Benjamin Button"
    );
    assert.deepStrictEqual(
      button,
      `<button id="1" class="btn" onClick="btnOnClick()">Benjamin Button</button>`
    );
  });

  test("br", function () {
    let br = HTML.br();
    assert.deepStrictEqual(br, "<br/>");
    br = HTML.br(2);
    assert.deepStrictEqual(br, "<br/><br/>");
  });
  test("attributeString", function () {
    const attributes = {
      id: "id1",
      class: "className",
      name: "elementName",
      onClick: "callOnClick()",
      type: "inputType",
      checked: true,
      disabled: true,
      title: "elementTitle",
      align: "elementAlignment",
    };
    assert.deepStrictEqual(
      HTML.attributeString(attributes),
      'id="id1" class="className" name="elementName" onClick="callOnClick()" type="inputType" checked disabled title="elementTitle" align="elementAlignment"'
    );

    attributes.checked = false;
    attributes.disabled = false;
    assert.deepStrictEqual(
      HTML.attributeString(attributes),
      'id="id1" class="className" name="elementName" onClick="callOnClick()" type="inputType" title="elementTitle" align="elementAlignment"'
    );
    assert.deepStrictEqual(HTML.attributeString(), "");
  });

  test.only("nonce", function () {
    const nonce = HTML.getNonce();
    assert.ok(
      nonce.match(/^[a-zA-Z0-9]{32}$/),
      `nonce "${nonce}" has an unexpected format`
    );
  });
});
