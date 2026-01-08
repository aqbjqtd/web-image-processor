# Docker 镜像管理记录

## 镜像信息

### 最新镜像：v1.0.0

**镜像详情**：
- **名称**：aqbjqtd/web-image-processor
- **标签**：v1.0.0
- **大小**：82.8 MB
- **构建日期**：2026-01-09
- **基础镜像**：nginx:alpine（推测）

**构建环境**：
- 平台：Linux/WSL2
- 构建工具：Docker
- 项目路径：/mnt/d/a_project/web-image-processor

**优化措施**：
- 使用 Alpine 基础镜像（轻量级）
- 多阶段构建（如有）
- 静态资源优化

## 使用方式

### 本地构建
```bash
docker build -t aqbjqtd/web-image-processor:v1.0.0 .
```

### 运行容器
```bash
docker run -d -p 9000:80 --name image-processor aqbjqtd/web-image-processor:v1.0.0
```

### 推送到 Docker Hub
```bash
docker push aqbjqtd/web-image-processor:v1.0.0
```

### 从 Docker Hub 拉取
```bash
docker pull aqbjqtd/web-image-processor:v1.0.0
```

## 版本历史

| 版本 | 日期 | 大小 | 变更说明 |
|------|------|------|----------|
| v1.0.0 | 2026-01-09 | 82.8 MB | 初始发布版本 |

## 维护说明

**镜像更新流程**：
1. 更新代码并提交
2. 更新 VERSION.txt
3. 构建新镜像：`docker build -t aqbjqtd/web-image-processor:vx.x.x .`
4. 测试镜像：`docker run -p 9000:80 aqbjqtd/web-image-processor:vx.x.x`
5. 推送到 Docker Hub：`docker push aqbjqtd/web-image-processor:vx.x.x`
6. 更新 git 标签

**清理旧镜像**：
```bash
# 删除本地旧镜像
docker rmi aqbjqtd/web-image-processor:old-version

# 清理悬空镜像
docker image prune -f
```

---

**最后更新**：2026-01-09
