import {
  ALCodeunitSubtype,
  ALObjectType,
  ALPropertyType,
  DataType,
  MultiLanguageType,
} from "./Enums";

export const alObjectTypeMap = new Map<string, ALObjectType>([
  ["page", ALObjectType.page],
  ["codeunit", ALObjectType.codeunit],
  ["controladdin", ALObjectType.controladdin],
  ["query", ALObjectType.query],
  ["report", ALObjectType.report],
  ["requestpage", ALObjectType.requestPage],
  ["table", ALObjectType.table],
  ["tabledata", ALObjectType.tableData],
  ["xmlport", ALObjectType.xmlPort],
  ["enum", ALObjectType.enum],
  ["pageextension", ALObjectType.pageExtension],
  ["tableextension", ALObjectType.tableExtension],
  ["reportextension", ALObjectType.reportExtension],
  ["enumextension", ALObjectType.enumExtension],
  ["profile", ALObjectType.profile],
  ["interface", ALObjectType.interface],
  ["pagecustomization", ALObjectType.pageCustomization],
  ["permissionset", ALObjectType.permissionSet],
  ["permissionsetextension", ALObjectType.permissionSetExtension],
  ["system", ALObjectType.system],
]);

export const multiLanguageTypeMap = new Map<string, MultiLanguageType>([
  ["optioncaption", MultiLanguageType.optionCaption],
  ["caption", MultiLanguageType.caption],
  ["tooltip", MultiLanguageType.toolTip],
  ["instructionaltext", MultiLanguageType.instructionalText],
  ["promotedactioncategories", MultiLanguageType.promotedActionCategories],
  ["additionalsearchterms", MultiLanguageType.additionalSearchTerms],
  ["requestfilterheading", MultiLanguageType.requestFilterHeading],
  ["entitycaption", MultiLanguageType.entityCaption],
  ["entitysetcaption", MultiLanguageType.entitySetCaption],
  ["profiledescription", MultiLanguageType.profileDescription],
  ["abouttitle", MultiLanguageType.aboutTitle],
  ["abouttext", MultiLanguageType.aboutText],
]);

export const alPropertyTypeMap = new Map<string, ALPropertyType>([
  ["sourcetable", ALPropertyType.sourceTable],
  ["tableno", ALPropertyType.tableNo],
  ["tabletype", ALPropertyType.tableType],
  ["pagetype", ALPropertyType.pageType],
  ["querytype", ALPropertyType.queryType],
  ["obsoletestate", ALPropertyType.obsoleteState],
  ["obsoletereason", ALPropertyType.obsoleteReason],
  ["obsoletetag", ALPropertyType.obsoleteTag],
  ["access", ALPropertyType.access],
  ["applicationarea", ALPropertyType.applicationArea],
  ["subtype", ALPropertyType.subtype],
  ["deleteallowed", ALPropertyType.deleteAllowed],
  ["insertallowed", ALPropertyType.insertAllowed],
  ["modifyallowed", ALPropertyType.modifyAllowed],
  ["editable", ALPropertyType.editable],
  ["apigroup", ALPropertyType.apiGroup],
  ["apipublisher", ALPropertyType.apiPublisher],
  ["apiversion", ALPropertyType.apiVersion],
  ["entityname", ALPropertyType.entityName],
  ["entitysetname", ALPropertyType.entitySetName],
  ["extensible", ALPropertyType.extensible],
  ["assignable", ALPropertyType.assignable],
]);

export const alCodeunitSubtypeMap = new Map<string, ALCodeunitSubtype>([
  ["normal", ALCodeunitSubtype.normal],
  ["test", ALCodeunitSubtype.test],
  ["testrunner", ALCodeunitSubtype.testRunner],
  ["install", ALCodeunitSubtype.install],
  ["upgrade", ALCodeunitSubtype.upgrade],
]);

export const alObjectTypeNumberMap = new Map<number, ALObjectType>([
  [0, ALObjectType.tableData],
  [1, ALObjectType.table],
  [3, ALObjectType.report],
  [5, ALObjectType.codeunit],
  [6, ALObjectType.xmlPort],
  [8, ALObjectType.page],
  [9, ALObjectType.query],
  [16, ALObjectType.enum],
  [18, ALObjectType.profile],
]);

export const alDataTypeObjectTypeMap = new Map<DataType, ALObjectType>([
  [DataType.record, ALObjectType.table],
  [DataType.report, ALObjectType.report],
  [DataType.codeunit, ALObjectType.codeunit],
  [DataType.xmlport, ALObjectType.xmlPort],
  [DataType.page, ALObjectType.page],
  [DataType.query, ALObjectType.query],
  [DataType.enum, ALObjectType.enum],
  [DataType.controlAddIn, ALObjectType.controladdin],
  [DataType.interface, ALObjectType.interface],
]);

export const extensionObjectMap = new Map<ALObjectType, ALObjectType>([
  [ALObjectType.tableExtension, ALObjectType.table],
  [ALObjectType.reportExtension, ALObjectType.report],
  [ALObjectType.pageExtension, ALObjectType.page],
  [ALObjectType.enumExtension, ALObjectType.enum],
  [ALObjectType.permissionSetExtension, ALObjectType.permissionSet],
]);
