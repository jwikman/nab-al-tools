page 50011 "NAB PromptDialog"
{
    ApplicationArea = All;
    Caption = 'PromptDialog';
    Extensible = false;
    PageType = PromptDialog;


    layout
    {
        area(Prompt)
        {
            field(ChatRequest; InputText)
            {
                MultiLine = true;
                ShowCaption = false;

                trigger OnValidate()
                begin
                    CurrPage.Update();
                end;
            }
        }
    }
    actions
    {
        area(SystemActions)
        {
            systemaction(Generate)
            {
                Caption = 'Generate';
                ToolTip = 'Generate function proposals with Dynamics 365 Copilot.';

                trigger OnAction()
                begin
                    RunGeneration();
                end;
            }
            systemaction(OK)
            {
                Caption = 'Confirm';
                ToolTip = 'Proceed with the selected functions.';
            }
            systemaction(Cancel)
            {
                Caption = 'Discard';
                ToolTip = 'Discard the function proposals by Dynamics 365 Copilot.';
            }
            systemaction(Regenerate)
            {
                Caption = 'Regenerate';
                ToolTip = 'Regenerate function proposals with Dynamics 365 Copilot.';
            }
        }
    }
    var
        InputText: Text;

    local procedure RunGeneration()
    begin
        Error('Procedure RunGeneration not implemented.');
    end;

}
