import { IExtensionPackage, Settings } from "../Settings/Settings";

type ApplicationInsights = typeof import("applicationinsights");

let initiated = false;
let enableTelemetry = false;
let appInsights: ApplicationInsights | undefined;
let appInsightsLoadFailed = false;

// Lazily load applicationinsights so a failure to load the module (or one of its
// dependencies) disables telemetry instead of crashing extension activation. The
// packaged extension bundles these dependencies, but this keeps activation
// resilient if a dependency ever goes missing.
function getAppInsights(): ApplicationInsights | undefined {
  if (appInsights || appInsightsLoadFailed) {
    return appInsights;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    appInsights = require("applicationinsights") as ApplicationInsights;
  } catch (error) {
    appInsightsLoadFailed = true;
    enableTelemetry = false;
    console.error(
      "nab-al-tools: applicationinsights could not be loaded, telemetry is disabled.",
      error
    );
  }
  return appInsights;
}

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

  const ai = getAppInsights();
  if (!ai) {
    return;
  }

  try {
    // applicationinsights v3 no longer supports telemetry processors, so
    // auto-collection is disabled and only explicit trackEvent/trackException
    // calls are sent. Paths are anonymized at the source in trackException.
    ai.setup(
      "InstrumentationKey=781a3017-e287-4f2c-9b14-897cb9943cdc;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/"
    )
      .setAutoCollectPerformance(false, false)
      .setAutoCollectExceptions(false)
      .setAutoCollectRequests(false)
      .setAutoCollectDependencies(false)
      .setAutoCollectConsole(false)
      .setAutoCollectPreAggregatedMetrics(false)
      .setAutoCollectHeartbeat(false);

    const client = ai.defaultClient;
    client.commonProperties = {
      version: extensionPackage.version,
      vscode: vscodeVersion,
      installationId: userId,
    };
    // Remove the client computer name from all telemetry.
    client.context.tags[client.context.keys.cloudRoleInstance] = "";

    ai.start();

    if (newInstallation) {
      trackEvent("install");
    }
  } catch (error) {
    enableTelemetry = false;
    console.error(
      "nab-al-tools: telemetry could not be initialized, telemetry is disabled.",
      error
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackEvent(eventName: string, args: any = {}): void {
  if (!enableTelemetry) {
    return;
  }
  const ai = getAppInsights();
  if (!ai) {
    return;
  }
  try {
    ai.defaultClient.trackEvent({
      name: eventName,
      properties: args,
    });
  } catch {
    // Never let a telemetry failure surface to the user.
  }
}

export function trackException(exception: Error): void {
  if (!enableTelemetry) {
    return;
  }
  if (!exception.stack || !exception.stack.includes("nab-al-tools")) {
    return; // Only log exceptions originating from nab-al-tools
  }
  const ai = getAppInsights();
  if (!ai) {
    return;
  }
  try {
    // Anonymize file paths at the source, since telemetry processors are no
    // longer supported in applicationinsights v3.
    ai.defaultClient.trackException({
      exception: anonymizeException(exception),
    });
  } catch {
    // Never let a telemetry failure surface to the user.
  }
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
