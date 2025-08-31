<#!
.SYNOPSIS
  Build term usage mapping for glossary terms.
.DESCRIPTION
  Reads glossary.tsv (first column: English term) and a large JSON source file mapping English source texts to translation arrays.
  Produces term-usages.json where each glossary term maps to an array of English source texts that contain the term (case-insensitive substring).

  Also handles variant normalization: G/L -> GL, Whse. -> Warehouse, Serial No. -> Serial No / Serial Number, etc.
.PARAMETER SourceJson
  Path to large JSON file (e.g., fetch-unpack-transform/tmp/Translations/sv-se.json) containing an object: { "English source": [ "Translation", ... ], ... }.
.PARAMETER GlossaryTsv
  Path to glossary.tsv file (first column header 'English').
.PARAMETER OutputJson
  Path to output JSON file (term-usages.json).
.PARAMETER VariantsJson (optional)
  Optional JSON file defining additional variant arrays: { "CanonicalTerm": ["Variant1", "Variant2"] }.
.EXAMPLE
  pwsh ./build-term-usages.ps1 -SourceJson ..\fetch-unpack-transform\tmp\Translations\sv-se.json -GlossaryTsv .\glossary.tsv -OutputJson .\term-usages.json
#>
[CmdletBinding()] param(
    [Parameter(Mandatory = $true)] [string] $SourceJson,
    [Parameter(Mandatory = $true)] [string] $GlossaryTsv,
    [Parameter(Mandatory = $true)] [string] $OutputJson,
    [string] $VariantsJson
)
set-strictmode -version latest
$ErrorActionPreference = 'Stop'

function Write-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[WARN] $msg" -ForegroundColor Yellow }

if (-not (Test-Path $SourceJson)) { throw "SourceJson not found: $SourceJson" }
if (-not (Test-Path $GlossaryTsv)) { throw "GlossaryTsv not found: $GlossaryTsv" }
if ($VariantsJson -and -not (Test-Path $VariantsJson)) { throw "VariantsJson not found: $VariantsJson" }

Write-Info "Loading source JSON (this may take a while)..."
$raw = Get-Content -Path $SourceJson -Raw
if (-not $raw.Trim()) { throw "Source JSON file is empty: $SourceJson" }
$sourceObject = $raw | ConvertFrom-Json -AsHashtable

if (-not $sourceObject) { throw "Failed to parse source JSON." }

Write-Info "Extracting English source keys..."
# Keys are English source strings
$allKeys = [System.Collections.Generic.List[string]]::new()
foreach ($k in $sourceObject.Keys) { if ([string]::IsNullOrWhiteSpace($k)) { continue } ; $allKeys.Add($k) }

Write-Info "Loaded $($allKeys.Count) distinct source texts"

Write-Info "Loading glossary terms..."
$glossaryLines = Get-Content -Path $GlossaryTsv -Encoding UTF8
if ($glossaryLines.Count -lt 2) { throw "Glossary appears empty or only header." }
$header = ($glossaryLines[0].Split("`t"))[0]
if ($header -ne 'English') { Write-Warn "First header cell is '$header' (expected 'English'). Proceeding." }
$termList = @()
foreach ($line in ($glossaryLines | Select-Object -Skip 1)) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $cell = ($line.Split("`t"))[0]
    if ([string]::IsNullOrWhiteSpace($cell)) { continue }
    $termList += $cell
}
$terms = $termList | Where-Object { $_ } | Sort-Object -Unique
Write-Info "Loaded $($terms.Count) glossary terms"

# Variant normalization map.
$variantMap = [ordered]@{
    'G/L'               = @('G/L', 'G L', 'GL', 'General Ledger')
    'Whse.'             = @('Whse.', 'Whse', 'Warehouse')
    'Serial No.'        = @('Serial No.', 'Serial No', 'Serial Number')
    'Lot No.'           = @('Lot No.', 'Lot No', 'Lot Number')
    'Assemble-to-Order' = @('Assemble-to-Order', 'Assemble to Order')
    'G/L Account'       = @('G/L Account', 'GL Account', 'General Ledger Account')
    'G/L Entry'         = @('G/L Entry', 'GL Entry', 'General Ledger Entry')
    'G/L Journal'       = @('G/L Journal', 'GL Journal', 'General Ledger Journal')
}
if ($VariantsJson) {
    Write-Info "Merging custom variants from $VariantsJson"
    $custom = Get-Content -Raw -Path $VariantsJson | ConvertFrom-Json -AsHashtable
    foreach ($ck in $custom.Keys) {
        if ($variantMap.Contains($ck)) {
            $merged = New-Object System.Collections.Generic.HashSet[string] ([StringComparer]::OrdinalIgnoreCase)
            foreach ($v in $variantMap[$ck]) { $null = $merged.Add($v) }
            foreach ($v in $custom[$ck]) { $null = $merged.Add($v) }
            # Enumerate hashset instead of calling ToArray() (not defined as instance method on HashSet in some PS versions)
            $variantMap[$ck] = @($merged)
        }
        else {
            $variantMap[$ck] = @($custom[$ck])
        }
    }
}

# Build index: lower-case key -> original key (for faster substring checks)
Write-Info "Preparing lowercase key cache..."
$keyCache = foreach ($k in $allKeys) { [PSCustomObject]@{ Original = $k; Lower = $k.ToLowerInvariant() } }

# Function to get variants (returns at least the term itself)
function Get-TermVariants([string] $term) {
    if ($variantMap.Contains($term)) { return $variantMap[$term] }
    return @($term)
}

Write-Info "Finding usages..."
$result = [ordered]@{}

foreach ($term in $terms) {
    $variants = Get-TermVariants $term
    $variantLowers = $variants | ForEach-Object { $_.ToLowerInvariant() } | Sort-Object -Unique
    $matchesSet = New-Object System.Collections.Generic.HashSet[string] ([StringComparer]::OrdinalIgnoreCase)

    foreach ($entry in $keyCache) {
        foreach ($v in $variantLowers) {
            if ($entry.Lower -like "*${v}*") { $matchesSet.Add($entry.Original) | Out-Null; break }
        }
    }
    # Enumerate hashset instead of calling ToArray() for compatibility
    $termMatches = @($matchesSet) | Sort-Object -Culture 'en-US' -CaseSensitive:$false
    $result[$term] = $termMatches
}

Write-Info "Writing JSON to $OutputJson"
# ConvertTo-Json depth default might truncate; specify large depth.
($result | ConvertTo-Json -Depth 6) | Out-File -FilePath $OutputJson -Encoding UTF8

# Report zero-match terms safely
$zero = @()
foreach ($kv in $result.GetEnumerator()) {
    if (-not $kv.Value -or (@($kv.Value)).Length -eq 0) { $zero += $kv.Key }
}
if ($zero.Length -gt 0) {
    Write-Warn "Zero-match terms ($($zero.Length)):"; $zero | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkYellow }
}
else {
    Write-Info "All terms had at least one match."
}

Write-Info "Done."
