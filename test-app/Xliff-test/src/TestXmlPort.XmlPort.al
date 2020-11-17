xmlport 50000 "NAB Test XmlPort"
{
    Caption = 'The Caption';

    schema
    {
        textelement(changedrecords)
        {
            XmlName = 'ChangedRecords';
            tableelement(changelog; "NAB Test Table")
            {
                MinOccurs = Zero;
                XmlName = 'ChangedRecord';
                textattribute(TypeOfChange)
                {

                    trigger OnBeforePassVariable()
                    var
                        ChangeLogTypeNotSupportedErr: Label 'ChangeLog.Type %1 not supported', Comment = '%1 = Type (Inserted, Modified, Deleted)';
                    begin
                    end;
                }
                tableelement(tfieldvalue; "NAB Test Table")
                {
                    XmlName = 'PrimaryKeyField';
                    UseTemporary = true;
                    fieldattribute(No; tFieldValue."My <> & Field")
                    {
                    }
                    fieldattribute(Name; tFieldValue.MyField)
                    {
                        trigger OnBeforePassField()
                        var
                            ChangeLogTypeNotSupportedErr: Label 'ChangeLog.Type %1 not supported', Comment = '%1 = Type (Inserted, Modified, Deleted)';
                        begin
                        end;
                    }
                    textattribute(TypeOfChange2)
                    {
                        trigger OnBeforePassVariable()
                        var
                            ChangeLogTypeNotSupportedErr: Label 'ChangeLog.Type %1 not supported', Comment = '%1 = Type (Inserted, Modified, Deleted)';
                        begin
                        end;
                    }
                }
            }
        }
    }
}
