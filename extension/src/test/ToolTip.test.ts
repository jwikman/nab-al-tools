import * as assert from 'assert';
import * as ToolTipsFunctions from '../ToolTipsFunctions';
import { ALObject } from '../ALObject/ALObject';
import * as TestToolLibrary from './TestToolLibrary';

suite("ToolTip", function () {
    test("Generate ToolTip Docs", function () {
        let alObjects: ALObject[] = new Array();
        addObjectToArray(alObjects, TestToolLibrary.getTable());
        addObjectToArray(alObjects, TestToolLibrary.getTableExtension());
        addObjectToArray(alObjects, TestToolLibrary.getPageExt());
        addObjectToArray(alObjects, TestToolLibrary.getPagePart());
        addObjectToArray(alObjects, TestToolLibrary.getPagePart2());
        addObjectToArray(alObjects, TestToolLibrary.getPage());
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