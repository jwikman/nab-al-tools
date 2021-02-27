
// BC ObjectType: ", Table,, Report,, Codeunit, XMLport, MenuSuite, Page, Query,,,,, PageExtension, TableExtension"
export enum ALObjectType {
    None = "None",
    Table = "Table",
    Report = "Report",
    Codeunit = "Codeunit",
    XmlPort = "XmlPort",
    Page = "Page",
    Query = "Query",
    PageExtension = "PageExtension",
    TableExtension = "TableExtension",
    PageCustomization = "PageCustomization",
    Profile = "Profile",
    RequestPage = "RequestPage",
    Enum = "Enum",
    EnumExtension = "EnumExtension",
    Interface = "Interface"
}
export enum ALPropertyType {
    Unknown,
    SourceTable,
    PageType,
    ObsoleteState,
    Access,
    ApplicationArea,
    Subtype,
    APIGroup,
    APIPublisher,
    APIVersion,
    EntityName,
    EntitySetName
}
export enum ALCodeunitSubtype {
    Normal,
    Test,
    TestRunner,
    Install,
    Upgrade,
    Unknown
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
    FieldAttribute,
    ModifiedPageField,
    ModifiedTableField
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
    AdditionalSearchTerms,
    EntityCaption,
    EntitySetCaption,
    ProfileDescription,
    AboutTitle,
    AboutText
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
    Field,
    Change
}
export enum ALAccessModifier {
    public,
    internal,
    local,
    protected
}



