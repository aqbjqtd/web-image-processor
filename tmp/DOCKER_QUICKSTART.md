# Docker 镜像快速使用指南

## 镜像信息
```
镜像名称: aqbjqtd/web-image-processor
版本标签: v1.0.0, latest
镜像大小: 23.6 MB (压缩)
```

## 快速启动

### 方法 1: 使用 Docker Compose (推荐)
```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 方法 2: 使用 Docker 命令
```bash
# 启动容器
docker run -d \
  --name web-image-processor \
  --restart unless-stopped \
  -p 59000:80 \
  aqbjqtd/web-image-processor:v1.0.0

# 查看日志
docker logs -f web-image-processor

# 停止容器
docker stop web-image-processor

# 删除容器
docker rm web-image-processor
```

## 访问应用
启动后，在浏览器中访问:
```
http://localhost:59000
```

## 常用操作

### 查看容器状态
```bash
docker ps | grep web-image-processor
```

### 查看健康状态
```bash
docker inspect web-image-processor --format='{{.State.Health.Status}}'
```

### 进入容器 (调试用)
```bash
docker exec -it web-image-processor sh
```

### 查看容器资源使用
```bash
docker stats web-image-processor
```

## 端口映射
- 容器端口: 80
- 主机端口: 59000 (可修改)
- 示例映射: `-p 8080:80` (映射到主机 8080 端口)

## 环境变量
```bash
# 设置时区
-e TZ=Asia/Shanghai

# 其他环境变量 (根据需要添加)
-e NODE_ENV=production
```

## 数据持久化
当前应用为纯静态 SPA，无需数据持久化。

## 日志管理
```bash
# 查看实时日志
docker logs -f web-image-processor

# 查看最近 100 行日志
docker logs --tail 100 web-image-processor

# 查看特定时间范围的日志
docker logs --since 2024-01-01T00:00:00 web-image-processor
```

## 更新镜像
```bash
# 拉取最新版本
docker pull aqbjqtd/web-image-processor:latest

# 停止并删除旧容器
docker stop web-image-processor
docker rm web-image-processor

# 启动新版本
docker run -d \
  --name web-image-processor \
  --restart unless-stopped \
  -p 59000:80 \
  aqbjqtd/web-image-processor:latest
```

## 故障排查

### 容器无法启动
```bash
# 查看容器日志
docker logs web-image-processor

# 检查端口占用
netstat -tln | grep 59000

# 尝试使用不同端口
docker run -d --name web-image-processor -p 59001:80 aqbjqtd/web-image-processor:v1.0.0
```

### 无法访问应用
```bash
# 检查容器状态
docker ps -a | grep web-image-processor

# 检查容器健康状态
docker inspect web-image-processor --format='{{.State.Health.Status}}'

# 检查防火墙设置
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 59000/tcp

# CentOS/RHEL
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=59000/tcp
sudo firewall-cmd --reload
```

### 性能优化
```bash
# 限制内存使用
docker run -d \
  --name web-image-processor \
  --memory="512m" \
  -p 59000:80 \
  aqbjqtd/web-image-processor:v1.0.0

# 设置 CPU 限制
docker run -d \
  --name web-image-processor \
  --cpus="0.5" \
  -p 59000:80 \
  aqbjqtd/web-image-processor:v1.0.0
```

## 生产环境部署建议

### 使用反向代理 (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:59000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 使用 SSL (Let's Encrypt)
```bash
# 安装 certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 使用 Docker Swarm
```yaml
version: '3.8'
services:
  web-image-processor:
    image: aqbjqtd/web-image-processor:v1.0.0
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    ports:
      - "59000:80"
    networks:
      - web-network

networks:
  web-network:
    driver: overlay
```

### 使用 Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-image-processor
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-image-processor
  template:
    metadata:
      labels:
        app: web-image-processor
    spec:
      containers:
      - name: web-image-processor
        image: aqbjqtd/web-image-processor:v1.0.0
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: web-image-processor-service
spec:
  selector:
    app: web-image-processor
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

## 监控和日志

### 使用 Prometheus + Grafana
```yaml
# docker-compose.yml
services:
  web-image-processor:
    image: aqbjqtd/web-image-processor:v1.0.0
    # ...其他配置
  
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
```

## 备份和恢复
当前应用为静态 SPA，无需特殊备份。如需备份:
```bash
# 导出镜像
docker save -o web-image-processor-backup.tar aqbjqtd/web-image-processor:v1.0.0

# 导入镜像
docker load -i web-image-processor-backup.tar
```

## 清理和卸载
```bash
# 停止并删除容器
docker stop web-image-processor
docker rm web-image-processor

# 删除镜像
docker rmi aqbjqtd/web-image-processor:v1.0.0

# 清理未使用的资源
docker system prune -a
```

## 支持和帮助
- GitHub Issues: https://github.com/aqbjqtd/web-image-processor/issues
- Docker Hub: https://hub.docker.com/r/aqbjqtd/web-image-processor

---
**最后更新**: 2026-01-07
**版本**: v1.0.0
