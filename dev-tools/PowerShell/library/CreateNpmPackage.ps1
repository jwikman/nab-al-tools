param
(
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

Write-Host "Publishing npm package"
npm set "//registry.npmjs.org/:_authToken=$env:NPM_TOKEN"
npm publish --access public

Pop-Location
