import { ALObjectType, ALPropertyType, MultiLanguageType } from "./Enums";


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
    ['requestfilterheading', MultiLanguageType.RequestFilterHeading]
]);

export const ALPropertyTypeMap = new Map<string, ALPropertyType>([
    ['sourcetable', ALPropertyType.SourceTable],
    ['pagetype', ALPropertyType.PageType],
    ['obsoletestate', ALPropertyType.ObsoleteState],
    ['applicationarea', ALPropertyType.ApplicationArea]
]);

