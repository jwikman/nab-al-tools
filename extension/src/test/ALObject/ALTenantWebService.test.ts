import * as assert from "assert";
import * as xmldom from "@xmldom/xmldom";
import { ALTenantWebService } from "../../ALObject/ALTenantWebService";
import { ALObjectType } from "../../ALObject/Enums";

suite("ALTenantWebService Test", () => {
  test("ALTenantWebService.fromElement()", function () {
    const xmlDom = new xmldom.DOMParser().parseFromString(
      tenantWebServiceCollectionXml()
    );
    const tenantWebServices: Element[] = Array.from(
      xmlDom.getElementsByTagName("TenantWebService")
    );
    const webServices: ALTenantWebService[] = [];
    tenantWebServices.forEach((ws) => {
      webServices.push(
        ALTenantWebService.fromElement(ws) as ALTenantWebService
      );
    });
    assert.strictEqual(
      webServices.length,
      3,
      "Unexpected number of web services."
    );
    const actual = webServices[0];
    assert.strictEqual(
      actual.object,
      undefined,
      "object should not be defined."
    );
    assert.strictEqual(actual.objectId, 50000, "Unexpected objectId.");
    assert.strictEqual(
      actual.objectType,
      ALObjectType.page,
      "Unexpected objectType."
    );
    assert.strictEqual(
      actual.published,
      true,
      "Expected webservice to be published."
    );
    assert.strictEqual(actual.serviceName, "customer", "Unexpect serviceName.");
  });
});

function tenantWebServiceCollectionXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<ExportedData>
    <TenantWebServiceCollection>
        <TenantWebService>
            <ObjectType>Page</ObjectType>
            <ServiceName>customer</ServiceName>
            <ObjectID>50000</ObjectID>
            <Published>true</Published>
        </TenantWebService>
        <TenantWebService>
            <ObjectType>CodeUnit</ObjectType>
            <ServiceName>systemAPI</ServiceName>
            <ObjectID>50000</ObjectID>
            <Published>true</Published>
        </TenantWebService>
        <TenantWebService>
            <ObjectType>Page</ObjectType>
            <ServiceName>item</ServiceName>
            <ObjectID>50001</ObjectID>
            <Published>true</Published>
        </TenantWebService>
    </TenantWebServiceCollection>
</ExportedData>`;
}
