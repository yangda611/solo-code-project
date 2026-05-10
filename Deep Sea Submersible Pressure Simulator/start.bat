@echo off
echo ========================================
echo   深海潜水器耐压舱体压力分析系统
echo   Deep Sea Submersible Pressure Simulator
echo ========================================
echo.

echo [1/3] 检查并安装后端依赖...
if not exist "node_modules" (
    echo 正在安装后端依赖...
    call npm install
) else (
    echo 后端依赖已安装
)

echo.
echo [2/3] 检查并安装前端依赖...
cd client
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
) else (
    echo 前端依赖已安装
)
cd ..

echo.
echo [3/3] 启动服务...
echo.
echo 后端服务将运行在: http://localhost:5000
echo 前端开发服务器将运行在: http://localhost:3000
echo.
echo 请在浏览器中访问: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务
echo ========================================
echo.

call npm run dev

pause
