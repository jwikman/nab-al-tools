
export enum ALObjectType {
    None,
    Codeunit,
    Page,
    PageCustomization,
    PageExtension,
    Profile,
    Query,
    Report,
    RequestPage,
    Table,
    TableExtension,
    XmlPort,
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
    RequestFilterHeading
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



