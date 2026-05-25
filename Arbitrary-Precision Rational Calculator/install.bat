@echo off
echo ========================================
echo  连分数计算器 - 安装脚本
echo ========================================
echo.

echo [1/2] 安装后端依赖...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo 后端依赖安装失败!
    pause
    exit /b 1
)
echo 后端依赖安装完成!
echo.

echo [2/2] 安装前端依赖...
cd ..\frontend
call npm install
if %errorlevel% neq 0 (
    echo 前端依赖安装失败!
    pause
    exit /b 1
)
echo 前端依赖安装完成!
echo.

echo ========================================
echo  安装完成!
echo ========================================
echo.
echo 启动方法:
echo   1. 启动后端: cd backend ^&^& npm run dev
echo   2. 启动前端: cd frontend ^&^& npm run dev
echo.
echo 访问 http://localhost:5173
echo.
pause
