# 多阶段构建 Dockerfile for Web Image Processing App v3.0
# 基于知识图谱最佳实践的现代化Web应用容器化方案

# Stage 1: 依赖安装阶段
FROM node:18-alpine AS deps

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl

# 复制依赖文件
COPY package*.json ./
COPY yarn.lock* ./

# 安装依赖（使用缓存优化）
RUN npm ci --frozen-lockfile --production=false

# Stage 2: 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 从依赖阶段复制node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制源代码
COPY . .

# 设置构建环境变量
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false

# 构建应用（包含PWA、WebAssembly支持）
RUN npm run build

# 生成Service Worker
RUN npm run generate-sw || echo "Service Worker generation skipped"

# Stage 3: 运行时阶段
FROM nginx:1.25-alpine AS runtime

# 安装必要工具和安全更新
RUN apk update && apk add --no-cache \
    curl \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建非root用户
RUN addgroup -g 1001 -S nginx-user && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx-user -g nginx-user nginx-user

# 复制构建产物
COPY --from=builder /app/dist/spa /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx-security.conf /etc/nginx/conf.d/security.conf

# 设置正确的权限
RUN chown -R nginx-user:nginx-user /usr/share/nginx/html && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /var/log/nginx && \
    chown -R nginx-user:nginx-user /etc/nginx/conf.d && \
    chown -R nginx-user:nginx-user /tmp

# 创建必要的目录
RUN mkdir -p /tmp/nginx/client_temp && \
    mkdir -p /tmp/nginx/proxy_temp && \
    mkdir -p /tmp/nginx/fastcgi_temp && \
    mkdir -p /tmp/nginx/uwsgi_temp && \
    mkdir -p /tmp/nginx/scgi_temp

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# 添加启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 切换到非root用户
USER nginx-user

# 设置标签
LABEL maintainer="Web Image Processing App" \
      version="3.0" \
      description="基于知识图谱最佳实践的高性能图像处理Web应用" \
      org.opencontainers.image.source="https://github.com/your-repo/web-image-processor"

# 启动应用
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]