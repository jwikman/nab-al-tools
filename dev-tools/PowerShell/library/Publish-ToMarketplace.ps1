param
(
    [Parameter(Mandatory = $true)]
    [ValidateSet('release', 'release-patch', 'pre-release')]
    [string] $releaseType
)
$CurrentScriptRoot = $PSScriptRoot

#$CurrentScriptRoot = "D:\VSCode\Git\GitHub\nab-al-tools\dev-tools\PowerShell\library"
#$releaseType = 'pre-release'
$ErrorActionPreference = "stop"
& (Join-Path $CurrentScriptRoot ".\Create-VSIX.ps1") -releaseType $releaseType

$ExtensionPath = Get-Location
if (!((Get-Location).Path.EndsWith('extension'))) {
    $ExtensionPath = Join-Path $CurrentScriptRoot "..\..\..\extension"
}
$vsixFiles = @() + (Get-ChildItem -Path $ExtensionPath -Filter '*.vsix')
if ($vsixFiles.Count -ne 1) {
    throw "Unexpected number of vsix files ($($vsixFiles.Count))"
}
$VsixPath = $vsixFiles[0].FullName


$response = ""
$count = 0
$ReleaseText = "release"
if ($releaseType -eq 'pre-release') {
    $ReleaseText = "pre-release"
}
do {
    if ($count -eq 0) {
        Write-Host "Publish $ReleaseText to Marketplace? (Y/N)" -ForegroundColor Yellow
    }
    else {
        Write-Host "Are you sure you want to publish $ReleaseText to Marketplace? (Y/N)" -ForegroundColor Yellow
    }
    $response = Read-Host
    if ($response.ToLower() -eq 'n') {
        Write-Host "Publishing skipped"
        return
    }
    if ($response.ToLower() -eq 'y') {
        $count++
    }
} while (($response.ToLower() -ne 'y') -or ($count -lt 2))

if ($response.ToLower() -ne 'y') {
    Write-Host "Publishing skipped"
    return
}
Write-Host "Publishing!" -ForegroundColor Yellow
if ($releaseType -eq 'pre-release') {
    Write-Host "publish pre-release"
    vsce publish  --pre-release --packagePath $VsixPath --baseContentUrl "https://github.com/jwikman/nab-al-tools/raw/master/extension"
}
else {
    Write-Host "publish release"
    vsce publish --packagePath $VsixPath --baseContentUrl "https://github.com/jwikman/nab-al-tools/raw/master/extension"
}