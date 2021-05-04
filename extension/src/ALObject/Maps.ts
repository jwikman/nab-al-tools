import { ALCodeunitSubtype, ALObjectType, ALPropertyType, MultiLanguageType } from "./Enums";


export const ALObjectTypeMap = new Map<string, ALObjectType>([
    ['page', ALObjectType.page],
    ['codeunit', ALObjectType.codeunit],
    ['query', ALObjectType.query],
    ['report', ALObjectType.report],
    ['requestpage', ALObjectType.requestPage],
    ['table', ALObjectType.table],
    ['xmlport', ALObjectType.xmlPort],
    ['enum', ALObjectType.enum],
    ['pageextension', ALObjectType.pageExtension],
    ['tableextension', ALObjectType.tableExtension],
    ['reportextension', ALObjectType.reportExtension],
    ['enumextension', ALObjectType.enumExtension],
    ['profile', ALObjectType.profile],
    ['interface', ALObjectType.interface],
    ['pagecustomization', ALObjectType.pageCustomization]
]);

export const MultiLanguageTypeMap = new Map<string, MultiLanguageType>([
    ['optioncaption', MultiLanguageType.OptionCaption],
    ['caption', MultiLanguageType.Caption],
    ['tooltip', MultiLanguageType.ToolTip],
    ['instructionaltext', MultiLanguageType.InstructionalText],
    ['promotedactioncategories', MultiLanguageType.PromotedActionCategories],
    ['additionalsearchterms', MultiLanguageType.AdditionalSearchTerms],
    ['requestfilterheading', MultiLanguageType.RequestFilterHeading],
    ['entitycaption', MultiLanguageType.EntityCaption],
    ['entitysetcaption', MultiLanguageType.EntitySetCaption],
    ['profiledescription', MultiLanguageType.ProfileDescription],
    ['abouttitle', MultiLanguageType.AboutTitle],
    ['abouttext', MultiLanguageType.AboutText]
]);

export const ALPropertyTypeMap = new Map<string, ALPropertyType>([
    ['sourcetable', ALPropertyType.SourceTable],
    ['pagetype', ALPropertyType.PageType],
    ['querytype', ALPropertyType.QueryType],
    ['obsoletestate', ALPropertyType.ObsoleteState],
    ['obsoletereason', ALPropertyType.ObsoleteReason],
    ['obsoletetag', ALPropertyType.ObsoleteTag],
    ['access', ALPropertyType.Access],
    ['applicationarea', ALPropertyType.ApplicationArea],
    ['subtype', ALPropertyType.Subtype],
    ['deleteallowed', ALPropertyType.DeleteAllowed],
    ['insertallowed', ALPropertyType.InsertAllowed],
    ['modifyallowed', ALPropertyType.ModifyAllowed],
    ['editable', ALPropertyType.Editable],
    ['apigroup', ALPropertyType.APIGroup],
    ['apipublisher', ALPropertyType.APIPublisher],
    ['apiversion', ALPropertyType.APIVersion],
    ['entityname', ALPropertyType.EntityName],
    ['entitysetname', ALPropertyType.EntitySetName]
]);
export const ALCodeunitSubtypeMap = new Map<string, ALCodeunitSubtype>([
    ['normal', ALCodeunitSubtype.Normal],
    ['test', ALCodeunitSubtype.Test],
    ['testrunner', ALCodeunitSubtype.TestRunner],
    ['install', ALCodeunitSubtype.Install],
    ['upgrade', ALCodeunitSubtype.Upgrade]
]);

