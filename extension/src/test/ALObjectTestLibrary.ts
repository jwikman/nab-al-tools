// Xlf combos:
// ---------------------------------
// Codeunit Method NamedType
// Codeunit NamedType
// Enum EnumValue Caption
// Page Action Caption
// Page Action Method NamedType
// Page Action ToolTip
// Page Caption
// Page Control Caption
// Page Control InstructionalText
// Page Control Method NamedType
// Page Control OptionCaption
// Page Control ToolTip
// Page InstructionalText
// Page Method NamedType
// Page NamedType
// Page PromotedActionCategories
// PageExtension Action Caption
// PageExtension Action Method NamedType
// PageExtension Action ToolTip
// PageExtension Control Caption
// PageExtension Control OptionCaption
// PageExtension Control ToolTip
// PageExtension Method NamedType
// PageExtension NamedType
// Query Caption
// Query Method NamedType
// Query NamedType
// Query QueryColumn Caption
// Report Action Method NamedType
// Report Caption
// Report Control Caption
// Report Control InstructionalText
// Report Control Method NamedType
// Report Control OptionCaption
// Report Control ToolTip
// Report Method NamedType
// Report NamedType
// Report ReportColumn Caption
// Report ReportColumn OptionCaption
// Report ReportDataItem RequestFilterHeading
// Table Caption
// Table Field Caption
// Table Field Method NamedType
// Table Field OptionCaption
// Table Method NamedType
// Table NamedType
// TableExtension Field Caption
// TableExtension Field Method NamedType
// TableExtension Field OptionCaption
// TableExtension Method NamedType
// TableExtension NamedType



export function getValidObjectDescriptors(): {
    ObjectDescriptor: string;
    ObjectName: string;
}[] {
    return [
        { ObjectDescriptor: 'codeunit 70314129 "QWESR IQCM S/Ftp Handler" implements "QWESR IQCM", "QWESR IQCM Import", "QWESR IQCM Export"', ObjectName: 'QWESR IQCM S/Ftp Handler' },
        { ObjectDescriptor: 'enum 70314080 "QWESR IQCM" implements "QWESR IQCM", "QWESR IQCM Import", "QWESR IQCM Export", "QWESR IQCM Function"', ObjectName: 'QWESR IQCM' },
        { ObjectDescriptor: 'codeunit 70314130 "QWESR Communication Method Mgt"', ObjectName: 'QWESR Communication Method Mgt' },
        { ObjectDescriptor: 'codeunit 70314130 CommunicationMethodMgt', ObjectName: 'CommunicationMethodMgt' },
        { ObjectDescriptor: 'pageextension 70219910 "QWESP Customer Card" extends "Customer Card" // 21', ObjectName: 'QWESP Customer Card' },
        { ObjectDescriptor: 'pageextension 70219910 "QWESP Customer Card" extends CustomerCard // 21', ObjectName: 'QWESP Customer Card' },
        { ObjectDescriptor: 'pageextension 70219910 QWESPCustomerCard extends "Customer Card" // 21', ObjectName: 'QWESPCustomerCard' },
        { ObjectDescriptor: 'pageextension 70219910 QWESPCustomerCard extends CustomerCard // 21', ObjectName: 'QWESPCustomerCard' },
        { ObjectDescriptor: 'profile "QWESP Time Sheet Role Center"', ObjectName: 'QWESP Time Sheet Role Center' },
        { ObjectDescriptor: 'interface "QWESR Integration Type"', ObjectName: 'QWESR Integration Type' },
    ];
}

export function getInvalidObjectDescriptors(): string[] {
    return [
        'codeunit 70314129 "QWESR"IQCM S/Ftp Handler" implements "QWESR IQCM", "QWESR IQCM Import", "QWESR IQCM Export"',
        'enum 70314080 "QWESR IQCM implements "QWESR IQCM", "QWESR IQCM Import", "QWESR IQCM Export", "QWESR IQCM Function"',
        'codeunit 70314130 QWESR Communication Method Mgt"',
        'codeunit 70314130 Commu"nicationMethodMgt"',
        'codeunit 70314130 Communi"cationMethodMgt',
        'pageextension 70219910 "QWESP" Customer Card" extends "Customer Card" // 21',
        'pageextension 70219910 QWESP Customer Card extends "Customer Card" // 21',
        'pageextension 70219910 QWESP"CustomerCard extends "Customer Card" // 21',
    ];
}
export function getEmptyGXlf(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp">
    <body>
      <group id="body">
      </group>
    </body>
  </file>
</xliff>`;
}


export function getGXlf(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - Field 1296262074 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>My Field Caption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064" size-unit="char" translate="yes" xml:space="preserve">
          <source>OnValidate Error</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Method OnValidate - NamedType TestOnValidateErr</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - Field 3945078064 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>My Field 2 Caption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField2 - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - Field 2443090863 - Property 62802879" size-unit="char" translate="yes" xml:space="preserve">
          <source> ,asdf,erew,fieldOptionCaption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyFieldOption - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - Field 2443090863 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>MyFieldOption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyFieldOption - Property Caption</note>
        </trans-unit>
        <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR in table</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - Control 4105281732 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>GroupCaption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Control GroupName - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - Control 4105281732 - Property 1968111052" size-unit="char" translate="yes" xml:space="preserve">
          <source>Group InstructionalText</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Control GroupName - Property InstructionalText</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - Control 2961552353 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
          <source>FieldCaption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Control Name - Property Caption</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - Control 2961552353 - Property 1295455071" size-unit="char" translate="yes" xml:space="preserve">
          <source>ToolTip</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Control Name - Property ToolTip</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - Control 2443090863 - Property 62802879" size-unit="char" translate="yes" xml:space="preserve">
          <source> ,PageTest,erew,fieldOptionCaption</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Control MyFieldOption - Property OptionCaption</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - Action 1692444235 - Method 1377591017 - NamedType 2384180296" size-unit="char" translate="yes" xml:space="preserve">
          <source>OnAction Error</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Action ActionName - Method OnAction - NamedType TestOnActionErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - Method 3998599243 - NamedType 1531128287" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is local procedure Error</source>
          <note from="Developer" annotates="general" priority="2"></note>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - Method MyProcedure - NamedType TestProcLocal</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

export function getEnuXlfMissingTranslations(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
  <file datatype="xml" source-language="en-US" target-language="en-US" original="AlTestApp">
    <body>
      <group id="body">
        <trans-unit id="Table 2328808854 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR in table</source>
          <target>This is a test ERROR in table</target>
          <note from="Developer" annotates="general" priority="2"/>
          <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - NamedType TestErr</note>
        </trans-unit>
        <trans-unit id="Page 2931038265 - NamedType 12557645" size-unit="char" translate="yes" xml:space="preserve">
          <source>This is a test ERROR</source>
          <target>This is a test ERROR</target>
          <note from="Developer" annotates="general" priority="2"/>
          <note from="Xliff Generator" annotates="general" priority="3">Page MyPage - NamedType TestErr</note>
        </trans-unit>
      </group>
    </body>
  </file>
</xliff>`;
}

export function getCueGroupPage(): string {
    return `page 50000 "My Cue Part"
{
    Caption = 'Activities';
    PageType = CardPart;

    layout
    {
        area(content)
        {
            cuegroup("Time Sheet Manager")
            {
                Caption = 'Time Sheet Manager';

                field("Field1"; "Field1")
                {
                    ApplicationArea = All;
                    ToolTip = 'Field 1 tooltip';
                }
                field("Field2"; "Field2"
                {
                    ToolTip = 'Field 2 tooltip';
                    Caption = 'Field 2';
                }
            }
        }
    }
}
`;
}


export function getRoleCenterPage(): string {
    return `page 50000 "My Role Center"
{
    PageType = RoleCenter;
    Caption = 'Page Caption', Locked = true;

    actions
    {
        area(Sections)
        {
            group(Jobs)
            {
                Caption = 'Jobs';
                action("Job List")
                {
                    Caption = 'Jobs';
                    RunObject = page "Job List";
                    ApplicationArea = All;
                }
                action("Job Tasks")
                {
                    Caption = 'Job Task Lines';
                    RunObject = page "Job Task Lines";
                    ApplicationArea = All;
                }
                action("Job Print Layouts")
                {
                    Caption = 'Job Print Layouts';
                    RunObject = page "QWESP Job Print Layout List";
                    ApplicationArea = All;
                }
            }
            group(Resources)
            {
                Caption = 'Resources';
                action("Resource List")
                {
                    Caption = 'Resources';
                    RunObject = page "Resource List";
                    ApplicationArea = All;
                }
                action("Resource Capacity")
                {
                    Caption = 'Resource Capacity';
                    RunObject = page "Resource Capacity";
                    ApplicationArea = All;
                }
            }
        }
}
`;
}



export function getPageWithGroupsAndRepeater(): string {
    return `page 50000 "Page with repeater"
    {
        Caption = 'Page with repeater';
        ApplicationArea = All;
        UsageCategory = Administration;
        Editable = false;
        PageType = NavigatePage;
        ShowFilter = false;
        SourceTable = "MyTable";
        SourceTableTemporary = true;
        SourceTableView = sorting("Sorting");
    
        layout
        {
            area(content)
            {
                group(InstructionNonStripeGrp)
                {
                    InstructionalText = 'This is an instruction';
                    ShowCaption = false;
                }
                group(Instruction1Grp)
                {
                    InstructionalText = 'This is another instruction';
                    ShowCaption = false;
                }
                repeater(Group)
                {
                    Caption = 'My repeater';
                    field(Description; Description)
                    {
                        ApplicationArea = All;
                        ToolTip = 'Specifies the description.';
                    }
                }
    
                group(EvaluationGroup)
                {
                    InstructionalText = 'Another instruction...';
                    ShowCaption = false;
                }
            }
        }
    }
    `;
}


export function getPage(): string {
    return `page 50100 MyPage
{
    PageType = List;
    ApplicationArea = All;
    UsageCategory = Lists;
    SourceTable = MyTable;

    layout
    {
        area(Content)
        {
            group(GroupName)
            {
                Caption = 'GroupCaption';
                InstructionalText = 'Group InstructionalText';
                field(Name; MyField)
                {

                    ApplicationArea = All;

                    Caption = 'FieldCaption';
                    ToolTip = 'ToolTip';

                }
                field(MyField2; MyField2)
                {
                    ApplicationArea = All;
                }

                field(MyFieldOption; MyFieldOption)
                {
                    OptionCaption = ' ,PageTest,erew,fieldOptionCaption';
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            ToolTip = 'AreaTooltip';

            action(ActionName)
            {
                ApplicationArea = All;

                trigger OnAction()
                var
                    TestOnActionErr: Label 'OnAction Error';
                begin

                end;
            }
        }
    }

    var
        myInt: Integer;
        TestErr: Label 'This is a test ERROR';

    local procedure MyProcedure()
    var
        TestProcLocal: Label 'This is local procedure Error';
    begin

    end;

}`;
}

export function getTable(): string {
    return `table 50100 MyTable
{
    DataClassification = CustomerContent;
    Caption = 'My Table Caption';

    fields
    {
        field(1; MyField; Integer)
        {
            DataClassification = CustomerContent;
            Caption = 'My Field Caption';
            trigger OnValidate()
            var
                TestOnValidateErr: Label 'OnValidate Error', Locked = true;
            begin

            end;
        }

        field(2; MyField2; Text[50])
        {
            DataClassification = CustomerContent;
            Caption = 'My Field 2 Caption';
        }
        field(3; MyFieldOption; Option)
        {
            DataClassification = ToBeClassified;
            OptionMembers = Default,asdf,erew;
            Caption = 'MyFieldOption - Caption';
            OptionCaption = ' ,asdf,erew,fieldOptionCaption';
        }
    }

    keys
    {
        key(PK; MyField)
        {
            Clustered = true;
        }
    }

    var
        myInt: Integer;
        TestErr: Label 'This is a test ERROR in table';


    trigger OnInsert()
    begin

    end;

    trigger OnModify()
    begin

    end;

    trigger OnDelete()
    begin

    end;

    trigger OnRename()
    begin

    end;

}`;
}

export function getCodeunit(): string {
    return `codeunit 50000 "NAB Test Codeunit"
    {
        trigger OnRun()
        var
            LocalTestLabelTxt: Label 'Local Test Label';
        begin
    
        end;
    
        procedure TestMethod()
        var
            LocalTestLabelTxt: Label 'Local Test Label';
        begin
        end;
    
        var
            GlobalTestLabelTxt: Label 'Global Test Label';
    
    }`;
}
export function getCodeunitWithApostrophes(): string {
    return `codeunit 50000 "NAB Test Codeunit"
    {
        var
          CantBeTheSameAsErr: Label '''%1'' can''t be the same as ''%2''', Comment = '%1 = Field Caption 1, %2 = Field Caption 2';
    
    }`;
}
export function getCodeunitWithFunctionsWithParenthesisParam(): string {
    return `codeunit 50000 "NAB Test Codeunit"
    {
        procedure TheProcedure(Parameter: Record "Table (Tbl)"; var pvRecRef: RecordRef)
        var
            MyLabel: Label 'The text';
        begin
        end;
    
    }`;
}

export function getCodeunitWithHtmlTags(): string {
    return `codeunit 50000 "NAB Test Codeunit"
    {
        var
          MyLabel: Label '%1%1%1<hr/> <!-- Swedish above, English below -->%1%1%1';
    
    }`;
}

export function getCodeunitWithHtmlTagsLocked(): string {
    return `codeunit 50000 "NAB Test Codeunit"
    {
        var
          MyLabel: Label '%1%1%1<hr/> <!-- Swedish above, English below -->%1%1%1', Locked = true;
    
    }`;
}

export function getEnum(): string {
    return `enum 50000 "NAB TestEnum"
    {
        Extensible = false;
    
        value(0; MyValue)
        {
            Caption = 'Enum1';
        }
    
    }`;
}
export function getPageExt(): string {
    return `pageextension 50000 "NAB Test PageExt" extends "Customer List"
    {
        layout
        {
    
            addfirst(Content)
            {
                group("NAB MyFieldGroup")
                {
    
                }
            }
            addafter("VAT Bus. Posting Group")
            {
    
                field("NAB Blocked3"; "Blocked")
                {
                    Caption = 'Capt';
                    ToolTip = 'Tooltip';
                    OptionCaption = 'asdf,ef';
                }
            }
        }
    
        actions
        {
            addafter(Workflow)
            {
                group("NAB Grp")
                {
                    Caption = 'Group';
                    ToolTip = 'ToolTup';
                    action("NAB Act")
                    {
                        Caption = 'Action';
                        ToolTip = 'Tooltip';
    
                        trigger OnAction()
                        var
                            LocalTestLabelTxt: Label 'Local Test Label';
    
                        begin
    
                        end;
                    }
                }
            }
            // Add changes to page actions here
        }
        procedure TestMethodPageExt()
        var
            LocalTestLabelTxt: Label 'Local Test Label';
        begin
        end;
    
        var
            GlobalTestLabelTxt: Label 'Global Test Label';
    
    }`;
}
export function getQuery(): string {
    return `query 50000 "NAB Test Query"
    {
        QueryType = Normal;
        Caption = 'Query';
    
        elements
        {
            dataitem(DataItemName; "NAB Test Table")
            {
                column(ColumnName; "Test Field")
                {
                    Caption = 'Column';
                }
            }
        }
    
        trigger OnBeforeOpen()
        var
            LocalTestLabelTxt: Label 'Local Test Label';
        begin
    
        end;
    
        procedure TestMethod()
        var
            LocalTestLabelTxt: Label 'Local Test Label';
        begin
        end;
    
        var
            GlobalTestLabelTxt: Label 'Global Test Label';
    
    }`;
}
export function getReport(): string {
    return `report 50000 "NAB Test Report"
    {
        UsageCategory = Administration;
        ApplicationArea = All;
        Caption = 'Report';
    
        dataset
        {
            dataitem(DataItemName; "NAB Test Table")
            {
                RequestFilterHeading = 'sdfa';
                column(ColumnName; asdf)
                {
                    Caption = 'Column', Comment = 'ColumnComment', MaxLength = 50;
                    OptionCaption = 'asd,asdf';
    
                }
            }
        }
    
        requestpage
        {
            layout
            {
                area(Content)
                {
                    group(GroupName)
                    {
                        Caption = 'Grp';
                        InstructionalText = 'Instructions';
                        field(Fld; "asdf")
                        {
                            Caption = 'Fld';
                            OptionCaption = '1234,34,43';
                            ToolTip = 'Tooltip';
                            trigger OnAssistEdit()
                            var
                                LocalTestLabelTxt: Label 'Local Test Label';
                                HelloWorldTxt: Label 'Hello World!';
                            begin
    
                            end;
    
                        }
                    }
                }
            }
    
            actions
            {
                area(processing)
                {
                    action(ActionName)
                    {
                        ApplicationArea = All;
                        trigger OnAction()
                        var
                            LocalTestLabelTxt: Label 'Local Test Label';
                        begin
    
                        end;
                    }
                }
            }
            trigger OnQueryClosePage(CloseAction: Action): Boolean;
            var
                ReportCannotBeScheduledErr: Label 'This report cannot be scheduled';
            begin
                exit(true);
            end;
        }
    
        procedure TestMethod()
        var
            LocalTestLabelTxt: Label 'Local Test Label';
        begin
        end;
    
        var
            GlobalTestLabelTxt: Label 'Global Test Label';
            asdf: Option " ",sdf,er;
    
    }`;
}
export function getTableExt(): string {
    return `tableextension 50000 "NAB Test Table Ext" extends Customer
    {
        fields
        {
            field(50000; "NAB Test Field"; Option)
            {
                DataClassification = CustomerContent;
                OptionMembers = asdf,er;
                OptionCaption = 'asdf,er';
                Caption = 'Field';
    
                trigger OnLookup()
                var
                    LocalTestLabelTxt: Label 'Local Test Label';
                begin
    
                end;
            }
        }
    
        procedure TestMethod()
        var
            LocalTestLabelTxt: Label 'Local Test Label';
        begin
        end;
    
        var
            TableExtLabel: Label 'TableExt Label';
    }`;
}
export function getXmlPort(): string {
    return `xmlport 50000 "NAB Test XmlPort"
    {
        Caption = 'The Caption';
    
        schema
        {
            textelement(changedrecords)
            {
                XmlName = 'ChangedRecords';
                tableelement(changelog; "NAB Test Table")
                {
                    MinOccurs = Zero;
                    XmlName = 'ChangedRecord';
                    textattribute(TypeOfChange)
                    {
    
                        trigger OnBeforePassVariable()
                        var
                            ChangeLogTypeNotSupportedErr: Label 'ChangeLog.Type %1 not supported', Comment = '%1 = Type (Inserted, Modified, Deleted)';
                        begin
                        end;
                    }
                    tableelement(tfieldvalue; "NAB Test Table")
                    {
                        XmlName = 'PrimaryKeyField';
                        UseTemporary = true;
                        fieldattribute(No; tFieldValue."My <> & Field")
                        {
                        }
                        fieldattribute(Name; tFieldValue.MyField)
                        {
                            trigger OnBeforePassField()
                            var
                                ChangeLogTypeNotSupportedErr: Label 'ChangeLog.Type %1 not supported', Comment = '%1 = Type (Inserted, Modified, Deleted)';
                            begin
                            end;
                        }
                        textattribute(TypeOfChange2)
                        {
                            trigger OnBeforePassVariable()
                            var
                                ChangeLogTypeNotSupportedErr: Label 'ChangeLog.Type %1 not supported', Comment = '%1 = Type (Inserted, Modified, Deleted)';
                            begin
                            end;
                        }
                    }
                }
            }
        }
    }    
    `;
}

export function getPageWithEmptyString(): string {
    return `page 50100 MyPage
{
    PageType = List;
    ApplicationArea = All;
    UsageCategory = Lists;
    SourceTable = MyTable;

    layout
    {
        area(Content)
        {
            group(GroupName)
            {
                Caption = ' ';
                InstructionalText = ' ';
                field(Name; MyField)
                {

                    ApplicationArea = All;

                    Caption = ' ';
                    ToolTip = ' ';

                }
            }
        }
    }
}`;
}

export function getXlfMultipleNABTokens(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
     <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
       <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
         <body>
           <group id="body">
             <trans-unit id="Table 2328808854 - Field 1296262999 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
               <source>Herro</source>
               <target>[NAB: SUGGESTION][NAB: NOT TRANSLATED]</target>
               <note from="Developer" annotates="general" priority="2"></note>
               <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Property Caption</note>
             </trans-unit>
             <trans-unit id="Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064" size-unit="char" translate="yes" xml:space="preserve">
                <source>OnValidate Error</source>
                <target>OnValidate Error</target>
                <note from="Developer" annotates="general" priority="2"></note>
                <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Method OnValidate - NamedType TestOnValidateErr</note>
            </trans-unit>
           </group>
         </body>
       </file>
     </xliff>`;
}
export function getXlfHasNABTokens(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
    <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
      <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
        <body>
          <group id="body">
            <trans-unit id="Table 2328808854 - Field 1296262999 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
              <source>Has Token</source>
              <target>[NAB: SUGGESTION]Has Token</target>
              <note from="Developer" annotates="general" priority="2"></note>
              <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Property Caption</note>
            </trans-unit>
            <trans-unit id="Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064" size-unit="char" translate="yes" xml:space="preserve">
               <source>No Token</source>
               <target>No Token</target>
               <note from="Developer" annotates="general" priority="2"></note>
               <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Method OnValidate - NamedType TestOnValidateErr</note>
           </trans-unit>
          </group>
        </body>
      </file>
    </xliff>`;
}
export function GetXlfHasMatchingSources(): string {
    return `<?xml version="1.0" encoding="utf-8"?>
    <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
      <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
        <body>
          <group id="body">
            <trans-unit id="Table 2328808854 - Field 1296262999 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
              <source>Has Token</source>
              <target>Has Token</target>
              <note from="Developer" annotates="general" priority="2"></note>
              <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Property Caption</note>
            </trans-unit>
            <trans-unit id="Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064" size-unit="char" translate="yes" xml:space="preserve">
               <source>Has Token</source>
               <note from="Developer" annotates="general" priority="2"></note>
               <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Method OnValidate - NamedType TestOnValidateErr</note>
            </trans-unit>
               <trans-unit id="Table 2328808854 - Field 1296262074 - Method 2126772001 - NamedType 1978266064" size-unit="char" translate="yes" xml:space="preserve">
               <source>Has Token</source>
               <note from="Developer" annotates="general" priority="2"></note>
               <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Method OnValidate - NamedType TestOnValidateErr</note>
            </trans-unit>           
          </group>
        </body>
      </file>
    </xliff>`;
}