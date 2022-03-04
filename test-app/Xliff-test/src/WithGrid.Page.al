page 50006 "NAB With Grid"
{
    Caption = 'Page With Grid';
    DeleteAllowed = false;
    InsertAllowed = false;
    ModifyAllowed = false;
    PageType = Worksheet;
    SourceTable = "Item";
    SourceTableTemporary = true;
    UsageCategory = None;

    layout
    {
        area(content)
        {
            grid(Option)
            {
                Caption = 'Option';
                field(ItemFilter; ItemFilter)
                {
                    ApplicationArea = Assembly;
                    Caption = 'Item Filter';
                    ToolTip = 'Specifies the bla bla bla.';
                }
            }
            repeater(Group)
            {
                Caption = 'Lines';
                ShowAsTree = true;
                field(Type; Rec.Type)
                {
                    Caption = 'Type';
                    ApplicationArea = Assembly;
                }
            }
        }
        area(factboxes)
        {
            systempart(RecordLinks; Links)
            {
                ApplicationArea = RecordLinks;
                Caption = 'RecordLinks';
                Visible = false;
            }
            systempart(Control1905767507; Notes)
            {
                ApplicationArea = Notes;
                Visible = false;
            }
        }
    }
    var
        ItemFilter: Text;
}
