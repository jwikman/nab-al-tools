pageextension 50001 "NAB ToolTip Item" extends "Item List" // 30 (27)
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
