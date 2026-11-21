// Application Insights connection string for the nab-al-tools telemetry
// resource. This is not sensitive (per VS Code telemetry guidance) and is shared
// by the extension sender (@vscode/extension-telemetry) and the CLI sender.
export const telemetryConnectionString =
  "InstrumentationKey=781a3017-e287-4f2c-9b14-897cb9943cdc;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/";

// Abstraction over the actual telemetry transport. The extension injects a
// sender backed by @vscode/extension-telemetry (which does NOT register global
// OpenTelemetry providers, so it cannot capture other extensions' signals), while
// the CLI injects a lightweight HTTPS sender. Keeping this module free of both
// `vscode` and `applicationinsights` imports is what lets the CLI/MCP bundles
// stay VS Code-independent and free of the heavy OpenTelemetry dependency tree.
export interface TelemetrySender {
  sendEvent(
    eventName: string,
    properties?: Record<string, string>,
    measurements?: Record<string, number>
  ): void;
  sendException(exception: Error, properties?: Record<string, string>): void;
  dispose(): void;
}

let sender: TelemetrySender | undefined;
let enableTelemetry = false;

// Injects the telemetry sender and enables/disables sending. `enabled` reflects
// the NAB.EnableTelemetry setting; the NAB_DISABLE_TELEMETRY env var and a
// missing sender both force telemetry off. The sender's own transport
// (@vscode/extension-telemetry) additionally honors VS Code's global
// telemetry.telemetryLevel setting.
export function initTelemetry(
  telemetrySender: TelemetrySender | undefined,
  enabled: boolean
): void {
  sender = telemetrySender;
  enableTelemetry =
    enabled &&
    !process.env.NAB_DISABLE_TELEMETRY &&
    telemetrySender !== undefined;
}

// Disposes the current sender and resets state. Safe to call multiple times.
export function disposeTelemetry(): void {
  try {
    sender?.dispose();
  } catch {
    // Never let a telemetry failure surface to the user.
  }
  sender = undefined;
  enableTelemetry = false;
}

// Splits an arbitrary args object into string properties and numeric
// measurements, matching the @vscode/extension-telemetry event shape.
function splitArgs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: Record<string, any>
): {
  properties: Record<string, string>;
  measurements: Record<string, number>;
} {
  const properties: Record<string, string> = {};
  const measurements: Record<string, number> = {};
  for (const [key, value] of Object.entries(args ?? {})) {
    if (typeof value === "number") {
      measurements[key] = value;
    } else if (value !== undefined && value !== null) {
      properties[key] = typeof value === "string" ? value : String(value);
    }
  }
  return { properties, measurements };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackEvent(eventName: string, args: any = {}): void {
  if (!enableTelemetry || !sender) {
    return;
  }
  try {
    const { properties, measurements } = splitArgs(args);
    sender.sendEvent(eventName, properties, measurements);
  } catch {
    // Never let a telemetry failure surface to the user.
  }
}

export function trackException(exception: Error): void {
  if (!enableTelemetry || !sender) {
    return;
  }
  if (!exception.stack || !exception.stack.includes("nab-al-tools")) {
    return; // Only log exceptions originating from nab-al-tools
  }
  try {
    // Anonymize file paths at the source before handing the error to the sender.
    sender.sendException(anonymizeException(exception));
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
