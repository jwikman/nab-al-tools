import {
  ALObject,
  ALControl,
  ALProperty,
  MultiLanguageObject,
} from "../ALObject/ALElementTypes";
import {
  ControlDefinition,
  ControlKind,
  LanguageElementWithProperties,
  NamespaceDefinition,
  PageDefinition,
  SymbolProperty,
  TableDefinition,
} from "./interfaces/SymbolReference";
import { ALControlType, ALObjectType } from "../ALObject/Enums";
import { ALTableField } from "../ALObject/ALTableField";
import { alPropertyTypeMap, multiLanguageTypeMap } from "../ALObject/Maps";
import { AppPackage } from "./types/AppPackage";
import { symbolReferenceCache } from "./SymbolReferenceCache";
import { ALPageField } from "../ALObject/ALPageField";
import { ALPagePart } from "../ALObject/ALPagePart";
import { addSystemFields } from "../ALObject/ALParser";

export function getObjectsFromAppFile(appFilePath: string): AppPackage {
  const appIdentifier = AppPackage.appIdentifierFromFilename(appFilePath);

  let appPackage;
  if (symbolReferenceCache.isCached(appIdentifier)) {
    appPackage = symbolReferenceCache.get(appIdentifier);
  }
  if (!appPackage) {
    appPackage = AppPackage.fromFile(appFilePath);
    parseObjectsInAppPackage(appPackage);
    // Free up unnecessary memory allocation
    appPackage.symbolReference = undefined;
    symbolReferenceCache.set(appPackage);
  }
  return appPackage;
}

function parseObjectsInAppPackage(appPackage: AppPackage): void {
  if (appPackage.symbolReference === undefined) {
    return;
  }
  const objects: ALObject[] = [];
  parseNamespaces(appPackage.symbolReference.Namespaces, objects);
  // Objects without namespace:
  parseTables(appPackage.symbolReference.Tables, objects);
  parsePages(appPackage.symbolReference.Pages, objects);
  parseObjects(
    ALObjectType.report,
    appPackage.symbolReference.Reports,
    objects
  );
  parseObjects(
    ALObjectType.codeunit,
    appPackage.symbolReference.Codeunits,
    objects
  );
  parseObjects(
    ALObjectType.controladdin,
    appPackage.symbolReference.ControlAddIns,
    objects
  );
  parseObjects(
    ALObjectType.interface,
    appPackage.symbolReference.Interfaces,
    objects
  );
  parseObjects(ALObjectType.query, appPackage.symbolReference.Queries, objects);
  parseObjects(
    ALObjectType.xmlPort,
    appPackage.symbolReference.XmlPorts,
    objects
  );

  objects.filter((obj) =>
    obj
      .getAllControls()
      .filter((ctrl) => ctrl.type === ALControlType.part)
      .forEach((partControl) => {
        const alPagePart = partControl as ALPagePart;
        // Substitute Page no. against page names
        const page = objects.find(
          (tbl) =>
            tbl.objectType === ALObjectType.page &&
            tbl.objectId === Number(alPagePart.value)
        );
        if (page) {
          alPagePart.value = page.name;
        }
      })
  );

  appPackage.objects.push(...objects);
}

function parseNamespaces(
  namespaces: NamespaceDefinition[],
  objects: ALObject[]
): void {
  if (!namespaces) {
    return;
  }
  namespaces.forEach((namespace) => {
    parseNamespaces(namespace.Namespaces, objects);
    parseTables(namespace.Tables, objects);
    parsePages(namespace.Pages, objects);
    parseObjects(ALObjectType.report, namespace.Reports, objects);
    parseObjects(ALObjectType.codeunit, namespace.Codeunits, objects);
    parseObjects(ALObjectType.controladdin, namespace.ControlAddIns, objects);
    parseObjects(ALObjectType.interface, namespace.Interfaces, objects);
    parseObjects(ALObjectType.query, namespace.Queries, objects);
    parseObjects(ALObjectType.xmlPort, namespace.XmlPorts, objects);
  });
}
function parsePages(pages: PageDefinition[], objects: ALObject[]): void {
  if (!pages) {
    return;
  }
  pages.forEach((page) => {
    const obj = pageToObject(page);
    obj.alObjects = objects;
    if (obj.sourceTable !== "") {
      // Substitute Table No. against Table Name
      const table = objects.find(
        (tbl) =>
          tbl.objectType === ALObjectType.table &&
          tbl.objectId === Number(obj.sourceTable)
      );
      if (table) {
        obj.sourceTable = table.name;
      }
    }
    objects.push(obj);
  });
}

function parseObjects(
  objectType: ALObjectType,
  symbolObjects: LanguageElementWithProperties[],
  objects: ALObject[]
): void {
  if (!symbolObjects) {
    return;
  }
  symbolObjects.forEach((symbolObject) => {
    const obj = symbolToObject(objectType, symbolObject);
    obj.alObjects = objects;
    objects.push(obj);
  });
}

function symbolToObject(
  objectType: ALObjectType,
  symbolObject: LanguageElementWithProperties
): ALObject {
  const obj = new ALObject(
    [],
    objectType,
    0,
    symbolObject.Name,
    symbolObject.Id
  );
  obj.generatedFromSymbol = true;
  symbolObject.Properties?.forEach((prop) => {
    addProperty(prop, obj);
  });
  return obj;
}
function parseTables(tables: TableDefinition[], objects: ALObject[]): void {
  if (!tables) {
    return;
  }
  tables.forEach((table) => {
    const obj = tableToObject(table);
    obj.alObjects = objects;
    objects.push(obj);
  });
}

function tableToObject(table: TableDefinition): ALObject {
  const obj = new ALObject([], ALObjectType.table, 0, table.Name, table.Id);
  obj.generatedFromSymbol = true;
  table.Properties?.forEach((prop) => {
    addProperty(prop, obj);
  });
  table.Fields?.forEach((field) => {
    const alField = ALTableField.fromFieldDefinition(field);
    alField.parent = obj;
    field.Properties?.forEach((prop) => {
      addProperty(prop, alField);
    });
    obj.controls.push(alField);
  });
  addSystemFields(obj);
  return obj;
}

function pageToObject(page: PageDefinition): ALObject {
  const obj = new ALObject([], ALObjectType.page, 0, page.Name, page.Id);
  obj.generatedFromSymbol = true;
  page.Properties?.forEach((prop) => {
    addProperty(prop, obj);
  });
  page.Controls?.forEach((control) => {
    addControl(control, obj);
  });
  return obj;
}

function addControl(control: ControlDefinition, parent: ALControl): void {
  let alControl: ALControl | undefined;
  if (control.Kind === ControlKind.Field) {
    const sourceExpr = control.Properties.filter(
      (prop) => prop.Name === "SourceExpression"
    )[0].Value;
    alControl = new ALPageField(
      ALControlType.pageField,
      control.Name,
      sourceExpr
    );
  } else if (control.Kind === ControlKind.Part) {
    let value = control.RelatedPagePartId?.Name;
    if (!value || value === "") {
      value = control.RelatedPagePartId?.Id?.toString();
    }
    alControl = new ALPagePart(ALControlType.part, control.Name, value || "");
  } else {
    let newAlControlType: ALControlType = ALControlType.none;
    switch (control.Kind) {
      case ControlKind.Area:
        newAlControlType = ALControlType.area;
        break;
      case ControlKind.CueGroup:
        newAlControlType = ALControlType.cueGroup;
        break;
      case ControlKind.Group:
        newAlControlType = ALControlType.group;
        break;
      case ControlKind.Repeater:
        newAlControlType = ALControlType.repeater;
        break;
    }
    if (newAlControlType !== ALControlType.none) {
      alControl = new ALControl(newAlControlType, control.Name);
    }
  }
  if (alControl) {
    control.Properties?.forEach((prop) => {
      if (alControl) {
        addProperty(prop, alControl);
      }
    });
    alControl.parent = parent;
    parent.controls.push(alControl);
    control.Controls?.forEach((c) => {
      if (alControl) {
        addControl(c, alControl);
      }
    });
  }
}

function addProperty(prop: SymbolProperty, obj: ALControl): void {
  const type = multiLanguageTypeMap.get(prop.Name.toLowerCase());
  if (type) {
    const mlProp = new MultiLanguageObject(obj, type, prop.Name);
    mlProp.text = prop.Value;
    obj.multiLanguageObjects.push(mlProp);
  } else if (alPropertyTypeMap.has(prop.Name.toLowerCase())) {
    obj.properties.push(new ALProperty(obj, 0, prop.Name, prop.Value));
  }
}
