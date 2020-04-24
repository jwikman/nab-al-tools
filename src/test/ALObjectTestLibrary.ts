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

export function GetGXlf():string{
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

export function GetEnuXlfMissingTranslations():string{
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


export function GetPage():string{
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

export function GetTable():string{
    return `table 50100 MyTable
{
    DataClassification = CustomerContent;

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

export function GetCodeunit():string{
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
export function GetEnum():string{
    return `enum 50000 "NAB TestEnum"
    {
        Extensible = false;
    
        value(0; MyValue)
        {
            Caption = 'Enum1';
        }
    
    }`;
}
export function GetPageExt():string{
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
export function GetQuery():string{
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
export function GetReport():string{
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
                    group("GroupName")
                    {
                        Caption = 'Grp';
                        InstructionalText = 'Instructions';
                        field("Fld"; "asdf")
                        {
                            Caption = 'Fld';
                            OptionCaption = '1234,34';
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
                    action("ActionName")
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
export function GetTableExt():string{
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

export function GetXlfMultipleNABTokens(): string {
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
           </group>
         </body>
       </file>
     </xliff>`;
}
