@echo off
title Cryptonauts - Local Server
color 0A

echo.
echo  ========================================
echo       CRYPTONAUTS - Expedition Crawler
echo  ========================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo.
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

echo [OK] Python found.

:: Set the port
set PORT=8000

:: Check if port is already in use, try alternative ports
netstat -ano | findstr :%PORT% >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Port %PORT% is in use, trying 8080...
    set PORT=8080
    netstat -ano | findstr :%PORT% >nul 2>&1
    if %errorlevel% equ 0 (
        echo [INFO] Port 8080 is in use, trying 8888...
        set PORT=8888
    )
)

echo [OK] Using port %PORT%
echo.

:: Get the directory where this batch file is located
cd /d "%~dp0"

echo [INFO] Starting local web server...
echo [INFO] Game will open in your default browser.
echo.
echo  ----------------------------------------
echo   Game URL: http://localhost:%PORT%/start_screen.html
echo  ----------------------------------------
echo.
echo [INFO] Keep this window open while playing!
echo [INFO] Press Ctrl+C to stop the server when done.
echo.

:: Wait a moment then open the browser
start "" "http://localhost:%PORT%/start_screen.html"

:: Start the Python HTTP server
python -m http.server %PORT%

:: This runs when the server is stopped
echo.
echo [INFO] Server stopped. Thanks for playing Cryptonauts!
pause
