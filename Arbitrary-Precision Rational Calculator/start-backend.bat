@echo off
echo ========================================
echo  启动后端服务器
echo ========================================
cd /d "%~dp0\backend"
echo.
echo 后端服务器将在 http://localhost:3001 启动
echo.
call npm run dev
pause
