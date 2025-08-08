# 使用轻量级Node.js基础镜像
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖（包括开发依赖以支持构建）
RUN npm ci --silent

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 使用轻量级nginx镜像作为运行时
FROM nginx:alpine

# 复制构建后的文件到nginx目录
COPY --from=builder /app/dist/spa /usr/share/nginx/html

# 创建简单的nginx配置
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # 支持Vue Router的history模式 \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # 静态资源缓存 \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
    \
    # 安全头 \
    add_header X-Frame-Options "SAMEORIGIN" always; \
    add_header X-Content-Type-Options "nosniff" always; \
    add_header X-XSS-Protection "1; mode=block" always; \
}' > /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]