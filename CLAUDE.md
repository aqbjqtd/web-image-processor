# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于Vue.js 3和Quasar Framework构建的轻量级Web图像处理工具，专注于客户端隐私保护和最低配置VPS部署。

### 核心特性
- 100%客户端处理，无任何数据上传
- 基于Canvas API的轻量级图像处理
- 支持多格式图像处理（JPEG、PNG、WebP、GIF、BMP等）
- 优化内存使用，适合低配置环境

## 开发命令

### 基础开发命令
- `npm run dev` - 启动开发服务器（端口9000）
- `npm run build` - 构建生产版本
- `npm run serve` - 本地预览构建版本

### 代码质量检查
- `npm run lint` - ESLint代码检查
- `npm run format` - Prettier代码格式化
- `npm run test` - 运行单元测试（Vitest）

## 架构说明

### 前端框架
- **Vue 3 Composition API** - 主要前端框架
- **Quasar Framework** - UI组件库，提供Material Design界面
- **Pinia** - 状态管理
- **Vue Router** - 路由管理

### 核心技术栈
- **Canvas API** - 轻量级图像处理和渲染
- **FileReader API** - 本地文件读取
- **HTML5特性** - 现代浏览器兼容性优化

### 项目结构
```
src/
├── utils/
│   └── ImageProcessor.js    # 轻量级图像处理类，基于Canvas API
├── pages/
│   └── IndexPage.vue       # 主页面，包含上传和处理界面
├── layouts/
│   └── MainLayout.vue      # 应用布局
└── App.vue                 # 根组件
```

### 核心组件说明

#### ImageProcessor.js (`src/utils/`)
- 轻量级图像处理类，基于Canvas API
- 串行批量处理，优化内存使用
- 智能质量优化，根据文件大小限制自动调整
- 多种调整模式：拉伸、保持比例填充、保持比例裁剪
- 支持常见图像格式：JPEG、PNG、WebP、GIF、BMP

### 配置文件

#### quasar.config.js
- Vite构建配置，优化打包体积
- 开发服务器配置（默认端口9000）
- 生产构建优化设置

## 开发注意事项

### 隐私保护原则
- 所有图像处理必须在客户端完成
- 禁止添加任何网络上传功能
- 确保FileReader API仅用于本地文件读取

### 性能优化
- 使用Canvas API进行轻量级图像处理
- 串行处理避免内存溢出
- 图像质量智能调整，满足文件大小限制
- 优化内存使用，适合低配置环境

### 错误处理
- 完整的输入验证和错误边界处理
- 用户友好的错误提示
- 文件格式和大小限制检查

### 测试和构建
- 使用Vitest进行单元测试
- ESLint + Prettier确保代码质量
- 轻量化构建优化

## 常见问题

### 开发服务器问题
如果遇到端口占用，手动终止占用端口9000的进程

### 内存使用优化
项目采用串行处理模式，避免内存溢出，适合低配置环境

### 部署访问地址
- 开发环境：http://localhost:9000

## 系统要求

- Node.js >= 18.0.0
- npm >= 8.19.0 或 yarn >= 1.21.1
- 现代浏览器支持Canvas API

## 关键依赖

### 核心框架
- Vue 3.4.15 - 主要前端框架
- Quasar 2.14.2 - UI组件库和构建工具
- Pinia 2.1.7 - 状态管理

### 图像处理相关
- file-saver 2.0.5 - 文件下载功能