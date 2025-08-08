# VPS 一键部署指南

## 🚀 快速部署

只需要一个文件即可在VPS上部署图像处理工具！

### 第一步：下载部署文件

```bash
# 下载 docker-compose.yml
wget https://raw.githubusercontent.com/aqbjqtd/web-image-processor/main/docker-compose.yml

# 或者使用 curl
curl -O https://raw.githubusercontent.com/aqbjqtd/web-image-processor/main/docker-compose.yml
```

### 第二步：启动服务

```bash
# 启动服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

### 第三步：访问服务

默认访问地址：`http://你的VPS-IP`

## 🔧 配置选项

### 端口配置

如果需要修改端口，编辑 docker-compose.yml 文件中的 ports 配置：

```yaml
ports:
  - "8080:80"  # 改为 8080 端口访问
```

### 域名配置

如果你有域名并使用 Traefik 反向代理，修改以下配置：

```yaml
labels:
  - "traefik.http.routers.web-image-processor.rule=Host(`your-domain.com`)"
```

将 `your-domain.com` 替换为你的实际域名。

### 资源限制

默认配置适合 512MB 内存的 VPS：

```yaml
deploy:
  resources:
    limits:
      memory: 128M      # 最大内存使用
      cpus: '0.5'       # 最大CPU使用
    reservations:
      memory: 64M       # 保留内存
      cpus: '0.1'       # 保留CPU
```

## 📊 常用命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新到最新版本
docker-compose pull
docker-compose up -d

# 查看资源使用情况
docker stats web-image-processor

# 查看健康检查状态
docker-compose ps
```

## 🔒 安全建议

1. **防火墙设置**：只开放必要的端口（80/443）
2. **反向代理**：建议使用 Nginx 或 Traefik 添加 HTTPS
3. **定期更新**：定期拉取最新镜像版本

## 🛠️ 故障排除

### 端口被占用
```bash
# 检查端口占用
netstat -tlnp | grep :80

# 修改 docker-compose.yml 中的端口映射
```

### 内存不足
```bash
# 降低资源限制
# 在 docker-compose.yml 中修改 memory 配置
```

### 服务无法启动
```bash
# 查看详细日志
docker-compose logs web-image-processor

# 检查磁盘空间
df -h
```

## 📈 性能优化

- **内存使用**：通常只需要 64-128MB 内存
- **启动时间**：首次启动约 10-15 秒（拉取镜像）
- **响应速度**：静态资源响应时间 < 10ms

## 🆕 更新版本

```bash
# 拉取最新镜像
docker-compose pull

# 重新创建容器
docker-compose up -d --force-recreate
```

完成！你的图像处理工具现在已经在 VPS 上运行了。