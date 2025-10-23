$ErrorActionPreference = "stop"
# Disable Telemetry:
$env:NAB_DISABLE_TELEMETRY = "true"

$CurrentPath = Get-Location
if ((Split-Path -Path $CurrentPath.Path -Leaf).ToLower() -eq "extension" ) {
    Set-Location (Split-Path -Path $CurrentPath.Path -Parent)
}
Write-Host "Running in folder '$(Get-Location)'"

$cliPath = (Join-Path (Get-Location) ".\extension\out\cli\CreateDocumentation.js")
if (!(Test-Path $cliPath)) {
    Write-Host "'out\cli\CreateDocumentation.js' not found, recompiling"
    Push-Location
    Set-Location ".\extension"
    npm run test-compile
    Pop-Location
}
$cliPath = Resolve-Path $cliPath

# Test documentation creation:

$ErrorActionPreference = "stop"
$TestAppFolderPath = Resolve-Path -Path (Join-Path "." "test-app\Xliff-test")
$ToolTipExpectedResultFilePath = Resolve-Path -Path (Join-Path $TestAppFolderPath "ToolTips.md")
$DocsExpectedResultFolderPath = Resolve-Path -Path (Join-Path $TestAppFolderPath "docs")
$WorkspaceFilePath = Resolve-Path (Join-Path "." "test-app\TestApp.code-workspace")

$OutputFolderPath = Join-Path ([System.IO.Path]::GetTempPath()) ([Guid]::NewGuid()).ToString()
$ToolTipFilePath = Join-Path ([System.IO.Path]::GetTempPath()) "$(([Guid]::NewGuid()).ToString())\ToolTips.md"
New-Item -Path $OutputFolderPath -ItemType Directory | Out-Null
New-Item -Path (Split-Path $ToolTipFilePath -Parent) -ItemType Directory | Out-Null

Write-Host "Create Docs files in folder '$OutputFolderPath' and Pages Overview in '$ToolTipFilePath'"
node $cliPath $TestAppFolderPath $OutputFolderPath $WorkspaceFilePath $ToolTipFilePath


function Compare-Files {
    param (
        $FilePath1,
        $FilePath2
    )
    $Content1 = (Get-Content $FilePath1 -Encoding UTF8)
    $Content2 = (Get-Content $FilePath2 -Encoding UTF8)

    if ($Content1.Length -ne $Content2.Length) {
        throw "Unexpected line count of $FilePath1. Current: $($Content1.Length). Expected: $($Content2.Length)"
    }
    for ($i = 0; $i -lt $Content1.Count; $i++) {
        $l1 = $Content1[$i]
        $l2 = $Content2[$i]
        if ($l1 -ne $l2) {
            throw "Unexpected line content of file '$FilePath1', line $i.`nCurrent:  '$($l1)'.`nExpected: '$($l2)'"
        }
    }
    Write-Host "File '$(Split-Path $FilePath1 -Leaf)' checked"
}

# Check content of ToolTips:
Compare-Files -FilePath1 $ToolTipFilePath -FilePath2 $ToolTipExpectedResultFilePath


# Check contents of all md files:
$DocsFiles = Get-ChildItem -Path $OutputFolderPath -Recurse -Include "*.md", "*.yml"
$CompareDocsFiles = Get-ChildItem -Path $DocsExpectedResultFolderPath -Recurse -Include "*.md", "*.yml"

if ($DocsFiles.Length -ne $CompareDocsFiles.Length) {
    throw "Unexpected number of files. Current: $($DocsFiles.Length). Expected: $($CompareDocsFiles.Length)"
}

for ($i = 0; $i -lt $DocsFiles.Count; $i++) {
    $f1 = $DocsFiles[$i]
    $f2 = $CompareDocsFiles[$i]
    $fileName1 = (Split-Path $f1 -Leaf)
    $fileName2 = (Split-Path $f2 -Leaf)
    if ($fileName1 -ne $fileName2) {
        throw "Unexpected filename, file $i. Current: '$($fileName1)'. Expected: '$($fileName2)'"
    }
    Compare-Files -FilePath1 $f1.FullName -FilePath2 $f2.FullName
}
Remove-Item $OutputFolderPath -Recurse -Force
Remove-Item (Split-Path $ToolTipFilePath -Parent) -Recurse -Force



Write-Host "All files OK" -ForegroundColor Green
