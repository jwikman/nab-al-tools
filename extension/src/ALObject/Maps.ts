import {
  ALCodeunitSubtype,
  ALObjectType,
  ALPropertyType,
  MultiLanguageType,
} from "./Enums";

export const alObjectTypeMap = new Map<string, ALObjectType>([
  ["page", ALObjectType.page],
  ["codeunit", ALObjectType.codeunit],
  ["query", ALObjectType.query],
  ["report", ALObjectType.report],
  ["requestpage", ALObjectType.requestPage],
  ["table", ALObjectType.table],
  ["xmlport", ALObjectType.xmlPort],
  ["enum", ALObjectType.enum],
  ["pageextension", ALObjectType.pageExtension],
  ["tableextension", ALObjectType.tableExtension],
  ["reportextension", ALObjectType.reportExtension],
  ["enumextension", ALObjectType.enumExtension],
  ["profile", ALObjectType.profile],
  ["interface", ALObjectType.interface],
  ["pagecustomization", ALObjectType.pageCustomization],
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
]);
export const alCodeunitSubtypeMap = new Map<string, ALCodeunitSubtype>([
  ["normal", ALCodeunitSubtype.normal],
  ["test", ALCodeunitSubtype.test],
  ["testrunner", ALCodeunitSubtype.testRunner],
  ["install", ALCodeunitSubtype.install],
  ["upgrade", ALCodeunitSubtype.upgrade],
]);
