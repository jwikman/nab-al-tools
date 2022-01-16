$ErrorActionPreference = "continue"
Get-ChildItem (Resolve-Path ".") -Recurse # TODO: Remove

$result = node (Resolve-Path ".\extension\dist\cli\CreateDocumentation.js")  2>&1

$stderr = $result.Where( { $_ -is [System.Management.Automation.ErrorRecord] })
$stdout = $result.Where( { $_ -isnot [System.Management.Automation.ErrorRecord] })
$VSCodeDependencyErr = $false
$UsageErr = $false

foreach ($err in $stderr) {
    Write-Host "$($err.Exception.Message)"
    if ($err.Exception.Message.IndexOf("Cannot find module 'vscode'") -ge 0) {
        $VSCodeDependencyErr = $true
    }
}
foreach ($out in $stdout) {
    Write-Host "$($out)"
    if ($out.IndexOf("Usage:") -ge 0) {
        $UsageErr = $true
    }
}
if ($VSCodeDependencyErr) {
    throw "A dependency on vscode is detected. Please refactor code to remove the dependency"
}
else {
    if (!$UsageErr) {
        throw "No usage instruction found in output."
    }
    else {
        Write-Host "------------------------------------------------"
        Write-Host "Output expected ---> OK!"
    }
}
