page 50010 "NAB WS Deprecated"
{
    Caption = 'WS Deprecated';
    PageType = List;
    SourceTable = Customer;
    ObsoleteState = Pending;
    ObsoleteReason = 'Testing deprecation';
    ObsoleteTag = '12.0';

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field(Address; Rec.Address)
                {
                    ApplicationArea = All;
                }
                field("Address 2"; Rec."Address 2")
                {
                    ApplicationArea = All;
                }
                field(Amount; Rec.Amount)
                {
                    ApplicationArea = All;
                }
            }
        }
    }
    actions
    {
        area(Navigation)
        {
            ObsoleteState = Pending;
            ObsoleteReason = 'Testing deprecation';
            ObsoleteTag = '12.0';
            group(TestGroup)
            {
                ObsoleteState = Pending;
                ObsoleteReason = 'Testing deprecation';
                ObsoleteTag = '12.0';

                action(TestAction)
                {
                    Caption = 'Test Action';
                    ObsoleteState = Pending;
                    ObsoleteReason = 'Testing deprecation';
                    ObsoleteTag = '12.0';

                    trigger OnAction()
                    begin
                        Message('I''m deprecated');
                    end;
                }
            }
        }
    }
}
