@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo 正在检查本地更改...
git status
if !errorlevel! neq 0 (
    echo 错误: git status 执行失败
    pause
    exit /b 1
)

echo 正在添加更改到暂存区...
git add .
if !errorlevel! neq 0 (
    echo 错误: git add 执行失败
    pause
    exit /b 1
)

echo 正在提交更改...
git commit -m "常规更新，完善文档"
if !errorlevel! neq 0 (
    echo 警告: 可能没有新的更改需要提交，或提交失败
    echo 继续执行后续操作...
)

echo 正在拉取远程最新代码...
git pull origin main
if !errorlevel! neq 0 (
    echo 错误: git pull 执行失败
    pause
    exit /b 1
)

echo 正在推送更改到GitHub...
git push origin main
if !errorlevel! neq 0 (
    echo 错误: git push 执行失败
    pause
    exit /b 1
)

echo 操作完成!
pause