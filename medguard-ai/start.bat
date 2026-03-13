@echo off
echo ==========================================
echo   MedGuard AI - Startup Script
echo ==========================================

echo.
echo [1/2] Starting FastAPI Backend (port 8000)...
start "MedGuard Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"

echo.
echo [2/2] Starting React Frontend (port 5173)...
timeout /t 2 /nobreak >nul
start "MedGuard Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==========================================
echo   MedGuard AI is starting up!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173  
echo   API Docs: http://localhost:8000/docs
echo ==========================================

timeout /t 4 /nobreak >nul
start http://localhost:5173
