@echo off
echo ===============================================================
echo     Starting Modern CareQ Application...
echo ===============================================================
echo.
echo Installing backend dependencies if needed...
cd backend
call npm install
echo.
echo Starting the CareQ Web and API Server...
echo The website will automatically be available at http://localhost:5000
echo.
call node server.js
pause
