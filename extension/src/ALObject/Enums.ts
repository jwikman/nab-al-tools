
// BC ObjectType: ", Table,, Report,, Codeunit, XMLport, MenuSuite, Page, Query,,,,, PageExtension, TableExtension"
export enum ALObjectType {
    none = "None",
    table = "Table",
    report = "Report",
    codeunit = "Codeunit",
    xmlPort = "XmlPort",
    page = "Page",
    query = "Query",
    pageExtension = "PageExtension",
    tableExtension = "TableExtension",
    reportExtension = "ReportExtension",
    pageCustomization = "PageCustomization",
    profile = "Profile",
    requestPage = "RequestPage",
    enum = "Enum",
    enumExtension = "EnumExtension",
    interface = "Interface"
}
export enum ALPropertyType {
    Unknown,
    SourceTable,
    PageType,
    QueryType,
    ObsoleteState,
    ObsoleteReason,
    ObsoleteTag,
    Access,
    ApplicationArea,
    Subtype,
    DeleteAllowed,
    InsertAllowed,
    ModifyAllowed,
    Editable,
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
    none = "None",
    object = "Object",
    pageField = "PageField", // Used for tooltip sorting
    group = "Group",     // Used for tooltip sorting
    action = "Action",    // Used for tooltip sorting
    part = "Part",      // Used for tooltip sorting
    dataItem = "DataItem",
    Column = "Column",
    Value = "Value",
    TableField = "TableField",
    Area = "Area",
    Trigger = "Trigger",
    Procedure = "Procedure",
    Layout = "Layout",
    RequestPage = "RequestPage",
    Actions = "Actions",
    CueGroup = "CueGroup",
    Repeater = "Repeater",
    Separator = "Separator",
    TextAttribute = "TextAttribute",
    FieldAttribute = "FieldAttribute",
    ModifiedPageField = "ModifiedPageField",
    ModifiedTableField = "ModifiedTableField"
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

export enum DocsType {
    Public,
    API,
    WS
}


