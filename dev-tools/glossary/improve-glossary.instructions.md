# Improve Business Central Glossary – Instructions

## Purpose

Enhance `glossary.tsv` by adding a new column `Description` that helps translators understand the precise Business Central (BC) usage and translation constraints of each term/phrase.

## Source & Output

- Source file: `glossary.tsv` (current columns: `English`)
- Output file (overwrite existing): `glossary.tsv` with columns (tab‑separated):
  1. English
  2. Description

Do **not** reorder or delete existing rows. Only append the new header and descriptions.

## Column Definition

`Description` = A concise, translation-oriented usage note (1–3 sentences; max ~220 characters unless disambiguation requires more). It must:

- Define the concept/function in BC ("what it represents / does").
- Clarify domain scope (e.g., Finance, Inventory, Manufacturing, Jobs, Service, Warehouse, Cost Accounting).
- Distinguish from similar or easily confused terms already in the glossary.
- Indicate if the term is: object type (table/page/report), document type, ledger entry, journal/batch, setup concept, posting group, calculation method, quantity type, planning parameter, etc.
- State translation constraints: fixed label vs adaptable grammatically (e.g., must stay noun, do not verbalize; keep abbreviation).
- Mention pluralization nuances if needed (e.g., term typically shown singular in UI headers even when list contains many).

Avoid:

- Circular definitions ("Sales Order: an order for sales").
- Pure UI paraphrases without functional info.
- Speculative behavior unsupported by evidence.

## Context Retrieval (Automated Preprocessing Workflow)

Instead of calling a search tool per term, generate a consolidated usage map once, then use it to write descriptions.

### Step 1: Generate Term Usage Map

Run the PowerShell script `build-term-usages.ps1` located in the same folder. It scans a large English-source JSON file (object: English text -> array of translations) and produces `term-usages.json` with this shape:

```
{
  "Item": ["Item", "Item Journal", "Specifies the item name", ...],
  "Non existing term": [],
  ...
}
```

Rules applied:

- Case-insensitive substring match (a glossary term matches any source text containing the term or any defined variant).
- Variants handled for punctuation/abbreviations (e.g., `G/L`, `GL`, `General Ledger`).
- All matches de-duplicated and sorted alphabetically.
- Terms with zero matches included as empty arrays (these require extra scrutiny when writing descriptions).

Script parameters (example):

```
pwsh ./build-term-usages.ps1 \ \
  -SourceJson .\resources\languages\sv-se.json \ \
  -GlossaryTsv .\glossary.tsv \ \
  -OutputJson .\term-usages.json
```

Optional: provide `-VariantsJson` with additional variant definitions.

### Step 2: Use `term-usages.json` While Writing Descriptions

For each glossary term:
IMPORTANT (MANDATORY): You MUST consult `term-usages.json` for EVERY term in `glossary.tsv` before drafting or revising a description. Do not skip terms with obvious meaning; still inspect their usage array (even if empty) to confirm context and discover edge cases.

Workflow per term:

1. Load its array of usages from `term-usages.json` (key matches the exact English term in the TSV).
2. Skim the variety of contexts (captions vs tooltips vs actions) to understand functional role.
3. Identify disambiguation needs (e.g., differentiate journals vs entries vs ledgers vs setup records).
4. Draft the description (see guidelines below).
5. If array empty: rely on standard BC domain knowledge; explicitly confirm the concept's scope before drafting.

Quality Gate Enforcement:

- A description is considered incomplete if the usage array was not reviewed.
- If the array is empty, add an internal reviewer note (outside the TSV) to verify in a later source update.

### Updating the Usage Map

If the source JSON is refreshed (new platform version), re-run the script before adding new descriptions. Do not manually edit `term-usages.json`.

### Variants Logic (Current Embedded Set)

Canonical term => accepted variants:

```
G/L -> G/L, G L, GL, General Ledger
G/L Account -> G/L Account, GL Account, General Ledger Account
G/L Entry -> G/L Entry, GL Entry, General Ledger Entry
G/L Journal -> G/L Journal, GL Journal, General Ledger Journal
Whse. -> Whse., Whse, Warehouse
Serial No. -> Serial No., Serial No, Serial Number
Lot No. -> Lot No., Lot No, Lot Number
Assemble-to-Order -> Assemble-to-Order, Assemble to Order
```

Extend via external variants JSON if needed.

### Zero-Match Terms

Treat empty arrays as high-priority review items. Confirm the term truly exists in UI or is forward-looking. Provide cautious, non-speculative definition based on domain understanding.

## Writing Guidelines by Category

| Category                                                 | Cues                                | Description Focus                                                                                                              |
| -------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Document Type (Order, Invoice, Credit Memo)              | Appears with Sales/Purchase/Service | Transaction lifecycle role; relationship to posting/shipment/invoicing.                                                        |
| Journal                                                  | Ends with "Journal"                 | Data entry staging area before posting; specify module (e.g., Item Journal = inventory adjustments, reclassification, counts). |
| Ledger Entry                                             | Ends with "Entry"                   | Immutable posted record; specify ledger (G/L, Item, Capacity, Value).                                                          |
| Posting Group                                            | Ends with "Posting Group"           | Mapping layer between master data and G/L accounts; specify dimension (Gen. Bus., Gen. Prod., VAT, Inventory).                 |
| Planning Parameter (Safety Lead Time, Reordering Policy) | Appears in planning/stock terms     | Explain influence on MRP/MPS suggestions (time buffer, lot sizing, reorder algorithm).                                         |
| Setup / Configuration                                    | Contains Setup / Template           | Governs defaults / processing logic for a functional area.                                                                     |
| Cost Accounting                                          | Cost Center, Cost Object            | Internal cost tracking dimension; how it's used in cost allocation.                                                            |
| Warehouse                                                | Warehouse / Whse. / Put-away / Pick | Physical handling, movement, or registration of inventory operations.                                                          |
| Manufacturing                                            | Routing, BOM, Work/Machine Center   | Production structure or capacity scheduling concept.                                                                           |
| Service                                                  | Service Item, Service Order         | After-sales service management objects (repair, maintenance).                                                                  |
| Jobs                                                     | Job Task, Job Planning Line         | Project-based costing & planning.                                                                                              |

## Disambiguation Tips

- If two terms differ only by domain (e.g., "Routing" vs "Routing Line"), explicitly relate them.
- Highlight contrasts: "Sales Quote" (not binding) vs "Sales Order" (commitment; can trigger reservation / fulfillment).
- For entries vs journals: Journal = editable staging; Entry = posted history.

## Style & Tone

- Impersonal, present tense.
- Prefer: "Represents", "Specifies", "Defines", "Holds", "Used to".
- Avoid marketing fluff.
- Use singular even if list context.

## Quality Checklist Before Saving

For each row:

1. Non-empty Description.
2. ≤220 chars unless critical clarification (flag if >300).
3. Contains at least one functional verb (represents/used to/defines/etc.).
4. No unresolved placeholders or speculative language (avoid "maybe", "possibly").
5. No duplicated definitions across different terms.
6. Manual per-term validation performed (see Manual Validation Process below).

## Editing Procedure

1. Load existing `glossary.tsv`.
2. If header does not already contain `Description`, modify first line to: `English\tDescription`.
3. For each subsequent line:
   - Preserve the original English term exactly.
   - Append a tab + crafted description.
4. Save file using UTF-8 without BOM. Do not wrap values in quotes. Do not insert extra blank lines.

## Example Transformations

Input row:

```
Item
```

Output row:

```
Item\tMaster record for something stocked or sold; defines identification, costing, inventory tracking, and serves as the basis for transactions (sales, purchase, production, service, warehouse).
```

Another:

```
G/L Account\tChart of Accounts record in the General Ledger; collects posted financial entries and is referenced by posting groups to classify transactions.
```

## Handling Multi-Word Phrases

Treat the entire phrase as the key; do not create separate entries for internal words unless already present. Description should clarify the phrase's distinct role beyond its components.

## Ambiguity & Synonyms

If two glossary terms refer to the same BC object (rare), note the preferred form in each description ("Preferred: X"). Do **not** delete duplicates without explicit instruction.

## Forbidden Content

- No external product names unless intrinsic to BC.
- No confidential customer-specific usage notes.
- No pseudo-code or AL unless required for disambiguation (normally not needed).

## Completion Criteria

Glossary file updated with a Description for 100% of rows; passes quality checklist; no structural TSV issues.

## Manual Validation Process (NO automated script)

For EACH term (no exceptions):

1. Open `term-usages.json` and retrieve the array for the term.
2. Review the breadth of contexts (captions vs tooltips vs action text vs narrative sentences).
3. Confirm the drafted description matches ALL observed contexts (not contradicting any usage) and clarifies domain/function.
4. If usages are empty: rely on domain knowledge and mark internally as "Zero evidence reviewed" (do NOT leave description blank).
5. Check quality criteria again (functional verb, distinctness, length ≤220 preferred / ≤300 max, no placeholders, neutral tone).
6. If the usage array reveals multiple semantic roles (rare), refine wording to encompass or disambiguate them.
7. Track progress externally (e.g., maintain a temporary `glossary-validation-log.md` with: Term | UsageCount | Notes). Do NOT commit that log unless process documentation is required.

Submission Gate: A glossary update is considered incomplete if any term was not manually cross-checked against its usage array at the time of editing.

## Optional Enhancement (Future)

Add columns later (do not add now): `Category`, `Notes`, `NeedsReview` for workflow tracking.

---

Follow these steps deterministically so another agent can reproduce the same enhancement process. Preserve traceability by keeping search queries used (in agent log, not in file) for potential audit.
