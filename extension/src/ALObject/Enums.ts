// BC ObjectType: ", Table,, Report,, Codeunit, XMLport, MenuSuite, Page, Query,,,,, PageExtension, TableExtension"
export enum ALObjectType {
  none = "None",
  tableData = "TableData",
  table = "Table",
  report = "Report",
  codeunit = "Codeunit",
  controladdin = "ControlAddIn",
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
  interface = "Interface",
  permissionSet = "PermissionSet",
  permissionSetExtension = "PermissionSetExtension",
  system = "System",
}
export enum ALPropertyType {
  unknown,
  sourceTable,
  tableNo,
  tableType,
  pageType,
  queryType,
  obsoleteState,
  obsoleteReason,
  obsoleteTag,
  access,
  applicationArea,
  subtype,
  deleteAllowed,
  insertAllowed,
  modifyAllowed,
  editable,
  apiGroup,
  apiPublisher,
  apiVersion,
  entityName,
  entitySetName,
  extensible,
  assignable,
}
export enum ALCodeunitSubtype {
  normal,
  test,
  testRunner,
  install,
  upgrade,
  unknown,
}
export enum ALTableType {
  normal = "Normal",
  temporary = "Temporary",
  cds = "CDS",
  crm = "CRM",
  exchange = "Exchange",
  externalSql = "ExternalSQL",
  microsoftGraph = "MicrosoftGraph",
}

export enum ALControlType {
  none = "None",
  object = "Object",
  pageField = "PageField", // Used for tooltip sorting
  group = "Group", // Used for tooltip sorting
  action = "Action", // Used for tooltip sorting
  systemaction = "Action", // Used for tooltip sorting
  part = "Part", // Used for tooltip sorting
  systemPart = "SystemPart",
  dataItem = "DataItem",
  column = "Column",
  enumValue = "EnumValue",
  controladdinEvent = "Event",
  tableField = "TableField",
  area = "Area",
  reportLabels = "ReportLabel",
  label = "Label",
  trigger = "Trigger",
  procedure = "Procedure",
  layout = "Layout",
  reportLayout = "ReportLayout",
  keys = "Keys",
  key = "Key",
  rendering = "Rendering",
  requestPage = "RequestPage",
  actions = "Actions",
  cueGroup = "CueGroup",
  repeater = "Repeater",
  separator = "Separator",
  textAttribute = "TextAttribute",
  fieldAttribute = "FieldAttribute",
  modifiedPageField = "ModifiedPageField",
  modifiedTableField = "ModifiedTableField",
  modifiedReportColumn = "ModifiedReportColumn",
  pageView = "PageView",
  pageGrid = "PageGrid",
}

export enum MultiLanguageType {
  label = "Label",
  reportLabel = "ReportLabel",
  namedType = "NamedType",
  property = "Property",
  optionCaption = "OptionCaption",
  caption = "Caption",
  toolTip = "ToolTip",
  instructionalText = "InstructionalText",
  promotedActionCategories = "PromotedActionCategories",
  requestFilterHeading = "RequestFilterHeading",
  additionalSearchTerms = "AdditionalSearchTerms",
  entityCaption = "EntityCaption",
  entitySetCaption = "EntitySetCaption",
  profileDescription = "ProfileDescription",
  aboutTitle = "AboutTitle",
  aboutText = "AboutText",
}

export enum XliffTokenType {
  skip = "Skip",
  inheritFromObjectType = "InheritFromObjectType",
  inheritFromControl = "InheritFromControl",
  xmlPortNode = "XmlPortNode",
  control = "Control",
  reportDataItem = "ReportDataItem",
  reportColumn = "ReportColumn",
  reportLayout = "ReportLayout",
  queryDataItem = "QueryDataItem",
  queryColumn = "QueryColumn",
  enumValue = "EnumValue",
  method = "Method",
  action = "Action",
  systemaction = "Action",
  field = "Field",
  change = "Change",
  view = "View",
}
export enum ALAccessModifier {
  public = "",
  internal = "internal",
  local = "local",
  protected = "protected",
}

export enum DocsType {
  public,
  api,
  ws,
}

/**
 * Represents an end of line character sequence in a document.
 */
export enum EndOfLine {
  /**
   * The line feed `\n` character.
   */
  lf = 1,
  /**
   * The carriage return line feed `\r\n` sequence.
   */
  crLf = 2,
}

export enum DataType {
  none = "(none)",
  array = "array",
  option = "Option",
  dotNet = "DotNet",
  page = "Page",
  record = "Record",
  codeunit = "Codeunit",
  xmlport = "Xmlport",
  query = "Query",
  report = "Report",
  interface = "Interface",
  enum = "Enum",
  testPage = "TestPage",
  dictionary = "Dictionary",
  list = "List",
  controlAddIn = "ControlAddIn",
}
