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

export function getPageWithCuesAndActions(): string {
  return `
page 70219909 "Time Sheet Activities"
{
    Caption = 'Activities';
    PageType = CardPart;

    layout
    {
        area(content)
        {
            cuegroup(CueGroupName)
            {
                Caption = 'New entry';
                actions
                {
                    action(Today)
                    {
                        ApplicationArea = All;
                        Caption = 'TheCaption';
                        Image = TileNew;
                        trigger OnAction()
                        var
                        begin
                            DoSomething;
                        end;
                    }
                }
            }
            cuegroup("Time Sheets")
            {
                Caption = 'Another caption';

                field("My Rejected"; "My Rejected")
                {
                    ApplicationArea = All;
                }
            }
        }
    }

    actions
    {
        area(processing)
        {
            action("Set Up Cues")
            {
                ApplicationArea = All;
                Caption = 'Third one';
                Image = Setup;

                trigger OnAction();
                    CueSetup: Codeunit "Cues And KPIs";
                    CueRecordRef: RecordRef;
                begin
                end;
            }
        }
    }
}
`;
}

export function getValidObjectDescriptors(): {
  objectDescriptor: string;
  objectName: string;
  extendedObjectId?: number | undefined;
  extendedObjectName?: string | undefined;
  extendedTableId?: number | undefined;
}[] {
  return [
    {
      objectDescriptor:
        'codeunit 70314129 "QWESR IQCM S/Ftp Handler" Implements "QWESR IQCM"',
      objectName: "QWESR IQCM S/Ftp Handler",
    },
    {
      objectDescriptor:
        'codeunit 70314129 "QWESR IQCM S/Ftp Handler" implements "QWESR IQCM", "QWESR IQCM Import", "QWESR IQCM Export"',
      objectName: "QWESR IQCM S/Ftp Handler",
    },
    {
      objectDescriptor:
        'enum 70314080 "QWESR IQCM" implements "QWESR IQCM", "QWESR IQCM Import", "QWESR IQCM Export", "QWESR IQCM Function"',
      objectName: "QWESR IQCM",
    },
    {
      objectDescriptor: 'codeunit 70314130 "QWESR Communication Method Mgt"',
      objectName: "QWESR Communication Method Mgt",
    },
    {
      objectDescriptor:
        'codeunit 70314130 "QWESR Communication Method Mgt" //some "comment"',
      objectName: "QWESR Communication Method Mgt",
    },
    {
      objectDescriptor: "codeunit 70314130 CommunicationMethodMgt",
      objectName: "CommunicationMethodMgt",
    },
    {
      objectDescriptor:
        'codeunit 70314130 CommunicationMethodMgt //some "comment"',
      objectName: "CommunicationMethodMgt",
    },
    {
      objectDescriptor:
        'pageextension 70219910 "QWESP Customer Card" extends "Customer Card" // 21',
      objectName: "QWESP Customer Card",
      extendedObjectId: 21,
      extendedObjectName: "Customer Card",
    },
    {
      objectDescriptor:
        'pageextension 70219910 "QWESP Customer Card" extends CustomerCard // 21',
      objectName: "QWESP Customer Card",
      extendedObjectId: 21,
      extendedObjectName: "CustomerCard",
    },
    {
      objectDescriptor:
        'pageextension 70219910 QWESPCustomerCard extends "Customer Card" // 21',
      objectName: "QWESPCustomerCard",
      extendedObjectId: 21,
      extendedObjectName: "Customer Card",
    },
    {
      objectDescriptor:
        "pageextension 70219910 QWESPCustomerCard extends CustomerCard // 21 (18)",
      objectName: "QWESPCustomerCard",
      extendedObjectId: 21,
      extendedObjectName: "CustomerCard",
      extendedTableId: 18,
    },
    {
      objectDescriptor: 'profile "QWESP Time Sheet Role Center"',
      objectName: "QWESP Time Sheet Role Center",
    },
    {
      objectDescriptor: 'interface "QWESR Integration Type"',
      objectName: "QWESR Integration Type",
    },
    {
      objectDescriptor: 'permissionset 123456789 "QWESR Admin"',
      objectName: "QWESR Admin",
    },
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
    "codeunit 50100 MyCodeunit implements",
    "codeunit 50100 MyCodeunit implements MyInterface1 MyInterface2",
    "codeunit 50100 MyCodeunit implements MyInterface1,,,,MyInterface2",
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
                field("Field2"; "Field2")
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
    Caption = 'Page Caption';

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

export function getPageWithObsoleteControls(): string {
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
                    ObsoleteReason = 'The Reason';
                    ObsoleteState = Pending;
                    ObsoleteTag = 'The Tag';

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
                ObsoleteReason = 'The Action Reason';
                ObsoleteState = Pending;
                ObsoleteTag = 'The Action Tag';

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
                TestOnValidateErr: Label 'OnValidate Error';
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

export function getCodeunitWithObsoletedMethods(): string {
  return `codeunit 50000 "NAB Test Codeunit"
    {
        trigger OnRun()
        var
        begin
    
        end;
    
        [Obsolete('The reason', 'The Tag')]
        procedure TestMethod()
        var
        LocalTestLabelTxt: Label 'Local Test Label';
        begin
        end;
        
        [Obsolete('The Event reason', 'The Event Tag')]
        // A Comment
        [IntegrationEvent(false, false)]
        #pragma warning disable
        local procedure OnBeforeWhatever(var IsHandled: Boolean)
        begin
        end;

    
    }`;
}

export function getCodeunitPublic(): string {
  return `codeunit 50000 "NAB Test Codeunit"
    {
        Access = Public;

        trigger OnRun()
        begin
        end;
    }`;
}
export function getCodeunitInternal(): string {
  return `codeunit 50000 "NAB Test Codeunit"
    {
        Access = Internal;

        trigger OnRun()
        begin
        end;
    }`;
}
export function getCodeunitWithOverloads(): string {
  return `codeunit 50001 "NAB Test Overload"
{
    procedure OverloadMethod1()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin

    end;

    procedure OverloadMethod1(param: boolean)
    var
        LocalTestLabel2Txt: Label 'Local Test Label 2';
    begin

    end;

    procedure OverloadMethod2()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin

    end;

    procedure TestMethodInTheMiddle()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    procedure OverloadMethod2(param: boolean)
    var
        LocalTestLabel2Txt: Label 'Local Test Label 2';
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
export function getCodeunitWithXmlComments(): string {
  return `
    /// <summary>
    /// The Summary
    /// </summary>
    codeunit 50000 "NAB Test Codeunit"
    {
        /// <summary>
        /// The Function Summary
        /// </summary>
        /// <param name="Parameter">The <c>first</c> parameter</param>
        /// <param name="pvRecRef">The second parameter</param>
        /// <returns>Anything</returns>
        procedure TheProcedure(Parameter: Record "Table"; var pvRecRef: RecordRef) : Integer
        var
            MyLabel: Label 'The text';
        begin
        end;

        /// <summary>
        /// The 2nd Summary
        /// </summary>
        /// <param name="Parameter">The first parameter</param>
        /// <param name="pvRecRef">The second parameter</param>
        /// <returns>Anything</returns>
        [TryFunction]
        procedure TheProcedure2(
            Parameter: Record "Table"; 
            var pvRecRef: RecordRef;
            var pvParameter: Record "Table" temporary
        ) : Integer
        begin
        end;
    
    }`;
}

export function getInterfaceWithXmlComments(): string {
  return `
    /// <summary>
    /// The Summary
    /// </summary>
    interface 50000 "NAB Test Interface"
    {
        /// <summary>
        /// The Function Summary
        /// </summary>
        /// <param name="Parameter">The first parameter</param>
        /// <param name="pvRecRef">The second parameter</param>
        /// <returns>Anything</returns>
        procedure TheProcedure(Parameter: Record "Table"; var pvRecRef: RecordRef) : Integer

        /// <summary>
        /// The 2nd Summary
        /// </summary>
        /// <param name="Parameter">The first parameter</param>
        /// <param name="pvRecRef">The second parameter</param>
        /// <returns>Anything</returns>
        procedure TheProcedure2(
            Parameter: Record "Table"; 
            var pvRecRef: RecordRef;
            var pvParameter: Record "Table" temporary
        ) : Integer
        /// <summary>
        /// The 3rd Summary
        /// </summary>
        /// <param name="pvParameter">The parameter</param>
        /// <returns>Anything</returns>
        [Obsolete('The reason','The tag')]
        procedure TheProcedure2(var pvParameter: Record "Table" temporary) : Integer
    }`;
}

export function getSimpleInterface(): string {
  return `interface "Inventory Adjustment"
{
    procedure SetFilterItem(var NewItem: Record Item)

    procedure SetJobUpdateProperties(SkipUpdateJobItemCost: Boolean)

    procedure SetProperties(NewIsOnlineAdjmt: Boolean; NewPostToGL: Boolean)

    procedure MakeMultiLevelAdjmt()
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
  return `pageextension 50000 "NAB Test PageExt" extends "Customer List" // 21 (18)
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
export function getReportExtension(): string {
  return `reportextension 50000 "NAB Test Report Ext." extends "Customer - Top 10 List"
{
    dataset
    {
        add(Customer)
        {
            column(Address; Address)
            {
                Caption = 'Test 1';
            }
            column(Address2; "Address 2")
            {
                Caption = 'Test 2';
            }
        }
        modify(BalanceLCY_Customer)
        {
            Description = 'Test 3';
        }
    }
}
`;
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
export function getApiPage(): string {
  return `page 12077501 "QWEBI Customer Entity"
{
    APIGroup = 'appName';
    APIPublisher = 'publisher';
    APIVersion = 'v1.0';
    Caption = 'customers', Locked = true;
    DelayedInsert = true;
    DeleteAllowed = false;
    EntityName = 'customer';
    EntitySetName = 'customers';
    InsertAllowed = false;
    ModifyAllowed = false;
    PageType = API;
    SourceTable = Customer;

    layout
    {
        area(Content)
        {
            repeater(Control1)
            {
                field(customerNumber; "No.")
                {
                    Caption = 'customerNumber', Locked = true;
                    ApplicationArea = all;
                }
                field(customerName; "Name")
                {
                    Caption = 'customerName', Locked = true;
                    ApplicationArea = all;
                }
            }
        }
    }
}`;
}

export function getObsoletePage(): string {
  return `page 50100 MyPage
{
    PageType = List;
    ApplicationArea = All;
    UsageCategory = Lists;
    SourceTable = MyTable;
    ObsoleteState = Removed;

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
                <target>OnValidate Error 2</target>
                <note from="Developer" annotates="general" priority="2"></note>
                <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Method OnValidate - NamedType TestOnValidateErr</note>
            </trans-unit>
           </group>
         </body>
       </file>
     </xliff>`;
}

export function getXlfMultipleTargets(): string {
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

export function getXlfHasMatchingSources(): string {
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

export function getXlfWithContextBasedMultipleMatchesInBaseApp(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
    <xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="urn:oasis:names:tc:xliff:document:1.2 xliff-core-1.2-transitional.xsd">
      <file datatype="xml" source-language="en-US" target-language="sv-SE" original="AlTestApp">
        <body>
          <group id="body">
            <trans-unit id="Table 2328808854 - Field 1296262999 - Property 2879900210" size-unit="char" translate="yes" xml:space="preserve">
              <source>State</source>
              <note from="Developer" annotates="general" priority="2"></note>
              <note from="Xliff Generator" annotates="general" priority="3">Table MyTable - Field MyField - Property Caption</note>
            </trans-unit>
          </group>
        </body>
      </file>
    </xliff>`;
}

export function getTableWithSpecialCharacters(): string {
  return `table 50000 "NAB Test Table"
{
    DataClassification = CustomerContent;
    Caption = 'Table', Comment = 'TableComment', MaxLength = 23;

    fields
    {
        field(1; "Test Field"; Option)
        {
            DataClassification = CustomerContent;
            OptionMembers = asdf,er;
            OptionCaption = 'asdf,er', Locked = true;
            Caption = 'Test Field';
        }
        field(2; MyField; Blob)
        {
            Caption = 'My Field Table Caption';
            DataClassification = ToBeClassified;
        }
        field(3; "My <> & Field"; Decimal)
        {
            DataClassification = ToBeClassified;
            Caption = 'My <> & Field''s';
        }
        field(4; "Field no Caption"; Decimal)
        {
        }
    }

    keys
    {
        key(PK; "Test Field")
        {
            Clustered = true;
        }
    }
}`;
}
export function getEnumWithOneLiners(): string {
  return `enum 50004 "NAB One Liners"
{
    Extensible = true;
    AssignmentCompatibility = true;

    value(0; "Straight-Line") { Caption = 'Straight-Line'; }
    value(1; "Equal per Period") { Caption = 'Equal per Period'; }
    value(2; "Days per Period") { Caption = 'Days per Period'; }
    value(3; "User-Defined") { Caption = 'User-Defined'; }
    value(4; none) { Caption = '', Locked = true; }
    value(5; SharedAccessSignature) { Caption = 'Shared access signature (SAS)'; }
}`;
}
export function getPageWithoutToolTips(): string {
  return `
page 50000 "NAB Test Table Card"
{
    PageType = Card;
    ApplicationArea = All;
    UsageCategory = Administration;
    SourceTable = "NAB Test Table";
    Caption = 'Page Caption';
    InstructionalText = 'Instructions';
    PromotedActionCategories = 'asdf,erewf';

    layout
    {
        area(Content)
        {
            group(GroupName)
            {
                Caption = 'Grp';
                InstructionalText = 'Instruction';
                field(Name; "asdf")
                {
                    ApplicationArea = All;
                    Caption = 'Page Field Caption';
                    OptionCaption = 'asdf,sadf,____ASADF';

                    trigger OnAssistEdit()
                    var
                        LocalTestLabelTxt: Label 'Local Test Label';

                    begin

                    end;
                }
                field(MyField; "MyField")
                {
                }
                field(FunctionAsField; GetTheValue())
                {
                }
                field(FieldNoCaption; "Field no Caption")
                {
                }
                field(LtGtAmpField; "My <> & Field")
                {
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(ActionName)
            {
                Caption = 'Action Caption';
                ApplicationArea = All;

                trigger OnAction()
                var
                    LocalTestLabelTxt: Label 'Local Test Label';
                begin

                end;
            }
            action(ActionNameNoCaption)
            {
                ApplicationArea = All;
            }
        }
    }
    procedure TestMethodPage()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    var
        GlobalTestLabelTxt: Label 'Global Test Label';
        asdf: Option;
}`;
}

export function getPageWithToolTips(): string {
  return `
page 50001 "NAB Test Table List"
{
    PageType = List;
    ApplicationArea = All;
    UsageCategory = Administration;
    SourceTable = "NAB Test Table";
    Caption = 'Page Caption';
    InstructionalText = 'Instructions';
    PromotedActionCategories = 'asdf,erewf';

    layout
    {
        area(Content)
        {
            group(GroupName)
            {
                Caption = 'Grp';
                InstructionalText = 'Instruction';
                field(Name; "asdf")
                {
                    ApplicationArea = All;
                    Caption = 'Page Field Caption';
                    OptionCaption = 'asdf,sadf,____ASADF';
                    ToolTip = 'Specifies a field';

                    trigger OnAssistEdit()
                    var
                        LocalTestLabelTxt: Label 'Local Test Label';

                    begin

                    end;
                }
                field(MyField; "MyField")
                {
                    ToolTip = 'Specifies another field';
                }
                field(FunctionAsField; GetTheValue())
                {
                    ToolTip = 'Specifies a third field';
                }
                field(FieldNoCaption; "Field no Caption")
                {
                    ToolTip = 'Specifies a field without caption';
                }
                field(LtGtAmpField; "My <> & Field")
                {
                    ToolTip = 'Specifies a field with odd characters';
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(ActionName)
            {
                Caption = 'Action Caption';
                ApplicationArea = All;
                ToolTip = 'First action';
                
                trigger OnAction()
                var
                LocalTestLabelTxt: Label 'Local Test Label';
                begin
                
                end;
            }
            action(ActionNameNoCaption)
            {
                ApplicationArea = All;
                ToolTip = 'Second action';
            }
        }
    }
}`;
}
