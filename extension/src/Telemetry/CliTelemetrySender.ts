import * as https from "https";
import { URL } from "url";
import { TelemetrySender } from "./Telemetry";

// A minimal, VS Code-independent telemetry sender for the CLI. It POSTs
// Application Insights track envelopes directly to the ingestion endpoint using
// Node's built-in https module, so the CLI bundle needs neither the heavy
// `applicationinsights` (OpenTelemetry) dependency nor `vscode`. It never
// registers global OpenTelemetry providers, so it cannot capture other
// processes' signals.

export interface ParsedConnectionString {
  instrumentationKey: string;
  ingestionEndpoint: string;
}

// Parses an Application Insights connection string into its instrumentation key
// and ingestion endpoint. Falls back to the public endpoint when none is given.
export function parseConnectionString(
  connectionString: string
): ParsedConnectionString {
  let instrumentationKey = "";
  let ingestionEndpoint = "https://dc.services.visualstudio.com/";
  for (const part of connectionString.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) {
      continue;
    }
    const key = part.substring(0, idx).trim().toLowerCase();
    const value = part.substring(idx + 1).trim();
    if (key === "instrumentationkey") {
      instrumentationKey = value;
    } else if (key === "ingestionendpoint") {
      ingestionEndpoint = value;
    }
  }
  if (!ingestionEndpoint.endsWith("/")) {
    ingestionEndpoint += "/";
  }
  return { instrumentationKey, ingestionEndpoint };
}

const cliSdkVersion = "nab-cli:1.0";

function baseTags(
  commonProperties: Record<string, string>
): Record<string, string> {
  const tags: Record<string, string> = {
    // Scrub the machine name from all CLI telemetry.
    /* eslint-disable @typescript-eslint/naming-convention */
    "ai.cloud.roleInstance": "",
    "ai.internal.sdkVersion": cliSdkVersion,
    /* eslint-enable @typescript-eslint/naming-convention */
  };
  if (commonProperties.installationId) {
    tags["ai.user.id"] = commonProperties.installationId;
  }
  return tags;
}

// Builds an Application Insights EventData envelope.
export function buildEventEnvelope(
  instrumentationKey: string,
  eventName: string,
  properties: Record<string, string> = {},
  measurements: Record<string, number> = {},
  commonProperties: Record<string, string> = {},
  time: Date = new Date()
): object {
  return {
    name: "Microsoft.ApplicationInsights.Event",
    time: time.toISOString(),
    iKey: instrumentationKey,
    tags: baseTags(commonProperties),
    data: {
      baseType: "EventData",
      baseData: {
        ver: 2,
        name: eventName,
        properties: { ...commonProperties, ...properties },
        measurements,
      },
    },
  };
}

// Builds an Application Insights ExceptionData envelope.
export function buildExceptionEnvelope(
  instrumentationKey: string,
  exception: Error,
  properties: Record<string, string> = {},
  commonProperties: Record<string, string> = {},
  time: Date = new Date()
): object {
  return {
    name: "Microsoft.ApplicationInsights.Exception",
    time: time.toISOString(),
    iKey: instrumentationKey,
    tags: baseTags(commonProperties),
    data: {
      baseType: "ExceptionData",
      baseData: {
        ver: 2,
        exceptions: [
          {
            typeName: exception.name || "Error",
            message: exception.message,
            hasFullStack: Boolean(exception.stack),
            stack: exception.stack ?? "",
            parsedStack: [],
          },
        ],
        properties: { ...commonProperties, ...properties },
      },
    },
  };
}

export class CliTelemetrySender implements TelemetrySender {
  private readonly parsed: ParsedConnectionString;
  private readonly commonProperties: Record<string, string>;
  private readonly inFlight: Promise<void>[] = [];

  constructor(
    connectionString: string,
    commonProperties: Record<string, string> = {}
  ) {
    this.parsed = parseConnectionString(connectionString);
    this.commonProperties = commonProperties;
  }

  sendEvent(
    eventName: string,
    properties: Record<string, string> = {},
    measurements: Record<string, number> = {}
  ): void {
    const envelope = buildEventEnvelope(
      this.parsed.instrumentationKey,
      eventName,
      properties,
      measurements,
      this.commonProperties
    );
    this.post(envelope);
  }

  sendException(
    exception: Error,
    properties: Record<string, string> = {}
  ): void {
    const envelope = buildExceptionEnvelope(
      this.parsed.instrumentationKey,
      exception,
      properties,
      this.commonProperties
    );
    this.post(envelope);
  }

  // Awaits all in-flight requests. The CLI should call this before exiting so
  // fire-and-forget telemetry is not lost when the process terminates.
  async flush(): Promise<void> {
    await Promise.allSettled(this.inFlight);
  }

  dispose(): void {
    // Best-effort; callers that need delivery guarantees should await flush().
    void this.flush();
  }

  private post(envelope: object): void {
    const request = new Promise<void>((resolve) => {
      try {
        const url = new URL("v2/track", this.parsed.ingestionEndpoint);
        const payload = Buffer.from(JSON.stringify(envelope), "utf-8");
        const req = https.request(
          {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: "POST",
            headers: {
              /* eslint-disable @typescript-eslint/naming-convention */
              "Content-Type": "application/json",
              "Content-Length": payload.length,
              /* eslint-enable @typescript-eslint/naming-convention */
            },
          },
          (res) => {
            res.on("data", () => undefined);
            res.on("end", () => resolve());
          }
        );
        req.on("error", () => resolve()); // Never surface telemetry failures.
        req.write(payload);
        req.end();
      } catch {
        resolve();
      }
    });
    this.inFlight.push(request);
  }
}
