$ErrorActionPreference = "stop"
# Disable Telemetry:
$env:NAB_DISABLE_TELEMETRY = "true"

$CurrentPath = Get-Location
if ((Split-Path -Path $CurrentPath.Path -Leaf).ToLower() -eq "extension" ) {
    Set-Location (Split-Path -Path $CurrentPath.Path -Parent)
}
Write-Host "Running in folder '$(Get-Location)'"

@("mcp/server.js", "cli/RefreshXLF.js", "cli/CreateDocumentation.js") | ForEach-Object {
    Write-Host "Checking '$_' for dependency on vscode module"
    $isCli = $_ -like "cli/*"
    $filePath = (Join-Path (Get-Location) ".\extension\out\$($_)")
    if (!(Test-Path $filePath)) {
        Write-Host "'out\$($_)' not found, recompiling"
        Push-Location
        Set-Location ".\extension"
        npm run test-compile
        Pop-Location
    }
    $filePath = Resolve-Path $filePath

    # Test for dependency on VSCode module:

    $ErrorActionPreference = "continue"
    # Run node with a timeout of 10 seconds (adjust as needed)
    $result = & {
        $job = Start-Job -ScriptBlock { param($file) node $file 2>&1 } -ArgumentList $filePath
        if (Wait-Job $job -Timeout 10) {
            Receive-Job $job
        }
        else {
            Stop-Job $job
            Write-Host "Node process timed out after 10 seconds."
        }
        Remove-Job $job
    }

    $stderr = $result.Where( { $_ -is [System.Management.Automation.ErrorRecord] })
    $stdout = $result.Where( { $_ -isnot [System.Management.Automation.ErrorRecord] })
    $VSCodeDependencyErr = $false
    $UsageErr = $false
    $startingServer = $false

    foreach ($err in $stderr) {
        Write-Host "$($err.Exception.Message)"
        if ($err.Exception.Message.IndexOf("Cannot find module 'vscode'") -ge 0) {
            $VSCodeDependencyErr = $true
        }
    }
    foreach ($out in $stdout) {
        Write-Host "$($out)"
        if ($isCli) {
            if ($out.IndexOf("Usage:") -ge 0) {
                $UsageErr = $true
            }
        }
        else {
            if ($out.TargetObject -like "*Starting NAB AL Tools MCP Server*") {
                $startingServer = $true
            }
        }
    }
    if ($VSCodeDependencyErr) {
        throw "A dependency on vscode is detected. Please refactor code to remove the dependency"
    }
    else {
        if (!$UsageErr -and $isCli) {
            throw "No usage instruction found in output."
        }
        elseif (!$startingServer -and !$isCli) {
            throw "No MCP server started. Please check the MCP server code."
        }
        else {
            Write-Host "------------------------------------------------"
            Write-Host "$($_) checked" -ForegroundColor Green
            Write-Host "Output expected, no dependency on vscode ---> OK!" -ForegroundColor Green
            $Global:LASTEXITCODE = 0 # Clear the exit code from the usage instruction error
        }
    }
}
