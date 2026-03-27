# NovAura Firebase Deployment Script
# Deploys unified backend (Social + API) to Firebase Functions

param(
    [switch]$BuildOnly,
    [switch]$DeployOnly,
    [switch]$Emulator
)

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NovAura Unified Backend Deployment" -ForegroundColor Cyan
Write-Host "  (Social + Auth + AI + Domains)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check Firebase CLI
if (!(Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Firebase CLI not found. Install with:" -ForegroundColor Red
    Write-Host "   npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}

# Install dependencies
if (!$DeployOnly) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
    npm ci
    
    Write-Host "📦 Installing functions dependencies..." -ForegroundColor Blue
    Push-Location functions
    npm ci
    Pop-Location
}

# Build
if (!$DeployOnly) {
    Write-Host "🔨 Building functions..." -ForegroundColor Blue
    Push-Location functions
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    Pop-Location
}

if ($BuildOnly) {
    Write-Host "✅ Build complete!" -ForegroundColor Green
    exit 0
}

# Set environment variables from .env
Write-Host "🔧 Setting Firebase environment variables..." -ForegroundColor Blue
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($value -and $value -notlike 'your_*' -and $value -notlike 'sk-*' -and $value -notlike '*placeholder*') {
                Write-Host "   Setting $key..." -ForegroundColor Gray
                firebase functions:config:set "$key=$value" --project novaura-o-s-63232239-3ee79 2>$null
            }
        }
    }
}

# Deploy or Emulator
if ($Emulator) {
    Write-Host "🧪 Starting Firebase Emulator..." -ForegroundColor Blue
    firebase emulators:start --only functions --project novaura-o-s-63232239-3ee79
} else {
    Write-Host "🚀 Deploying to Firebase..." -ForegroundColor Blue
    firebase deploy --only functions --project novaura-o-s-63232239-3ee79
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✅ Deployment Successful!" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "  API Endpoint:" -ForegroundColor Cyan
        Write-Host "  https://us-central1-novaura-o-s-63232239-3ee79.cloudfunctions.net/api" -ForegroundColor White
        Write-Host ""
        Write-Host "  Routes:" -ForegroundColor Cyan
        Write-Host "  POST /api/auth/login        - User login" -ForegroundColor Gray
        Write-Host "  POST /api/auth/register     - User signup" -ForegroundColor Gray
        Write-Host "  POST /api/ai/chat           - AI chat (Gemini/Claude/OpenAI/Kimi)" -ForegroundColor Gray
        Write-Host "  POST /api/domains/check     - Check domain availability" -ForegroundColor Gray
        Write-Host "  POST /api/domains/register  - Register domain" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        exit 1
    }
}
