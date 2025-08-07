# 现代图像处理工具 v3.0

一款基于现代Web技术构建的高性能、注重隐私的客户端图像处理应用。

## ✨ 功能特性

- **纯客户端处理**: 所有图像处理均在您的浏览器中完成，**100%保护您的隐私**，无需上传任何文件。
- **高性能处理**: 集成 **WebAssembly (WASM)** 和 **Web Workers**，实现接近本机的处理速度，UI流畅不卡顿。
- **现代化界面**: 采用基于Vue.js 3和Quasar Framework的现代化、响应式UI设计，美观易用。
- **批量处理**: 支持一次性处理多张图片，并提供丰富的尺寸和格式调整选项。
- **文件大小控制**: 智能的文件大小限制功能，可设置输出图片的最大文件大小（KB），自动优化图片质量以满足要求。
- **PWA支持**: 可作为渐进式Web应用（PWA）安装到桌面，支持离线使用。
- **多格式支持**: 支持JPEG, PNG, WebP, AVIF, GIF, BMP等多种主流图像格式。

## 🛠️ 技术栈

- **前端框架**: Vue.js 3 + Quasar Framework
- **构建工具**: Vite
- **高性能计算**: WebAssembly (WASM)
- **多线程**: Web Workers
- **PWA**: Service Worker + Workbox
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx

## 🚀 快速开始

### 开发环境

```bash
# 1. 克隆项目
git clone https://github.com/aqbjqtd/web-image-processor.git
cd web-image-processor

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

## 🐳 Docker 部署指南

本项目采用Docker Compose标准override文件模式，提供两种部署方式以适应不同场景。

### 📦 快速部署（推荐给用户使用）

**适用场景**: 生产环境快速部署或用户体验

**特点**:
- 使用Docker Hub预构建镜像 `aqbjqtd/web-image-processor:latest`
- 部署快速，无需本地构建
- 配置简洁，适合生产环境

**使用命令**:
```bash
# 启动服务（默认使用docker-compose.yml）
docker compose up -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止服务
docker compose down
```

**访问地址**: http://localhost:8080

### 🛠️ 开发环境（推荐给开发者使用）

**适用场景**: 开发者需要自定义构建、调试或完整监控环境

**特点**:
- 本地源代码构建，支持实时调试
- 包含完整的监控栈（Prometheus + Grafana）
- 支持Traefik反向代理和SSL
- 支持Redis缓存
- 遵循Docker Compose标准override实践

**使用命令**:
```bash
# 开发环境基础部署
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# 含监控系统
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile monitoring up -d --build

# 含反向代理
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile traefik up -d --build

# 完整开发环境（所有服务）
docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile traefik --profile monitoring --profile cache up -d --build
```

**服务端口**:
- 主应用: http://localhost:8080
- Grafana监控: http://localhost:3000 (admin/admin123)
- Prometheus: http://localhost:9090  
- Traefik仪表板: http://localhost:8081
- Redis: localhost:6379

### 🔧 环境变量配置

创建 `.env` 文件自定义配置：

```bash
# 应用配置
APP_PORT=8080
DOMAIN=localhost
TZ=Asia/Shanghai

# 监控配置
GRAFANA_PASSWORD=your_secure_password
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000

# Traefik配置
TRAEFIK_DASHBOARD_PORT=8081
TRAEFIK_INSECURE=true
ACME_EMAIL=your-email@example.com

# Redis配置
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# 数据存储
DATA_DIR=./data
```

### 🚀 快速使用建议

- **用户快速体验**: `docker compose up -d`
- **开发者日常开发**: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build`
- **生产级开发环境**: `docker compose -f docker-compose.yml -f docker-compose.dev.yml --profile traefik --profile monitoring up -d --build`

### ✨ 方案优势

1. **标准化**: 遵循Docker Compose官方override文件最佳实践
2. **简洁性**: 默认命令 `docker compose up -d` 即可快速部署
3. **灵活性**: 开发者可通过组合文件获得完整功能
4. **维护性**: 基础配置和开发配置分离，便于独立维护
5. **扩展性**: 通过profiles支持不同服务组合

## 📦 主要命令

- `npm run dev`: 启动开发服务器
- `npm run build`: 构建生产版本
- `npm test`: 运行单元测试
- `npm run lint`: 代码风格检查
- `npm run format`: 代码格式化

## 🔒 隐私与安全

您的所有数据和图片都**不会离开您的电脑**。所有处理过程都在您的浏览器本地完成，本项目不收集任何用户信息。这是一个完全值得信赖的客户端工具。

### 技术实现保障

- **零网络通信**：代码中无任何上传API调用，无`fetch`/`XMLHttpRequest`等网络请求
- **本地文件处理**：使用浏览器原生`FileReader API`直接读取本地文件到内存
- **客户端计算**：所有图像处理通过HTML5 Canvas和WebAssembly在浏览器内存中完成
- **安全下载**：处理结果通过`URL.createObjectURL()`生成本地下载链接，无任何服务器交互
- **部署验证**：即使在VPS上部署，用户浏览器也仅下载静态资源，所有处理仍在本地进行

## 🤝 贡献指南

欢迎任何形式的贡献！如果您有好的想法或建议，请随时提交Pull Request或开启一个Issue。

1. Fork项目
2. 创建特性分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'feat: Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交Pull Request

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。
