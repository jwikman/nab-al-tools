// Populates extension/resources/glossary.tsv using translations from dev-tools/glossary/resources/languages/*.json
// Matching policy: exact key match on en-US term; prefer case-sensitive, then case-insensitive. No substring/partial matching.
// Safety: Only fills empty language cells; keeps en-US and Description as-is.
// Usage: `node populate-glossary.js` from dev-tools/glossary folder.

const fs = require("fs");
const path = require("path");

function loadJson(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    return JSON.parse(text);
  } catch (err) {
    console.warn(`Warn: Failed to load ${filePath}: ${err.message}`);
    return null;
  }
}

function buildLookups(obj) {
  // obj: { enString: [translations...] }
  const exact = obj || {};
  const lower = Object.create(null);
  if (obj) {
    for (const k of Object.keys(obj)) {
      const lk = k.toLowerCase();
      // Keep first occurrence for deterministic behavior
      if (!(lk in lower)) lower[lk] = obj[k];
    }
  }
  return { exact, lower };
}

function main() {
  const scriptDir = __dirname; // dev-tools/glossary
  const repoRoot = path.resolve(scriptDir, "..", "..");
  const tsvPath = path.resolve(
    repoRoot,
    "extension",
    "resources",
    "glossary.tsv"
  );
  const languagesDir = path.resolve(scriptDir, "resources", "languages");

  if (!fs.existsSync(tsvPath)) {
    console.error(`Error: TSV not found at ${tsvPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(languagesDir)) {
    console.error(`Error: Languages folder not found at ${languagesDir}`);
    process.exit(1);
  }

  const tsvText = fs.readFileSync(tsvPath, "utf8");
  const newline = tsvText.includes("\r\n") ? "\r\n" : "\n";
  const rows = tsvText.split(/\r?\n/);
  if (rows.length === 0) {
    console.error("Error: Empty TSV file.");
    process.exit(1);
  }

  const header = rows[0].split("\t");
  const colCount = header.length;
  const enCol = header.indexOf("en-US");
  const descCol = header.indexOf("Description");
  if (enCol !== 0) {
    console.warn("Warn: Expected en-US as first column. Proceeding anyway.");
  }
  if (descCol === -1) {
    console.error("Error: Description column not found.");
    process.exit(1);
  }

  // Prepare language lookups per column index
  const langLookups = new Array(colCount).fill(null);
  for (let c = 0; c < colCount; c++) {
    const colName = header[c];
    if (!colName || colName === "en-US" || colName === "Description") continue;
    const fileName = `${colName}.json`;
    const filePath = path.resolve(languagesDir, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(
        `Warn: No JSON for column '${colName}' (${fileName}). Skipping.`
      );
      continue;
    }
    const data = loadJson(filePath);
    if (!data || typeof data !== "object") continue;
    langLookups[c] = buildLookups(data);
  }

  let filledCount = 0;
  let totalCandidates = 0;

  const updatedRows = rows.map((line, idx) => {
    if (idx === 0) return line; // header
    if (line.trim() === "") return line; // keep empty lines

    // Preserve trailing empty columns by padding to header length
    const cells = line.split("\t");
    if (cells.length < colCount) {
      while (cells.length < colCount) cells.push("");
    } else if (cells.length > colCount) {
      // Truncate extras to avoid corrupting structure
      cells.length = colCount;
    }

    const enTerm = cells[enCol] ?? "";
    if (enTerm === "") return line; // nothing to translate

    for (let c = 0; c < colCount; c++) {
      if (c === enCol || c === descCol) continue; // don't change en-US or Description
      const lookups = langLookups[c];
      if (!lookups) continue; // language file missing

      if (cells[c] === "") {
        totalCandidates++;
        let translated = null;
        // Case-sensitive exact key
        if (Object.prototype.hasOwnProperty.call(lookups.exact, enTerm)) {
          const arr = lookups.exact[enTerm];
          if (Array.isArray(arr) && arr.length > 0) translated = arr[0];
        } else {
          // Case-insensitive exact key
          const arr = lookups.lower[enTerm.toLowerCase()];
          if (Array.isArray(arr) && arr.length > 0) translated = arr[0];
        }
        if (translated != null) {
          cells[c] = translated;
          filledCount++;
        }
      }
    }

    return cells.join("\t");
  });

  const outText = updatedRows.join(newline);
  if (outText !== tsvText) {
    fs.writeFileSync(tsvPath, outText, "utf8");
  }

  console.log(
    `Done. Filled ${filledCount} cells out of ${totalCandidates} candidates.`
  );
}

if (require.main === module) {
  main();
}
