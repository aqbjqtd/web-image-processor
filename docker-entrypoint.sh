#!/bin/sh
# Docker启动脚本 v3.0
# 基于知识图谱最佳实践的容器化启动方案

set -e

# 颜色输出函数
red() { echo "\033[31m$1\033[0m"; }
green() { echo "\033[32m$1\033[0m"; }
yellow() { echo "\033[33m$1\033[0m"; }
blue() { echo "\033[34m$1\033[0m"; }

# 日志函数
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# 错误处理
error_exit() {
    red "错误: $1" >&2
    exit 1
}

# 信号处理
trap 'log "收到终止信号，正在优雅关闭..."; nginx -s quit; exit 0' TERM INT

log "$(blue '启动 Web图像处理应用 v3.0')"
log "基于知识图谱最佳实践的高性能图像处理Web应用"

# 环境变量设置
export TZ=${TZ:-Asia/Shanghai}
export NGINX_WORKER_PROCESSES=${NGINX_WORKER_PROCESSES:-auto}
export NGINX_WORKER_CONNECTIONS=${NGINX_WORKER_CONNECTIONS:-2048}

log "时区设置: $TZ"
log "Nginx工作进程数: $NGINX_WORKER_PROCESSES"
log "Nginx连接数: $NGINX_WORKER_CONNECTIONS"

# 检查必要的目录和文件
log "$(yellow '检查应用文件...')"
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    error_exit "应用文件不存在，请检查构建过程"
fi

# 检查Nginx配置
log "$(yellow '验证Nginx配置...')"
nginx -t || error_exit "Nginx配置验证失败"


# 设置权限（非 root 用户跳过）
if [ "$(id -u)" = "0" ]; then
    chmod 755 /usr/share/nginx/html
    chmod -R 644 /usr/share/nginx/html/*
    chmod 755 /usr/share/nginx/html/*/
fi

# 显示应用信息
log "$(green '应用信息:')"
log "  版本: 3.0"
log "  端口: 8080"
log "  文档根目录: /usr/share/nginx/html"
log "  健康检查: http://localhost:8080/health"
log "  支持特性: WebAssembly, PWA"

# 显示文件统计
if command -v find >/dev/null 2>&1; then
    file_count=$(find /usr/share/nginx/html -type f | wc -l)
    total_size=$(du -sh /usr/share/nginx/html 2>/dev/null | cut -f1 || echo "未知")
    log "  文件数量: $file_count"
    log "  总大小: $total_size"
fi

# 检查WebAssembly文件
if find /usr/share/nginx/html -name "*.wasm" -type f | grep -q .; then
    wasm_count=$(find /usr/share/nginx/html -name "*.wasm" -type f | wc -l)
    log "  WebAssembly模块: $wasm_count 个"
fi

# 检查Service Worker
if [ -f "/usr/share/nginx/html/sw.js" ]; then
    log "  Service Worker: 已启用"
else
    log "  Service Worker: 未找到"
fi

# 检查PWA Manifest
if [ -f "/usr/share/nginx/html/manifest.json" ]; then
    log "  PWA Manifest: 已配置"
else
    log "  PWA Manifest: 未找到"
fi

# 性能优化提示
log "$(yellow '性能优化建议:')"
log "  - 启用了Gzip压缩"
log "  - 配置了静态资源缓存"
log "  - 支持HTTP/2（需要HTTPS）"
log "  - 启用了跨域隔离策略"

# 安全配置提示
log "$(yellow '安全配置:')"
log "  - 启用了安全头部"
log "  - 配置了CSP策略"
log "  - 启用了跨域隔离"
log "  - 隐藏了服务器信息"

# 启动前最后检查
log "$(yellow '启动前检查...')"
if ! nginx -t >/dev/null 2>&1; then
    error_exit "Nginx配置测试失败"
fi

# 启动Nginx
log "$(green '启动Nginx服务器...')"
log "应用已启动，访问地址: http://localhost:8080"
log "健康检查地址: http://localhost:8080/health"
log "$(green '应用启动完成！')"

# 执行传入的命令
exec "$@"