@echo off
title CareQ Startup Manager
color 0B

echo ===============================================================
echo     CareQ Smart Healthcare Flow - Launching System
echo ===============================================================
echo.

:: Check Backend
echo [1/2] Launching Backend API...
cd backend
if not exist "node_modules\" (
    echo Installing backend dependencies for the first time...
    call npm install
)
start "CareQ Backend Server" cmd /c "title CareQ Backend && echo [CareQ Backend API is Running on Port 5000] && echo Do not close this window! && echo. && node server.js"
cd ..

:: Check Frontend
echo [2/2] Launching Frontend React App...
cd frontend
if not exist "node_modules\" (
    echo Installing frontend dependencies for the first time...
    call npm install
)
start "CareQ Frontend App" cmd /c "title CareQ Frontend && echo [CareQ Frontend is Running] && echo Do not close this window! && echo. && npm run dev -- --open"
cd ..

echo.
echo ===============================================================
echo ✅ ALL SYSTEMS GO!
echo.
echo The CareQ dashboard should automatically open in your browser shortly.
echo If it does not, look at the Frontend console for the Local URL.
echo.
echo NOTE: Two background windows were opened. Keep them open while
echo using CareQ. To stop the application, just close those windows.
echo ===============================================================
echo.
pause
