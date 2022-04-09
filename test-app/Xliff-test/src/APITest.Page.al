page 50007 "NAB API Test"
{
    APIGroup = 'testGroup';
    APIPublisher = 'tester';
    APIVersion = 'v1.0';
    Caption = 'apiTest';
    DelayedInsert = true;
    EntityName = 'test';
    EntitySetName = 'tests';
    PageType = API;
    SourceTable = "NAB Test Table";

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field(myEnumField; Rec."My Enum Field")
                {
                    Caption = 'My Enum Field';
                }
                field(myField; Rec.MyField)
                {
                    Caption = 'MyField';
                }
                field(myField2; Rec.MyField2)
                {
                    Caption = 'MyField2';
                }
                field(systemCreatedAt; Rec.SystemCreatedAt)
                {
                    Caption = 'SystemCreatedAt';
                }
                field(systemCreatedBy; Rec.SystemCreatedBy)
                {
                    Caption = 'SystemCreatedBy';
                }
                field(systemId; Rec.SystemId)
                {
                    Caption = 'SystemId';
                }
                field(systemModifiedAt; Rec.SystemModifiedAt)
                {
                    Caption = 'SystemModifiedAt';
                }
                field(systemModifiedBy; Rec.SystemModifiedBy)
                {
                    Caption = 'SystemModifiedBy';
                }
                field("testField"; Rec."Test Field")
                {
                    Caption = 'Field';
                }
                part("subPage"; "NAB API Sub Test")
                {
                    Caption = 'subPage';
                }
            }
        }
    }
}
