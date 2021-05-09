import * as assert from "assert";
import * as AlFunctions from "../AlFunctions";
import { XliffIdToken } from "../ALObject/XliffIdToken";
import { MultiLanguageObject } from "../ALObject/MultiLanguageObject";
import * as ALObjectTestLibrary from "./ALObjectTestLibrary";
import * as ALParser from "../ALObject/ALParser";

suite("Classes.AL Functions Tests", function () {
  test("AL Fnv", function () {
    assert.equal(AlFunctions.alFnv("MyPage"), 2931038265, "Value: MyPage");
    assert.equal(
      AlFunctions.alFnv("ActionName"),
      1692444235,
      "Value: ActionName"
    );
    assert.equal(AlFunctions.alFnv("OnAction"), 1377591017, "Value: OnAction");
    assert.equal(
      AlFunctions.alFnv("TestOnActionErr"),
      2384180296,
      "Value: TestOnActionErr"
    );
    assert.equal(
      AlFunctions.alFnv("TestProcLocal"),
      1531128287,
      "Value: TestProcLocal"
    );
    assert.equal(
      AlFunctions.alFnv("MyFieldOption"),
      2443090863,
      "Value: MyFieldOption"
    );
    assert.equal(
      AlFunctions.alFnv("OptionCaption"),
      62802879,
      "Value: OptionCaption"
    );
    assert.equal(AlFunctions.alFnv("MyTable"), 2328808854, "Value: MyTable");
    assert.equal(AlFunctions.alFnv("MyField"), 1296262074, "Value: MyField");
    // assert.equal(, AlFunctions.AlFnv(''),'Value: ');
  });

  test("XliffIdToken from Text", function () {
    const idConst = "Table 3999920088 - Field 1446865707 - Property 2879900210";
    const noteConst =
      "Table QWESP Chargeab. Chart Setup - Field Period Length - Property Caption";
    const result = XliffIdToken.getXliffIdTokenArray(idConst, noteConst);
    let fullIdArr = idConst.split(" ");
    fullIdArr = fullIdArr.filter((x) => x !== "-");
    const typeArr = fullIdArr.filter((x) => isNaN(Number(x)));
    const idArr = fullIdArr.filter((x) => !isNaN(Number(x)));

    for (let index = 0; index < result.length; index++) {
      const token = result[index];
      assert.equal(typeArr[index], token.type, "Type not the same");
      assert.equal(idArr[index], token.id, "Id not the same");
    }
  });

  test("AL Codeunit procedure(param with parenthesis) Xliff", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCodeunitWithFunctionsWithParenthesisParam(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const i: { i: number } = { i: 0 };

    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Codeunit 456387620 - Method 481402784 - NamedType 2350589126",
      "Codeunit NAB Test Codeunit - Method TheProcedure - NamedType MyLabel"
    );
    assert.equal(
      mlObjects[i.i - 1].transUnit()?.toString(),
      '<trans-unit id="Codeunit 456387620 - Method 481402784 - NamedType 2350589126" size-unit="char" translate="yes" xml:space="preserve"><source>The text</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Codeunit NAB Test Codeunit - Method TheProcedure - NamedType MyLabel</note></trans-unit>',
      "Codeunit NAB Test Codeunit - Method TheProcedure - NamedType MyLabel"
    );
  });

  test("AL Page with groups and repeater Xliff", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getPageWithGroupsAndRepeater(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const i: { i: number } = { i: 0 };

    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2975601355 - Property 2879900210",
      "Page Page with repeater - Property Caption"
    );
    assert.equal(
      mlObjects[i.i - 1].transUnit()?.toString(),
      '<trans-unit id="Page 2975601355 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>Page with repeater</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Property Caption</note></trans-unit>',
      "Page Page with repeater - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2975601355 - Control 459968125 - Property 1968111052",
      "Page Page with repeater - Control InstructionNonStripeGrp - Property InstructionalText"
    );
    assert.equal(
      mlObjects[i.i - 1].transUnit()?.toString(),
      '<trans-unit id="Page 2975601355 - Control 459968125 - Property 1968111052" size-unit="char" translate="yes" xml:space="preserve"><source>This is an instruction</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Control InstructionNonStripeGrp - Property InstructionalText</note></trans-unit>',
      "Page Page with repeater - Control InstructionNonStripeGrp - Property InstructionalText"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2975601355 - Control 4083082504 - Property 1968111052",
      "Page Page with repeater - Control Instruction1Grp - Property InstructionalText"
    );
    assert.equal(
      mlObjects[i.i - 1].transUnit()?.toString(),
      '<trans-unit id="Page 2975601355 - Control 4083082504 - Property 1968111052" size-unit="char" translate="yes" xml:space="preserve"><source>This is another instruction</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Control Instruction1Grp - Property InstructionalText</note></trans-unit>',
      "Page Page with repeater - Control Instruction1Grp - Property InstructionalText"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2975601355 - Control 739346273 - Property 2879900210",
      "Page Page with repeater - Control Group - Property Caption"
    );
    assert.equal(
      mlObjects[i.i - 1].transUnit()?.toString(),
      '<trans-unit id="Page 2975601355 - Control 739346273 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve"><source>My repeater</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Control Group - Property Caption</note></trans-unit>',
      "Page Page with repeater - Control Group - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2975601355 - Control 3461834954 - Property 1295455071",
      "Page Page with repeater - Control Description - Property ToolTip"
    );
    assert.equal(
      mlObjects[i.i - 1].transUnit()?.toString(),
      '<trans-unit id="Page 2975601355 - Control 3461834954 - Property 1295455071" size-unit="char" translate="yes" xml:space="preserve"><source>Specifies the description.</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Control Description - Property ToolTip</note></trans-unit>',
      "Page Page with repeater - Control Description - Property ToolTip"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2975601355 - Control 2491558131 - Property 1968111052",
      "Page Page with repeater - Control EvaluationGroup - Property InstructionalText"
    );
    assert.equal(
      mlObjects[i.i - 1].transUnit()?.toString(),
      '<trans-unit id="Page 2975601355 - Control 2491558131 - Property 1968111052" size-unit="char" translate="yes" xml:space="preserve"><source>Another instruction...</source><note from="Developer" annotates="general" priority="2"/><note from="Xliff Generator" annotates="general" priority="3">Page Page with repeater - Control EvaluationGroup - Property InstructionalText</note></trans-unit>',
      "Page Page with repeater - Control EvaluationGroup - Property InstructionalText"
    );
  });

  test("AL Table Xliff", function () {
    const alObj = ALParser.getALObjectFromText(ALObjectTestLibrary.getTable(), true);
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const i: { i: number } = { i: 0 };

    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Table 2328808854 - Property 2879900210",
      "Table MyTable - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Table 2328808854 - Field 1296262074 - Property 2879900210",
      "Table MyTable - Field MyField - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064",
      "Table MyTable - Field MyField - Method OnValidate - NamedType TestOnValidateErr"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Table 2328808854 - Field 3945078064 - Property 2879900210",
      "Table MyTable - Field MyField2 - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Table 2328808854 - Field 2443090863 - Property 2879900210",
      "Table MyTable - Field MyFieldOption - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Table 2328808854 - Field 2443090863 - Property 62802879",
      "Table MyTable - Field MyFieldOption - Property OptionCaption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Table 2328808854 - NamedType 12557645",
      "Table MyTable - NamedType TestErr"
    );
  });

  test("AL RoleCenterPage Xliff", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getRoleCenterPage(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });

    const i: { i: number } = { i: 0 };
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1933621741 - Property 2879900210",
      "Page My Role Center - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1933621741 - Action 3661919152 - Property 2879900210",
      "Page My Role Center - Action Jobs - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1933621741 - Action 2273701615 - Property 2879900210",
      "Page My Role Center - Action Job List - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1933621741 - Action 844797923 - Property 2879900210",
      "Page My Role Center - Action Job Tasks - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1933621741 - Action 369017905 - Property 2879900210",
      "Page My Role Center - Action Job Print Layouts - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1933621741 - Action 3504687331 - Property 2879900210",
      "Page My Role Center - Action Resources - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1933621741 - Action 4265073908 - Property 2879900210",
      "Page My Role Center - Action Resource List - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1933621741 - Action 3512836922 - Property 2879900210",
      "Page My Role Center - Action Resource Capacity - Property Caption"
    );
  });

  test("AL CueGroup page Xliff", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCueGroupPage(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const i: { i: number } = { i: 0 };
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1018816708 - Property 2879900210",
      "Page My Cue Part - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1018816708 - Control 1494066971 - Property 2879900210",
      "Page My Cue Part - Control Time Sheet Manager - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1018816708 - Control 3616567109 - Property 1295455071",
      "Page My Cue Part - Control Field1 - Property ToolTip"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1018816708 - Control 2978870492 - Property 1295455071",
      "Page My Cue Part - Control Field2 - Property ToolTip"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 1018816708 - Control 2978870492 - Property 2879900210",
      "Page My Cue Part - Control Field2 - Property Caption"
    );
  });

  test("AL Page Xliff", function () {
    const alObj = ALParser.getALObjectFromText(ALObjectTestLibrary.getPage(), true);
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const i: { i: number } = { i: 0 };
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2931038265 - Control 4105281732 - Property 2879900210",
      "Page MyPage - Control GroupName - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2931038265 - Control 4105281732 - Property 1968111052",
      "Page MyPage - Control GroupName - Property InstructionalText"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2931038265 - Control 2961552353 - Property 2879900210",
      "Page MyPage - Control Name - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2931038265 - Control 2961552353 - Property 1295455071",
      "Page MyPage - Control Name - Property ToolTip"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2931038265 - Control 2443090863 - Property 62802879",
      "Page MyPage - Control MyFieldOption - Property OptionCaption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2931038265 - Action 3862845261 - Property 1295455071",
      "Page MyPage - Action Processing - Property ToolTip"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2931038265 - Action 1692444235 - Method 1377591017 - NamedType 2384180296",
      "Page MyPage - Action ActionName - Method OnAction - NamedType TestOnActionErr"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2931038265 - NamedType 12557645",
      "Page MyPage - NamedType TestErr"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Page 2931038265 - Method 3998599243 - NamedType 1531128287",
      "Page MyPage - Method MyProcedure - NamedType TestProcLocal"
    );
  });

  test("AL Codeunit Xliff", function () {
    const alObj = ALParser.getALObjectFromText(ALObjectTestLibrary.getCodeunit(), true);
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const i: { i: number } = { i: 0 };
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Codeunit 456387620 - Method 1665861916 - NamedType 1061650423",
      "Codeunit NAB Test Codeunit - Method OnRun - NamedType LocalTestLabelTxt"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Codeunit 456387620 - Method 1968185403 - NamedType 1061650423",
      "Codeunit NAB Test Codeunit - Method TestMethod - NamedType LocalTestLabelTxt"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Codeunit 456387620 - NamedType 2688233357",
      "Codeunit NAB Test Codeunit - NamedType GlobalTestLabelTxt"
    );
  });

  test("AL Query Xliff", function () {
    const alObj = ALParser.getALObjectFromText(ALObjectTestLibrary.getQuery(), true);
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const i: { i: number } = { i: 0 };
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Query 3258925707 - Property 2879900210",
      "Query NAB Test Query - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Query 3258925707 - QueryColumn 967337907 - Property 2879900210",
      "Query NAB Test Query - QueryColumn ColumnName - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Query 3258925707 - Method 1336600528 - NamedType 1061650423",
      "Query NAB Test Query - Method OnBeforeOpen - NamedType LocalTestLabelTxt"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Query 3258925707 - Method 1968185403 - NamedType 1061650423",
      "Query NAB Test Query - Method TestMethod - NamedType LocalTestLabelTxt"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Query 3258925707 - NamedType 2688233357",
      "Query NAB Test Query - NamedType GlobalTestLabelTxt"
    );
  });

  test("AL TableExt Xliff", function () {
    const alObj = ALParser.getALObjectFromText(ALObjectTestLibrary.getTableExt(), true);
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const i: { i: number } = { i: 0 };
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "TableExtension 3999646232 - Field 4159685971 - Property 62802879",
      "TableExtension NAB Test Table Ext - Field NAB Test Field - Property OptionCaption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "TableExtension 3999646232 - Field 4159685971 - Property 2879900210",
      "TableExtension NAB Test Table Ext - Field NAB Test Field - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "TableExtension 3999646232 - Field 4159685971 - Method 1213635141 - NamedType 1061650423",
      "TableExtension NAB Test Table Ext - Field NAB Test Field - Method OnLookup - NamedType LocalTestLabelTxt"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "TableExtension 3999646232 - Method 1968185403 - NamedType 1061650423",
      "TableExtension NAB Test Table Ext - Method TestMethod - NamedType LocalTestLabelTxt"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "TableExtension 3999646232 - NamedType 1399329827",
      "TableExtension NAB Test Table Ext - NamedType TableExtLabel"
    );
  });

  test("AL PageExt Xliff", function () {
    const alObj = ALParser.getALObjectFromText(ALObjectTestLibrary.getPageExt(), true);
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });

    const i: { i: number } = { i: 0 };
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "PageExtension 3795862579 - Control 3146432722 - Property 2879900210",
      "PageExtension NAB Test PageExt - Control NAB Blocked3 - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "PageExtension 3795862579 - Control 3146432722 - Property 1295455071",
      "PageExtension NAB Test PageExt - Control NAB Blocked3 - Property ToolTip"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "PageExtension 3795862579 - Control 3146432722 - Property 62802879",
      "PageExtension NAB Test PageExt - Control NAB Blocked3 - Property OptionCaption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "PageExtension 3795862579 - Action 3144175164 - Property 2879900210",
      "PageExtension NAB Test PageExt - Action NAB Grp - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "PageExtension 3795862579 - Action 3144175164 - Property 1295455071",
      "PageExtension NAB Test PageExt - Action NAB Grp - Property ToolTip"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "PageExtension 3795862579 - Action 1483499693 - Property 2879900210",
      "PageExtension NAB Test PageExt - Action NAB Act - Property Caption"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "PageExtension 3795862579 - Action 1483499693 - Property 1295455071",
      "PageExtension NAB Test PageExt - Action NAB Act - Property ToolTip"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "PageExtension 3795862579 - Action 1483499693 - Method 1377591017 - NamedType 1061650423",
      "PageExtension NAB Test PageExt - Action NAB Act - Method OnAction - NamedType LocalTestLabelTxt"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "PageExtension 3795862579 - Method 3244334789 - NamedType 1061650423",
      "PageExtension NAB Test PageExt - Method TestMethodPageExt - NamedType LocalTestLabelTxt"
    );
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "PageExtension 3795862579 - NamedType 2688233357",
      "PageExtension NAB Test PageExt - NamedType GlobalTestLabelTxt"
    );
  });

  test("AL Enum Xliff", function () {
    const alObj = ALParser.getALObjectFromText(ALObjectTestLibrary.getEnum(), true);
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    const i: { i: number } = { i: 0 };
    assert.equal(
      getNextObject(i, mlObjects).xliffId(),
      "Enum 3133857684 - EnumValue 1445202145 - Property 2879900210",
      "Enum NAB TestEnum - EnumValue MyValue - Property Caption"
    );
  });

  // test("CodeGenerator", function () {
  //     //let alObj: ALObject.ALObject = new ALObject.ALObject(ALObjectTestLibrary.GetTable(), true);
  //     let alObj = ALObject.getALObject(ALObjectTestLibrary.getCueGroupPage(), true);
  //     if (!alObj) {
  //         assert.fail('Could not find object');
  //     }
  //     let mlObjects = alObj.getMultiLanguageObjects(true);
  //     for (let index = 0; index < mlObjects.length; index++) {
  //         const mlObject = mlObjects[index];
  //         console.log(`assert.equal(getNextObject(i, mlObjects).xliffId(), '${mlObject.xliffId()}', '${mlObject.xliffIdWithNames()}');`);
  //         //            console.log(`assert.equal(mlObjects[i.i - 1].transUnit()?.toString(), '${mlObject.transUnit()?.toString()}', '${mlObject.xliffIdWithNames()}');`);
  //     }
  // });
});
function getNextObject(
  i: { i: number },
  mlObject: MultiLanguageObject[]
): MultiLanguageObject {
  i.i++;
  return mlObject[i.i - 1];
}
