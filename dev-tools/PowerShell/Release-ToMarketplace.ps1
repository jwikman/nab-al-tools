$CurrentScriptRoot = $PSScriptRoot
$ErrorActionPreference = "stop"
& (Join-Path $CurrentScriptRoot "library\Publish-ToMarketplace.ps1") -releaseType "pre-release" -preReleaseOnRelease
& (Join-Path $CurrentScriptRoot "library\Publish-ToMarketplace.ps1") -releaseType "release"