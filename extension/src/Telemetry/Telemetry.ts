import * as applicationinsights from "applicationinsights";
import { IExtensionPackage, Settings } from "../Settings/Settings";

let initiated = false;
let enableTelemetry = false;

export function startTelemetry(
  vscodeVersion: string,
  settings: Settings,
  extensionPackage: IExtensionPackage,
  userId: string,
  newInstallation: boolean
): void {
  if (!initiated) {
    enableTelemetry =
      settings.enableTelemetry && !process.env.NAB_DISABLE_TELEMETRY;
    initiated = true;
  }
  if (!enableTelemetry) {
    return;
  }

  applicationinsights
    .setup(
      "InstrumentationKey=781a3017-e287-4f2c-9b14-897cb9943cdc;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/"
    )
    .setAutoCollectPerformance(false, false)
    .start();

  applicationinsights.defaultClient.commonProperties = {
    version: extensionPackage.version,
    vscode: vscodeVersion,
    installationId: userId,
  };

  applicationinsights.defaultClient.addTelemetryProcessor(
    removeStackTracePaths
  );
  if (newInstallation) {
    trackEvent("install");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackEvent(eventName: string, args: any = {}): void {
  if (!enableTelemetry) {
    return;
  }
  const client: applicationinsights.TelemetryClient =
    applicationinsights.defaultClient;

  client.trackEvent({
    name: eventName,
    properties: args,
  });
}

export function trackException(exception: Error): void {
  if (!enableTelemetry) {
    return;
  }
  if (exception.stack && !exception.stack.includes("nab-al-tools")) {
    return;
  }
  const client: applicationinsights.TelemetryClient =
    applicationinsights.defaultClient;

  client.trackException({
    exception: exception,
  });
}

function removeStackTracePaths(
  envelope: applicationinsights.Contracts.EnvelopeTelemetry
): boolean {
  envelope.tags["ai.cloud.roleInstance"] = ""; // Remove client computer name
  if (envelope.data.baseType === "ExceptionData") {
    let isOurException = false;
    const data = envelope.data.baseData;
    if (data) {
      if (data.exceptions && data.exceptions.length > 0) {
        for (const exception of data.exceptions) {
          exception.message = anonymizePath(exception.message);
          for (const stackFrame of exception.parsedStack) {
            stackFrame.assembly = anonymizePath(stackFrame.assembly);
            stackFrame.fileName = anonymizePath(stackFrame.fileName);
            if (!isOurException) {
              isOurException = stackFrame.fileName.includes("nab-al-tools");
            }
          }
        }
      }
    }
    return isOurException; // Only log if the exception is from nab-al-tools
  } else {
    return true;
  }
}

export function anonymizePath(param: string): string {
  param = param.replace(
    /(\b\w:\\\w+\\[- .0-9A-Za-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\\)([^":*/<>?|\n]+(:\d+:\d+)?)/gi,
    "%user%\\$2"
  );
  return param;
}
