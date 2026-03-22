@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM =============================================================================
REM Ralph 自主执行循环 - 山信二手平台 (Windows 版本)
REM 基于 Ralph 官方模式：迭代计数 + 状态跟踪 + 电路断路器
REM =============================================================================

REM 初始化配置
set MAX_ITERATIONS=%~1
if "%MAX_ITERATIONS%"=="" set MAX_ITERATIONS=100

set DELAY_SECONDS=3
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..
set LOG_DIR=%SCRIPT_DIR%logs
set STATE_FILE=%SCRIPT_DIR%.ralph-state.json

REM 创建日志目录
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM =============================================================================
REM 状态管理
REM =============================================================================

set ITERATION=0
set START_TIME=%DATE% %TIME%

REM 读取状态文件
if exist "%STATE_FILE%" (
    for /f "tokens=2 delims=:" %%a in ('findstr "iteration" "%STATE_FILE%"') do set ITERATION=%%a
)

REM =============================================================================
REM 主循环
REM =============================================================================

echo.
echo ╔════════════════════════════════════════════════╗
echo ║     Ralph 自主执行循环 - 山信二手平台          ║
echo ╠════════════════════════════════════════════════╣
echo ║     最大迭代次数：%MAX_ITERATIONS%                          ║
echo ║     延迟时间：%DELAY_SECONDS%s                            ║
echo ╚════════════════════════════════════════════════╝
echo.

echo [%DATE% %TIME%] Ralph 循环启动 (PID: %%)
echo.

:loop
if %ITERATION% GEQ %MAX_ITERATIONS% (
    echo.
    echo 已达到最大迭代次数 %MAX_ITERATIONS%，循环结束
    goto :end
)

set /a ITERATION+=1

REM 保存状态
echo { > "%STATE_FILE%"
echo   "iteration": %ITERATION%, >> "%STATE_FILE%"
echo   "startTime": "%START_TIME%", >> "%STATE_FILE%"
echo   "lastUpdate": "%DATE% %TIME%" >> "%STATE_FILE%"
echo } >> "%STATE_FILE%"

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo [%DATE% %TIME%] 开始第 %ITERATION%/%MAX_ITERATIONS% 次 Ralph 迭代
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM 步骤 1: 生成任务
echo 步骤 1/2: 生成任务...
call node "%PROJECT_ROOT%\scripts\ralph-loop.mjs"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] 任务生成失败，退出码：%ERRORLEVEL%
    goto :end
)

REM 检查是否所有任务已完成
if exist "%SCRIPT_DIR%current-task.md" (
    findstr /C:"所有用户故事已完成" "%SCRIPT_DIR%current-task.md" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo [SUCCESS] 所有任务已完成!
        goto :end
    )
)

REM 步骤 2: 执行任务
echo.
echo 步骤 2/2: 执行任务...

if exist "%SCRIPT_DIR%current-task.md" (
    REM 记录任务日志
    set TASK_LOG=%LOG_DIR%\claude_output_%DATE:~0,4%-%DATE:~5,2%-%DATE:~8,2%_%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%.log
    echo 任务开始：%DATE% %TIME% >> "%TASK_LOG%"
    echo --- >> "%TASK_LOG%"

    echo [%DATE% %TIME%] 正在调用 Claude Code 执行任务...
    claude -p "%SCRIPT_DIR%current-task.md" >> "%TASK_LOG%" 2>&1

    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Claude Code 执行失败，退出码：%ERRORLEVEL%
    ) else (
        echo [SUCCESS] 任务执行完成
    )

    echo --- >> "%TASK_LOG%"
    echo 任务结束：%DATE% %TIME% >> "%TASK_LOG%"
) else (
    echo [ERROR] 未找到当前任务文件
)

REM 等待下一轮
echo.
echo [%DATE% %TIME%] 等待 %DELAY_SECONDS% 秒后继续下一轮...
timeout /t %DELAY_SECONDS% /nobreak >nul

goto :loop

:end
echo.
echo ╔════════════════════════════════════════════════╗
echo ║     Ralph 循环结束                             ║
echo ╠════════════════════════════════════════════════╣
echo ║     总迭代次数：%ITERATION%                            ║
echo ║     启动时间：%START_TIME%                  ║
echo ║     结束时间：%DATE% %TIME%                  ║
echo ╚════════════════════════════════════════════════╝
echo.

echo [%DATE% %TIME%] Ralph 循环结束

REM 保存最终状态
echo { > "%STATE_FILE%"
echo   "iteration": %ITERATION%, >> "%STATE_FILE%"
echo   "startTime": "%START_TIME%", >> "%STATE_FILE%"
echo   "lastUpdate": "%DATE% %TIME%", >> "%STATE_FILE%"
echo   "status": "completed" >> "%STATE_FILE%"
echo } >> "%STATE_FILE%"

pause
