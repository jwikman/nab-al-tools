report 50000 "NAB Test Report"
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
            TestMethod();
            exit(true);
        end;
    }

    labels
    {
        PostingDateCaption = 'Posting Date';
        DescCaption = 'Description';
    }

    local procedure TestMethod()
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    procedure TestMethod(Parameter: Integer)
    var
        LocalTestLabelTxt: Label 'Local Test Label';
    begin
    end;

    var
        GlobalTestLabelTxt: Label 'Global Test Label';
        asdf: Option " ",sdf,er;

}