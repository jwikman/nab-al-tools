import * as assert from "assert";
import {
  anonymizeException,
  anonymizePath,
  initTelemetry,
  disposeTelemetry,
  trackEvent,
  trackException,
  TelemetrySender,
} from "../Telemetry/Telemetry";
import {
  buildEventEnvelope,
  buildExceptionEnvelope,
  parseConnectionString,
} from "../Telemetry/CliTelemetrySender";

interface RecordedEvent {
  eventName: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

class FakeSender implements TelemetrySender {
  public events: RecordedEvent[] = [];
  public exceptions: Error[] = [];
  public disposed = false;
  sendEvent(
    eventName: string,
    properties?: Record<string, string>,
    measurements?: Record<string, number>
  ): void {
    this.events.push({ eventName, properties, measurements });
  }
  sendException(exception: Error): void {
    this.exceptions.push(exception);
  }
  dispose(): void {
    this.disposed = true;
  }
}

suite("Telemetry", function () {
  test("Anonymize paths", function () {
    assert.strictEqual(
      anonymizePath("c:\\users\\user.name\\.vscode\\whatever\\path\\file.js"),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
    assert.strictEqual(
      anonymizePath("c:\\users\\user name\\.vscode\\whatever\\path\\file.js"),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
    assert.strictEqual(
      anonymizePath("c:\\users\\user-name\\.vscode\\whatever\\path\\file.js"),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
    assert.strictEqual(
      anonymizePath("c:\\users\\username\\.vscode\\whatever\\path\\file.js"),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
    assert.strictEqual(
      anonymizePath("c:\\users\\Ûsèr.nàmÈ\\.vscode\\whatever\\path\\file.js"),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
    assert.strictEqual(
      anonymizePath(
        "c:\\users\\Ìsür.nÄÅÖåäöme\\.vscode\\whatever\\path\\file.js"
      ),
      "%user%\\.vscode\\whatever\\path\\file.js",
      "Unexpected anonymous path"
    );
  });

  test("anonymizeException anonymizes message and stack without mutating original", function () {
    const original = new Error(
      "Failed reading c:\\users\\user.name\\.vscode\\ext\\file.js"
    );
    original.name = "CustomError";
    original.stack =
      "CustomError: boom\n    at fn (c:\\users\\user.name\\.vscode\\ext\\file.js:10:5)";
    const originalMessage = original.message;
    const originalStack = original.stack;

    const result = anonymizeException(original);

    assert.strictEqual(
      result.message,
      "Failed reading %user%\\.vscode\\ext\\file.js",
      "Message paths should be anonymized"
    );
    assert.strictEqual(result.name, "CustomError", "Name should be preserved");
    assert.ok(
      result.stack?.includes("%user%\\.vscode\\ext\\file.js") &&
        !result.stack?.includes("user.name"),
      "Stack paths should be anonymized"
    );
    assert.strictEqual(
      original.message,
      originalMessage,
      "Original message must not be mutated"
    );
    assert.strictEqual(
      original.stack,
      originalStack,
      "Original stack must not be mutated"
    );
  });

  test("anonymizeException handles missing stack", function () {
    const original = new Error("no path here");
    original.stack = undefined;
    const result = anonymizeException(original);
    assert.strictEqual(result.message, "no path here");
    assert.strictEqual(result.stack, undefined);
  });

  suite("Telemetry facade", function () {
    // These tests control the NAB_DISABLE_TELEMETRY env var explicitly. CI sets
    // it to "true" globally, which would otherwise force telemetry off and break
    // the "enabled" assertions below.
    let prevDisableEnv: string | undefined;
    setup(function () {
      prevDisableEnv = process.env.NAB_DISABLE_TELEMETRY;
      delete process.env.NAB_DISABLE_TELEMETRY;
    });
    teardown(function () {
      disposeTelemetry();
      if (prevDisableEnv === undefined) {
        delete process.env.NAB_DISABLE_TELEMETRY;
      } else {
        process.env.NAB_DISABLE_TELEMETRY = prevDisableEnv;
      }
    });

    test("trackEvent delegates to sender when enabled", function () {
      const sender = new FakeSender();
      initTelemetry(sender, true);
      trackEvent("myEvent", { foo: "bar", count: 3 });
      assert.strictEqual(sender.events.length, 1);
      assert.strictEqual(sender.events[0].eventName, "myEvent");
      assert.deepStrictEqual(sender.events[0].properties, { foo: "bar" });
      assert.deepStrictEqual(sender.events[0].measurements, { count: 3 });
    });

    test("trackEvent does nothing when disabled", function () {
      const sender = new FakeSender();
      initTelemetry(sender, false);
      trackEvent("myEvent");
      assert.strictEqual(sender.events.length, 0);
    });

    test("trackEvent does nothing when NAB_DISABLE_TELEMETRY is set", function () {
      process.env.NAB_DISABLE_TELEMETRY = "true";
      const sender = new FakeSender();
      initTelemetry(sender, true);
      trackEvent("myEvent");
      assert.strictEqual(sender.events.length, 0);
    });

    test("trackException only sends nab-al-tools exceptions, anonymized", function () {
      const sender = new FakeSender();
      initTelemetry(sender, true);

      const foreign = new Error("boom");
      foreign.stack = "Error: boom\n    at somewhere-else (c:\\other\\file.js)";
      trackException(foreign);
      assert.strictEqual(
        sender.exceptions.length,
        0,
        "Foreign exceptions must not be sent"
      );

      const own = new Error(
        "failed reading c:\\users\\user.name\\.vscode\\nab-al-tools\\file.js"
      );
      own.stack =
        "Error: boom\n    at fn (c:\\users\\user.name\\.vscode\\nab-al-tools\\file.js:1:1)";
      trackException(own);
      assert.strictEqual(sender.exceptions.length, 1);
      assert.ok(
        sender.exceptions[0].message.includes("%user%"),
        "Message should be anonymized"
      );
      assert.ok(
        !sender.exceptions[0].stack?.includes("user.name"),
        "Stack should be anonymized"
      );
    });

    test("disposeTelemetry disposes the sender and stops sending", function () {
      const sender = new FakeSender();
      initTelemetry(sender, true);
      disposeTelemetry();
      assert.strictEqual(sender.disposed, true);
      trackEvent("myEvent");
      assert.strictEqual(sender.events.length, 0);
    });
  });

  suite("CLI telemetry sender", function () {
    test("parseConnectionString extracts key and endpoint", function () {
      const parsed = parseConnectionString(
        "InstrumentationKey=abc-123;IngestionEndpoint=https://example.in.applicationinsights.azure.com/"
      );
      assert.strictEqual(parsed.instrumentationKey, "abc-123");
      assert.strictEqual(
        parsed.ingestionEndpoint,
        "https://example.in.applicationinsights.azure.com/"
      );
    });

    test("parseConnectionString appends trailing slash to endpoint", function () {
      const parsed = parseConnectionString(
        "InstrumentationKey=abc-123;IngestionEndpoint=https://example.com"
      );
      assert.strictEqual(parsed.ingestionEndpoint, "https://example.com/");
    });

    test("buildEventEnvelope produces a valid EventData envelope", function () {
      const time = new Date("2026-11-21T00:00:00.000Z");
      const envelope = buildEventEnvelope(
        "ikey-1",
        "cliCreateDocumentation",
        { foo: "bar" },
        { count: 2 },
        { version: "1.49.0" },
        time
      ) as {
        name: string;
        time: string;
        iKey: string;
        tags: Record<string, string>;
        data: {
          baseType: string;
          baseData: {
            name: string;
            properties: Record<string, string>;
            measurements: Record<string, number>;
          };
        };
      };
      assert.strictEqual(envelope.name, "Microsoft.ApplicationInsights.Event");
      assert.strictEqual(envelope.iKey, "ikey-1");
      assert.strictEqual(envelope.time, "2026-11-21T00:00:00.000Z");
      assert.strictEqual(envelope.data.baseType, "EventData");
      assert.strictEqual(envelope.data.baseData.name, "cliCreateDocumentation");
      assert.strictEqual(envelope.data.baseData.properties.foo, "bar");
      assert.strictEqual(envelope.data.baseData.properties.version, "1.49.0");
      assert.strictEqual(envelope.data.baseData.measurements.count, 2);
      assert.strictEqual(envelope.tags["ai.cloud.roleInstance"], "");
    });

    test("buildExceptionEnvelope produces a valid ExceptionData envelope", function () {
      const err = new Error("something broke");
      err.name = "CustomError";
      err.stack = "CustomError: something broke\n    at fn (file.js:1:1)";
      const envelope = buildExceptionEnvelope("ikey-1", err) as {
        data: {
          baseType: string;
          baseData: {
            exceptions: {
              typeName: string;
              message: string;
            }[];
          };
        };
      };
      assert.strictEqual(envelope.data.baseType, "ExceptionData");
      assert.strictEqual(
        envelope.data.baseData.exceptions[0].typeName,
        "CustomError"
      );
      assert.strictEqual(
        envelope.data.baseData.exceptions[0].message,
        "something broke"
      );
    });
  });
});
