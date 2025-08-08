# VPS低配部署指南

本指南专门针对512MB-1GB内存的低配VPS部署优化。

## 🎯 适用场景

- VPS内存: 512MB - 1GB
- 磁盘空间: 至少2GB可用
- 系统: Ubuntu 18.04+ / CentOS 7+ / Debian 9+

## 🚀 快速部署（推荐）

### 方法1: 使用预构建镜像（最节省资源）

```bash
# 1. 下载部署文件
wget https://raw.githubusercontent.com/aqbjqtd/web-image-processor/main/docker-compose.low-resource.yml

# 2. 直接部署
docker-compose -f docker-compose.low-resource.yml up -d

# 3. 检查状态
docker-compose -f docker-compose.low-resource.yml ps
```

### 方法2: 使用部署脚本

```bash
# 1. 克隆项目
git clone https://github.com/aqbjqtd/web-image-processor.git
cd web-image-processor

# 2. 运行自动部署脚本
chmod +x deploy-vps.sh
./deploy-vps.sh
```

## 🔧 手动部署步骤

### 1. 环境准备

```bash
# 安装Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 重新登录以应用组权限
```

### 2. 系统优化（可选）

```bash
# 创建swap文件（如果内存不足512MB）
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用swap
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. 部署应用

```bash
# 方式A: 使用低配版本（推荐）
docker-compose -f docker-compose.low-resource.yml up -d

# 方式B: 如果VPS配置较好，可尝试标准版本
docker-compose up -d
```

## 📊 资源消耗对比

| 部署方式   | 内存占用 | 构建时间 | 磁盘占用 |
| ---------- | -------- | -------- | -------- |
| 标准部署   | ~512MB   | 5-10分钟 | ~800MB   |
| 低配部署   | ~128MB   | 30秒     | ~200MB   |
| 预构建镜像 | ~64MB    | 10秒     | ~150MB   |

## 🎛️ 配置参数说明

### 低配版本优化项目：

1. **内存限制**: 256MB (标准版512MB)
2. **Worker进程**: 1个 (标准版auto)
3. **连接数**: 512 (标准版2048)
4. **Keepalive时间**: 30s (标准版75s)
5. **Gzip压缩级别**: 4 (标准版6)
6. **缓存策略**: 简化版本

### 环境变量配置：

```bash
# 端口设置
export APP_PORT=59000

# 时区设置
export TZ=Asia/Shanghai

# 内存限制模式
export MEMORY_MODE=low
```

## 🔍 故障排除

### 1. 内存不足错误

```bash
# 检查内存使用
free -h
docker stats

# 创建swap文件
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 2. 构建失败

```bash
# 使用预构建镜像
docker pull aqbjqtd/web-image-processor:latest
docker-compose -f docker-compose.low-resource.yml up -d
```

### 3. 服务无法启动

```bash
# 查看详细日志
docker-compose logs -f

# 检查端口占用
sudo netstat -tulpn | grep :59000

# 重启服务
docker-compose restart
```

### 4. 性能优化

```bash
# 清理Docker缓存
docker system prune -f

# 限制Docker日志大小
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

## 📝 监控命令

```bash
# 查看服务状态
docker-compose ps

# 实时监控资源
docker stats

# 查看应用日志
docker-compose logs -f web-image-processor

# 检查健康状态
curl http://localhost:59000/health
```

## 🌐 访问应用

部署成功后，通过以下地址访问：

```
http://你的VPS-IP:59000
```

## 💡 性能建议

1. **VPS选择**:
   - 推荐1GB内存以上
   - SSD硬盘
   - 至少1Mbps带宽

2. **系统优化**:
   - 关闭不必要的系统服务
   - 配置适当的swap空间
   - 定期清理Docker缓存

3. **应用优化**:
   - 使用CDN加速静态资源
   - 启用Gzip压缩
   - 配置适当的缓存策略

## 🔒 安全建议

1. 配置防火墙只开放必要端口
2. 定期更新系统和Docker
3. 使用非root用户运行
4. 配置SSL证书（可选）

## 📞 技术支持

如果遇到问题，请：

1. 查看部署日志
2. 检查系统资源
3. 尝试重启服务
4. 提交Issue到GitHub仓库
