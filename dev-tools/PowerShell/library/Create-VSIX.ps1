param
(
    [Parameter(Mandatory = $true)]
    [ValidateSet('release', 'release-patch', 'pre-release')]
    [string] $releaseType
)
$CurrentScriptRoot = $PSScriptRoot

Push-Location
if (!((Get-Location).Path.EndsWith('extension'))) {
    $ExtensionPath = Join-Path $PSScriptRoot "..\..\..\extension"
    Set-Location $ExtensionPath
}
$ExtensionPath = (Get-Location).Path
Get-ChildItem -Path $ExtensionPath -Filter '*.vsix' | Remove-Item
$deliveryFilePath = Join-Path $ExtensionPath "delivery.json"
$delivery = Get-Content -Path $deliveryFilePath -Encoding "UTF8" | ConvertFrom-Json


[version]$Version = [version]::Parse($delivery.currentLive)
$NewMinor = $Version.Minor
if ($releaseType -eq "release") {
    $NewMinor += 2
}
$NewPatch = 0;
if ($releaseType -in ('release-patch', 'pre-release')) {
    $NewPatch = [int]::Parse("$(Get-Date -Format "yyMMddHHmm")")    
}
if ($releaseType -eq 'pre-release') {
    $NewMinor += 1
}
$NewVersion = [version]::new($Version.Major, $NewMinor, $NewPatch)
$NewVersionText = $NewVersion.ToString()

Write-Host "New version: $NewVersionText"

if ($releaseType -in ('release', 'release-patch')) {
    Write-Host "Update delivery.json"
    $delivery.currentLive = $NewVersionText
    . (Join-Path $CurrentScriptRoot "Save-Json.ps1") -CustomObject $delivery -FilePath $deliveryFilePath
}

Write-Host "Run 'npm install' to make sure that everything is up-to-date"
npm install

Write-Host "Remove old out folder"
Remove-Item -Path ".\out" -Recurse -Force -ErrorAction Ignore
Write-Host "Remove old dist folder"
Remove-Item -Path ".\dist" -Recurse -Force -ErrorAction Ignore
if ($releaseType -eq 'pre-release') {
    Write-Host "Package pre-release!"
    vsce package --message $NewVersionText --pre-release --baseContentUrl "https://github.com/jwikman/nab-al-tools/raw/master/extension" $NewVersionText
}
else {
    Write-Host "Package release!"
    vsce package --message $NewVersionText --baseContentUrl "https://github.com/jwikman/nab-al-tools/raw/master/extension" $NewVersionText
}
if ($LASTEXITCODE -ne 0) {
    throw "Packaging failed"
}

if ($releaseType -in ('release', 'release-patch')) {
    . (Join-Path $CurrentScriptRoot "Save-Json.ps1") -CustomObject $delivery -FilePath $deliveryFilePath
}

Pop-Location

Write-Host "Version created: $NewVersionText" -ForegroundColor Yellow
Write-Host "Finished at $(Get-Date -Format g)"

