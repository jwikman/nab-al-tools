
// BC ObjectType: ", Table,, Report,, Codeunit, XMLport, MenuSuite, Page, Query,,,,, PageExtension, TableExtension"
export enum ALObjectType {
    None,
    Table,
    Report,
    Codeunit,
    XmlPort,
    Page,
    Query,
    PageExtension,
    TableExtension,
    PageCustomization,
    Profile,
    RequestPage,
    Enum,
    EnumExtension,
    Interface
}
export enum ALPropertyType {
    Unknown,
    SourceTable,
    PageType,
    ObsoleteState
}

export enum ALControlType {
    None,
    Object,
    PageField, // Used for tooltip sorting
    Group,     // Used for tooltip sorting
    Action,    // Used for tooltip sorting
    Part,      // Used for tooltip sorting
    DataItem,
    Column,
    Value,
    TableField,
    Area,
    Trigger,
    Procedure,
    Layout,
    RequestPage,
    Actions,
    CueGroup,
    Repeater,
    Separator,
    TextAttribute,
    FieldAttribute
}

export enum MultiLanguageType {
    Label,
    NamedType,
    Property,
    OptionCaption,
    Caption,
    ToolTip,
    InstructionalText,
    PromotedActionCategories,
    RequestFilterHeading,
    AdditionalSearchTerms
}

export enum XliffTokenType {
    Skip,
    InheritFromObjectType,
    InheritFromControl,
    XmlPortNode,
    Control,
    ReportDataItem,
    ReportColumn,
    QueryDataItem,
    QueryColumn,
    EnumValue,
    Method,
    Action,
    Field
}



