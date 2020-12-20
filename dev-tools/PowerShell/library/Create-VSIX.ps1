param
(
    [switch] $preview
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
$packagePath = Join-Path $ExtensionPath ".\package.json"
$package = Get-Content -Path $packagePath -Encoding "UTF8" | ConvertFrom-Json
$CurrentVersion = [version]::Parse($delivery.live)
Write-Host "Last delivered version: $CurrentVersion"
$NewVersionText = "$($CurrentVersion.Major).$($CurrentVersion.Minor).$($CurrentVersion.Build + 1)"
if ($preview.IsPresent) {
    Write-Host "Last preview version: $($delivery.preview)"
    $delivery.preview = [int]($delivery.preview) + 1
    $NewVersionText += "-preview.$($delivery.preview)"
}
else {
    $delivery.live = $NewVersionText
    $delivery.preview = "0"
}
Write-Host "New version: $NewVersionText"

. (Join-Path $CurrentScriptRoot "Save-Json.ps1") -CustomObject $delivery -FilePath $deliveryFilePath

$package.version = $NewVersionText
. (Join-Path $CurrentScriptRoot "Save-Json.ps1") -CustomObject $package -FilePath $packagePath

Write-Host "Remove old out folder"
Remove-Item -Path ".\out" -Recurse -Force -ErrorAction Ignore
Write-Host "Package!"
vsce package --baseContentUrl "https://github.com/jwikman/nab-al-tools/raw/master/extension"

Pop-Location

Write-Host "Version created: $NewVersionText" -ForegroundColor Yellow
