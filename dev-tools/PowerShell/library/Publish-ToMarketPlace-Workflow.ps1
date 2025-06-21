param
(
    [Parameter(Mandatory = $true)]
    [ValidateSet('release', 'pre-release')]
    [string] $releaseType,
    [switch] $preReleaseOnRelease
)
$CurrentScriptRoot = $PSScriptRoot

$ErrorActionPreference = "stop"
& (Join-Path $CurrentScriptRoot ".\Create-VSIX-Workflow.ps1") -releaseType $releaseType -preReleaseOnRelease:$preReleaseOnRelease.IsPresent

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

$env:GIT_REDIRECT_STDERR = '2>&1'
Write-Host "Commit changes under '$(Resolve-Path $ExtensionPath)'"
git add $ExtensionPath/\*
$CommitMessage = "chore: $VersionText"
git commit -m $CommitMessage

Write-Host "Create Tag '$TagName'"
git tag "$TagName"

Add-Content -Encoding UTF8 -Path $env:GITHUB_OUTPUT -Value "vsixPath=$VsixPath"
Add-Content -Encoding UTF8 -Path $env:GITHUB_OUTPUT -Value "versionText=$VersionText"
Add-Content -Encoding UTF8 -Path $env:GITHUB_OUTPUT -Value "tagName=$TagName"
