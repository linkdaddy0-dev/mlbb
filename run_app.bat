@echo off
title MythicIQ App - Bootloader
echo ===================================================================
echo                      MYTHICIQ WEB APP
echo ===================================================================
echo.
echo [1/2] Checking project dependencies...
if not exist node_modules (
    echo       Node.js packages not found. Installing now...
    call npm install
) else (
    echo       Dependencies are already installed.
)
echo.
echo [2/2] Launching developer server...
echo       Your default browser will open automatically at http://localhost:3000
echo       (Keep this terminal window open while using the app)
echo.
echo ===================================================================
call npm run dev
pause
