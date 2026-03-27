@echo off
chcp 65001 >nul
echo ==========================================
echo   NovAura WebOS - Local Development
echo ==========================================
echo.

:: Check if node_modules exists
if not exist "node_modules" (
    echo [1/3] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependencies already installed ✓
)

echo.
echo [2/3] Checking environment...

:: Check for .env file
if not exist ".env" (
    echo Creating default .env file...
    (
        echo VITE_BACKEND_URL=http://localhost:8001
        echo VITE_APP_NAME=NovaAura
        echo VITE_APP_VERSION=1.0.0
    ) > .env
    echo .env created with defaults
) else (
    echo .env file exists ✓
)

echo.
echo [3/3] Starting development server...
echo.
echo ==========================================
echo   Local URLs:
echo   - App:    http://localhost:5173
echo   - Backend must be running on :8001
echo ==========================================
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev

pause
