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

### 在线体验

您可以直接访问该项目的GitHub主页，以获取最新的代码和文档：
[https://github.com/aqbjqtd/web-image-processor](https://github.com/aqbjqtd/web-image-processor)

### 开发环境

```bash
# 1. 克隆项目
git clone https://github.com/aqbjqtd/web-image-processor.git
cd web-app

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

## 🐳 Docker 部署指南

本项目已完全容器化，您可以通过Docker或Docker Compose轻松部署。在开始之前，请先将 `.env.example` 文件复制为 `.env`，并根据需要修改其中的配置。

### 方法一：使用 Docker Compose (推荐)

这是最简单、最推荐的部署方式。只需一条命令即可启动整个应用。

```bash
# 基础部署（仅包含主应用）
docker-compose up -d

# 部署包含监控套件（Prometheus + Grafana）
docker-compose --profile monitoring up -d

# 部署包含Traefik反向代理
docker-compose --profile traefik up -d

# 部署完整应用（所有服务）
docker-compose --profile monitoring --profile traefik up -d
```

启动后，应用将运行在 `http://localhost:8080`。 Traefik 面板在 `http://localhost:8081`，Grafana 在 `http://localhost:3000`。

**其他 `docker-compose` 命令:**

- `docker-compose down`: 停止并移除容器。
- `docker-compose logs -f`: 查看实时日志。
- `docker-compose pull`: 拉取最新镜像。
- `docker-compose build`: 强制重新构建镜像。

### 方法二：使用原生 Docker 命令

如果您希望手动控制构建和运行过程，可以遵循以下步骤：

**1. 构建Docker镜像**

```bash
# 在项目根目录下执行
npm run docker:build
```

**2. 运行Docker容器**

```bash
# 将容器的8080端口映射到主机的8080端口
npm run docker:run
```

启动后，应用同样会运行在 `http://localhost:8080`。

## 📦 主要命令

- `npm run dev`: 启动开发服务器
- `npm run build`: 构建生产版本
- `npm test`: 运行单元测试
- `npm run lint`: 代码风格检查
- `npm run format`: 代码格式化

## 🔒 隐私与安全

我们郑重承诺，您的所有数据和图片都**不会离开您的电脑**。所有处理过程都在您的浏览器本地完成，我们不收集任何用户信息。这是一个完全值得信赖的客户端工具。

## 🤝 贡献指南

我们欢迎任何形式的贡献！如果您有好的想法或建议，请随时提交Pull Request或开启一个Issue。

1. Fork项目
2. 创建特性分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'feat: Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交Pull Request

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。
