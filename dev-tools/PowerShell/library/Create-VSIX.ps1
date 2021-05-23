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
[version]$NextLiveVersion = [version]::Parse($delivery.nextLive)
$NewVersionText = $NextLiveVersion.ToString()
Write-Host "Next Live version: $NextLiveVersion"
if ($preview.IsPresent) {
    Write-Host "Creating Preview version: $($delivery.nextPreview)"
    $previewPrefix = ''
    if ($delivery.previewPrefix) {
        $previewPrefix = "-$($delivery.previewPrefix)"
    }
    $NewVersionText += "-preview$($previewPrefix).$($delivery.nextPreview)"
    $delivery.nextPreview = [int]($delivery.nextPreview) + 1
    Write-Verbose "Next preview version: $($delivery.nextPreview)"
}
else {
    $NewNextLiveVersionText = "$($NextLiveVersion.Major).$($NextLiveVersion.Minor).$($NextLiveVersion.Build + 1)"
    $delivery.nextLive = $NewNextLiveVersionText
    $delivery.nextPreview = "1"
}
Write-Host "New version: $NewVersionText"

. (Join-Path $CurrentScriptRoot "Save-Json.ps1") -CustomObject $delivery -FilePath $deliveryFilePath

$package.version = $NewVersionText
. (Join-Path $CurrentScriptRoot "Save-Json.ps1") -CustomObject $package -FilePath $packagePath

Write-Host "Run 'npm install' to make sure that everything is up-to-date"
npm install

Write-Host "Remove old out folder"
Remove-Item -Path ".\out" -Recurse -Force -ErrorAction Ignore
Write-Host "Remove old dist folder"
Remove-Item -Path ".\dist" -Recurse -Force -ErrorAction Ignore
Write-Host "Package!"
vsce package --baseContentUrl "https://github.com/jwikman/nab-al-tools/raw/master/extension"
if ($LASTEXITCODE -ne 0) {
    throw "Packaging failed"
}
Pop-Location

Write-Host "Version created: $NewVersionText" -ForegroundColor Yellow
Write-Host "Finished at $(Get-Date -Format g)"
