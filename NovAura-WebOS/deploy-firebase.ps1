# NovAura Firebase Deployment Script
# This script deploys all Firebase services for the Social Network

param(
    [switch]$InstallCLI,
    [switch]$Login,
    [switch]$DeployAll,
    [switch]$DeployFunctions,
    [switch]$DeployRules,
    [switch]$SetupOnly
)

$projectId = "novaura-o-s-63232239-3ee79"
$functionsDir = "./functions"

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  NovAura Firebase Deployment" -ForegroundColor Cyan
Write-Host "  Project: $projectId" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
function Test-FirebaseCLI {
    try {
        $version = firebase --version 2>$null
        if ($version) {
            Write-Host "✓ Firebase CLI found: $version" -ForegroundColor Green
            return $true
        }
    } catch {}
    return $false
}

# Install Firebase CLI
if ($InstallCLI -or !(Test-FirebaseCLI)) {
    Write-Host "Installing Firebase CLI..." -ForegroundColor Yellow
    npm install -g firebase-tools
    if (!(Test-FirebaseCLI)) {
        Write-Host "✗ Failed to install Firebase CLI" -ForegroundColor Red
        exit 1
    }
}

# Login to Firebase
if ($Login) {
    Write-Host ""
    Write-Host "Opening Firebase login..." -ForegroundColor Yellow
    firebase login
}

# Set project
Write-Host ""
Write-Host "Setting Firebase project..." -ForegroundColor Yellow
firebase use $projectId

# Setup only mode
if ($SetupOnly) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "Setup complete! Next steps:" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Enable services in Firebase Console:" -ForegroundColor Cyan
    Write-Host "   https://console.firebase.google.com/project/$projectId"
    Write-Host ""
    Write-Host "   Required services:" -ForegroundColor Yellow
    Write-Host "   • Firestore Database" -ForegroundColor White
    Write-Host "   • Authentication (Email/Password + Google)" -ForegroundColor White
    Write-Host "   • Cloud Messaging" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Get FCM VAPID Key:" -ForegroundColor Cyan
    Write-Host "   Project Settings → Cloud Messaging → Web Push certificates"
    Write-Host "   Add to .env: VITE_FCM_VAPID_KEY=your_key"
    Write-Host ""
    Write-Host "3. Then run: .\deploy-firebase.ps1 -DeployAll" -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

# Build and deploy functions
if ($DeployFunctions -or $DeployAll) {
    Write-Host ""
    Write-Host "Building Cloud Functions..." -ForegroundColor Yellow
    
    Push-Location $functionsDir
    
    if (!(Test-Path "node_modules")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    Write-Host "Compiling TypeScript..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Build failed" -ForegroundColor Red
        Pop-Location
        exit 1
    }
    
    Pop-Location
    
    Write-Host ""
    Write-Host "Deploying Cloud Functions..." -ForegroundColor Yellow
    firebase deploy --only functions
}

# Deploy Firestore rules
if ($DeployRules -or $DeployAll) {
    Write-Host ""
    Write-Host "Deploying Firestore Security Rules..." -ForegroundColor Yellow
    firebase deploy --only firestore:rules
    
    Write-Host ""
    Write-Host "Deploying Firestore Indexes..." -ForegroundColor Yellow
    firebase deploy --only firestore:indexes
}

# Full deployment
if ($DeployAll) {
    Write-Host ""
    Write-Host "Deploying Hosting configuration..." -ForegroundColor Yellow
    firebase deploy --only hosting
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Firebase Console: https://console.firebase.google.com/project/$projectId" -ForegroundColor Cyan
Write-Host ""
