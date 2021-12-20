import * as SettingsLoader from "./Settings/SettingsLoader";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appInsights = require("applicationinsights");
const enableTelemetry = SettingsLoader.getSettings().enableTelemetry;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appPackage = require("../package.json");

export function startTelemetry(vscodeVersion: string): void {
  if (!enableTelemetry) {
    return;
  }

  appInsights
    .setup(
      "InstrumentationKey=781a3017-e287-4f2c-9b14-897cb9943cdc;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/"
    )
    .setAutoCollectPerformance(false, false)
    .start();

  appInsights.defaultClient.commonProperties = {
    version: appPackage.version,
    vscode: vscodeVersion,
  };

  appInsights.defaultClient.addTelemetryProcessor(removeStackTracePaths);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function trackEvent(eventName: string, args: any = {}): void {
  if (!enableTelemetry) {
    return;
  }
  const client = appInsights.defaultClient;

  client.trackEvent({
    name: eventName,
    properties: args,
  });
}

export function trackException(exception: Error): void {
  if (!enableTelemetry) {
    return;
  }
  const client = appInsights.defaultClient;

  client.trackException({
    exception: exception,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeStackTracePaths(envelope: any): boolean {
  if (envelope.data.baseType === "ExceptionData") {
    const data = envelope.data.baseData;
    if (data.exceptions && data.exceptions.length > 0) {
      for (const exception of data.exceptions) {
        exception.message = anonymizePath(exception.message);
        for (const stackFrame of exception.parsedStack) {
          stackFrame.assembly = anonymizePath(stackFrame.assembly);
          stackFrame.fileName = anonymizePath(stackFrame.fileName);
          stackFrame.fileName = anonymizePath(stackFrame.fileName);
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
