@echo off
chcp 65001 >nul
echo ========================================
echo   模块依赖分析器 - 后端启动
echo ========================================
echo.

cd /d "%~dp0backend"

if not exist node_modules (
    echo [INFO] 正在安装后端依赖...
    npm install --no-optional
    if errorlevel 1 (
        echo [ERROR] 依赖安装失败！
        pause
        exit /b 1
    )
)

echo [INFO] 启动后端服务...
echo [INFO] 服务地址: http://localhost:3000
echo [INFO] 按 Ctrl+C 停止服务
echo.

node server.js
pause
