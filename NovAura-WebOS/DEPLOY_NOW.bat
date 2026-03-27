@echo off
echo ==========================================
echo  NovAura Firebase Deployment
echo ==========================================
echo.

cd /d "%~dp0"

echo Step 1: Building functions...
cd functions
call npm run build
if errorlevel 1 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Deploying to Firebase...
cd ..
call firebase deploy --only functions --project novaura-o-s-63232239-3ee79

echo.
echo ==========================================
if errorlevel 1 (
    echo Deployment failed!
    echo.
    echo Try running: firebase login
) else (
    echo Deployment successful!
    echo.
    echo API Endpoint:
    echo https://us-central1-novaura-o-s-63232239-3ee79.cloudfunctions.net/api
)
echo ==========================================
pause
