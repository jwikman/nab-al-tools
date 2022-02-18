import * as assert from "assert";
import { ALXmlComment } from "../ALObject/ALXmlComment";
import { ALProcedure } from "../ALObject/ALProcedure";
import * as ALObjectTestLibrary from "./ALObjectTestLibrary";
import {
  ALAccessModifier,
  ALControlType,
  ALObjectType,
  ALPropertyType,
  MultiLanguageType,
} from "../ALObject/Enums";
import { ALVariable } from "../ALObject/ALVariable";
import { removeGroupNamesFromRegex } from "../constants";
import * as ALParser from "../ALObject/ALParser";
import { ALObject, ALControl } from "../ALObject/ALElementTypes";
import { ALCodeLine } from "../ALObject/ALCodeLine";
import { ALPageField } from "../ALObject/ALPageField";
import { ALTableField } from "../ALObject/ALTableField";
import { ALPagePart } from "../ALObject/ALPagePart";

suite("Classes.AL Functions Tests", function () {
  test("SpecialCharacters XLIFF", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getTableWithSpecialCharacters(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const fld = alObj
      .getAllControls(ALControlType.tableField)
      .filter((c) => c.name === "My <> & Field")[0];
    const caption = fld
      .getAllMultiLanguageObjects()
      .filter((x) => x.name === MultiLanguageType.caption)[0];
    const xliffId = caption.xliffId();
    assert.strictEqual(
      xliffId,
      "Table 596208023 - Field 1942294334 - Property 2879900210",
      "unexpected XliffId"
    );
  });

  test("Obsolete Page Controls", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getPageWithObsoleteControls(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }

    let control = alObj.getControl(ALControlType.pageField, "Name");
    if (!control) {
      assert.fail("Could not find Name");
    }
    assert.strictEqual(control.name, "Name", "Unexpected name 1");
    assert.strictEqual(
      control.getObsoletePendingInfo()?.obsoleteState,
      "Pending",
      "Unexpected State 1"
    );
    assert.strictEqual(
      control.getObsoletePendingInfo()?.obsoleteReason,
      "The Reason",
      "Unexpected Reason 1"
    );
    assert.strictEqual(
      control.getObsoletePendingInfo()?.obsoleteTag,
      "The Tag",
      "Unexpected Tag 1"
    );

    control = alObj.getControl(ALControlType.action, "ActionName");
    if (!control) {
      assert.fail("Could not find ActionName");
    }
    assert.strictEqual(control.name, "ActionName", "Unexpected name 2");
    assert.strictEqual(
      control.getObsoletePendingInfo()?.obsoleteState,
      "Pending",
      "Unexpected State 2"
    );
    assert.strictEqual(
      control.getObsoletePendingInfo()?.obsoleteReason,
      "The Action Reason",
      "Unexpected Reason 2"
    );
    assert.strictEqual(
      control.getObsoletePendingInfo()?.obsoleteTag,
      "The Action Tag",
      "Unexpected Tag 2"
    );
  });

  test("Obsolete Codeunit Procedures", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCodeunitWithObsoletedMethods(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }

    let method = alObj.getControl(
      ALControlType.procedure,
      "TestMethod"
    ) as ALProcedure;
    if (!method) {
      assert.fail("Could not find TestMethod");
    }
    assert.strictEqual(method.name, "TestMethod", "Unexpected name 1");
    assert.strictEqual(
      method.getObsoletePendingInfo()?.obsoleteState,
      "Pending",
      "Unexpected State 1"
    );
    assert.strictEqual(
      method.getObsoletePendingInfo()?.obsoleteReason,
      "The reason",
      "Unexpected Reason 1"
    );
    assert.strictEqual(
      method.getObsoletePendingInfo()?.obsoleteTag,
      "The Tag",
      "Unexpected Tag 1"
    );

    method = alObj.getControl(
      ALControlType.procedure,
      "OnBeforeWhatever"
    ) as ALProcedure;
    if (!method) {
      assert.fail("Could not find OnBeforeWhatever");
    }
    assert.strictEqual(method.name, "OnBeforeWhatever", "Unexpected name 2");
    assert.strictEqual(
      method.getObsoletePendingInfo()?.obsoleteState,
      "Pending",
      "Unexpected State 2"
    );
    assert.strictEqual(
      method.getObsoletePendingInfo()?.obsoleteReason,
      "The Event reason",
      "Unexpected Reason 2"
    );
    assert.strictEqual(
      method.getObsoletePendingInfo()?.obsoleteTag,
      "The Event Tag",
      "Unexpected Tag 2"
    );
    assert.strictEqual(
      method.attributes[0].startsWith("IntegrationEvent("),
      true,
      "Unexpected IntegrationEvent attribute 2"
    );
    assert.strictEqual(
      method.attributes[1].startsWith("Obsolete("),
      true,
      "Unexpected Obsolete attribute 2"
    );
  });

  test("Obsolete Procedure", function () {
    testObsoleteProcedure(
      `
        [Obsolete('Reason','Tag')]
        procedure MyTest1(First: Integer)`,
      true,
      "Reason",
      "Tag"
    );

    testObsoleteProcedure(
      `
        [Obsolete('Reason')]
        procedure MyTest2(First: Integer)`,
      true,
      "Reason",
      ""
    );

    testObsoleteProcedure(
      `
        [Obsolete()]
        procedure MyTest3(First: Integer)`,
      true,
      "",
      ""
    );

    testObsoleteProcedure(
      `
        [Obsolete]
        procedure MyTest4(First: Integer)`,
      true,
      "",
      ""
    );

    testObsoleteProcedure(
      `
        [AnyOtherAttribute]
        procedure MyTest5(First: Integer)`,
      false,
      "",
      ""
    );

    testObsoleteProcedure(
      `
        [Obsolete('Reason with a "lot" of text wi''th double '' in it ', 'Tag')]
        procedure MyTest6(First: Integer)`,
      true,
      "Reason with a \"lot\" of text wi''th double '' in it ",
      "Tag"
    );
  });

  function testObsoleteProcedure(
    procedureString: string,
    obsolete: boolean,
    obsoleteReason: string,
    obsoleteTag: string
  ): void {
    const procedure = ALProcedure.fromString(procedureString);

    const obsoleteInfo = procedure.getObsoletePendingInfo();
    if (obsolete) {
      if (!obsoleteInfo) {
        assert.notEqual(
          obsoleteInfo,
          undefined,
          `Not obsoleted ${procedure.name}`
        );
      } else {
        assert.strictEqual(
          obsoleteInfo.obsoleteReason,
          obsoleteReason,
          `Unexpected obsoleteReason ${procedure.name}`
        );
        assert.strictEqual(
          obsoleteInfo.obsoleteTag,
          obsoleteTag,
          `Unexpected obsoleteTag ${procedure.name}`
        );
      }
    } else {
      assert.strictEqual(
        obsoleteInfo,
        undefined,
        `Unexpected obsolete ${procedure.name}`
      );
    }
  }
  test("API Page", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getApiPage(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    assert.strictEqual(
      alObj.getPropertyValue(ALPropertyType.apiGroup),
      "appName",
      "Unexpected APIGroup"
    );
    assert.strictEqual(
      alObj.getPropertyValue(ALPropertyType.apiPublisher),
      "publisher",
      "Unexpected APIPublisher"
    );
    assert.strictEqual(
      alObj.getPropertyValue(ALPropertyType.apiVersion),
      "v1.0",
      "Unexpected APIVersion"
    );
    assert.strictEqual(
      alObj.getPropertyValue(ALPropertyType.entityName),
      "customer",
      "Unexpected EntityName"
    );
    assert.strictEqual(
      alObj.getPropertyValue(ALPropertyType.entitySetName),
      "customers",
      "Unexpected EntitySetName"
    );
  });

  test("Report Extension", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getReportExtension(),
      true
    );
    assert.ok(alObj, "Could not parse Report Extension");
    assert.deepStrictEqual(
      alObj.name,
      "NAB Test Report Ext.",
      "Unexpected Name"
    );
    assert.deepStrictEqual(
      alObj.extendedObjectName,
      "Customer - Top 10 List",
      "Unexpected Extended Object Name"
    );
    assert.deepStrictEqual(
      alObj.controls.length,
      3,
      "Unexpected control length"
    );
    assert.deepStrictEqual(
      alObj.controls[0].name,
      "Address",
      "Unexpected Address (0)"
    );
    assert.deepStrictEqual(
      alObj.controls[0].type,
      ALControlType.column,
      "Unexpected type (0)"
    );
    assert.deepStrictEqual(
      alObj.controls[2].name,
      "BalanceLCY_Customer",
      "Unexpected BalanceLCY_Customer (2)"
    );
    assert.deepStrictEqual(
      alObj.controls[2].type,
      ALControlType.modifiedReportColumn,
      "Unexpected type (2)"
    );
  });

  test("Remove group names from RegEx", function () {
    assert.strictEqual(
      removeGroupNamesFromRegex("?<test>asdf"),
      "asdf",
      "1. Groups not removed"
    );
    assert.strictEqual(
      removeGroupNamesFromRegex("(?<test>asdf)(?<wer>qwer)"),
      "(asdf)(qwer)",
      "2. Groups not removed"
    );
  });

  test("ALControl parsing", function () {
    testAlControlParsing(
      'field("IOGRec.""Location Code"""; IOGRec."Location Code")',
      ALObjectType.page,
      ALControlType.pageField,
      'IOGRec."Location Code"',
      'IOGRec."Location Code"'
    );

    testAlControlParsing(
      'field("gGLAccount.""No.""";gGLAccount."No.")',
      ALObjectType.page,
      ALControlType.pageField,
      'gGLAccount."No."',
      'gGLAccount."No."'
    );

    testAlControlParsing(
      'part("Table Setup"; "QWESR External System Subp.")',
      ALObjectType.page,
      ALControlType.part,
      "Table Setup",
      "QWESR External System Subp."
    );

    testAlControlParsing(
      'dataitem(ExtSystemSyncHistoryLine; "QWESR Ext. Sys. Sync Hist. Lne")',
      ALObjectType.report,
      ALControlType.dataItem,
      "ExtSystemSyncHistoryLine"
    );

    testAlControlParsing(
      'field(11; "Change Type"; Enum "QWESR Ext. Sys. Change Type")',
      ALObjectType.table,
      ALControlType.tableField,
      "Change Type",
      'Enum "QWESR Ext. Sys. Change Type"'
    );
  });

  function testAlControlParsing(
    codeLine: string,
    objectType: ALObjectType,
    alControlType: ALControlType,
    name: string,
    value?: string
  ): void {
    const alControl = ALParser.matchALControl(
      new ALObject([], objectType, 0, "DUMMY"),
      0,
      new ALCodeLine(codeLine, 0)
    );
    assert.ok(
      alControl,
      `Line '${codeLine}' could not be parsed as an ALControl`
    );
    assert.strictEqual(
      alControl.name,
      name,
      `Unexpected name from line '${codeLine}'`
    );
    assert.strictEqual(
      alControl.type,
      alControlType,
      `Unexpected type from line '${codeLine}'`
    );
    if (value) {
      switch (alControlType) {
        case ALControlType.pageField:
          assert.strictEqual(
            (alControl as ALPageField).value,
            value,
            `Unexpected value from line '${codeLine}'`
          );
          break;
        case ALControlType.part:
          assert.strictEqual(
            (alControl as ALPagePart).value,
            value,
            `Unexpected value from line '${codeLine}'`
          );
          break;
        case ALControlType.tableField:
          assert.strictEqual(
            (alControl as ALTableField).dataType,
            value,
            `Unexpected value from line '${codeLine}'`
          );
          break;
        default:
          assert.fail(`ALControlType ${alControlType} is not supported`);
      }
    }
  }

  test("Procedure parsing", function () {
    testProcedure(
      `    internal procedure GetBusinessRelatedSystemIds(TableId: Integer; SystemId: Guid; var RelatedSystemIds: Dictionary of [Integer, List of [Guid]])`,
      0,
      ALAccessModifier.internal,
      "GetBusinessRelatedSystemIds",
      3,
      0
    );
    testProcedure(
      `[IntegrationEvent(false, false)]
local procedure OnCalcDateBOCOnAfterGetCalendarCodes(var CustomCalendarChange: Array[2] of Record "Customized Calendar Change")`,
      1,
      ALAccessModifier.local,
      "OnCalcDateBOCOnAfterGetCalendarCodes",
      1,
      1
    );
    testProcedure(
      `    local procedure CalcTotalAndVar(var Value: array[5, 5] of Decimal)`,
      0,
      ALAccessModifier.local,
      "CalcTotalAndVar",
      1,
      0
    );
    testProcedure(
      `    local procedure CalcAndInsertPeriodAxis(var BusChartBuf: Record "Business Chart Buffer"; AccountSchedulesChartSetup: Record "Account Schedules Chart Setup"; Period: Option ,Next,Previous; MaxPeriodNo: Integer; StartDate: Date; EndDate: Date)`,
      0,
      ALAccessModifier.local,
      "CalcAndInsertPeriodAxis",
      6,
      0
    );
    testProcedure(
      `    procedure Load(MatrixColumns1: array[32] of Text[80]; var MatrixRecords1: array[32] of Record "Cause of Absence"; PeriodType1: Enum "Analysis Period Type"; AbsenceAmountType1: Enum "Analysis Amount Type"; EmployeeNoFilter1: Text)`,
      0,
      ALAccessModifier.public,
      "Load",
      5,
      0
    );
    testProcedure(
      `    procedure GetUser(UserPrincipalName: Text; var UserInfo: DotNet UserInfo)`,
      0,
      ALAccessModifier.public,
      "GetUser",
      2,
      0
    );
    testProcedure(
      `    local procedure RecalculateAmounts(JobExchCalculation: Option "Fixed FCY","Fixed LCY"; xAmount: Decimal; var Amount: Decimal; var AmountLCY: Decimal);`,
      0,
      ALAccessModifier.local,
      "RecalculateAmounts",
      4,
      0
    );

    testProcedure(
      `
      /// <summary>
      /// The 2nd Summary
      /// </summary>
      /// <param name="Parameter">The first parameter</param>
      /// <param name="pvRecRef">The second parameter</param>
      /// <returns>Anything</returns>
      procedure TheProcedure2(
            Parameter: Record "Table"; 
            var pvRecRef: RecordRef;
            var pvParameter: Record "Table" temporary
        ) : Integer`,
      7,
      ALAccessModifier.public,
      "TheProcedure2",
      3,
      0,
      "Integer"
    );

    testProcedure(
      `[attribute]
       #pragma warning disable AL0432 // whatever
       procedure MyTest(First: Integer)
       #pragma warning restore AL0432`,
      2,
      ALAccessModifier.public,
      "MyTest",
      1,
      1
    );

    testProcedure(
      "procedure GetBCUrl(var pvRec: Variant; pClientType: Option Current,Default,Windows,Web,SOAP,OData,NAS,Background,Management; pPageId: Integer; pUseFilter: Boolean): Text;",
      0,
      ALAccessModifier.public,
      "GetBCUrl",
      4,
      0,
      "Text"
    );
    testProcedure(
      "procedure MyTest()",
      0,
      ALAccessModifier.public,
      "MyTest",
      0,
      0
    );
    testProcedure(
      "local procedure MyTest()",
      0,
      ALAccessModifier.local,
      "MyTest",
      0,
      0
    );
    testProcedure(
      "internal procedure MyTest()",
      0,
      ALAccessModifier.internal,
      "MyTest",
      0,
      0
    );
    testProcedure(
      "protected procedure MyTest()",
      0,
      ALAccessModifier.protected,
      "MyTest",
      0,
      0
    );
    testProcedure(
      "procedure MyTest(First: Integer)",
      0,
      ALAccessModifier.public,
      "MyTest",
      1,
      0
    );
    testProcedure(
      `[attribute]
        [attribute2]
        [attribute3]
        procedure MyTest(First: Integer)`,
      3,
      ALAccessModifier.public,
      "MyTest",
      1,
      3
    );
    testProcedure(
      `[attribute]
        [attribute2]
        #pragma warning disable AL0432 // whatever
        // whatever
        [attribute3]
        procedure MyTest(First: Integer)`,
      5,
      ALAccessModifier.public,
      "MyTest",
      1,
      3
    );
    testProcedure(
      "procedure MyTest(First: Integer; Second: Decimal)",
      0,
      ALAccessModifier.public,
      "MyTest",
      2,
      0
    );
    testProcedure(
      "procedure MyTest(First: Integer; Second: Decimal) : Integer",
      0,
      ALAccessModifier.public,
      "MyTest",
      2,
      0,
      "Integer"
    );
    testProcedure(
      "procedure MyTest(First: Integer; Second: Decimal) : List of [Text]",
      0,
      ALAccessModifier.public,
      "MyTest",
      2,
      0,
      "List of [Text]"
    );
    testProcedure(
      "procedure MyTest(First: Integer; Second: Decimal) : Dictionary of [Integer, Text]",
      0,
      ALAccessModifier.public,
      "MyTest",
      2,
      0,
      "Dictionary of [Integer, Text]"
    );
    testProcedure(
      "procedure MyTest(First: Integer; Second: Decimal) : Dictionary of [Integer, Dictionary of [Integer, Text]]",
      0,
      ALAccessModifier.public,
      "MyTest",
      2,
      0,
      "Dictionary of [Integer, Dictionary of [Integer, Text]]"
    );
    testProcedure(
      " procedure MyTest(First: Integer; Second: Decimal) returns : Integer;",
      0,
      ALAccessModifier.public,
      "MyTest",
      2,
      0,
      "Integer"
    );
    testProcedure(
      'local procedure MyTest(First: Integer; Second: Decimal; Third: Record "Sales Line") returns : Record "Sales Header"',
      0,
      ALAccessModifier.local,
      "MyTest",
      3,
      0,
      "Record",
      '"Sales Header"'
    );
    testProcedure(
      `local procedure MyTest(
            First: Integer; 
            Second: Decimal; 
            Third: Record "Sales Line"
        ) returns : Record "Sales Header"`,
      0,
      ALAccessModifier.local,
      "MyTest",
      3,
      0,
      "Record",
      '"Sales Header"'
    );
  });

  function testProcedure(
    procedureString: string,
    procedureLineNo: number,
    access: ALAccessModifier,
    name: string,
    parameterCount: number,
    attributeCount: number,
    returnDataType?: string,
    returnSubtype?: string
  ): void {
    const alControl = new ALControl(ALControlType.procedure, "dummy");
    const alCodeLines = ALCodeLine.fromString(procedureString);
    assert.ok(
      alCodeLines.length >= procedureLineNo + 1,
      `procedureLineNo (${procedureLineNo}) cannot more than the number of lines (${alCodeLines.length})`
    );
    const procedure = ALParser.parseProcedureDeclaration(
      alControl,
      alCodeLines,
      procedureLineNo
    ) as ALProcedure;

    assert.strictEqual(
      procedure.access,
      access,
      `Unexpected access (${procedureString})`
    );
    assert.strictEqual(
      procedure.name,
      name,
      `Unexpected name (${procedureString})`
    );
    assert.strictEqual(
      procedure.parameters.length,
      parameterCount,
      `Unexpected number of parameters (${procedureString})`
    );
    assert.strictEqual(
      procedure.attributes.length,
      attributeCount,
      `Unexpected number of attributes (${procedureString})`
    );
    if (returnDataType) {
      assert.strictEqual(
        procedure.returns?.datatype,
        returnDataType,
        `Unexpected return datatype (${procedureString})`
      );
      if (returnSubtype) {
        assert.strictEqual(
          procedure.returns?.subtype,
          returnSubtype,
          `Unexpected return subtype (${procedureString})`
        );
      } else {
        assert.strictEqual(
          procedure.returns?.subtype,
          undefined,
          `Unexpected return subtype 2 (${procedureString})`
        );
      }
    } else {
      assert.strictEqual(
        procedure.returns,
        undefined,
        `Unexpected return (${procedureString})`
      );
    }
  }
  test("Parameter parsing", function () {
    testParameter(
      "var RelatedSystemIds: Dictionary of [Integer, List of [Guid]]",
      true,
      "RelatedSystemIds",
      "Dictionary of [Integer, List of [Guid]]"
    );
    testParameter(
      "var Value: array[5, 5,4, 5 , 4] of Decimal",
      true,
      "Value",
      "array[5, 5,4, 5 , 4] of Decimal",
      "Decimal"
    );
    testParameter(
      "var Value: array[5, 5] of Decimal",
      true,
      "Value",
      "array[5, 5] of Decimal",
      "Decimal"
    );
    testParameter(
      "Period: Option ,Next,Previous",
      false,
      "Period",
      "Option ,Next,Previous",
      ",Next,Previous"
    );
    testParameter(
      'var MatrixRecords1: array[32] of Record "Cause of Absence"',
      true,
      "MatrixRecords1",
      'array[32] of Record "Cause of Absence"',
      'Record "Cause of Absence"'
    );
    testParameter(
      "MatrixColumns1: array[32] of Text[80]",
      false,
      "MatrixColumns1",
      "array[32] of Text[80]",
      "Text[80]"
    );
    testParameter(
      " var pUserInfo: DotNet UserInfo",
      true,
      "pUserInfo",
      "DotNet UserInfo",
      "UserInfo"
    );
    testParameter(" myParam: Code[20]", false, "myParam", "Code[20]");
    testParameter(" myParam: integer ", false, "myParam", "integer");
    testParameter("myParam: integer", false, "myParam", "integer");
    testParameter(
      "myParam: List of [Text]",
      false,
      "myParam",
      "List of [Text]"
    );
    testParameter(
      "myParam: List of [Text[100]]",
      false,
      "myParam",
      "List of [Text[100]]"
    );
    testParameter(
      "myParam: Dictionary of [Integer, Text]",
      false,
      "myParam",
      "Dictionary of [Integer, Text]"
    );
    testParameter(
      "myParam: Dictionary of [Integer, Code[20]]",
      false,
      "myParam",
      "Dictionary of [Integer, Code[20]]"
    );
    testParameter("var myParam: integer", true, "myParam", "integer");
    testParameter(
      "var myParam: Record Item temporary",
      true,
      "myParam",
      "Record Item temporary",
      "Item"
    );
    testParameter(
      "var myParam: Record Item",
      true,
      "myParam",
      "Record Item",
      "Item"
    );
    testParameter(
      'var myParam: Record "Sales Header"',
      true,
      "myParam",
      'Record "Sales Header"',
      '"Sales Header"'
    );
    testParameter(
      ' myParam: Record "Sales Header"',
      false,
      "myParam",
      'Record "Sales Header"',
      '"Sales Header"'
    );
    testParameter(
      'var myParam: Record "Name [) _0 | ""() []{}"',
      true,
      "myParam",
      'Record "Name [) _0 | ""() []{}"',
      '"Name [) _0 | ""() []{}"'
    );
    testParameter(
      'var "myParam with space": integer',
      true,
      '"myParam with space"',
      "integer"
    );
  });

  function testParameter(
    paramString: string,
    byRef: boolean,
    name: string,
    fullDataType: string,
    subtype?: string
  ): void {
    const param = ALVariable.fromString(paramString);
    assert.strictEqual(param.byRef, byRef, `Unexpected byRef (${paramString})`);
    assert.strictEqual(param.name, name, `Unexpected name (${paramString})`);
    assert.strictEqual(
      param.fullDataType,
      fullDataType,
      `Unexpected datatype (${paramString})`
    );
    assert.strictEqual(
      param.subtype,
      subtype,
      `Unexpected subtype (${paramString})`
    );
  }

  test("ALObject to string", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getObsoletePage(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    assert.strictEqual(
      alObj.toString().trimEnd(),
      ALObjectTestLibrary.getObsoletePage().trimEnd(),
      "Object not untouched (Double negations, yey!)"
    );
  });

  test("Obsolete Page", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getObsoletePage(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    const mlObjects = alObj.getAllMultiLanguageObjects({
      onlyForTranslation: true,
    });
    assert.strictEqual(
      mlObjects.length,
      0,
      "No translation should be done in an obsolete object"
    );
  });

  test("Access Property", function () {
    let alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCodeunit(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    assert.strictEqual(alObj.publicAccess, true, "Unexpected default access");

    alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCodeunitPublic(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    assert.strictEqual(alObj.publicAccess, true, "Unexpected public access");

    alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCodeunitInternal(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    assert.strictEqual(alObj.publicAccess, false, "Unexpected internal access");
  });

  test("Valid Object Descriptors", function () {
    const objectDescriptorArr = ALObjectTestLibrary.getValidObjectDescriptors();
    for (let index = 0; index < objectDescriptorArr.length; index++) {
      const item = objectDescriptorArr[index];
      const obj = ALParser.getALObjectFromText(item.objectDescriptor, false);
      if (!obj) {
        assert.fail(`No descriptor found in ${item.objectDescriptor}`);
      }
      assert.strictEqual(obj.objectName, item.objectName);
      if (obj.extendedObjectId) {
        assert.strictEqual(obj.extendedObjectId, item.extendedObjectId);
      }
      if (obj.extendedObjectName) {
        assert.strictEqual(obj.extendedObjectName, item.extendedObjectName);
      }
      if (obj.extendedTableId) {
        assert.strictEqual(obj.extendedTableId, item.extendedTableId);
      }
    }
  });

  test("Invalid Object Descriptors", function () {
    const objectDescriptorArr = ALObjectTestLibrary.getInvalidObjectDescriptors();
    for (let index = 0; index < objectDescriptorArr.length; index++) {
      const item = objectDescriptorArr[index];
      let obj = null;
      try {
        obj = ALParser.getALObjectFromText(item, false);
      } catch (error) {
        // console.log('Item: ', item,'\nError:', error);
      }
      if (obj !== null) {
        assert.fail(
          `Object should fail. Code: "${item}". Name: "${obj?.objectName}"`
        );
      }
    }
  });

  test("AL XmlComment", function () {
    const commentAsXml = `
             <summary>
             The Summary
             </summary>
             <param name="FirstParam">The first parameter</param>
             <param name="SecondParam">The second parameter</param>
             <returns>Anything</returns>
             <remarks>Bla bla <paramref name="FirstParam"/></remarks>
             <example>Function('','')</example>

`;
    const commentXmlArr = commentAsXml.split("\n");
    const xmlComment = ALXmlComment.fromString(commentXmlArr);
    assert.strictEqual(xmlComment.summary, "The Summary", "Unexpected summary");
    assert.strictEqual(xmlComment.returns, "Anything", "Unexpected returns");
    assert.strictEqual(
      xmlComment.remarks,
      'Bla bla <paramref name="FirstParam"/>',
      "Unexpected remarks"
    );
    assert.strictEqual(
      xmlComment.example,
      "Function('','')",
      "Unexpected example"
    );
    assert.strictEqual(
      xmlComment.parameters[0].name,
      "FirstParam",
      "Unexpected First param name"
    );
    assert.strictEqual(
      xmlComment.parameters[0].description,
      "The first parameter",
      "Unexpected First param name"
    );
    assert.strictEqual(
      xmlComment.parameters[1].name,
      "SecondParam",
      "Unexpected First param name"
    );
    assert.strictEqual(
      xmlComment.parameters[1].description,
      "The second parameter",
      "Unexpected First param description"
    );
  });

  test("AL XmlComment ///", function () {
    const commentAsXml = `
            /// <summary>
            /// The Summary
            /// </summary>
            /// <param name="FirstParam">The first parameter</param>
            /// <param name="SecondParam">The second parameter</param>
            /// <returns>Anything</returns>
            /// <remarks>Bla bla</remarks>
            /// <example>Function('','')</example>

`;
    const commentXmlArr = commentAsXml.split("\n");
    const xmlComment = ALXmlComment.fromString(commentXmlArr);
    assert.strictEqual(xmlComment.summary, "The Summary", "Unexpected summary");
    assert.strictEqual(xmlComment.returns, "Anything", "Unexpected returns");
    assert.strictEqual(xmlComment.remarks, "Bla bla", "Unexpected remarks");
    assert.strictEqual(
      xmlComment.example,
      "Function('','')",
      "Unexpected example"
    );
    assert.strictEqual(
      xmlComment.parameters[0].name,
      "FirstParam",
      "Unexpected First param name"
    );
    assert.strictEqual(
      xmlComment.parameters[0].description,
      "The first parameter",
      "Unexpected First param name"
    );
    assert.strictEqual(
      xmlComment.parameters[1].name,
      "SecondParam",
      "Unexpected First param name"
    );
    assert.strictEqual(
      xmlComment.parameters[1].description,
      "The second parameter",
      "Unexpected First param description"
    );
  });
});
