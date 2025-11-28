import * as vscode from "vscode";
import * as Telemetry from "./Telemetry/Telemetry";

/**
 * State key prefix for deprecation warnings that users have dismissed
 */
const DEPRECATION_DISMISSED_PREFIX = "nab:deprecation-dismissed:";

/**
 * Common deprecation message for all DTS-related features
 */
const DTS_DEPRECATION_MESSAGE =
  "The DTS (Dynamics 365 Translation Service) functionality is deprecated and will be removed in early 2026. Microsoft has announced that DTS will be retired. Please migrate to alternative translation services.";

/**
 * Deprecated features that can trigger warnings
 */
export enum DeprecatedFeature {
  dtsFormatCurrentXlf = "FormatCurrentXlfFileForDTS",
  dtsOpen = "OpenDTS",
  dtsImportTranslations = "ImportDtsTranslations",
}

/**
 * Information about deprecated features
 */
const deprecationInfo: Record<DeprecatedFeature, { message: string }> = {
  [DeprecatedFeature.dtsFormatCurrentXlf]: {
    message: DTS_DEPRECATION_MESSAGE,
  },
  [DeprecatedFeature.dtsOpen]: {
    message: DTS_DEPRECATION_MESSAGE,
  },
  [DeprecatedFeature.dtsImportTranslations]: {
    message: DTS_DEPRECATION_MESSAGE,
  },
};

let extensionContext: vscode.ExtensionContext | undefined;

/**
 * Initializes the deprecation module with the extension context
 * @param context The VS Code extension context
 */
export function initializeDeprecation(context: vscode.ExtensionContext): void {
  extensionContext = context;
}

/**
 * Gets the state key for a deprecated feature
 */
function getStateKey(feature: DeprecatedFeature): string {
  return `${DEPRECATION_DISMISSED_PREFIX}${feature}`;
}

/**
 * Checks if the deprecation warning for a feature has been dismissed
 */
function isWarningDismissed(feature: DeprecatedFeature): boolean {
  if (!extensionContext) {
    return false;
  }
  return extensionContext.globalState.get(getStateKey(feature), false);
}

/**
 * Sets the warning as dismissed for a feature
 */
async function dismissWarning(feature: DeprecatedFeature): Promise<void> {
  if (!extensionContext) {
    return;
  }
  await extensionContext.globalState.update(getStateKey(feature), true);
}

/**
 * Shows a deprecation warning for a feature if not already dismissed
 * Also tracks telemetry for the deprecated feature usage
 * @param feature The deprecated feature being used
 * @returns Promise<boolean> true if the user wants to continue, false to cancel
 */
export async function showDeprecationWarning(
  feature: DeprecatedFeature
): Promise<boolean> {
  // Always track telemetry for deprecated feature usage
  Telemetry.trackEvent("deprecatedFeatureUsed", { feature: feature });

  // If warning was dismissed, allow the operation to continue
  if (isWarningDismissed(feature)) {
    return true;
  }

  const info = deprecationInfo[feature];
  const continueButton = "Continue";
  const doNotShowAgain = "Don't show again";
  const learnMore = "Learn more";

  const selection = await vscode.window.showWarningMessage(
    info.message,
    { modal: false },
    continueButton,
    doNotShowAgain,
    learnMore
  );

  if (selection === learnMore) {
    vscode.env.openExternal(
      vscode.Uri.parse(
        "https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/fin-ops/get-started/removed-deprecated-features-platform-updates"
      )
    );
    return false;
  }

  if (selection === doNotShowAgain) {
    await dismissWarning(feature);
    return true;
  }

  if (selection === continueButton) {
    return true;
  }

  // User dismissed the dialog without selecting anything
  return false;
}
