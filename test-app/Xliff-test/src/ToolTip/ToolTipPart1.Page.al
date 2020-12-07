page 50002 "NAB ToolTip Part 1" // (27)
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
