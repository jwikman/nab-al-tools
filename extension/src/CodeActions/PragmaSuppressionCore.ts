import * as vscode from "vscode";

/** The scope of a suppression code action. */
export type SuppressionScope = "occurrence" | "file" | "app";

/**
 * Justification category selected by the user when suppressing a diagnostic with a pragma.
 */
export type JustificationCategory =
  | "todo"
  | "byDesign"
  | "legacyCode"
  | "falsePositive"
  | "custom";

export interface IJustificationOption {
  category: JustificationCategory;
  label: string;
}

/** Justification options offered for a single-occurrence suppression. */
export const occurrenceJustificationOptions: IJustificationOption[] = [
  { category: "todo", label: "TODO" },
  { category: "byDesign", label: "By design" },
  { category: "legacyCode", label: "Legacy code" },
  { category: "falsePositive", label: "False positive" },
  { category: "custom", label: "Custom" },
];

/**
 * Justification options offered for file/app-scoped (bulk) suppression.
 * "By design" and "False positive" imply a per-instance judgment call, so they
 * are only offered for the single-occurrence action.
 */
export const bulkJustificationOptions: IJustificationOption[] = [
  { category: "todo", label: "TODO" },
  { category: "legacyCode", label: "Legacy code" },
  { category: "custom", label: "Custom" },
];

/**
 * A simple, half-open (inclusive) line range used to describe where a
 * `#pragma warning disable`/`restore` pair should be inserted.
 */
export interface ILineRange {
  startLine: number;
  endLine: number;
}

/**
 * Extracts the rule code from a diagnostic, handling both plain and
 * `{ value, target }` code formats.
 * @returns the code as a string, or undefined if the diagnostic has no code
 */
export function getDiagnosticCode(
  diagnostic: vscode.Diagnostic
): string | undefined {
  const code = diagnostic.code;
  if (code === undefined || code === null) {
    return undefined;
  }
  if (typeof code === "object" && "value" in code) {
    return code.value.toString();
  }
  return code.toString();
}

/**
 * Determines if a diagnostic can be suppressed with `#pragma warning disable`.
 * Only diagnostics with a rule code and a severity below Error are suppressible,
 * since `#pragma warning disable` only affects warnings/info/hints, never errors.
 */
export function isSuppressible(diagnostic: vscode.Diagnostic): boolean {
  if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
    return false;
  }
  return getDiagnosticCode(diagnostic) !== undefined;
}

/**
 * Builds the comment text inserted alongside the `#pragma warning disable` statement
 * for the given justification category.
 * @param customText only used when category is "custom"
 */
export function getJustificationText(
  category: JustificationCategory,
  code: string,
  customText?: string
): string {
  switch (category) {
    case "todo":
      return `TODO: Fix ${code}`;
    case "byDesign":
      return "By design";
    case "legacyCode":
      return "Legacy code";
    case "falsePositive":
      return "False positive";
    case "custom":
      return (customText ?? "").trim();
  }
}

/**
 * Groups diagnostics matching `code` into merged line ranges, so that
 * consecutive occurrences can share a single `disable`/`restore` pair instead of one per instance.
 * Two occurrences are merged when the number of lines between them is <= mergeGap.
 * Diagnostics that are not suppressible, or that don't match `code`, are ignored.
 */
export function mergeDiagnosticRanges(
  diagnostics: vscode.Diagnostic[],
  code: string,
  mergeGap: number
): ILineRange[] {
  const matching: ILineRange[] = diagnostics
    .filter((d) => isSuppressible(d) && getDiagnosticCode(d) === code)
    .map((d) => ({
      startLine: d.range.start.line,
      endLine: d.range.end.line,
    }))
    .sort((a, b) => a.startLine - b.startLine);

  const merged: ILineRange[] = [];
  for (const current of matching) {
    const last = merged[merged.length - 1];
    if (last && current.startLine - last.endLine - 1 <= mergeGap) {
      last.endLine = Math.max(last.endLine, current.endLine);
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

/**
 * Builds the text edits that insert a `#pragma warning disable`/`restore` pair around `range`.
 * The disable line is inserted before `range.startLine` and the restore line after `range.endLine`,
 * matching the indentation of the first line and the document's end-of-line sequence.
 */
export function buildSuppressionEdits(
  document: vscode.TextDocument,
  range: ILineRange,
  code: string,
  tagText: string
): vscode.TextEdit[] {
  const eol = document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
  const startLineText = document.lineAt(range.startLine).text;
  const indentMatch = startLineText.match(/^[ \t]*/);
  const indent = indentMatch ? indentMatch[0] : "";

  const trimmedTag = tagText.trim();
  const disableLine = trimmedTag
    ? `${indent}#pragma warning disable ${code} // ${trimmedTag}`
    : `${indent}#pragma warning disable ${code}`;
  const restoreLine = `${indent}#pragma warning restore ${code}`;

  const disableEdit = vscode.TextEdit.insert(
    new vscode.Position(range.startLine, 0),
    `${disableLine}${eol}`
  );

  const endOfEndLine = document.lineAt(range.endLine).range.end;
  const restoreEdit = vscode.TextEdit.insert(
    endOfEndLine,
    `${eol}${restoreLine}`
  );

  return [disableEdit, restoreEdit];
}
