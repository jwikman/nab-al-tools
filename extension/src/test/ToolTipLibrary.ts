export function getTable(): string {
  return `table 50001 "NAB ToolTip"
{
    Caption = 'NAB ToolTip';
    DataClassification = CustomerContent;

    fields
    {
        field(1; PK; Code[2])
        {
            Caption = 'PK';
            DataClassification = CustomerContent;
        }
        field(10; "Field 1"; Text[50])
        {
            Caption = 'Field 1';
            DataClassification = CustomerContent;
        }
        field(11; "Field 2"; Text[50])
        {
            Caption = 'Field 2';
            DataClassification = CustomerContent;
        }
        field(12; "Field 3"; Decimal)
        {
            Caption = 'Field 3', Locked = true;
            DataClassification = CustomerContent;
        }
        field(13; "Field No Caption"; Decimal)
        {
            DataClassification = CustomerContent;
        }
    }
    keys
    {
        key(PK; PK)
        {
            Clustered = true;
        }
    }

}

`;
}
export function getTableExtension(): string {
  return `tableextension 50001 "NAB ToolTip" extends Item // 27
{
    fields
    {
        field(50000; "Field 1"; Text[50])
        {
            Caption = 'Field 1';
            DataClassification = CustomerContent;
        }
        field(50001; "Field 2"; Text[50])
        {
            Caption = 'Field 2';
            DataClassification = CustomerContent;
        }
        field(50002; "Field 3"; Decimal)
        {
            Caption = 'Field 3';
            DataClassification = CustomerContent;
        }
        field(50003; "Field 4"; Option)
        {
            Caption = 'Field 4';
            OptionMembers = one,two;
            OptionCaption = 'One,Two';
            DataClassification = CustomerContent;
        }
    }
}

`;
}
export function getPageExt(): string {
  return `pageextension 50001 "NAB ToolTip Item" extends "Item List" // 31 (27)
{
    layout
    {
        addafter("No.")
        {
            field("Field 1"; Rec."Field 1")
            {
                ApplicationArea = All;
            }
            field("Field 2"; Rec."Field 2")
            {
                ApplicationArea = All;
            }
            field("Field 3"; Rec."Field 3")
            {
                ApplicationArea = All;
            }
            field("Field 4"; Rec."Field 4")
            {
                ApplicationArea = All;
            }
        }
    }
}
`;
}

export function getPagePart(): string {
  return `page 50002 "NAB ToolTip Part 1"
{

    Caption = 'NAB ToolTip Part 1';
    PageType = ListPart;
    SourceTable = Item;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("Description 2"; Rec."Description 2")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Description 2 field';
                }
                field("Discrete Order Quantity"; Rec."Discrete Order Quantity")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Discrete Order Quantity field';
                }
                field("Field 1"; Rec."Field 1")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 1 field';
                }
                field("Field 2"; Rec."Field 2")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 2 field';
                }
                field("Field 3"; Rec."Field 3")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 3 field';
                }
                field("Field 4"; Rec."Field 4")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 4 field';
                }
            }
        }
    }

}

`;
}

export function getPagePart2(): string {
  return `page 50003 "NAB ToolTip Part 2"
{

    Caption = 'NAB ToolTip Part 2';
    PageType = ListPart;
    SourceTable = "NAB ToolTip";

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("Field 1"; Rec."Field 1")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 1 field';
                }
                field("Field 2"; Rec."Field 2")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 2 field';
                }
                field("Field 3"; Rec."Field 3")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 3 field';
                }
                field("Field No Caption"; Rec."Field No Caption")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field No Caption field';
                }

            }
        }
    }

}
`;
}

export function getPage(): string {
  return `#pragma implicitwith disable
page 50001 "NAB ToolTips"
{

    Caption = 'NAB ToolTips';
    PageType = List;
    SourceTable = "NAB ToolTip";
    UsageCategory = None;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field(PK; Rec.PK)
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the PK field';
                }
                field("Field 1"; Rec."Field 1")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 1 field';
                }
                field("Field 2"; Rec."Field 2")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 2 field';
                }
                field("Field 3"; Rec."Field 3")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field 3';
                }
                field("Field 4"; Rec."Field No Caption")
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the Field No Caption field';
                }
                field(SystemId; Rec.SystemId)
                {
                    ApplicationArea = All;
                    ToolTip = 'Specifies the value of the SystemId field';
                }
            }
            part(ToolTipPart; "NAB ToolTip Part 1")
            {

            }
            part(ToolTipPart2; "NAB ToolTip Part 2")
            {

            }
        }
    }

}

#pragma implicitwith restore

`;
}
