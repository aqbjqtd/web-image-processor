@echo off
REM Web Image Processor - Docker 部署脚本 (Windows)
REM 使用方法: deploy.bat [prod|dev] [build|start|stop|restart]

setlocal enabledelayedexpansion

REM 配置变量
set COMPOSE_FILE=
set ENVIRONMENT=
set CONTAINER_NAME=web-image-processor
set IMAGE_NAME=web-image-processor
set VERSION=latest

REM 解析参数
if "%1"=="prod" (
    set ENVIRONMENT=production
    set COMPOSE_FILE=docker-compose.prod.yml
    set CONTAINER_NAME=web-image-processor-prod
) else if "%1"=="dev" (
    set ENVIRONMENT=development
    set COMPOSE_FILE=docker-compose.dev.yml
    set CONTAINER_NAME=web-image-processor-v2
) else (
    echo ❌ 错误: 请指定环境 [prod^|dev]
    echo 使用方法: deploy.bat [prod^|dev] [build^|start^|stop^|restart]
    exit /b 1
)

if "%2"=="" (
    echo ❌ 错误: 请指定操作 [build^|start^|stop^|restart]
    echo 使用方法: deploy.bat [prod^|dev] [build^|start^|stop^|restart]
    exit /b 1
)

set ACTION=%2

REM 检查依赖
echo [INFO] 检查依赖...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker 未安装或不在 PATH 中
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose 未安装或不在 PATH 中
    exit /b 1
)

echo [SUCCESS] 依赖检查通过

REM 执行操作
if "%ACTION%"=="build" (
    call :build_image
) else if "%ACTION%"=="start" (
    call :start_container
) else if "%ACTION%"=="stop" (
    call :stop_container
) else if "%ACTION%"=="restart" (
    call :restart_container
) else if "%ACTION%"=="logs" (
    call :show_logs
) else if "%ACTION%"=="cleanup" (
    call :cleanup
) else (
    echo ❌ 未知操作: %ACTION%
    exit /b 1
)

echo.
echo [SUCCESS] 操作完成! 🎉
goto :eof

REM 构建镜像
:build_image
echo [INFO] 开始构建 Docker 镜像...
echo [INFO] 环境: %ENVIRONMENT%
echo [INFO] 镜像名: %IMAGE_NAME%:%VERSION%

docker build -t %IMAGE_NAME%:%VERSION% .
if errorlevel 1 (
    echo ❌ 镜像构建失败
    exit /b 1
)

echo [SUCCESS] 镜像构建成功
echo.
echo [INFO] 镜像信息:
docker images %IMAGE_NAME%:%VERSION%
goto :eof

REM 启动容器
:start_container
echo [INFO] 启动容器...
echo [INFO] 配置文件: %COMPOSE_FILE%
echo [INFO] 容器名: %CONTAINER_NAME%

if not exist "%COMPOSE_FILE%" (
    echo ❌ 配置文件 %COMPOSE_FILE% 不存在
    exit /b 1
)

docker-compose -f %COMPOSE_FILE% up -d
if errorlevel 1 (
    echo ❌ 容器启动失败
    exit /b 1
)

echo [SUCCESS] 容器启动成功

echo [INFO] 等待服务启动...
timeout /t 10 /nobreak >nul

docker ps | findstr "%CONTAINER_NAME%" >nul
if errorlevel 1 (
    echo ❌ 容器启动失败
    exit /b 1
)

echo [SUCCESS] 容器运行正常
echo.
echo [INFO] 容器状态:
docker ps | findstr "%CONTAINER_NAME%"

echo.
echo [INFO] 访问信息:
echo 🌐 本地访问: http://localhost:9000
echo 📊 状态检查: docker ps
echo 🔧 管理命令: docker-compose -f %COMPOSE_FILE% [logs^|stop^|restart]
goto :eof

REM 停止容器
:stop_container
echo [INFO] 停止容器...

docker ps | findstr "%CONTAINER_NAME%" >nul
if errorlevel 1 (
    echo [WARNING] 容器未运行
    goto :eof
)

docker-compose -f %COMPOSE_FILE% down
echo [SUCCESS] 容器已停止
goto :eof

REM 重启容器
:restart_container
echo [INFO] 重启容器...
call :stop_container
timeout /t 3 /nobreak >nul
call :start_container
goto :eof

REM 显示日志
:show_logs
echo [INFO] 显示容器日志...
docker logs -f %CONTAINER_NAME%
goto :eof

REM 清理资源
:cleanup
echo [INFO] 清理Docker资源...

docker-compose -f %COMPOSE_FILE% down -v
docker image prune -f
docker volume prune -f

echo [SUCCESS] 清理完成
goto :eof

REM 显示帮助
:show_help
echo Web Image Processor - Docker 部署脚本 (Windows)
echo.
echo 使用方法:
echo   deploy.bat [prod^|dev] [build^|start^|stop^|restart]
echo.
echo 环境:
echo   prod    生产环境 (安全优化, 资源限制)
echo   dev     开发环境 (基础配置)
echo.
echo 操作:
echo   build   构建 Docker 镜像
echo   start   启动容器
echo   stop    停止容器
echo   restart 重启容器
echo.
echo 示例:
echo   deploy.bat prod build    # 构建生产镜像
echo   deploy.bat prod start    # 启动生产环境
echo   deploy.bat dev start     # 启动开发环境
echo   deploy.bat prod restart  # 重启生产环境
goto :eof