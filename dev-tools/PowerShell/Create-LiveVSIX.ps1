$CurrentScriptRoot = $PSScriptRoot
$ErrorActionPreference = "stop"
& (Join-Path $CurrentScriptRoot "library\Create-VSIX.ps1") 