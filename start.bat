@echo off
echo ========================================================
echo Cognate Workspace — Automated Boot Sequence
echo ========================================================

echo.
echo [1/2] Initializing Backend Environment...
start "Cognate Backend" cmd /k "cd backend && pip install -r requirements.txt && python -m uvicorn main:app --reload"

echo [2/2] Initializing Frontend Environment...
start "Cognate Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Both services are now booting in separate terminal windows.
echo Keep those windows open to maintain server uptime.
echo ========================================================
