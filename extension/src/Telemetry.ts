import * as path from "path";
import * as fs from "fs";
import * as uuid from "uuid";
import * as SettingsLoader from "./Settings/SettingsLoader";
import * as applicationinsights from "applicationinsights";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appInsights = require("applicationinsights");
const enableTelemetry = SettingsLoader.getSettings().enableTelemetry;

const extensionPackage = SettingsLoader.getExtensionPackage();

export function startTelemetry(vscodeVersion: string): void {
  if (!enableTelemetry) {
    return;
  }

  const filePath = path.resolve(__dirname, "i");
  let installationId = "";
  let newInstallation = false;
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, { encoding: "utf8" });
    installationId = content;
  } else {
    installationId = uuid.v4();
    newInstallation = true;
    fs.writeFileSync(filePath, installationId, { encoding: "utf8" });
  }
  appInsights
    .setup(
      "InstrumentationKey=781a3017-e287-4f2c-9b14-897cb9943cdc;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/"
    )
    .setAutoCollectPerformance(false, false)
    .start();

  appInsights.defaultClient.commonProperties = {
    version: extensionPackage.version,
    vscode: vscodeVersion,
    installationId: installationId,
  };

  appInsights.defaultClient.addTelemetryProcessor(removeStackTracePaths);
  if (newInstallation) {
    trackEvent("install");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackEvent(eventName: string, args: any = {}): void {
  if (!enableTelemetry) {
    return;
  }
  const client: applicationinsights.TelemetryClient = appInsights.defaultClient;

  client.trackEvent({
    name: eventName,
    properties: args,
  });
}

export function trackException(exception: Error): void {
  if (!enableTelemetry) {
    return;
  }
  const client: applicationinsights.TelemetryClient = appInsights.defaultClient;

  client.trackException({
    exception: exception,
  });
}

function removeStackTracePaths(
  envelope: applicationinsights.Contracts.EnvelopeTelemetry
): boolean {
  if (envelope.data.baseType === "ExceptionData") {
    const data = envelope.data.baseData;
    if (data) {
      if (data.exceptions && data.exceptions.length > 0) {
        for (const exception of data.exceptions) {
          exception.message = anonymizePath(exception.message);
          for (const stackFrame of exception.parsedStack) {
            stackFrame.assembly = anonymizePath(stackFrame.assembly);
            stackFrame.fileName = anonymizePath(stackFrame.fileName);
          }
        }
      }
    }
  }
  envelope.tags["ai.cloud.roleInstance"] = ""; // Remove client computer name
  return true;
}

export function anonymizePath(param: string): string {
  param = param.replace(
    /(\b\w:\\\w+\\[- .0-9A-Za-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\\)([^":*/<>?|\n]+(:\d+:\d+)?)/gi,
    "%user%\\$2"
  );
  return param;
}
