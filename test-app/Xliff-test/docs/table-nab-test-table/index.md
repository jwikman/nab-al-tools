---
uid: table_nab_test_table
title: Table Test Table | Al
---
# Test Table

## Object Definition

<table>
<tr><td><b>Object Type</b></td><td>Table</td></tr>
<tr><td><b>Object ID</b></td><td>50000</td></tr>
<tr><td><b>Object Name</b></td><td>NAB Test Table</td></tr>
</table>

## Procedures

| Name | Description |
| ----- | ------ |
| [TestMethod()](test-method.md#test_method) | This is a test method |
| [TestMethod(Integer)](test-method.md#test_method_integer) | This is a test method with pipe (\|) in the summary |

## Fields

| Number | Name | Type |
| ---- | ------- | ----------- |
| 1 | Test Field | Option |
| 2 | MyField | Blob |
| 3 | My <> & Field | Blob |
| 5 | MyField2 | Code[20] |
| 7 | My Enum Field | Enum ["NAB Test Extensible Enum"](../enum-nab-test-extensible-enum/index.md) |

## Deprecated Controls

| Type | Name | Reason | Deprecated since |
| ---- | ---- | ------ | ---------------- |
| Field | My Deprecated Field | Nah not having it |  |
