import * as vscode from "vscode";
import * as fs from "graceful-fs";
import * as Telemetry from "./Telemetry/Telemetry";
import * as ALParser from "./ALObject/ALParser";
import * as Common from "./Common";
import * as WorkspaceFunctions from "./WorkspaceFunctions";
import * as SettingsLoader from "./Settings/SettingsLoader";
import * as DocumentFunctions from "./DocumentFunctions";
import * as LanguageFunctions from "./LanguageFunctions";
import { getObjectFromTokens } from "./XliffFunctions";
import { logger } from "./Logging/LogHelper";
import { OutputLogger } from "./Logging/OutputLogger";
import { TransUnit, Xliff } from "./Xliff/XLIFFDocument";
import { showErrorAndLog } from "./VSCodeFunctions";
import { ALControlType } from "./ALObject/Enums";
import { ALProcedure } from "./ALObject/ALProcedure";
import { getQuickPickResult } from "./NABfunctions";

export async function troubleshootParseCurrentFile(): Promise<void> {
  logger.log("Running: troubleshootParseCurrentFile");
  Telemetry.trackEvent("troubleshootParseCurrentFile");
  try {
    const currDocument = vscode.window.activeTextEditor?.document;
    if (!currDocument) {
      throw new Error("This command must be run with an open editor.");
    }
    if (!currDocument.getText()) {
      throw new Error("This command must be run with an open editor.");
    }
    const alObj = ALParser.getALObjectFromText(
      currDocument.getText(),
      true,
      undefined,
      undefined,
      true
    );
    if (!alObj) {
      throw new Error("No object descriptor was found in the open editor.");
    }
    logger.log("---------------------------------------------");
    logger.log(`Object Type: ${alObj.objectType}`);
    logger.log(`Object Id: ${alObj.objectId}`);
    logger.log(`Object Name: ${alObj.objectName}`);
    if (alObj.extendedObjectId) {
      logger.log(`Extends Object ID: ${alObj.extendedObjectId}`);
    }
    if (alObj.extendedObjectName) {
      logger.log(`Extends Object Name: ${alObj.extendedObjectName}`);
    }
    if (alObj.extendedTableId) {
      logger.log(`TableId of Extended page: ${alObj.extendedTableId}`);
    }
    logger.log();
    logger.log("AL Object properties:");
    alObj.properties.forEach((p) => logger.log(`  ${p.name} = ${p.value}`));
    logger.log();
    logger.log("Multi Language Controls:");
    alObj
      .getAllMultiLanguageObjects()
      .forEach((m) => logger.log(`  ${m.name} = ${m.text}`));
    logger.log();
    logger.log("Controls:");
    alObj
      .getAllControls()
      .filter((c) => c.type !== ALControlType.procedure)
      .forEach((c) => {
        logger.log(`  ${c.type}: ${c.name}`);
      });

    const procedures = <ALProcedure[]>(
      alObj.controls.filter(
        (c) => c.type === ALControlType.procedure && !(c as ALProcedure).event
      )
    );
    if (procedures.length > 0) {
      logger.log("Procedures:");
      procedures.forEach((proc) => {
        logger.log(`  ${proc.name}`);
        if (proc.parameters.length > 0) {
          logger.log("    Parameters:");
          proc.parameters.forEach((param) =>
            logger.log(`      ${param.toString(true)}`)
          );
        }
        if (proc.returns) {
          logger.log("    Returns:");
          logger.log(`      ${proc.returns.toString(false)}`);
        }
        if (proc.variables.length > 0) {
          logger.log("    Local variables:");
          proc.variables.forEach((variable) =>
            logger.log(`      ${variable.toString(true)}`)
          );
        }
      });
    }
    const events = <ALProcedure[]>(
      alObj.controls.filter(
        (c) => c.type === ALControlType.procedure && (c as ALProcedure).event
      )
    );
    if (events.length > 0) {
      logger.log("Events:");
      events.forEach((event) => {
        logger.log(`  ${event.name}`);
        if (event.parameters.length > 0) {
          logger.log("    Parameters:");
          event.parameters.forEach((param) =>
            logger.log(`      ${param.toString(true)}`)
          );
        }
      });
    }
    logger.log();
    if (alObj.variables.length > 0) {
      logger.log("Global variables:");
      alObj.variables.forEach((v) => logger.log(`  ${v.toString(true)}`));
      logger.log();
    }

    alObj.prepareForJsonOutput();
    vscode.workspace
      .openTextDocument({
        language: "json",
        content: Common.orderedJsonStringify(alObj, 4),
      })
      .then((doc) => vscode.window.showTextDocument(doc));
    vscode.window.showInformationMessage(
      `The .al file was successfully parsed. Open the Output channel '${OutputLogger.channelName}' for details. Review the opened json file for the parsed object structure.`
    );
  } catch (error) {
    showErrorAndLog(
      "Parsing of current AL Object failed with error:",
      error as Error,
      true
    );
  }
  logger.show();
}
export async function troubleshootParseAllFiles(): Promise<void> {
  logger.log("Running: troubleshootParseAllFiles");
  Telemetry.trackEvent("troubleshootParseAllFiles");
  try {
    const response = await getQuickPickResult(["No", "Yes"], {
      canPickMany: false,
      ignoreFocusOut: true,
      title: "Include objects from Symbols?",
    });
    const includeSymbols = response ? response[0] === "Yes" : false;

    const objects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
      SettingsLoader.getSettings(),
      SettingsLoader.getAppManifest(),
      true,
      false,
      includeSymbols
    );
    for (const alObj of objects) {
      alObj.prepareForJsonOutput();
    }

    logger.log();
    logger.log("Objects:");
    objects.forEach((obj) =>
      logger.log(`${obj.objectType} ${obj.objectId} ${obj.objectName}`)
    );
    try {
      vscode.workspace
        .openTextDocument({
          language: "json",
          content: Common.orderedJsonStringify(objects, 4),
        })
        .then((doc) => vscode.window.showTextDocument(doc));
      vscode.window.showInformationMessage(
        `All .al file was successfully parsed. Review the opened json file for the parsed object structure. Any missing object could not be identified as an AL object, please report as an issue on GitHub (https://github.com/jwikman/nab-al-tools/issues)`
      );
    } catch (error) {
      logger.error(
        "Couldn't serialize all objects as a json file, probably due to the number of objects:",
        error as string
      );
      vscode.window.showInformationMessage(
        `All .al file was successfully parsed, but the serialization of the objects failed. Review the NAB AL Tools Output log for more information. Any missing object could not be identified as an AL object, please report as an issue on GitHub (https://github.com/jwikman/nab-al-tools/issues)`
      );
    }
  } catch (error) {
    showErrorAndLog(
      "Parsing of all AL Objects failed with error:",
      error as Error,
      true
    );
  }
  logger.show();
}
export async function troubleshootFindTransUnitsWithoutSource(): Promise<void> {
  logger.log("Running: troubleshootFindTransUnitsWithoutSource");
  Telemetry.trackEvent("troubleshootFindTransUnitsWithoutSource");

  const settings = SettingsLoader.getSettings();
  const appManifest = SettingsLoader.getAppManifest();
  const gXlfFilePath = WorkspaceFunctions.getGXlfFilePath(
    settings,
    appManifest
  );
  const alObjects = await WorkspaceFunctions.getAlObjectsFromCurrentWorkspace(
    settings,
    appManifest,
    true
  );
  const gXlf = Xliff.fromFileSync(gXlfFilePath);
  const failingTransUnits: TransUnit[] = [];
  gXlf.transunit.forEach((tu) => {
    try {
      const obj = getObjectFromTokens(alObjects, tu.getXliffIdTokenArray());
      const mlObjects = obj.getAllMultiLanguageObjects({
        onlyForTranslation: false, // Include obsoleted objects and controls
      });
      const mlObject = mlObjects.find(
        (x) => x.xliffId().toLowerCase() === tu.id.toLowerCase()
      );
      if (!mlObject) {
        throw new Error("ML Object not found");
      }
    } catch {
      failingTransUnits.push(tu);
    }
  });
  if (failingTransUnits.length === 0) {
    vscode.window.showInformationMessage(
      "All is OK, could find the source of all TransUnits."
    );
  } else {
    logger.error("The following TransUnits could not identify it's code:");
    failingTransUnits.forEach((tu) =>
      logger.log(`${tu.id} - ${tu.xliffGeneratorNoteContent()}`)
    );
    const firstFailing = LanguageFunctions.findTransUnitId(
      failingTransUnits[0].id,
      fs.readFileSync(gXlfFilePath, "utf8"),
      gXlfFilePath
    );
    if (firstFailing) {
      DocumentFunctions.openTextFileWithSelection(
        firstFailing.filePath,
        firstFailing.position,
        firstFailing.length
      );
      vscode.window.showErrorMessage(
        `There was ${failingTransUnits.length} TransUnits that could find it's source. Investigate the NAB AL Tools Output log to identify them. The first of them is now opened.`,
        { modal: true }
      );
    } else {
      vscode.window.showErrorMessage(
        `There was ${failingTransUnits.length} TransUnits that could find it's source. Investigate the NAB AL Tools Output log to identify them.`,
        { modal: true }
      );
    }
    logger.show();
  }
}
