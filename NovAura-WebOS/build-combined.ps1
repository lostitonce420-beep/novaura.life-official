#!/usr/bin/env pwsh
# Combined build script for NovAura.life
# Builds both WebOS and Platform into a single dist folder

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NovAura.life - Combined Build (WebOS + Platform)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Step 1: Build WebOS (Landing page + OS)
Write-Host "`n[1/4] Building WebOS (Landing + OS)..." -ForegroundColor Yellow
cd $PSScriptRoot
npm run build
if ($LASTEXITCODE -ne 0) { throw "WebOS build failed" }

# Step 2: Build Platform (Marketplace)
Write-Host "`n[2/4] Building Platform (Marketplace)..." -ForegroundColor Yellow
cd "$PSScriptRoot\platform"
npm run build
if ($LASTEXITCODE -ne 0) { throw "Platform build failed" }

# Step 3: Merge platform into dist/platform
Write-Host "`n[3/4] Merging Platform into dist/platform..." -ForegroundColor Yellow
if (Test-Path "$PSScriptRoot\dist\platform") {
    Remove-Item -Recurse -Force "$PSScriptRoot\dist\platform"
}
Copy-Item -Recurse "$PSScriptRoot\platform\dist" "$PSScriptRoot\dist\platform"

# Step 4: Create _redirects for combined routing
Write-Host "`n[4/4] Setting up routing rules..." -ForegroundColor Yellow
$redirects = @"
# NovAura.life - Combined App Routing
# Platform routes (Marketplace, Auth, etc.)
/platform/*  /platform/index.html  200
/login       /platform/index.html  200
/browse      /platform/index.html  200
/domains     /platform/index.html  200
/market      /platform/index.html  200

# WebOS routes
/system      /index.html           200
/os          /index.html           200

# Catch-all (Landing page)
/*           /index.html           200
"@

$redirects | Out-File -FilePath "$PSScriptRoot\dist\_redirects" -Encoding utf8

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  BUILD COMPLETE!" -ForegroundColor Green
Write-Host "  Output: dist/" -ForegroundColor Green
Write-Host "  Deploy: firebase deploy --only hosting:novaura-life" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
