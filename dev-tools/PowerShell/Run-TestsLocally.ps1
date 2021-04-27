$CurrentScriptRoot = $PSScriptRoot
$ExtensionPath = Resolve-Path (Join-Path $CurrentScriptRoot "..\..\extension")
Push-Location
Set-Location $ExtensionPath
npm install
npm test
Pop-Location

$workspacePath = Resolve-Path (join-path $ExtensionPath "..\nab-al-tools.code-workspace")
. code $workspacePath