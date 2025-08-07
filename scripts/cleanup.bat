@echo off
chcp 65001
setlocal enabledelayedexpansion

echo 正在清理端口9000...
echo.

REM 查找占用9000端口的进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :9000 ^| findstr LISTENING') do (
    set PID=%%a
    echo 发现占用端口9000的进程: PID !PID!
    
    REM 获取进程名称
    for /f "tokens=1" %%b in ('tasklist /FI "PID eq !PID!" /FO TABLE /NH') do (
        echo 进程名称: %%b
    )
    
    REM 终止进程
    echo 正在终止进程...
    taskkill /F /PID !PID!
    
    if !errorlevel! equ 0 (
        echo 成功终止进程 !PID!
    ) else (
        echo 终止进程 !PID! 失败
    )
    echo.
)

REM 检查是否还有node进程
set NODE_COUNT=0
for /f "skip=1" %%a in ('tasklist ^| findstr /I node.exe') do (
    set /a NODE_COUNT+=1
)

if !NODE_COUNT! gtr 0 (
    echo 发现 !NODE_COUNT! 个node进程
    echo 是否清理所有node进程？(Y/N)
    set /p CLEANUP=
    if /i "!CLEANUP!"=="Y" (
        echo 正在清理所有node进程...
        taskkill /F /IM node.exe
        echo 清理完成
    )
) else (
    echo 没有发现node进程
)

echo.
echo 清理完成！
echo 按任意键退出...
pause >nul