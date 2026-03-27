@echo off
echo Building NovAura Landing Page...
echo.

REM Build with landing page as entry
call npx vite build --mode landing

echo.
echo Build complete! Deploy with:
echo firebase deploy --config firebase.landing.json --only hosting:novaura-life
echo.
pause
