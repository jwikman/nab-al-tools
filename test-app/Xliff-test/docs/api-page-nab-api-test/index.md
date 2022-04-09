---
uid: api_page_nab_api_test
title: Page NAB API Test | Al
---
# NAB API Test

## Object Definition

<table>
<tr><td><b>Object Type</b></td><td>Page</td></tr>
<tr><td><b>Object ID</b></td><td>50007</td></tr>
<tr><td><b>Object Name</b></td><td>NAB API Test</td></tr>
<tr><td><b>Source Table</b></td><td>NAB Test Table</td></tr>
</table>

## API Definition

<table>
<tr><td><b>APIPublisher</b></td><td>tester</td></tr>
<tr><td><b>APIGroup</b></td><td>testGroup</td></tr>
<tr><td><b>APIVersion</b></td><td>v1.0</td></tr>
<tr><td><b>EntitySetName</b></td><td>tests</td></tr>
<tr><td><b>EntityName</b></td><td>test</td></tr>
</table>

## Controls

| Type | Name | Data Type | Read-only |
| ---- | ------- | ------- | ----------- |
| Field | myEnumField | Enum "NAB Test Extensible Enum" |  |
| Field | myField | Blob |  |
| Field | myField2 | Code[20] |  |
| Field | systemCreatedAt | DateTime | Yes |
| Field | systemCreatedBy | Guid | Yes |
| Field | systemId | Guid | Yes |
| Field | systemModifiedAt | DateTime | Yes |
| Field | systemModifiedBy | Guid | Yes |
| Field | testField | Option |  |
| Sub page | [subPage](../api-page-nab-api-sub-test/index.md) |  |  |
