$ErrorActionPreference = "continue"
$cliPath = (Resolve-Path ".\extension\out\cli\CreateDocumentation.js")

$result = node $cliPath  2>&1

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
        Write-Host "Output expected ---> OK!" -ForegroundColor Green
        $Global:LASTEXITCODE = 0 # Clear the exit code from the usage instruction error
    }
}

$TestAppFolderPath = Resolve-Path -Path (Join-Path "." "test-app\Xliff-test")
$OutputFolderPath = Join-Path ([System.IO.Path]::GetTempPath()) ([Guid]::NewGuid()).ToString()
$WorkspaceFilePath = Resolve-Path (Join-Path "." "test-app\TestApp.code-workspace")
$ToolTipFilePath = Join-Path ([System.IO.Path]::GetTempPath()) "$(([Guid]::NewGuid()).ToString())\ToolTips.md"
New-Item -Path $OutputFolderPath -ItemType Directory | Out-Null
New-Item -Path (Split-Path $ToolTipFilePath -Parent) -ItemType Directory | Out-Null

Write-Host "Create Docs files in folder '$OutputFolderPath' and Pages Overview in '$ToolTipFilePath'"
node $cliPath $TestAppFolderPath $OutputFolderPath $WorkspaceFilePath $ToolTipFilePath

# Asserts:

$CompareToolTipFilePath = Resolve-Path -Path (Join-Path "." "test-app\Xliff-test\ToolTips.md")
# TODO: Function that takes two file paths, compares content

$ToolTipContent = (Get-Content $ToolTipFilePath -Encoding UTF8).TrimEnd().TrimStart().Replace('`r', '').Split('`n')
$CompareToolTipContent = (Get-Content $CompareToolTipFilePath -Encoding UTF8).TrimEnd().TrimStart().Replace('`r', '').Split('`n')

if ($ToolTipContent.Length -ne $CompareToolTipContent.Length) {
    throw "Unexpected line count of ToolTip. Current: $($ToolTipContent.Length). Expected: $($CompareToolTipContent.Length)"
}
for ($i = 0; $i -lt $ToolTipContent.Count; $i++) {
    $l1 = $ToolTipContent[$i]
    $l2 = $CompareToolTipContent[$i]
    if ($l1 -ne $l2) {
        throw "Unexpected line content of ToolTip, line $i. Current: '$($l1)'. Expected: '$($l2)'"
    }
}



$CompareDocsFolderPath = Resolve-Path -Path (Join-Path "." "test-app\Xliff-test\docs")
# TODO: Get-ChildItems *.md -recurse - Call above function on all files.