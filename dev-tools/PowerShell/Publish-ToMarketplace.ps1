$CurrentScriptRoot = $PSScriptRoot
$ErrorActionPreference = "stop"
& (Join-Path $CurrentScriptRoot ".\Create-LiveVSIX.ps1") 
$response = ""
$count = 0
do {
    if ($count -eq 0) {
        Write-Host "Publish to Marketplace? (Y/N)" -ForegroundColor Yellow
    }
    else {
        Write-Host "Are you sure you want to publish to Marketplace? (Y/N)" -ForegroundColor Yellow
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
vsce publish