#!/bin/bash

# Web Image Processor - 快速部署验证脚本
# 验证从 Docker Hub 拉取并部署应用

set -e

# 配置
IMAGE="aqbjqtd/web-image-processor:latest"
CONTAINER_NAME="web-image-processor-test"
PORT="9001"

echo "🚀 Web Image Processor 部署验证脚本"
echo "======================================="
echo "镜像: $IMAGE"
echo "容器: $CONTAINER_NAME"
echo "端口: $PORT"
echo ""

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 清理旧的测试容器
cleanup() {
    log_info "清理旧的测试容器..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# 测试拉取镜像
test_pull() {
    log_info "拉取镜像: $IMAGE"
    docker pull $IMAGE
    log_success "镜像拉取成功"
}

# 测试运行容器
test_run() {
    log_info "启动测试容器..."
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:80 \
        --restart unless-stopped \
        $IMAGE
    
    log_success "容器启动成功"
}

# 测试健康检查
test_health() {
    log_info "等待容器启动..."
    sleep 10
    
    log_info "执行健康检查..."
    if curl -f -s http://localhost:$PORT/ > /dev/null; then
        log_success "健康检查通过 ✓"
        return 0
    else
        log_error "健康检查失败 ✗"
        return 1
    fi
}

# 测试功能
test_functionality() {
    log_info "测试应用功能..."
    
    # 测试首页响应
    response=$(curl -s -w "%{http_code}" http://localhost:$PORT/ | tail -n 1)
    if [ "$response" = "200" ]; then
        log_success "首页访问正常 ✓"
    else
        log_error "首页访问失败 (HTTP $response) ✗"
        return 1
    fi
    
    # 测试静态资源
    css_response=$(curl -s -w "%{http_code}" http://localhost:$PORT/assets/index.b0d8d672.css | tail -n 1)
    if [ "$css_response" = "200" ]; then
        log_success "CSS资源加载正常 ✓"
    else
        log_error "CSS资源加载失败 (HTTP $css_response) ✗"
        return 1
    fi
    
    # 测试JS资源
    js_response=$(curl -s -w "%{http_code}" http://localhost:$PORT/assets/index.eb8c0cd0.js | tail -n 1)
    if [ "$js_response" = "200" ]; then
        log_success "JS资源加载正常 ✓"
    else
        log_error "JS资源加载失败 (HTTP $js_response) ✗"
        return 1
    fi
}

# 显示部署信息
show_info() {
    echo ""
    echo "🎊 部署验证成功！"
    echo "==================="
    echo "📍 访问地址: http://localhost:$PORT"
    echo "📊 容器状态: docker ps | grep $CONTAINER_NAME"
    echo "📋 容器日志: docker logs $CONTAINER_NAME"
    echo "🔧 停止容器: docker stop $CONTAINER_NAME"
    echo "🗑️  删除容器: docker rm $CONTAINER_NAME"
    echo ""
    echo "🌐 在其他设备上访问: http://[您的IP]:$PORT"
    echo "📱 移动端测试: 手机浏览器访问上述地址"
    echo ""
    echo "🎯 功能测试建议:"
    echo "1. 拖拽上传图片文件"
    echo "2. 测试批量处理功能"  
    echo "3. 调整处理参数设置"
    echo "4. 查看处理结果对比"
    echo "5. 测试响应式布局"
}

# 主函数
main() {
    cleanup
    test_pull
    test_run
    test_health
    test_functionality
    show_info
}

# 错误处理
trap cleanup EXIT

# 执行测试
main "$@"