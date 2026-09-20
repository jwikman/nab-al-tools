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

  // applicationinsights v3 no longer supports telemetry processors, so
  // auto-collection is disabled and only explicit trackEvent/trackException
  // calls are sent. Paths are anonymized at the source in trackException.
  applicationinsights
    .setup(
      "InstrumentationKey=781a3017-e287-4f2c-9b14-897cb9943cdc;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/"
    )
    .setAutoCollectPerformance(false, false)
    .setAutoCollectExceptions(false)
    .setAutoCollectRequests(false)
    .setAutoCollectDependencies(false)
    .setAutoCollectConsole(false)
    .setAutoCollectPreAggregatedMetrics(false)
    .setAutoCollectHeartbeat(false);

  const client = applicationinsights.defaultClient;
  client.commonProperties = {
    version: extensionPackage.version,
    vscode: vscodeVersion,
    installationId: userId,
  };
  // Remove the client computer name from all telemetry.
  client.context.tags[client.context.keys.cloudRoleInstance] = "";

  applicationinsights.start();

  if (newInstallation) {
    trackEvent("install");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackEvent(eventName: string, args: any = {}): void {
  if (!enableTelemetry) {
    return;
  }
  applicationinsights.defaultClient.trackEvent({
    name: eventName,
    properties: args,
  });
}

export function trackException(exception: Error): void {
  if (!enableTelemetry) {
    return;
  }
  if (exception.stack && !exception.stack.includes("nab-al-tools")) {
    return; // Only log exceptions originating from nab-al-tools
  }
  // Anonymize file paths at the source, since telemetry processors are no
  // longer supported in applicationinsights v3.
  applicationinsights.defaultClient.trackException({
    exception: anonymizeException(exception),
  });
}

// Returns a copy of the exception with file paths anonymized in the message and
// stack trace, without mutating the original error.
export function anonymizeException(exception: Error): Error {
  const anonymized = new Error(anonymizePath(exception.message));
  anonymized.name = exception.name;
  anonymized.stack = exception.stack
    ? anonymizePath(exception.stack)
    : undefined;
  return anonymized;
}

export function anonymizePath(param: string): string {
  param = param.replace(
    /(\b\w:\\\w+\\[- .0-9A-Za-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\\)([^":*/<>?|\n]+(:\d+:\d+)?)/gi,
    "%user%\\$2"
  );
  return param;
}
