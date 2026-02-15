---
title: "项目结构说明 - Web Image Processor"
priority: important
type: structure
tags: ["项目结构", "目录组织", "模块划分"]
created_at: "2025-01-06"
updated_at: "2025-01-06"
auto_load: false
summary: "详细说明Web Image Processor的项目结构和目录组织"
---

# 项目结构说明

本文档详细说明 Web Image Processor v3.0 的项目结构和各模块的职责。

## 目录结构概览

```
web-image-processor/
├── src/                        # 源代码目录
│   ├── pages/                  # 页面组件
│   ├── layouts/                # 布局组件
│   ├── utils/                  # 工具类和核心逻辑
│   ├── workers/                # Web Workers
│   ├── router/                 # 路由配置
│   ├── types/                  # TypeScript类型定义
│   ├── components/             # 可复用组件（未来扩展）
│   ├── stores/                 # Pinia状态管理（未来扩展）
│   ├── assets/                 # 静态资源
│   ├── css/                    # 全局样式
│   ├── App.vue                 # 根组件
│   └── main.ts                 # 应用入口
│
├── tests/                      # 测试文件
│   └── unit/                   # 单元测试
│
├── public/                     # 公共静态资源
│   ├── favicon.ico             # 网站图标
│   └── ...                     # 其他静态文件
│
├── .serena/                    # Serena项目管理
│   └── memories/               # 项目记忆
│       ├── project-metadata.md
│       ├── project-overview.md
│       ├── technical-decisions.md
│       └── milestone-*.md
│
├── dist/                       # 构建输出（自动生成）
├── node_modules/               # 依赖包（自动生成）
│
├── .gitignore                  # Git忽略文件
├── .dockerignore               # Docker忽略文件
├── .eslintrc.js                # ESLint配置
├── .eslintrc.json              # ESLint配置（JSON格式）
├── .eslintignore               # ESLint忽略文件
├── .prettierrc                 # Prettier配置
├── .quasar/                    # Quasar配置
├── tsconfig.json               # TypeScript配置
├── quasar.config.js            # Quasar构建配置
├── package.json                # 项目依赖和脚本
├── docker-compose.yml          # Docker编排配置
├── Dockerfile                  # Docker镜像配置
├── index.html                  # HTML入口
├── README.md                   # 项目文档
├── DEPLOY.md                   # 部署文档
├── CLAUDE.md                   # 开发指导
└── LICENSE                     # 许可证
```

---

## 核心目录详解

### 1. src/ - 源代码目录

#### src/pages/ - 页面组件
**职责**: 存放应用的所有页面组件

```
pages/
├── IndexPage.vue       # 主界面（标准版）
├── SimpleIndex.vue     # 简化版界面（低配置环境）
├── MediumIndex.vue     # 中等复杂度界面
├── TestPage.vue        # 测试页面
├── AboutPage.vue       # 关于页面
└── ErrorNotFound.vue   # 404错误页面
```

**组件说明**:
- **IndexPage.vue**: 完整功能的主界面，包含所有处理选项
- **SimpleIndex.vue**: 精简版界面，仅保留核心功能
- **MediumIndex.vue**: 平衡版，功能介于两者之间
- **TestPage.vue**: 用于测试新功能的页面

#### src/layouts/ - 布局组件
**职责**: 应用的布局容器

```
layouts/
└── MainLayout.vue      # 主布局（包含头部、主体、底部）
```

**MainLayout.vue 结构**:
```vue
<template>
  <q-layout view="hHh lpR fFf">
    <q-header>...</q-header>        <!-- 头部导航 -->
    <q-page-container>
      <router-view />                <!-- 页面内容 -->
    </q-page-container>
    <q-footer>...</q-footer>         <!-- 底部信息 -->
  </q-layout>
</template>
```

#### src/utils/ - 工具类
**职责**: 核心业务逻辑和工具函数

```
utils/
├── ImageProcessor.ts    # 核心图像处理类
└── WorkerManager.ts     # Web Worker管理器
```

**ImageProcessor.ts**:
```typescript
export class ImageProcessor {
  // 图像压缩
  async compress(image: HTMLImageElement, quality: number): Promise<Blob>

  // 尺寸调整
  async resize(image: HTMLImageElement, width: number, height: number): Promise<Blob>

  // 格式转换
  async convert(image: HTMLImageElement, format: ImageFormat): Promise<Blob>

  // 智能优化
  async optimize(image: HTMLImageElement, maxSize: number): Promise<Blob>
}
```

**WorkerManager.ts**:
```typescript
export class WorkerManager {
  // 创建Worker
  createWorker(): Worker

  // 处理任务
  processTask(task: ProcessTask): Promise<ProcessResult>

  // 管理队列
  private queue: ProcessTask[]

  // 进度追踪
  private updateProgress(progress: number): void
}
```

#### src/workers/ - Web Workers
**职责**: 后台图像处理线程

```
workers/
└── imageWorker.ts      # 图像处理Worker
```

**imageWorker.ts 功能**:
- 接收主线程发送的图像数据
- 在后台线程执行图像处理
- 返回处理结果给主线程
- 不阻塞UI线程

#### src/router/ - 路由配置
**职责**: 应用的路由管理

```
router/
├── index.ts            # 路由实例
└── routes.ts           # 路由定义
```

**routes.ts**:
```typescript
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'index',
        component: () => import('pages/IndexPage.vue')
      },
      {
        path: 'simple',
        name: 'simple',
        component: () => import('pages/SimpleIndex.vue')
      },
      {
        path: 'medium',
        name: 'medium',
        component: () => import('pages/MediumIndex.vue')
      }
    ]
  }
];
```

#### src/types/ - TypeScript类型定义
**职责**: 全局类型定义

```
types/
└── vue-shim.d.ts       # Vue文件类型声明
```

**vue-shim.d.ts**:
```typescript
declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
```

#### src/main.ts - 应用入口
**职责**: 应用初始化和插件注册

```typescript
import { createApp } from 'vue';
import { Quasar } from 'quasar';
import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(Quasar, {
  config: {}
});

app.use(router);
app.mount('#app');
```

---

### 2. tests/ - 测试目录

```
tests/
└── unit/
    ├── ImageProcessor.test.ts    # ImageProcessor单元测试
    └── WorkerManager.test.ts     # WorkerManager单元测试
```

---

### 3. public/ - 公共静态资源

**职责**: 不经过构建的静态文件

```
public/
├── favicon.ico              # 网站图标
├── robots.txt               # 爬虫配置
└── manifest.json            # PWA清单（未来）
```

---

### 4. 配置文件

#### package.json
**项目元数据和依赖管理**

**关键字段**:
- `name`: modern-image-processor
- `version`: 1.0.0
- `scripts`: 开发和构建脚本
- `dependencies`: 生产依赖
- `devDependencies`: 开发依赖

**核心脚本**:
```json
{
  "scripts": {
    "dev": "quasar dev",
    "build": "quasar build",
    "serve": "quasar serve",
    "test": "vitest run",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx,.vue",
    "format": "prettier --write \"**/*.{js,vue,json,css,scss,md}\""
  }
}
```

#### tsconfig.json
**TypeScript编译配置**

**关键配置**:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "moduleResolution": "node",
    "jsx": "preserve",
    "esModuleInterop": true
  }
}
```

#### quasar.config.js
**Quasar框架配置**

**关键配置**:
```javascript
module.exports = {
  framework: {
    plugins: ['Notify', 'Dialog', 'Loading']
  },
  build: {
    vueRouterMode: 'history',
    extendViteConf(conf) {
      // 自定义Vite配置
    }
  }
};
```

#### Dockerfile
**Docker镜像配置**

**多阶段构建**:
```dockerfile
# 阶段1: 构建
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段2: 运行
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

#### docker-compose.yml
**Docker编排配置**

```yaml
version: '3'
services:
  web:
    build: .
    ports:
      - "9000:80"
    restart: always
```

---

## 模块依赖关系

```
┌─────────────────────────────────────────┐
│          main.ts (应用入口)              │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌────────────┐  ┌──────────────┐
│  router/   │  │   App.vue    │
└──────┬─────┘  └──────┬───────┘
       │               │
       ▼               ▼
┌────────────┐  ┌──────────────┐
│  pages/    │  │  layouts/    │
└──────┬─────┘  └──────────────┘
       │
       ▼
┌────────────┐  ┌──────────────┐
│  utils/    │◄─│ workers/     │
└────────────┘  └──────────────┘
       │
       ▼
┌────────────┐
│   types/   │
└────────────┘
```

---

## 文件命名规范

### TypeScript文件
- **类文件**: PascalCase (例: ImageProcessor.ts)
- **工具文件**: camelCase (例: formatUtils.ts)
- **类型文件**: *.d.ts (例: vue-shim.d.ts)

### Vue文件
- **页面组件**: PascalCase + Page (例: IndexPage.vue)
- **布局组件**: PascalCase + Layout (例: MainLayout.vue)
- **通用组件**: PascalCase (例: ImageCard.vue)

### 配置文件
- **配置文件**: kebab-case (例: quasar.config.js)
- **环境配置**: .env.* (例: .env.production)

---

## 导入路径别名

**配置位置**: tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "components/*": ["src/components/*"],
      "pages/*": ["src/pages/*"],
      "utils/*": ["src/utils/*"],
      "types/*": ["src/types/*"]
    }
  }
}
```

**使用示例**:
```typescript
// 不使用别名
import { ImageProcessor } from '../../../utils/ImageProcessor'

// 使用别名
import { ImageProcessor } from '@/utils/ImageProcessor'
```

---

## 目录扩展规划

### 未来扩展目录

#### src/components/ - 可复用组件
**计划中的组件**:
```
components/
├── ImageCard.vue        # 图片卡片
├── ProgressBar.vue      # 进度条
├── FileDropZone.vue     # 文件拖放区
└── SettingsPanel.vue    # 设置面板
```

#### src/stores/ - Pinia状态管理
**计划中的Store**:
```
stores/
├── processor.ts         # 处理器状态
├── settings.ts          # 用户设置
└── files.ts             # 文件列表状态
```

#### src/composables/ - 组合式函数
**计划中的Composable**:
```
composables/
├── useImageProcess.ts   # 图像处理逻辑
├── useFileUpload.ts     # 文件上传逻辑
└── useWorker.ts         # Worker管理逻辑
```

---

## 最佳实践

### 1. 文件组织
- ✅ 按功能模块组织文件
- ✅ 相关文件放在一起
- ✅ 避免深层嵌套（不超过3层）

### 2. 导入顺序
```typescript
// 1. Vue相关
import { ref, computed } from 'vue';

// 2. 第三方库
import { notify } from 'quasar';

// 3. 内部模块
import { ImageProcessor } from '@/utils/ImageProcessor';

// 4. 类型导入
import type { ProcessOptions } from '@/types';
```

### 3. 组件结构
```vue
<template>
  <!-- 模板内容 -->
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'ComponentName',
  setup() {
    // 组件逻辑
  }
});
</script>

<style lang="scss" scoped>
/* 组件样式 */
</style>
```

---

## 性能优化

### 代码分割
- 路由级别代码分割（动态导入）
- 组件级别懒加载
- Worker文件独立打包

### 构建优化
- Tree-shaking移除未使用代码
- 压缩和混淆
- 资源哈希（缓存策略）

---

**文档版本**: 1.0
**最后更新**: 2025-01-06
**维护者**: Web Image Processor Team
