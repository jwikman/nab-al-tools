param
(
  [switch]$SkipPublish,
  [ValidateSet('pre-release', 'release')]
  [string]$ReleaseType = 'release'
)

$CurrentScriptRoot = $PSScriptRoot

$ExtensionPath = Join-Path $CurrentScriptRoot "..\..\..\extension" -Resolve

$McpPath = Join-Path $ExtensionPath ".\dist\mcp\server.js" -Resolve
if (!(Test-Path -Path $McpPath )) {
  throw "MCP not found, run build extension first"
}
$mcpResourcePath = Join-Path $ExtensionPath "mcp-resources"
$ServerJsPath = Join-Path $mcpResourcePath "server.js"

if (Test-Path $ServerJsPath) {
  Remove-Item -Path $ServerJsPath -Force
}

$glossaryPath = Join-Path $ExtensionPath ".\src\mcp\glossary.tsv" -Resolve
Copy-Item -Path $glossaryPath -Destination (Join-Path $mcpResourcePath "glossary.tsv") -Force

# Add shebang to make server.js executable
$ServerJsContent = Get-Content -Path $McpPath -Raw
$ServerJsWithShebang = "#!/usr/bin/env node`n" + $ServerJsContent
$ServerJsWithShebang | Set-Content -Path $ServerJsPath -Force -Encoding UTF8

$ExtensionPackagePath = Join-Path $ExtensionPath ".\package.json"
$ExtensionPackage = Get-Content -Path $ExtensionPackagePath -Raw | ConvertFrom-Json
$McpPackagePath = Join-Path $mcpResourcePath "package.json"
$McpPackage = Get-Content -Path $McpPackagePath -Raw | ConvertFrom-Json
$McpPackage.version = $ExtensionPackage.version
Remove-Item -Path $McpPackagePath -Force
Set-Content -Path $McpPackagePath -Value ($McpPackage | ConvertTo-Json -Depth 10) -Force

Push-Location
Set-Location $mcpResourcePath

Write-Host "Packing npm package"
npm pack

if (!$SkipPublish.IsPresent) {
  Write-Host "Publishing npm package"
  npm set "//registry.npmjs.org/:_authToken=$env:NPM_TOKEN"
  
  if ($ReleaseType -eq 'pre-release') {
    Write-Host "Publishing as pre-release (tag: next)"
    npm publish --access public --tag next
  } else {
    Write-Host "Publishing as release (tag: latest)"
    npm publish --access public --tag latest
  }
}

Pop-Location
