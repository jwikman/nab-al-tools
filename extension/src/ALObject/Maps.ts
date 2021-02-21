import { ALCodeunitSubtype, ALObjectType, ALPropertyType, MultiLanguageType } from "./Enums";


export const ALObjectTypeMap = new Map<string, ALObjectType>([
    ['page', ALObjectType.Page],
    ['codeunit', ALObjectType.Codeunit],
    ['query', ALObjectType.Query],
    ['report', ALObjectType.Report],
    ['requestpage', ALObjectType.RequestPage],
    ['table', ALObjectType.Table],
    ['xmlport', ALObjectType.XmlPort],
    ['enum', ALObjectType.Enum],
    ['pageextension', ALObjectType.PageExtension],
    ['tableextension', ALObjectType.TableExtension],
    ['enumextension', ALObjectType.EnumExtension],
    ['profile', ALObjectType.Profile],
    ['interface', ALObjectType.Interface],
    ['pagecustomization', ALObjectType.PageCustomization]
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
    ['obsoletestate', ALPropertyType.ObsoleteState],
    ['access', ALPropertyType.Access],
    ['applicationarea', ALPropertyType.ApplicationArea],
    ['subtype', ALPropertyType.Subtype]
]);
export const ALCodeunitSubtypeMap = new Map<string, ALCodeunitSubtype>([
    ['normal', ALCodeunitSubtype.Normal],
    ['test', ALCodeunitSubtype.Test],
    ['testrunner', ALCodeunitSubtype.TestRunner],
    ['install', ALCodeunitSubtype.Install],
    ['upgrade', ALCodeunitSubtype.Upgrade]
]);

