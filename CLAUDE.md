# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于Vue.js 3和Quasar Framework构建的现代化Web图像处理工具，专注于客户端隐私保护和高性能处理。

### 核心特性
- 100%客户端处理，无任何数据上传
- WebAssembly和Web Workers集成
- PWA支持，可离线使用
- 多格式图像处理（JPEG、PNG、WebP、AVIF等）

## 开发命令

### 基础开发命令
- `npm run dev` - 启动开发服务器（端口9000）
- `npm run build` - 构建生产版本
- `npm run serve` - 本地预览构建版本

### 代码质量检查
- `npm run lint` - ESLint代码检查
- `npm run format` - Prettier代码格式化
- `npm run test` - 运行单元测试（Vitest）
- `npm run generate-sw` - 生成Service Worker文件

### Docker部署
- `npm run docker:build` - 构建Docker镜像
- `npm run docker:run` - 运行Docker容器（端口59000）
- `npm run docker:compose` - 使用docker-compose启动
- `npm run docker:compose:down` - 停止docker-compose服务

### 进程清理命令
- `npm run cleanup` - 清理指定端口的进程
- `npm run cleanup:all` - 清理所有相关进程
- `npm run cleanup:enhanced` - 增强清理功能
- `npm run cleanup:enhanced-all` - 完整清理

## 架构说明

### 前端框架
- **Vue 3 Composition API** - 主要前端框架
- **Quasar Framework** - UI组件库，提供Material Design界面
- **Pinia** - 状态管理
- **Vue Router** - 路由管理

### 核心技术栈
- **WebAssembly (WASM)** - 高性能图像处理
- **Web Workers** - 多线程处理，避免UI阻塞  
- **Canvas API** - 基础图像处理和渲染
- **PWA技术** - Service Worker + Workbox实现离线功能

### 项目结构
```
src/
├── utils/
│   ├── ImageProcessor.js    # 主要图像处理类，集成WASM和Canvas
│   └── WasmManager.js      # WASM模块管理器
├── workers/
│   └── imageWorker.js      # Web Worker图像处理
├── pages/
│   └── IndexPage.vue       # 主页面，包含上传和处理界面
├── layouts/
│   └── MainLayout.vue      # 应用布局
└── App.vue                 # 根组件
```

### 核心组件说明

#### ImageProcessor.js (`src/utils/`)
- 主要图像处理类，支持Canvas和WASM两种处理模式
- 批量处理功能，支持并发处理
- 智能质量优化，根据文件大小限制自动调整
- 多种调整模式：拉伸、保持比例填充、保持比例裁剪

#### WasmManager.js (`src/utils/`)  
- 管理WebAssembly模块的加载、初始化和生命周期
- 支持异步模块加载和内存管理
- 错误处理和降级机制

#### imageWorker.js (`src/workers/`)
- 独立线程图像处理，避免阻塞主UI
- 支持OffscreenCanvas和ImageData处理
- 集成WASM支持和颜色调整功能

### 配置文件

#### quasar.config.js
- 包含优雅退出处理机制，确保进程正确清理
- PWA配置，支持Service Worker
- Vite构建配置，包含WebAssembly优化
- 开发服务器配置（默认端口9000）

#### 进程管理
项目集成了完善的进程清理机制：
- 自动监听退出信号（SIGINT、SIGTERM等）
- Windows特殊处理，支持控制台关闭事件
- 超时强制退出，防止进程僵死
- 清理脚本自动化处理

## 开发注意事项

### 隐私保护原则
- 所有图像处理必须在客户端完成
- 禁止添加任何网络上传功能
- 确保FileReader API仅用于本地文件读取

### 性能优化
- 使用WebAssembly优先处理大图像
- Web Workers用于批量处理
- 图像质量智能调整，满足文件大小限制

### 错误处理
- 优雅降级：WASM失败时自动切换到Canvas
- 完整的错误边界处理
- 用户友好的错误提示

### 测试和构建
- 使用Vitest进行单元测试
- ESLint + Prettier确保代码质量
- Docker多阶段构建优化

### PWA功能
- Workbox Service Worker自动生成
- 支持离线使用
- 可安装到桌面

## 常见问题

### 开发服务器问题
如果遇到端口占用，使用清理命令：`npm run cleanup:enhanced`

### WASM模块加载失败
系统会自动降级到Canvas处理，确保功能正常

### 内存使用过高
检查图像批量处理的并发数量，默认限制为4个并发

### 容器启动问题
如果Docker容器启动失败，请检查端口59000是否被占用

### 部署访问地址
- 开发环境：http://localhost:9000
- Docker部署：http://localhost:59000
- 健康检查：http://localhost:59000/health

### DockerHub镜像
项目镜像已推送至DockerHub：
- 镜像名称：`aqbjqtd/web-image-processor:latest`
- 直接使用：`docker pull aqbjqtd/web-image-processor:latest`

## 系统要求

- Node.js >= 18.0.0
- npm >= 8.19.0 或 yarn >= 1.21.1
- 支持WebAssembly的现代浏览器

## 关键依赖

### 核心框架
- Vue 3.5.18 - 主要前端框架
- Quasar 2.18.2 - UI组件库和构建工具
- Pinia 2.3.1 - 状态管理

### 图像处理相关
- file-saver 2.0.5 - 文件下载功能
- workbox-window 7.3.0 - PWA功能
- idb 7.1.1 - IndexedDB操作