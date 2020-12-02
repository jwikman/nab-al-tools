import * as assert from 'assert';
import * as ToolTipsFunctions from '../ToolTipsFunctions';
import { ALObject } from '../ALObject/ALObject';
import * as ToolTipLibrary from './ToolTipLibrary';

suite("ToolTip", function () {
    test("Generate ToolTip Docs", function () {
        let alObjects: ALObject[] = new Array();
        addObjectToArray(alObjects, ToolTipLibrary.getTable());
        addObjectToArray(alObjects, ToolTipLibrary.getTableExtension());
        addObjectToArray(alObjects, ToolTipLibrary.getPageExt());
        addObjectToArray(alObjects, ToolTipLibrary.getPagePart());
        addObjectToArray(alObjects, ToolTipLibrary.getPagePart2());
        addObjectToArray(alObjects, ToolTipLibrary.getPage());
        let text = ToolTipsFunctions.getToolTipDocumentation(alObjects);
        text = text.replace(/(\r\n|\n)/gm, '\n');
        assert.equal(text, `# Pages Overview

## Pages

### NAB ToolTip Part 2

| Type | Caption | Description |
| ----- | --------- | ------- |
| Field | Field 1 | Specifies the value of the Field 1 field |
| Field | Field 2 | Specifies the value of the Field 2 field |
| Field | Field 3 | Specifies the value of the Field 3 field |

### NAB ToolTips

| Type | Caption | Description |
| ----- | --------- | ------- |
| Field | PK | Specifies the value of the PK field |
| Field | Field 1 | Specifies the value of the Field 1 field |
| Field | Field 2 | Specifies the value of the Field 2 field |
| Field | Field 3 | Specifies the value of the Field 3 |
| Sub page | NAB ToolTip Part 2 | [NAB ToolTip Part 2](#nab-tooltip-part-2) |
`);
    });

});

function addObjectToArray(alObjects: ALObject[], objectAsText: string) {
    let alObj = ALObject.getALObject(objectAsText, true, undefined, alObjects);
    if (!alObj) {
        assert.fail(`Could not find object. ${objectAsText}`);
    }
    alObjects.push(alObj);
}