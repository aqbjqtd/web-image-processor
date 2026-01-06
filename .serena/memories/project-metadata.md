---
title: "项目元数据 - Web Image Processor"
priority: core
type: metadata
tags: ["vue3", "typescript", "image-processing", "quasar", "canvas"]
created_at: "2025-01-06"
updated_at: "2025-01-06"
auto_load: true
summary: "Web Image Processor v3.0 - 现代化客户端图像批量处理工具"
project_id: "web-image-processor"
version: "1.0.0"
status: "active"
---

# Web Image Processor - 项目元数据

## 基本信息

**项目ID**: web-image-processor
**项目名称**: Web Image Processor (轻量级图像处理工具)
**当前版本**: v1.0.0
**项目状态**: ✅ 活跃开发中
**创建时间**: 2024-08-08
**最后更新**: 2025-01-06
**开发语言**: TypeScript
**许可证**: MIT

## 项目概述

一款基于现代Web技术构建的轻量级、注重隐私的客户端图像处理应用，专为低配置VPS环境优化。所有图像处理均在浏览器中完成，100%保护用户隐私。

### 核心特性

- **纯客户端处理**: 所有处理在浏览器本地完成，零网络通信
- **轻量级架构**: 基于 HTML5 Canvas API，内存友好
- **现代化界面**: Vue.js 3 + Quasar Framework，响应式设计
- **批量处理**: 支持多图片串行处理，确保稳定性
- **智能压缩**: 基于图像复杂度的质量优化算法
- **TypeScript支持**: 完整的类型安全保障

## 技术栈

### 前端框架
- **Vue.js**: 3.4.15 (Composition API)
- **Quasar Framework**: 2.14.2 (Material Design UI)
- **TypeScript**: 5.9.2 (严格模式)
- **Pinia**: 2.1.7 (状态管理)
- **Vue Router**: 4.2.5 (路由管理)

### 构建工具
- **Vite**: 2.9.18 (快速构建)
- **@quasar/app-vite**: 1.7.3 (Quasar集成)
- **ESLint**: 8.56.0 (代码检查)
- **Prettier**: 3.2.4 (代码格式化)
- **Vitest**: 1.2.2 (单元测试)

### 图像处理
- **HTML5 Canvas API**: 核心图像处理引擎
- **FileReader API**: 本地文件读取
- **file-saver**: 2.0.5 (文件下载)
- **Web Workers**: 后台图像处理（避免阻塞UI）

### 部署环境
- **Node.js**: >= 18.0.0
- **Docker**: 容器化部署支持
- **Nginx**: 生产环境Web服务器
- **1Panel**: VPS管理平台适配

## 项目结构

```
web-image-processor/
├── src/
│   ├── pages/              # 页面组件
│   │   ├── IndexPage.vue   # 主界面（标准版）
│   │   ├── SimpleIndex.vue # 简化版界面
│   │   ├── MediumIndex.vue # 中等复杂度界面
│   │   └── TestPage.vue    # 测试页面
│   ├── layouts/
│   │   └── MainLayout.vue  # 主布局
│   ├── utils/
│   │   ├── ImageProcessor.ts    # 核心图像处理类
│   │   └── WorkerManager.ts     # Web Worker管理器
│   ├── workers/
│   │   └── imageWorker.ts  # 图像处理Worker
│   ├── router/
│   │   ├── index.ts        # 路由配置
│   │   └── routes.ts       # 路由定义
│   ├── types/
│   │   └── vue-shim.d.ts   # TypeScript声明
│   ├── App.vue             # 根组件
│   └── main.ts             # 应用入口
├── public/                 # 静态资源
├── tests/                  # 测试文件
├── .serena/                # Serena项目管理
│   └── memories/           # 项目记忆
├── dist/                   # 构建输出
├── docker-compose.yml      # Docker编排
├── Dockerfile              # Docker镜像
├── quasar.config.js        # Quasar配置
├── package.json            # 项目依赖
└── tsconfig.json           # TypeScript配置
```

## 核心模块

### 1. ImageProcessor.ts
**职责**: 核心图像处理引擎
- 图像压缩和优化
- 尺寸调整（拉伸/填充/裁剪）
- 格式转换（JPEG/PNG/WebP/GIF/BMP）
- 文件大小控制（智能质量调整）

### 2. WorkerManager.ts
**职责**: Web Worker管理
- 并发控制
- 任务队列管理
- 进度追踪
- 错误处理

### 3. imageWorker.ts
**职责**: 后台图像处理
- 非阻塞图像处理
- 批量处理支持
- 内存优化

### 4. 页面组件
- **IndexPage.vue**: 完整功能界面
- **SimpleIndex.vue**: 简化版（低配置环境）
- **MediumIndex.vue**: 中等复杂度界面

## 性能指标

- **构建大小**: ~290KB (gzip ~110KB)
- **内存使用**: < 50MB（批量处理）
- **处理速度**: 优化算法，快速处理
- **兼容性**: 现代浏览器 ES2021+

## 部署配置

### 开发环境
- **端口**: 9000
- **命令**: `npm run dev`

### 生产环境
- **端口**: 9000 (可配置)
- **命令**: `npm run build && npm run serve`
- **Docker**: `docker-compose up -d`

### VPS要求
- **最低内存**: 512MB
- **推荐内存**: 1GB
- **磁盘空间**: 500MB
- **Node.js**: >= 18.0.0

## Git信息

- **仓库地址**: https://github.com/aqbjqtd/web-image-processor
- **主分支**: main
- **最新标签**: v1.0.0
- **提交历史**: 36+ commits

## 相关资源

- **部署文档**: `/DEPLOY.md`
- **开发指导**: `/CLAUDE.md`
- **GitHub Issues**: https://github.com/aqbjqtd/web-image-processor/issues

## 开发规范

- **代码风格**: ESLint + Prettier
- **类型检查**: TypeScript严格模式
- **提交规范**: Conventional Commits
- **测试覆盖**: Vitest单元测试
- **文档更新**: 同步更新README和技术决策

## 版本历史

### v1.0.0 (当前版本)
- 完成TypeScript迁移
- 重构项目架构
- 优化性能和内存使用
- 添加Web Worker支持
- 适配1Panel平台

### v2.x
- 添加批量处理功能
- 优化压缩算法
- 改进UI/UX

### v1.x
- 初始版本
- 基础图像处理功能
