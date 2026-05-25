@echo off
echo ========================================
echo  启动前端服务器
echo ========================================
cd /d "%~dp0\frontend"
echo.
echo 前端服务器将在 http://localhost:5173 启动
echo.
call npm run dev
pause
