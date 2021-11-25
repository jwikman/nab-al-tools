import * as assert from "assert";
import { ALXmlComment } from "../ALObject/ALXmlComment";
import { ALProcedure } from "../ALObject/ALProcedure";
import * as ALObjectTestLibrary from "./ALObjectTestLibrary";
import {
  ALAccessModifier,
  ALControlType,
  ALPropertyType,
  MultiLanguageType,
} from "../ALObject/Enums";
import { isNullOrUndefined } from "util";
import { ALVariable } from "../ALObject/ALVariable";
import { removeGroupNamesFromRegex } from "../constants";
import * as ALParser from "../ALObject/ALParser";
import { ALControl } from "../ALObject/ALElementTypes";
import { ALCodeLine } from "../ALObject/ALCodeLine";

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
    assert.equal(
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
    assert.equal(control.name, "Name", "Unexpected name 1");
    assert.equal(
      control.getObsoletePendingInfo()?.obsoleteState,
      "Pending",
      "Unexpected State 1"
    );
    assert.equal(
      control.getObsoletePendingInfo()?.obsoleteReason,
      "The Reason",
      "Unexpected Reason 1"
    );
    assert.equal(
      control.getObsoletePendingInfo()?.obsoleteTag,
      "The Tag",
      "Unexpected Tag 1"
    );

    control = alObj.getControl(ALControlType.action, "ActionName");
    if (!control) {
      assert.fail("Could not find ActionName");
    }
    assert.equal(control.name, "ActionName", "Unexpected name 2");
    assert.equal(
      control.getObsoletePendingInfo()?.obsoleteState,
      "Pending",
      "Unexpected State 2"
    );
    assert.equal(
      control.getObsoletePendingInfo()?.obsoleteReason,
      "The Action Reason",
      "Unexpected Reason 2"
    );
    assert.equal(
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
    assert.equal(method.name, "TestMethod", "Unexpected name 1");
    assert.equal(
      method.getObsoletePendingInfo()?.obsoleteState,
      "Pending",
      "Unexpected State 1"
    );
    assert.equal(
      method.getObsoletePendingInfo()?.obsoleteReason,
      "The reason",
      "Unexpected Reason 1"
    );
    assert.equal(
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
    assert.equal(method.name, "OnBeforeWhatever", "Unexpected name 2");
    assert.equal(
      method.getObsoletePendingInfo()?.obsoleteState,
      "Pending",
      "Unexpected State 2"
    );
    assert.equal(
      method.getObsoletePendingInfo()?.obsoleteReason,
      "The Event reason",
      "Unexpected Reason 2"
    );
    assert.equal(
      method.getObsoletePendingInfo()?.obsoleteTag,
      "The Event Tag",
      "Unexpected Tag 2"
    );
    assert.equal(
      method.attributes[0].startsWith("IntegrationEvent("),
      true,
      "Unexpected IntegrationEvent attribute 2"
    );
    assert.equal(
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
        assert.equal(
          obsoleteInfo.obsoleteReason,
          obsoleteReason,
          `Unexpected obsoleteReason ${procedure.name}`
        );
        assert.equal(
          obsoleteInfo.obsoleteTag,
          obsoleteTag,
          `Unexpected obsoleteTag ${procedure.name}`
        );
      }
    } else {
      assert.equal(
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
    assert.equal(
      alObj.getPropertyValue(ALPropertyType.apiGroup),
      "appName",
      "Unexpected APIGroup"
    );
    assert.equal(
      alObj.getPropertyValue(ALPropertyType.apiPublisher),
      "publisher",
      "Unexpected APIPublisher"
    );
    assert.equal(
      alObj.getPropertyValue(ALPropertyType.apiVersion),
      "v1.0",
      "Unexpected APIVersion"
    );
    assert.equal(
      alObj.getPropertyValue(ALPropertyType.entityName),
      "customer",
      "Unexpected EntityName"
    );
    assert.equal(
      alObj.getPropertyValue(ALPropertyType.entitySetName),
      "customers",
      "Unexpected EntitySetName"
    );
  });

  test("Remove group names from RegEx", function () {
    assert.equal(
      removeGroupNamesFromRegex("?<test>asdf"),
      "asdf",
      "1. Groups not removed"
    );
    assert.equal(
      removeGroupNamesFromRegex("(?<test>asdf)(?<wer>qwer)"),
      "(asdf)(qwer)",
      "2. Groups not removed"
    );
  });

  test("Procedure parsing", function () {
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
    const procedure = ALParser.parseProcedureDeclaration(
      alControl,
      alCodeLines,
      procedureLineNo
    ) as ALProcedure;

    assert.equal(
      procedure.access,
      access,
      `Unexpected access (${procedureString})`
    );
    assert.equal(procedure.name, name, `Unexpected name (${procedureString})`);
    assert.equal(
      procedure.parameters.length,
      parameterCount,
      `Unexpected number of parameters (${procedureString})`
    );
    assert.equal(
      procedure.attributes.length,
      attributeCount,
      `Unexpected number of attributes (${procedureString})`
    );
    if (returnDataType) {
      assert.equal(
        procedure.returns?.datatype,
        returnDataType,
        `Unexpected return datatype (${procedureString})`
      );
      if (returnSubtype) {
        assert.equal(
          procedure.returns?.subtype,
          returnSubtype,
          `Unexpected return subtype (${procedureString})`
        );
      } else {
        assert.equal(
          isNullOrUndefined(procedure.returns?.subtype),
          true,
          `Unexpected return subtype 2 (${procedureString})`
        );
      }
    } else {
      assert.equal(
        isNullOrUndefined(procedure.returns),
        true,
        `Unexpected return (${procedureString})`
      );
    }
  }
  test("Parameter parsing", function () {
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
    assert.equal(param.byRef, byRef, `Unexpected byRef (${paramString})`);
    assert.equal(param.name, name, `Unexpected name (${paramString})`);
    assert.equal(
      param.fullDataType,
      fullDataType,
      `Unexpected datatype (${paramString})`
    );
    assert.equal(param.subtype, subtype, `Unexpected subtype (${paramString})`);
  }
  test("ALObject to string", function () {
    const alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getObsoletePage(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    assert.equal(
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
    assert.equal(
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
    assert.equal(alObj.publicAccess, true, "Unexpected default access");

    alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCodeunitPublic(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    assert.equal(alObj.publicAccess, true, "Unexpected public access");

    alObj = ALParser.getALObjectFromText(
      ALObjectTestLibrary.getCodeunitInternal(),
      true
    );
    if (!alObj) {
      assert.fail("Could not find object");
    }
    assert.equal(alObj.publicAccess, false, "Unexpected internal access");
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
    assert.equal(xmlComment.summary, "The Summary", "Unexpected summary");
    assert.equal(xmlComment.returns, "Anything", "Unexpected returns");
    assert.equal(
      xmlComment.remarks,
      'Bla bla <paramref name="FirstParam"/>',
      "Unexpected remarks"
    );
    assert.equal(xmlComment.example, "Function('','')", "Unexpected example");
    assert.equal(
      xmlComment.parameters[0].name,
      "FirstParam",
      "Unexpected First param name"
    );
    assert.equal(
      xmlComment.parameters[0].description,
      "The first parameter",
      "Unexpected First param name"
    );
    assert.equal(
      xmlComment.parameters[1].name,
      "SecondParam",
      "Unexpected First param name"
    );
    assert.equal(
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
    assert.equal(xmlComment.summary, "The Summary", "Unexpected summary");
    assert.equal(xmlComment.returns, "Anything", "Unexpected returns");
    assert.equal(xmlComment.remarks, "Bla bla", "Unexpected remarks");
    assert.equal(xmlComment.example, "Function('','')", "Unexpected example");
    assert.equal(
      xmlComment.parameters[0].name,
      "FirstParam",
      "Unexpected First param name"
    );
    assert.equal(
      xmlComment.parameters[0].description,
      "The first parameter",
      "Unexpected First param name"
    );
    assert.equal(
      xmlComment.parameters[1].name,
      "SecondParam",
      "Unexpected First param name"
    );
    assert.equal(
      xmlComment.parameters[1].description,
      "The second parameter",
      "Unexpected First param description"
    );
  });
});
