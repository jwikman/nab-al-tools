<#
.SYNOPSIS
    Downloads the latest NAB AL Tools extension from the VS Code Marketplace.

.DESCRIPTION
    This script queries the VS Code Marketplace API to find and download the latest version
    of the NAB AL Tools extension (nabsolutions.nab-al-tools). It extracts the VSIX package
    to a specified destination directory for analysis, testing, or manual installation.

.PARAMETER DestinationPath
    The directory path where the extension will be extracted. This parameter is mandatory.

.PARAMETER preview
    Switch parameter to include pre-release versions in the search. If not specified,
    only stable releases will be considered.

.EXAMPLE
    .\Get-LatestNABALTools.ps1 -DestinationPath "C:\temp\nab-al-tools"
    Downloads the latest stable version of NAB AL Tools and extracts it to C:\temp\nab-al-tools

.EXAMPLE
    .\Get-LatestNABALTools.ps1 -DestinationPath "C:\temp\nab-al-tools" -preview
    Downloads the latest version (including pre-release) of NAB AL Tools and extracts it to C:\temp\nab-al-tools

.NOTES
    - Requires internet connectivity to access the VS Code Marketplace API
    - The script uses the VS Code Marketplace REST API to query for extensions
    - The downloaded VSIX file is temporarily stored and then extracted to the destination
    - The destination directory will be created if it doesn't exist
    - To start the MCP server after extraction, run: node "c:/temp/nab-al-tools/extension/dist/mcp/server.js"
    - The MCP server provides Model Context Protocol functionality for AI assistants
    - To configure the MCP server, add the following to your MCP.json configuration:
      "nab-al-tools-mcp": {
          "type": "stdio",
          "command": "node",
          "args": [
              "c:/temp/nab-al-tools/extension/dist/mcp/server.js"
          ]
      }

.OUTPUTS
    Extracts the extension files to the specified destination path and displays version information

.LINK
    https://marketplace.visualstudio.com/items?itemName=nabsolutions.nab-al-tools
#>

param (
    [Parameter(Mandatory = $true)]
    [string]
    $DestinationPath,
    [switch]
    $preview
)
$listing = Invoke-WebRequest -Method POST -UseBasicParsing `
    -Uri https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery?api-version=3.0-preview.1 `
    -Body '{"filters":[{"criteria":[{"filterType":8,"value":"Microsoft.VisualStudio.Code"},{"filterType":12,"value":"4096"},{"filterType":7,"value":"nabsolutions.nab-al-tools"}],"pageNumber":1,"pageSize":50,"sortBy":0,"sortOrder":0}],"assetTypes":[],"flags":55}' `
    -ContentType application/json | ConvertFrom-Json 

$IncludePreRelease = $preview.IsPresent
$vsixUrl = $listing.results | Select-Object -First 1 -ExpandProperty extensions `
| Select-Object -First 1 -ExpandProperty versions `
| Where-Object { ($_.properties.Where({ $_.key -eq "Microsoft.VisualStudio.Code.PreRelease" }).value -ne $true) -or $IncludePreRelease } `
| Select-Object -First 1 -ExpandProperty files `
| Where-Object { $_.assetType -eq "Microsoft.VisualStudio.Services.VSIXPackage" } `
| Select-Object -ExpandProperty source

if (!$vsixUrl) {
    throw "Unable to locate latest NAB AL Tools Extension from the VS Code Marketplace"
}
$version = "v$($listing.results.extensions.versions[0].version)"

Write-Host "Downloadning $($version) from '$vsixUrl'"

$tmpFilePath = [System.IO.Path]::GetTempFileName() + '.zip'
$response = Invoke-WebRequest -Uri $VsixUrl -Method Get -UseBasicParsing
if ($response.StatusCode -ne 200) {
    throw "Failure to download '$Url'"
}
else {
    Set-Content -Path $tmpFilePath -Value $response.Content -AsByteStream
}
Write-Host "Un-zipping to $DestinationPath"
Expand-Archive -Path $tmpFilePath -DestinationPath $DestinationPath -Force

# Clean up temporary file
Remove-Item -Path $tmpFilePath -Force
