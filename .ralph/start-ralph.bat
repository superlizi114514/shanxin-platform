@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════╗
echo ║     ZB Ralph 快速启动 - 山信二手平台           ║
echo ╚════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

REM 检查 Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 未找到 Node.js
    pause
    exit /b 1
)

REM 检查 Claude CLI
where claude >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] 未找到 Claude CLI
    pause
    exit /b 1
)

set MAX_ITERATIONS=%~1
if "%MAX_ITERATIONS%"=="" set MAX_ITERATIONS=100

echo ✓ Node.js: %node_version%
echo ✓ 最大迭代次数：%MAX_ITERATIONS%
echo.

call ralph-loop.bat %MAX_ITERATIONS%
