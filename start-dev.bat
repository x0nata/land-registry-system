@echo off
echo Starting Land Registry System Development Environment...
echo.
echo Port Configuration:
echo - Land Officer Frontend: http://localhost:3000
echo - User Frontend:         http://localhost:3002
echo - Unified Backend:       https://land-registry-backend-plum.vercel.app
echo.

REM Start Land Officer application
echo Starting Land Officer application...
start "Land Officer" cmd /k "cd landofficer && npm run dev"

REM Wait a moment before starting the next application
timeout /t 3 /nobreak >nul

REM Start User application
echo Starting User application...
start "User" cmd /k "cd user && npm run dev"

echo.
echo Both applications are starting...
echo Check the opened terminal windows for status.
echo.
pause
