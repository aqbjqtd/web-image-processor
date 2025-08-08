#!/bin/bash

# VPS部署脚本 - 低配服务器优化版
# 适用于512MB-1GB内存的VPS

set -e

echo "🚀 开始部署Web图像处理工具到VPS..."

# 检查系统资源
echo "📊 检查系统资源..."
FREE_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $7}')
TOTAL_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')

echo "总内存: ${TOTAL_MEMORY}MB"
echo "可用内存: ${FREE_MEMORY}MB"

if [ "$TOTAL_MEMORY" -lt 512 ]; then
    echo "⚠️  警告: 系统内存少于512MB，建议升级VPS配置"
    exit 1
fi

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    echo "安装命令: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    echo "安装命令: sudo apt-get install docker-compose-plugin"
    exit 1
fi

# 清理旧容器和镜像（释放空间）
echo "🧹 清理旧资源..."
docker container prune -f || true
docker image prune -f || true

# 检查可用磁盘空间
AVAILABLE_SPACE=$(df -BM . | awk 'NR==2 {print $4}' | sed 's/M//')
if [ "$AVAILABLE_SPACE" -lt 1000 ]; then
    echo "⚠️  警告: 可用磁盘空间少于1GB (${AVAILABLE_SPACE}MB)"
    echo "建议清理磁盘空间或使用docker system prune"
fi

# 选择部署方式
if [ "$FREE_MEMORY" -lt 800 ]; then
    echo "🔧 检测到低内存环境 (${FREE_MEMORY}MB)，使用预构建镜像部署..."
    COMPOSE_FILE="docker-compose.low-resource.yml"
    
    # 拉取预构建镜像
    echo "📦 拉取预构建镜像..."
    docker pull aqbjqtd/web-image-processor:latest
    
else
    echo "🔧 使用标准部署方式..."
    COMPOSE_FILE="docker-compose.yml"
fi

# 创建必要目录
mkdir -p logs

# 设置环境变量
export APP_PORT=${APP_PORT:-59000}
export TZ=${TZ:-Asia/Shanghai}

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose -f "$COMPOSE_FILE" down 2>/dev/null || true

# 启动服务
echo "🚀 启动服务..."
docker-compose -f "$COMPOSE_FILE" up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🔍 检查服务状态..."
for i in {1..10}; do
    if curl -f "http://localhost:${APP_PORT}/health" &>/dev/null; then
        echo "✅ 服务启动成功!"
        echo "🌐 访问地址: http://$(curl -s ifconfig.me):${APP_PORT}"
        break
    else
        echo "等待服务启动... ($i/10)"
        sleep 5
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ 服务启动失败，请检查日志:"
        docker-compose -f "$COMPOSE_FILE" logs --tail=50
        exit 1
    fi
done

# 显示资源使用情况
echo "📊 当前资源使用:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

echo "🎉 部署完成!"
echo "💡 常用命令:"
echo "  查看日志: docker-compose -f $COMPOSE_FILE logs -f"
echo "  停止服务: docker-compose -f $COMPOSE_FILE down"
echo "  重启服务: docker-compose -f $COMPOSE_FILE restart"