# VPS 部署指南 v3.0

完整的VPS部署解决方案，支持Docker、1Panel平台和传统部署方式。

## 🚀 快速部署（推荐）

### 方案一：Docker Compose部署

只需要一个文件即可在VPS上部署图像处理工具！

#### 第一步：下载部署文件

```bash
# 下载 docker-compose.yml
wget https://raw.githubusercontent.com/aqbjqtd/web-image-processor/main/docker-compose.yml

# 或者使用 curl
curl -O https://raw.githubusercontent.com/aqbjqtd/web-image-processor/main/docker-compose.yml
```

#### 第二步：启动服务

```bash
# 启动服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

#### 第三步：访问服务

默认访问地址：`http://你的VPS-IP`

### 方案二：1Panel平台部署

项目已适配1Panel平台，支持一键部署：

1. 登录1Panel管理面板
2. 进入"应用商店"
3. 搜索"web-image-processor"或上传项目配置
4. 一键安装并启动

### 方案三：手动Docker部署

```bash
# 构建镜像
docker build -t web-image-processor .

# 运行容器
docker run -d \
  --name image-processor \
  -p 9000:80 \
  --restart unless-stopped \
  web-image-processor

# 访问服务
# http://你的VPS-IP:9000
```

## 🔧 配置选项

### 端口配置

修改 docker-compose.yml 文件中的 ports 配置：

```yaml
services:
  web-image-processor:
    ports:
      - "8080:80"  # 改为 8080 端口访问
      - "443:443"  # 如果需要HTTPS
```

### 环境变量

```yaml
environment:
  - NODE_ENV=production
  - PORT=80
  - TZ=Asia/Shanghai  # 时区设置
```

### 域名配置

使用Nginx反向代理配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 资源限制

针对不同VPS配置的推荐设置：

#### 512MB内存VPS
```yaml
deploy:
  resources:
    limits:
      memory: 128M
      cpus: "0.5"
    reservations:
      memory: 64M
      cpus: "0.1"
```

#### 1GB内存VPS
```yaml
deploy:
  resources:
    limits:
      memory: 256M
      cpus: "1.0"
    reservations:
      memory: 128M
      cpus: "0.2"
```

#### 2GB+内存VPS
```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: "2.0"
    reservations:
      memory: 256M
      cpus: "0.5"
```

## 📊 运维命令

### 基础操作
```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 强制重新创建容器
docker-compose up -d --force-recreate

# 查看容器状态
docker-compose ps

# 实时查看日志
docker-compose logs -f web-image-processor
```

### 更新操作
```bash
# 拉取最新镜像
docker-compose pull

# 应用更新并重启
docker-compose up -d

# 清理旧镜像
docker image prune -a
```

### 监控命令
```bash
# 查看资源使用情况
docker stats web-image-processor

# 查看容器详细信息
docker inspect web-image-processor

# 查看镜像信息
docker images | grep web-image-processor
```

### 数据管理
```bash
# 导出容器日志
docker logs web-image-processor > app.log

# 进入容器执行命令
docker exec -it web-image-processor /bin/sh

# 查看容器文件系统
docker exec web-image-processor ls -la /usr/share/nginx/html
```

## 🔒 安全配置

### 防火墙设置
```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### SSL/HTTPS配置

使用Let's Encrypt免费SSL证书：

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 安全头配置

在Nginx配置中添加：

```nginx
# 安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## 🛠️ 故障排除

### 常见问题

#### 1. 端口被占用
```bash
# 检查端口占用
ss -tlnp | grep :80
netstat -tlnp | grep :80

# 终止占用进程
sudo kill -9 <PID>

# 或修改docker-compose.yml中的端口
```

#### 2. 内存不足
```bash
# 检查内存使用
free -h
docker stats

# 优化方案：
# - 降低资源限制
# - 启用swap分区
# - 升级VPS配置
```

#### 3. 磁盘空间不足
```bash
# 检查磁盘使用
df -h

# 清理Docker
docker system prune -a
docker volume prune

# 清理日志
sudo truncate -s 0 /var/log/docker.log
```

#### 4. 容器启动失败
```bash
# 查看详细错误
docker-compose logs web-image-processor

# 检查配置文件
docker-compose config

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

### 网络问题

#### 1. 域名解析问题
```bash
# 检查DNS解析
nslookup your-domain.com
dig your-domain.com

# 检查A记录是否正确指向VPS IP
```

#### 2. 反向代理问题
```bash
# 测试Nginx配置
sudo nginx -t

# 重载Nginx配置
sudo nginx -s reload

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

## 📈 性能优化

### 系统级优化

#### 内存优化
```bash
# 设置swap（如果内存小于2GB）
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用swap
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 网络优化
```nginx
# Nginx gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Docker优化

#### 镜像优化
```dockerfile
# 多阶段构建已实现
# 使用.dockerignore减少构建上下文
# 使用Alpine基础镜像减少大小
```

#### 容器优化
```yaml
# docker-compose.yml优化配置
services:
  web-image-processor:
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 📊 性能指标

### 预期性能表现

| VPS配置 | 内存使用 | CPU使用 | 启动时间 | 响应时间 |
|---------|----------|---------|----------|----------|
| 512MB   | 64-128MB | 5-10%   | 15-20s   | < 50ms   |
| 1GB     | 128-256MB| 3-8%    | 10-15s   | < 30ms   |
| 2GB+    | 256-512MB| 2-5%    | 5-10s    | < 20ms   |

### 监控脚本

创建监控脚本 `monitor.sh`：

```bash
#!/bin/bash
# Web Image Processor 监控脚本

echo "=== 容器状态 ==="
docker-compose ps

echo "=== 资源使用 ==="
docker stats --no-stream web-image-processor

echo "=== 磁盘使用 ==="
df -h

echo "=== 内存使用 ==="
free -h

echo "=== 最近日志 ==="
docker-compose logs --tail=10 web-image-processor
```

## 🔄 备份和恢复

### 配置备份
```bash
# 备份配置文件
tar -czf backup-$(date +%Y%m%d).tar.gz docker-compose.yml

# 上传到远程（可选）
scp backup-*.tar.gz user@backup-server:/path/to/backups/
```

### 快速恢复
```bash
# 恢复配置
tar -xzf backup-20241201.tar.gz

# 重新部署
docker-compose up -d
```

## 🆕 版本更新

### 自动更新脚本

创建 `update.sh`：

```bash
#!/bin/bash
# 自动更新脚本

echo "开始更新 Web Image Processor..."

# 备份当前配置
cp docker-compose.yml docker-compose.yml.backup

# 拉取最新镜像
docker-compose pull

# 重新创建容器
docker-compose up -d --force-recreate

# 清理旧镜像
docker image prune -f

echo "更新完成！"
docker-compose ps
```

### 版本回滚

```bash
# 回滚到指定版本
docker-compose down
docker run -d --name image-processor -p 9000:80 ghcr.io/aqbjqtd/web-image-processor:v2.9.0

# 或恢复备份配置
cp docker-compose.yml.backup docker-compose.yml
docker-compose up -d
```

## 📞 技术支持

如果遇到部署问题：

1. 检查 [故障排除](#故障排除) 部分
2. 查看项目 [Issues](https://github.com/aqbjqtd/web-image-processor/issues)
3. 提交新的Issue并提供：
   - VPS配置信息
   - 错误日志
   - 部署步骤

---

完成！你的图像处理工具现在已经成功部署在 VPS 上了。🎉
