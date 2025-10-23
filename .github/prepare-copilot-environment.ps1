$ErrorActionPreference = "Stop"
# Write-Host "Environment Variables:"
# Get-ChildItem Env: | ForEach-Object { Write-Host "$($_.Name)=$($_.Value)" }

Write-Host "Node version:"
node --version
Write-Host "NPM version:"
npm --version

Set-Location extension
Write-Host "Install"
npm install        # Install dependencies first time or when package.json changes

Write-host "Build"
npm run webpack  # Webpack in development mode

Write-Host "Validate"
npm run test-compile  # TypeScript compilation check
npm run lint         # ESLint static analysis

Write-Host "Disabling telemetry for when running in this environment"
$env:NAB_DISABLE_TELEMETRY = "true"

Write-Host "Run tests - This will prepare the test environment"

# Check if we can run VS Code tests in this environment
if ($IsLinux) {
    if (!(Get-Command "xvfb-run" -ErrorAction SilentlyContinue)) {
        Write-Host "Installing xvfb for headless testing..."
        sudo apt-get update -qq
        sudo apt-get install -y xvfb
    }
    Write-Host "Linux with xvfb - running tests with virtual display"
    xvfb-run --auto-servernum --server-args="-screen 0 1280x1024x24" npm run test
}
elseif ($IsWindows -or $env:DISPLAY) {
    Write-Host "Display available - running full test suite"
    npm run test         # Run all unit tests
}
else {
    Write-Host "Headless environment detected - skipping VS Code integration tests"
}

