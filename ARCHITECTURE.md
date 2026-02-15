# Web Image Processor - 架构文档

## 📋 概述

本文档描述了 Web Image Processor v1.0.0 的现代化架构设计，包括重构后的模块结构、设计模式和最佳实践。

## 🏗️ 架构目标

### 核心设计原则

- **单一职责原则**: 每个模块专注于特定功能
- **依赖注入**: 松耦合的模块依赖关系
- **可组合性**: Vue 3 Composition API 的灵活复用
- **类型安全**: 完整的 TypeScript 类型覆盖
- **性能优先**: 内存管理和并发处理优化

### 架构优势

- 🔧 **可维护性**: 模块化设计，易于理解和修改
- 🚀 **可扩展性**: 插件化架构，支持功能扩展
- 🧪 **可测试性**: 独立模块，便于单元测试
- 📈 **性能**: 智能缓存和并行处理
- 🛡️ **可靠性**: 类型安全和错误处理

## 📁 项目结构

```
src/
├── composables/           # 可组合逻辑层
│   ├── useFileUpload.ts   # 文件上传逻辑
│   ├── useImageProcessing.ts # 图像处理逻辑
│   └── useErrorHandler.ts # 错误处理逻辑
├── components/            # UI组件层
│   ├── ImageUploader.vue  # 文件上传组件
│   ├── ProcessingPanel.vue # 处理配置面板
│   ├── ImagePreview.vue   # 图像预览组件
│   └── ProcessResults.vue # 处理结果组件
├── utils/                 # 核心工具层
│   ├── ImageProcessor.ts  # 图像处理引擎（单例）
│   ├── WorkerManager.ts   # Web Worker管理器（单例）
│   ├── CompressionEngine.ts # 压缩策略引擎
│   ├── ImageValidator.ts  # 图像验证器
│   ├── CacheManager.ts    # 缓存管理器
│   └── ParallelProcessingManager.ts # 并行处理管理器
├── workers/               # Web Worker
│   └── imageWorker.ts     # 图像处理Worker
└── pages/                 # 页面组件
    ├── IndexPage.vue      # 主页面（简化版）
    ├── SimpleIndex.vue    # 简化版界面
    └── MediumIndex.vue    # 中等复杂度界面
```

## 🧩 架构层次

### 1. 表示层 (Presentation Layer)

**职责**: 用户界面和交互逻辑

- **Pages**: 页面级组件，路由入口
- **Components**: 可复用UI组件
- **Composables**: 响应式状态管理

### 2. 业务逻辑层 (Business Logic Layer)

**职责**: 核心业务逻辑和数据处理

- **CompressionEngine**: 压缩算法和策略
- **ImageValidator**: 文件验证和合规检查
- **ParallelProcessingManager**: 并发处理管理

### 3. 基础设施层 (Infrastructure Layer)

**职责**: 底层服务和工具

- **ImageProcessor**: 图像处理核心引擎
- **WorkerManager**: 多线程处理
- **CacheManager**: 内存和缓存管理

## 🔧 核心模块详解

### Composables (可组合逻辑)

#### `useFileUpload.ts`

**职责**: 文件上传和验证逻辑

```typescript
// 主要功能
-文件拖拽处理 -
  文件选择和文件夹选择 -
  文件格式和大小验证 -
  上传进度管理 -
  错误状态处理;

// 核心API
interface FileUploadComposable {
  files: Ref<File[]>;
  isDragging: Ref<boolean>;
  uploadProgress: Ref<number>;
  errors: Ref<UploadError[]>;

  // 方法
  handleFileUpload: (files: FileList | File[]) => Promise<void>;
  validateFiles: (files: File[]) => ValidationResult[];
  clearFiles: () => void;
}
```

#### `useImageProcessing.ts`

**职责**: 图像处理状态管理

```typescript
// 主要功能
-处理进度跟踪 - 结果状态管理 - 处理配置管理 - 批量处理协调;

// 核心API
interface ImageProcessingComposable {
  isProcessing: Ref<boolean>;
  processedImages: Ref<ProcessedImage[]>;
  processingProgress: Ref<ProcessingProgress>;

  // 方法
  processImages: (files: File[], config: ProcessConfig) => Promise<void>;
  cancelProcessing: () => void;
  getProcessingStats: () => ProcessingStats;
}
```

#### `useErrorHandler.ts`

**职责**: 统一错误处理和用户通知

```typescript
// 主要功能
-错误分类和处理 - 用户友好的错误消息 - 错误恢复建议 - 错误日志记录;

// 核心API
interface ErrorHandlerComposable {
  errors: Ref<ErrorInfo[]>;

  // 方法
  handleError: (error: Error | string, context?: string) => void;
  clearErrors: () => void;
  getErrorRecovery: (error: ErrorInfo) => RecoveryAction[];
}
```

### UI Components

#### `ImageUploader.vue`

**特性**:

- 拖拽上传区域
- 文件选择器
- 文件夹选择器
- 实时文件验证
- 上传进度显示

#### `ProcessingPanel.vue`

**特性**:

- 预设配置选择
- 自定义参数调整
- 实时预览
- 配置验证

#### `ImagePreview.vue`

**特性**:

- 网格/列表视图切换
- 分页显示
- 图像详情查看
- 批量选择操作

#### `ProcessResults.vue`

**特性**:

- 处理统计信息
- 批量下载
- 对比显示
- 历史记录

### Core Utilities

#### `CompressionEngine.ts`

**职责**: 智能压缩策略

```typescript
class CompressionEngine {
  // 核心方法
  optimizeQuality(image: HTMLImageElement, targetSize: number): number;
  selectOptimalFormat(imageData: ImageData, hasTransparency: boolean): string;
  compressWithStrategy(
    image: HTMLCanvasElement,
    strategy: CompressionStrategy,
  ): Blob;

  // 压缩策略
  private readonly strategies = {
    PHOTOGRAPHY: new PhotographyCompression(),
    GRAPHICS: new GraphicsCompression(),
    ICON: new IconCompression(),
  };
}
```

#### `ImageValidator.ts`

**职责**: 全面的文件验证

```typescript
class ImageValidator {
  // 验证规则
  validateFormat(file: File): ValidationResult;
  validateSize(file: File, limits: SizeLimits): ValidationResult;
  validateDimensions(
    image: HTMLImageElement,
    config: DimensionConfig,
  ): ValidationResult;
  validateContent(image: HTMLImageElement): ValidationResult;

  // 安全检查
  scanForMaliciousContent(file: File): Promise<SecurityCheckResult>;
}
```

#### `CacheManager.ts`

**职责**: 智能缓存和内存管理

```typescript
class CacheManager {
  // 缓存策略
  private strategy: CacheStrategy;
  private memoryMonitor: MemoryMonitor;

  // 核心功能
  get(key: string): ProcessedImage | null;
  set(key: string, data: ProcessedImage): void;
  optimize(): void;
  cleanup(): void;

  // 内存管理
  checkMemoryPressure(): MemoryPressure;
  autoCleanup(): void;
}
```

#### `ParallelProcessingManager.ts`

**职责**: 高性能并发处理

```typescript
class ParallelProcessingManager {
  // 并发控制
  private semaphore: Semaphore;
  private taskQueue: TaskQueue;
  private workerPool: WorkerPool;

  // 核心功能
  processConcurrently(
    files: File[],
    config: ProcessConfig,
  ): Promise<TaskResult[]>;
  addTask(file: File, config: ProcessConfig): Promise<TaskResult>;
  pause(): void;
  resume(): void;

  // 性能监控
  getStats(): ProcessingStats;
  getThroughput(): number;
}
```

## 🔄 数据流架构

### 文件处理流程

```
用户上传 → FileValidator → CompressionEngine → CacheManager → 结果展示
    ↓           ↓              ↓               ↓           ↓
  拖拽/选择   格式验证       智能压缩        缓存检查     下载/预览
```

### 并行处理流程

```
文件队列 → 任务分配 → Worker处理 → 结果收集 → 缓存更新
    ↓         ↓         ↓          ↓         ↓
  排序优化   并发控制   Canvas处理  错误处理   内存管理
```

## 🎯 设计模式应用

### 1. 单例模式 (Singleton)

**应用**: `ImageProcessor`, `WorkerManager`
**目的**: 全局唯一实例，资源统一管理

### 2. 工厂模式 (Factory)

**应用**: `CompressionEngine.createStrategy()`
**目的**: 根据图像特征选择最佳压缩策略

### 3. 策略模式 (Strategy)

**应用**: 压缩算法选择
**目的**: 运行时切换处理策略

### 4. 观察者模式 (Observer)

**应用**: 进度通知和状态更新
**目的**: 解耦事件源和处理器

### 5. 装饰器模式 (Decorator)

**应用**: 图像处理增强
**目的**: 动态添加处理功能

## 🔐 类型安全设计

### 接口定义

```typescript
// 核心接口
interface ProcessedImage {
  name: string;
  dataUrl: string;
  originalSize: ImageSize;
  processedSize: ImageSize;
  sizeReduction: number;
}

interface ProcessConfig {
  resizeOption: ResizeOption;
  targetWidth: number;
  targetHeight: number;
  maxFileSize: number;
  format: OutputFormat;
}

// 泛型约束
interface CacheManager<T extends CacheEntry> {
  get<K extends keyof T>(key: K): T[K] | null;
  set<K extends keyof T>(key: K, value: T[K]): void;
}
```

### 类型守卫

```typescript
// 运行时类型检查
function isImageFile(file: File): file is File & { type: ImageMimeType } {
  return VALID_IMAGE_TYPES.includes(file.type as ImageMimeType);
}

function isProcessedImage(obj: unknown): obj is ProcessedImage {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj &&
    "dataUrl" in obj &&
    "sizeReduction" in obj
  );
}
```

## 📊 性能优化策略

### 1. 内存管理

- **智能缓存**: LRU算法 + 内存压力感知
- **分块处理**: 大文件分块，避免内存溢出
- **资源回收**: 及时释放Canvas和ImageBitmap

### 2. 并发优化

- **Worker池**: 复用Worker实例，减少创建开销
- **信号量控制**: 限制并发数，避免资源竞争
- **任务队列**: 优先级调度，大文件优先

### 3. 算法优化

- **二分查找**: 快速定位最优压缩质量
- **复杂度分析**: 基于图像特征的自适应压缩
- **格式选择**: 智能选择最优输出格式

## 🧪 测试策略

### 单元测试覆盖

```
✓ CompressionEngine - 压缩算法测试
✓ ImageValidator - 验证规则测试
✓ CacheManager - 缓存策略测试
✓ ParallelProcessingManager - 并发处理测试
✓ Composables - 响应式逻辑测试
✓ Components - 组件渲染测试
```

### 集成测试

- **端到端流程**: 文件上传 → 处理 → 下载
- **性能测试**: 大批量文件处理
- **兼容性测试**: 多浏览器验证

## 🚀 部署架构

### 构建优化

- **代码分割**: 按路由和功能分割
- **Tree Shaking**: 移除未使用代码
- **压缩优化**: Gzip/Brotli压缩

### 静态部署

```
Nginx/Caddy
├── SPA路由 (Hash模式)
├── 静态资源 (CDN友好)
└── Service Worker (PWA支持)
```

### Docker部署

```dockerfile
# 多阶段构建
Stage 1: Build (Node.js)
Stage 2: Runtime (Nginx Alpine)
```

## 🔮 扩展性设计

### 插件系统

```typescript
interface ImageProcessingPlugin {
  name: string;
  version: string;
  process(
    image: HTMLCanvasElement,
    config: PluginConfig,
  ): Promise<HTMLCanvasElement>;
}

class PluginManager {
  register(plugin: ImageProcessingPlugin): void;
  unregister(name: string): void;
  execute(name: string, image: HTMLCanvasElement): Promise<HTMLCanvasElement>;
}
```

### 配置系统

```typescript
interface AppConfig {
  processing: ProcessingConfig;
  cache: CacheConfig;
  performance: PerformanceConfig;
  ui: UIConfig;
}

class ConfigManager {
  load(path: string): AppConfig;
  save(config: AppConfig): void;
  validate(config: AppConfig): ValidationResult;
}
```

## 📈 监控和调试

### 性能监控

- **处理时间**: 平均/最大处理时间
- **内存使用**: 峰值内存和GC频率
- **吞吐量**: 文件/秒处理能力
- **错误率**: 处理失败率统计

### 调试工具

- **开发者面板**: 实时状态监控
- **性能分析**: 请求时间线和瓶颈识别
- **错误追踪**: 详细错误堆栈和上下文

## 🎚️ 配置最佳实践

### 开发环境

```typescript
const devConfig = {
  processing: {
    enableDebugMode: true,
    enablePerformanceMonitoring: true,
    maxConcurrency: 2,
  },
  cache: {
    maxSize: 50, // MB
    enablePersistence: false,
  },
};
```

### 生产环境

```typescript
const prodConfig = {
  processing: {
    enableDebugMode: false,
    enablePerformanceMonitoring: false,
    maxConcurrency: 4,
  },
  cache: {
    maxSize: 100, // MB
    enablePersistence: true,
  },
};
```

## 🔄 迁移指南

### 从旧版本迁移

1. **配置迁移**: 更新配置格式
2. **API迁移**: 适配新的组件接口
3. **样式迁移**: 更新CSS类名和结构
4. **测试迁移**: 更新测试用例

### 版本兼容性

- **v1.0.x**: 当前稳定版本
- **v0.9.x**: 向后兼容支持
- **v2.0.0**: 主要版本更新计划

## 📚 相关文档

- [用户手册](README.md)
- [部署指南](DEPLOY.md)
- [开发指南](CLAUDE.md)
- [API文档](API.md) - 待创建
- [更新日志](CHANGELOG.md) - 待创建

---

**文档版本**: v1.0.0  
**最后更新**: 2026-01-17  
**维护者**: Web Image Processor 开发团队
