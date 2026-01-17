#!/bin/bash

# Web Image Processor - Docker 部署脚本
# 使用方法: ./deploy.sh [prod|dev] [build|start|stop|restart]

set -e

# 配置变量
COMPOSE_FILE=""
ENVIRONMENT=""
CONTAINER_NAME="web-image-processor"
IMAGE_NAME="web-image-processor"
VERSION="latest"

# 解析参数
if [ "$1" = "prod" ]; then
    ENVIRONMENT="production"
    COMPOSE_FILE="docker-compose.prod.yml"
    CONTAINER_NAME="web-image-processor-prod"
elif [ "$1" = "dev" ]; then
    ENVIRONMENT="development"
    COMPOSE_FILE="docker-compose.dev.yml"
    CONTAINER_NAME="web-image-processor-v2"
else
    echo "❌ 错误: 请指定环境 [prod|dev]"
    echo "使用方法: ./deploy.sh [prod|dev] [build|start|stop|restart]"
    exit 1
fi

if [ -z "$2" ]; then
    echo "❌ 错误: 请指定操作 [build|start|stop|restart]"
    echo "使用方法: ./deploy.sh [prod|dev] [build|start|stop|restart]"
    exit 1
fi

ACTION="$2"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Docker和Docker Compose
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装或不在 PATH 中"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装或不在 PATH 中"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 构建镜像
build_image() {
    log_info "开始构建 Docker 镜像..."
    log_info "环境: $ENVIRONMENT"
    log_info "镜像名: $IMAGE_NAME:$VERSION"
    
    # 构建镜像
    docker build -t "$IMAGE_NAME:$VERSION" .
    
    if [ $? -eq 0 ]; then
        log_success "镜像构建成功"
        
        # 显示镜像信息
        echo ""
        log_info "镜像信息:"
        docker images "$IMAGE_NAME:$VERSION"
    else
        log_error "镜像构建失败"
        exit 1
    fi
}

# 启动容器
start_container() {
    log_info "启动容器..."
    log_info "配置文件: $COMPOSE_FILE"
    log_info "容器名: $CONTAINER_NAME"
    
    # 检查配置文件
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "配置文件 $COMPOSE_FILE 不存在"
        exit 1
    fi
    
    # 启动服务
    docker-compose -f "$COMPOSE_FILE" up -d
    
    if [ $? -eq 0 ]; then
        log_success "容器启动成功"
        
        # 等待容器完全启动
        log_info "等待服务启动..."
        sleep 10
        
        # 检查容器状态
        if docker ps | grep -q "$CONTAINER_NAME"; then
            log_success "容器运行正常"
            
            # 显示状态
            echo ""
            log_info "容器状态:"
            docker ps | grep "$CONTAINER_NAME"
            
            # 健康检查
            echo ""
            log_info "执行健康检查..."
            HEALTH_STATUS=$(docker inspect "$CONTAINER_NAME" | jq -r '.[0].State.Health.Status // "none"')
            
            if [ "$HEALTH_STATUS" = "healthy" ]; then
                log_success "健康检查通过 ✓"
            elif [ "$HEALTH_STATUS" = "starting" ]; then
                log_warning "健康检查进行中... (请稍后检查)"
            else
                log_warning "健康检查状态: $HEALTH_STATUS"
            fi
            
            # 显示访问信息
            echo ""
            log_info "访问信息:"
            echo "🌐 本地访问: http://localhost:9000"
            echo "📊 健康检查: docker logs $CONTAINER_NAME"
            echo "🔧 管理命令: docker-compose -f $COMPOSE_FILE [logs|stop|restart]"
            
        else
            log_error "容器启动失败"
            exit 1
        fi
    else
        log_error "容器启动失败"
        exit 1
    fi
}

# 停止容器
stop_container() {
    log_info "停止容器..."
    
    if docker ps | grep -q "$CONTAINER_NAME"; then
        docker-compose -f "$COMPOSE_FILE" down
        log_success "容器已停止"
    else
        log_warning "容器未运行"
    fi
}

# 重启容器
restart_container() {
    log_info "重启容器..."
    stop_container
    sleep 3
    start_container
}

# 显示日志
show_logs() {
    log_info "显示容器日志..."
    docker logs -f "$CONTAINER_NAME"
}

# 清理资源
cleanup() {
    log_info "清理Docker资源..."
    
    # 停止并删除容器
    docker-compose -f "$COMPOSE_FILE" down -v
    
    # 删除未使用的镜像
    docker image prune -f
    
    # 删除未使用的卷
    docker volume prune -f
    
    log_success "清理完成"
}

# 显示帮助信息
show_help() {
    echo "Web Image Processor - Docker 部署脚本"
    echo ""
    echo "使用方法:"
    echo "  ./deploy.sh [prod|dev] [build|start|stop|restart]"
    echo ""
    echo "环境:"
    echo "  prod    生产环境 (安全优化, 资源限制)"
    echo "  dev     开发环境 (基础配置)"
    echo ""
    echo "操作:"
    echo "  build   构建 Docker 镜像"
    echo "  start   启动容器"
    echo "  stop    停止容器"
    echo "  restart 重启容器"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh prod build    # 构建生产镜像"
    echo "  ./deploy.sh prod start    # 启动生产环境"
    echo "  ./deploy.sh dev start     # 启动开发环境"
    echo "  ./deploy.sh prod restart  # 重启生产环境"
}

# 主逻辑
main() {
    echo "🚀 Web Image Processor Docker 部署脚本"
    echo "=========================================="
    echo "环境: $ENVIRONMENT"
    echo "操作: $ACTION"
    echo ""
    
    check_dependencies
    
    case $ACTION in
        "build")
            build_image
            ;;
        "start")
            start_container
            ;;
        "stop")
            stop_container
            ;;
        "restart")
            restart_container
            ;;
        "logs")
            show_logs
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知操作: $ACTION"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    log_success "操作完成! 🎉"
}

# 执行主函数
main "$@"