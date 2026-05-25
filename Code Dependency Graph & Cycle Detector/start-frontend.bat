@echo off
chcp 65001 >nul
echo ========================================
echo   模块依赖分析器 - 前端启动
echo ========================================
echo.

cd /d "%~dp0frontend"

if not exist node_modules (
    echo [INFO] 正在安装前端依赖...
    npm install
    if errorlevel 1 (
        echo [ERROR] 依赖安装失败！
        pause
        exit /b 1
    )
)

echo [INFO] 启动前端开发服务器...
echo [INFO] 服务地址: http://localhost:4200
echo [INFO] 按 Ctrl+C 停止服务
echo.

call ng serve
pause
