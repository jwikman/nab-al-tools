param
(
    [Parameter(Mandatory = $true)]
    [ValidateSet('release', 'release-patch', 'pre-release')]
    [string] $releaseType,
    [switch] $preReleaseOnRelease
)
$CurrentScriptRoot = $PSScriptRoot

$baseContentUrl = "https://github.com/jwikman/nab-al-tools/raw/master/extension"

$ErrorActionPreference = "stop"
& (Join-Path $CurrentScriptRoot ".\Create-VSIX-Pipeline.ps1") -releaseType $releaseType -preReleaseOnRelease:$preReleaseOnRelease.IsPresent

$ExtensionPath = Get-Location
if (!((Get-Location).Path.EndsWith('extension'))) {
    $ExtensionPath = Join-Path $CurrentScriptRoot "..\..\..\extension"
}
$vsixFiles = @() + (Get-ChildItem -Path $ExtensionPath -Filter '*.vsix')
if ($vsixFiles.Count -ne 1) {
    throw "Unexpected number of vsix files ($($vsixFiles.Count))"
}
$VsixPath = $vsixFiles[0].FullName

$vsixName = Split-Path -Path $VsixPath -Leaf
$vsixName -match "nab-al-tools-(?<major>[^\.]+)\.(?<minor>[^\.]+)\.(?<patch>[^\.]+)\.vsix"
if (!$Matches) {
    throw "Unexpected naming of $vsixName, version could not be parsed."
}
$VersionText = "v$($Matches.major).$($Matches.minor).$($Matches.patch)"
$TagName = $VersionText

$response = ""
$count = 0
$ReleaseText = "release"
if ($releaseType -eq 'pre-release') {
    $ReleaseText = "pre-release"
    $TagName = "pre-release/$TagName"
}


$env:GIT_REDIRECT_STDERR = '2>&1'
Write-Host "Commit changes under '$(Resolve-Path $ExtensionPath)'"
git add $ExtensionPath/\*
$CommitMessage = "chore: $VersionText"
git commit -m $CommitMessage

Write-Host "Create Tag '$TagName'"
git tag "$TagName"

Write-Host "Publishing!" -ForegroundColor Yellow
if ($releaseType -eq 'pre-release') {
    Write-Host "publish pre-release"
    vsce publish  --pre-release --packagePath $VsixPath --baseContentUrl $baseContentUrl
}
else {
    Write-Host "publish release"
    vsce publish --packagePath $VsixPath --baseContentUrl $baseContentUrl
}

Write-Host "Push git changes to remote"
git push
git push --tags

$logFilePath = Join-Path $CurrentScriptRoot '..\install_log.txt'
Add-Content $logFilePath -Value "------ $(Get-Date -Format "g") - $($VersionText) ------"  -Encoding UTF8
$statJson = vsce show nabsolutions.nab-al-tools --json | ConvertFrom-Json
$statJson.statistics | Add-Content $logFilePath -Encoding UTF8
