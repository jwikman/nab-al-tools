import { TelemetryReporter } from "@vscode/extension-telemetry";
import { TelemetrySender, telemetryConnectionString } from "./Telemetry";

// Telemetry sender for the VS Code extension, backed by
// @vscode/extension-telemetry. Unlike applicationinsights v3, this reporter uses
// an isolated 1DS sender and does NOT register global OpenTelemetry providers, so
// it cannot capture telemetry emitted by other extensions (e.g. GitHub Copilot
// Chat). It also automatically honors VS Code's global telemetry.telemetryLevel
// setting.
export class ExtensionTelemetrySender implements TelemetrySender {
  private readonly reporter: TelemetryReporter;

  constructor(commonProperties: Record<string, string>) {
    this.reporter = new TelemetryReporter(
      telemetryConnectionString,
      undefined, // replacementOptions
      undefined, // initializationOptions
      undefined, // customFetch
      {
        commonProperties,
        // Scrub the machine name from all telemetry (matches prior behavior).
        tagOverrides: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "ai.cloud.roleInstance": "REDACTED",
        },
      }
    );
  }

  sendEvent(
    eventName: string,
    properties: Record<string, string> = {},
    measurements: Record<string, number> = {}
  ): void {
    this.reporter.sendTelemetryEvent(eventName, properties, measurements);
  }

  sendException(
    exception: Error,
    properties: Record<string, string> = {}
  ): void {
    // Report exceptions as error events. The stack is already anonymized by the
    // Telemetry facade before this is called.
    this.reporter.sendTelemetryErrorEvent("exception", {
      ...properties,
      name: exception.name,
      message: exception.message,
      callstack: exception.stack ?? "",
    });
  }

  dispose(): void {
    void this.reporter.dispose();
  }
}
