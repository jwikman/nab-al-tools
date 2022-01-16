$ErrorActionPreference = "continue"
$result = node .\dist\cli\CreateDocumentation.js 2>&1

$stderr = $result.Where( { $_ -is [System.Management.Automation.ErrorRecord] })
$VSCodeDependencyErr = $false
#$UsageErr = $false
foreach ($err in $stderr) {
    Write-Host "$($err.Exception.Message)"
    if ($err.Exception.Message.IndexOf("Cannot find module 'vscode'")) {
        $VSCodeDependencyErr = $true
    }
}
if ($VSCodeDependencyErr) {
    throw "A dependency on vscode is detected. Please refactor code to remove the dependency"
}
