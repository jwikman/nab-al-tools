report 50100 "NAB Report With Labels"
{
    ApplicationArea = All;
    Caption = 'Consistency Check for Active';
    DefaultLayout = RDLC;
    UsageCategory = Tasks;

    dataset
    {
        dataitem(Integer; "Integer")
        {
            column(CompanyName; CompanyName()) { }
            column(Source; GlobalSource) { }
        }
    }

    labels
    {
        SourceLbl = 'Source Table';
    }

    var
        GlobalSource: Text;

}
