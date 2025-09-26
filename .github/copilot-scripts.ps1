$ErrorActionPreference = "Stop"
Write-Host "Environment Variables:"
Get-ChildItem Env: | ForEach-Object { Write-Host "$($_.Name)=$($_.Value)" }

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

Write-Host "Run tests - This will prepare the test environment"
npm run test         # Run all unit tests

