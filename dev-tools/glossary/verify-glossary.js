#!/usr/bin/env node
/*
 * verify-glossary.js (enhanced with --fix)
 * Verifies that translations in extension/resources/glossary.tsv match the canonical language JSON files
 * located in dev-tools/glossary/resources/languages/*.json
 *
 * Rules:
 *  - Column 0 is en-US key (source). Subsequent columns are language codes matching header names.
 *  - A glossary cell matches if its trimmed text equals (case-sensitive) any variant in the JSON array for that key.
 *  - If glossary cell empty but JSON has translations -> report missing.
 *  - If glossary cell differs and is a strict prefix of some variant (longer) -> report truncated with suggestion.
 *  - If glossary cell not found among variants (and not truncated) -> mismatch.
 *  - If JSON missing key but glossary has a value -> report unknown-in-json.
 *  - Summaries per language and global exit code !=0 if any problems.
 *  - Options:
 *      --glossary <path>  (default extension/resources/glossary.tsv)
 *      --languages <csv>  (restrict to subset of languages by code as in header)
 *      --json             (emit JSON result to stdout)
 *      --only <pattern>   (substring/regex fragment to filter source keys)
 *      --fix               (attempt auto-fix of truncated/missing/mismatch cells - safe heuristics)
 *      --dry-run           (show fixes without writing file, implies --fix)
 *      --no-fail           (exit 0 even if unresolved issues remain)
 *
 */

const fs = require("fs");
const path = require("path");

(function () {
  function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
      glossary: path.join(__dirname, "../../extension/resources/glossary.tsv"),
      languages: null,
      json: false,
      only: null,
      fix: false,
      dryRun: false,
      noFail: false,
    };
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "--glossary") opts.glossary = args[++i];
      else if (a === "--languages")
        opts.languages = args[++i]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      else if (a === "--json") opts.json = true;
      else if (a === "--only") opts.only = args[++i];
      else if (a === "--fix") opts.fix = true;
      else if (a === "--dry-run") opts.dryRun = true;
      else if (a === "--no-fail") opts.noFail = true;
      else if (a === "--help" || a === "-h") {
        console.log(
          `Usage: node verify-glossary.js [options]\n\nOptions:\n  --glossary <path>         Path to glossary.tsv\n  --languages <csv>         Restrict to language codes\n  --only <pattern>          Regex/substring filter for source keys\n  --json                    JSON output\n  --fix                     Attempt auto-fix of truncated/missing/mismatch cells (safe heuristics)\n  --dry-run                 Show fixes without writing file (implies --fix)\n  --no-fail                 Exit 0 even if unresolved issues remain\n`
        );
        process.exit(0);
      }
    }
    if (opts.dryRun) opts.fix = true;
    return opts;
  }
  function loadLanguagesMap() {
    const dir = path.join(__dirname, "resources", "languages");
    const map = {};
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      const code = file.replace(/\.json$/, "");
      const full = path.join(dir, file);
      try {
        map[code] = JSON.parse(fs.readFileSync(full, "utf8"));
      } catch (e) {
        console.error("Failed to parse", file, e.message);
      }
    }
    return map;
  }
  function parseTsv(tsvPath) {
    const raw = fs.readFileSync(tsvPath, "utf8");
    const lines = raw.split(/\r?\n/);
    const headerLineIndex = lines.findIndex((l) => l.includes("\t"));
    if (headerLineIndex < 0) throw new Error("No header line with tabs found");
    const header = lines[headerLineIndex].split("\t").map((h) => h.trim());
    const rows = [];
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = line.split("\t");
      while (cols.length < header.length) cols.push("");
      rows.push({ cols, originalIndex: i - (headerLineIndex + 1) });
    }
    return { header, rows, originalLines: lines, headerLineIndex };
  }
  function filterRows(rows, onlyPattern) {
    if (!onlyPattern) return rows;
    let regex = null;
    try {
      regex = new RegExp(onlyPattern, "i");
    } catch {
      regex = new RegExp(
        onlyPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
    }
    return rows.filter((r) => regex.test(r.cols[0]));
  }
  function verify(tsv, langMap, opts) {
    const issues = {};
    const summary = {};
    const mods = []; // {originalRowIndex, colIndex, from, to, reason}
    const sourceCol = 0;
    const active = [];
    for (let i = 1; i < tsv.header.length; i++) {
      const code = tsv.header[i].toLowerCase();
      if (
        opts.languages &&
        !opts.languages.map((l) => l.toLowerCase()).includes(code)
      )
        continue;
      active.push({ col: i, code });
      issues[code] = [];
      summary[code] = {
        matched: 0,
        missing: 0,
        truncated: 0,
        mismatch: 0,
        unknownInJson: 0,
        fixed: 0,
        skipped: 0,
      };
    }
    tsavLoop: for (const row of tsv.rows) {
      const key = row.cols[sourceCol];
      if (!key) continue;
      for (const { col, code } of active) {
        const cellRaw = row.cols[col] || "";
        const cell = cellRaw.trim();
        const json = langMap[code];
        if (!json) {
          issues[code].push({ key, type: "lang-file-missing" });
          summary[code].mismatch++;
          continue;
        }
        const variants = json[key];
        if (!variants) {
          if (cell) {
            issues[code].push({ key, type: "unknown-in-json", value: cell });
            summary[code].unknownInJson++;
          }
          continue;
        }
        if (!cell) {
          issues[code].push({ key, type: "missing", expected: variants });
          summary[code].missing++;
          if (opts.fix) {
            if (variants.length === 1) {
              mods.push({
                originalRowIndex: row.originalIndex,
                colIndex: col,
                from: cellRaw,
                to: variants[0],
                reason: "fill-missing",
              });
              summary[code].fixed++;
            } else if (opts.fix) {
              summary[code].skipped++;
            }
          }
          continue;
        }
        if (variants.includes(cell)) {
          summary[code].matched++;
          continue;
        }
        const trunc = variants.find(
          (v) => v.startsWith(cell) && v.length > cell.length
        );
        if (trunc) {
          issues[code].push({
            key,
            type: "truncated",
            value: cell,
            suggestion: trunc,
          });
          summary[code].truncated++;
          if (opts.fix) {
            mods.push({
              originalRowIndex: row.originalIndex,
              colIndex: col,
              from: cellRaw,
              to: trunc,
              reason: "extend-truncated",
            });
            summary[code].fixed++;
          }
          continue;
        }
        issues[code].push({
          key,
          type: "mismatch",
          value: cell,
          expected: variants,
        });
        summary[code].mismatch++;
        if (opts.fix && variants.length === 1) {
          const target = variants[0];
          if (
            target.toLowerCase().startsWith(cell.toLowerCase()) ||
            cell
              .toLowerCase()
              .startsWith(
                target
                  .toLowerCase()
                  .slice(0, Math.min(target.length, cell.length - 1))
              )
          ) {
            mods.push({
              originalRowIndex: row.originalIndex,
              colIndex: col,
              from: cellRaw,
              to: target,
              reason: "replace-mismatch-single-variant",
            });
            summary[code].fixed++;
          } else summary[code].skipped++;
        } else if (opts.fix) summary[code].skipped++;
      }
    }
    return { issues, summary, mods };
  }
  function applyModifications(tsv, mods, opts) {
    if (!mods.length) return { written: false };
    const lineStart = tsv.headerLineIndex + 1;
    for (const m of mods) {
      const row = tsv.rows.find((r) => r.originalIndex === m.originalRowIndex);
      if (!row) continue;
      row.cols[m.colIndex] = m.to;
      tsv.originalLines[lineStart + m.originalRowIndex] = row.cols.join("\t");
    }
    if (opts.dryRun) return { written: false };
    // Backup
    const backupName =
      opts.glossary +
      "." +
      new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15) +
      ".bak";
    fs.copyFileSync(opts.glossary, backupName);
    fs.writeFileSync(opts.glossary, tsv.originalLines.join("\n"), "utf8");
    return { written: true, backup: backupName };
  }
  function main() {
    const opts = parseArgs();
    const langMap = loadLanguagesMap();
    const tsv = parseTsv(opts.glossary);
    const filtered = filterRows(tsv.rows, opts.only);
    const subset = { header: tsv.header, rows: filtered };
    const result = verify(subset, langMap, opts);
    let modResult = { written: false };
    if (opts.fix) {
      modResult = applyModifications(tsv, result.mods, opts);
    }
    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            summary: result.summary,
            issues: result.issues,
            modifications: result.mods,
            wrote: modResult.written,
            backup: modResult.backup,
          },
          null,
          2
        )
      );
    } else {
      for (const [code, sum] of Object.entries(result.summary)) {
        console.log(
          `Language ${code}: matched=${sum.matched} missing=${sum.missing} truncated=${sum.truncated} mismatch=${sum.mismatch} unknownInJson=${sum.unknownInJson} fixed=${sum.fixed} skipped=${sum.skipped}`
        );
        (result.issues[code] || []).forEach((issue) => {
          const base = `[${code}] ${issue.type.toUpperCase()} ${issue.key}`;
          if (issue.type === "truncated")
            console.log(`  ${base}: '${issue.value}' -> '${issue.suggestion}'`);
          else if (issue.type === "mismatch")
            console.log(
              `  ${base}: '${issue.value}' not in ${JSON.stringify(
                issue.expected
              )}`
            );
          else if (issue.type === "missing")
            console.log(
              `  ${base}: empty expected ${JSON.stringify(issue.expected)}`
            );
          else if (issue.type === "unknown-in-json")
            console.log(
              `  ${base}: value '${issue.value}' but key missing in JSON`
            );
          else console.log(`  ${base}`);
        });
      }
      if (opts.fix) {
        if (result.mods.length) {
          console.log(
            `Modifications (${opts.dryRun ? "preview" : "applied"}):`
          );
          result.mods.forEach((m) =>
            console.log(
              `  OrigRow#${m.originalRowIndex} Col#${m.colIndex} ${m.reason}: '${m.from}' -> '${m.to}'`
            )
          );
          if (modResult.backup)
            console.log(`Backup created: ${modResult.backup}`);
        } else console.log("No modifications to apply.");
      }
    }
    const unresolved = Object.values(result.summary).some(
      (s) =>
        s.missing + s.truncated + s.mismatch + s.unknownInJson > 0 &&
        s.missing + s.truncated + s.mismatch + s.unknownInJson !== s.fixed
    );
    if (unresolved && !opts.noFail) process.exit(1);
    else process.exit(0);
  }
  if (require.main === module) {
    try {
      main();
    } catch (e) {
      console.error("Fatal:", e.stack || e.message);
      process.exit(2);
    }
  }
})();
