# Web Image Processor - API 文档

## 📋 概述

Web Image Processor 提供了完整的图像处理 API，包括核心处理引擎、工具类、Composables 和组件接口。

## 🔧 核心工具类 API

### ImageProcessor

**单例图像处理引擎**，提供完整的图像处理功能。

```typescript
class ImageProcessor {
  // 获取单例实例
  static getInstance(): ImageProcessor;

  // 核心处理方法
  async processImage(
    file: File,
    config: ProcessImageConfig,
  ): Promise<ProcessedImage>;

  // 批量处理
  async processBatch(
    files: File[],
    config: ProcessImageConfig,
  ): Promise<ProcessedImage[]>;

  // 生命周期管理
  warmup(): Promise<void>;
  cleanup(): void;
  reinitialize(): Promise<void>;
  dispose(): void;

  // 内存管理
  checkAndCleanMemory(): void;

  // 工具方法
  static supportedFormats(): string[];
  static getMaxFileSize(): number;
}
```

**配置接口**:

```typescript
interface ProcessImageConfig {
  resizeOption: "custom" | "original" | "percentage";
  resizePercentage: number;
  targetWidth: number;
  targetHeight: number;
  resizeMode: "keep_ratio_pad" | "keep_ratio_crop" | "stretch";
  maxFileSize: number; // KB
  concurrency?: number;
  useWasm?: boolean;
  format?: "image/jpeg" | "image/png" | "image/webp";
}
```

**返回值**:

```typescript
interface ProcessedImage {
  name: string;
  dataUrl: string;
  originalSize: { width: number; height: number; fileSize: number };
  processedSize: { width: number; height: number; fileSize: number };
  sizeReduction: number; // 百分比
}
```

### WorkerManager

**Web Worker 管理器**，提供多线程图像处理能力。

```typescript
class WorkerManager {
  // 获取单例实例
  static getInstance(): WorkerManager;

  // 支持检测
  checkWorkerSupport(): WorkerSupportInfo;

  // Worker 池管理
  getWorker(): Promise<ImageWorker>;
  releaseWorker(worker: ImageWorker): void;

  // 任务执行
  async executeInWorker(
    file: File,
    config: ProcessImageConfig,
  ): Promise<ProcessedImage>;

  // 资源管理
  terminateAll(): void;
  getActiveWorkers(): number;

  // 超时控制
  executeWithTimeout<T>(task: () => Promise<T>, timeout: number): Promise<T>;
}
```

**支持信息**:

```typescript
interface WorkerSupportInfo {
  offscreenCanvas: boolean;
  imageBitmap: boolean;
  webWorkers: boolean;
  recommendedConcurrency: number;
}
```

### CompressionEngine

**智能压缩引擎**，提供多种压缩策略。

```typescript
class CompressionEngine {
  constructor(config?: CompressionConfig);

  // 核心压缩方法
  async compressImage(
    image: HTMLImageElement,
    targetSize: number,
    options?: CompressionOptions,
  ): Promise<CompressResult>;

  // 质量优化
  async optimizeQuality(
    canvas: HTMLCanvasElement,
    targetSizeBytes: number,
    format: string,
  ): Promise<number>;

  // 格式选择
  async selectOptimalFormat(
    imageData: ImageData,
    hasTransparency: boolean,
    targetSize: number,
  ): Promise<"image/jpeg" | "image/png" | "image/webp">;

  // 复杂度分析
  analyzeImageComplexity(imageData: ImageData): {
    complexity: number;
    isPhotography: boolean;
    recommendedFormat: string;
  };

  // 批量压缩
  async compressBatch(
    images: HTMLImageElement[],
    config: BatchCompressionConfig,
  ): Promise<CompressResult[]>;
}
```

**压缩结果**:

```typescript
interface CompressResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  format: string;
  processingTime: number;
}
```

### ImageValidator

**图像验证器**，提供全面的文件验证功能。

```typescript
class ImageValidator {
  constructor(config?: ValidationConfig);

  // 基础验证
  validateFormat(file: File): ValidationResult;
  validateSize(file: File, limits: SizeLimits): ValidationResult;
  validateDimensions(
    image: HTMLImageElement,
    config: DimensionConfig,
  ): ValidationResult;

  // 高级验证
  validateContent(image: HTMLImageElement): Promise<ContentValidationResult>;
  scanForMaliciousContent(file: File): Promise<SecurityCheckResult>;

  // 批量验证
  validateBatch(files: File[]): Promise<BatchValidationResult>;

  // 自定义规则
  addCustomRule(name: string, rule: ValidationRule): void;
  removeCustomRule(name: string): void;

  // 配置管理
  updateConfig(config: Partial<ValidationConfig>): void;
  getConfig(): ValidationConfig;
}
```

**验证结果**:

```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata?: ValidationMetadata;
}

interface ValidationError {
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion?: string;
}
```

### CacheManager

**智能缓存管理器**，提供内存优化和缓存策略。

```typescript
class CacheManager {
  constructor(config?: CacheConfig);

  // 基础缓存操作
  get(key: string): ProcessedImage | null;
  set(key: string, data: ProcessedImage, ttl?: number): void;
  delete(key: string): boolean;
  clear(): void;

  // 高级缓存
  getWithMetadata(key: string): CacheEntry | null;
  setWithMetadata(
    key: string,
    data: ProcessedImage,
    metadata: CacheMetadata,
  ): void;

  // 缓存策略
  getOptimalCacheSize(): number;
  optimize(): void;
  cleanup(expiredOnly?: boolean): void;

  // 内存管理
  getMemoryUsage(): MemoryUsage;
  checkMemoryPressure(): MemoryPressure;
  enableAutoCleanup(enabled: boolean): void;

  // 统计信息
  getStats(): CacheStats;
  exportCache(): CacheExport;
  importCache(data: CacheExport): void;
}
```

**缓存配置**:

```typescript
interface CacheConfig {
  maxSize: number; // MB
  maxEntries: number; // 最大条目数
  ttl: number; // 生存时间（毫秒）
  strategy: "lru" | "lfu" | "fifo";
  enablePersistence: boolean;
  compressionEnabled: boolean;
  autoCleanup: boolean;
}
```

### ParallelProcessingManager

**并行处理管理器**，提供高性能并发处理能力。

```typescript
class ParallelProcessingManager {
  constructor(cacheManager: CacheManager, config?: ParallelConfig);

  // 任务管理
  addTask(
    file: File,
    config: ProcessImageConfig,
    targetWidth: number,
    targetHeight: number,
  ): Promise<TaskResult>;

  // 批量处理
  async processFiles(
    files: File[],
    config: ProcessImageConfig,
    targetWidth: number,
    targetHeight: number,
  ): Promise<TaskResult[]>;

  // 控制方法
  pause(): void;
  resume(): void;
  stop(): void;
  reset(): void;

  // 状态查询
  getState(): ParallelProcessingState;
  getStats(): ProcessingStats;
  getProgress(): ProcessingProgress;

  // 配置更新
  updateConfig(config: Partial<ParallelConfig>): void;
  getConfig(): ParallelConfig;
}
```

**任务结果**:

```typescript
interface TaskResult {
  success: boolean;
  data?: ProcessedImage;
  error?: string;
  processingTime: number;
  index: number;
  retryCount: number;
}
```

## 🎯 Composables API

### useFileUpload

**文件上传 Composable**，处理文件选择和验证。

```typescript
function useFileUpload(options?: FileUploadOptions): FileUploadComposable;

interface FileUploadComposable {
  // 响应式状态
  files: Ref<File[]>;
  isDragging: Ref<boolean>;
  uploadProgress: Ref<number>;
  errors: Ref<UploadError[]>;

  // 计算属性
  totalFiles: ComputedRef<number>;
  totalSize: ComputedRef<number>;
  validFiles: ComputedRef<File[]>;

  // 方法
  handleFileUpload: (files: FileList | File[]) => Promise<void>;
  handleDrop: (event: DragEvent) => void;
  handleDragOver: (event: DragEvent) => void;
  handleDragLeave: (event: DragEvent) => void;
  selectFiles: (accept?: string, multiple?: boolean) => Promise<File[]>;
  selectFolder: () => Promise<File[]>;
  validateFiles: (files: File[]) => ValidationResult[];
  clearFiles: () => void;
  removeFile: (index: number) => void;
  retryUpload: (file: File) => Promise<void>;

  // 事件处理
  onFilesAdded: (callback: (files: File[]) => void) => void;
  onFileRemoved: (callback: (file: File, index: number) => void) => void;
  onValidationError: (callback: (errors: UploadError[]) => void) => void;
}
```

**配置选项**:

```typescript
interface FileUploadOptions {
  maxFiles?: number;
  maxFileSize?: number; // KB
  allowedTypes?: string[];
  autoValidate?: boolean;
  enableDragDrop?: boolean;
  enableFolderUpload?: boolean;
  validationConfig?: ValidationConfig;
}
```

### useImageProcessing

**图像处理 Composable**，管理处理状态和流程。

```typescript
function useImageProcessing(
  options?: ProcessingOptions,
): ImageProcessingComposable;

interface ImageProcessingComposable {
  // 响应式状态
  isProcessing: Ref<boolean>;
  isPaused: Ref<boolean>;
  processedImages: Ref<ProcessedImage[]>;
  processingProgress: Ref<ProcessingProgress>;
  errors: Ref<ProcessingError[]>;

  // 计算属性
  totalFiles: ComputedRef<number>;
  completedFiles: ComputedRef<number>;
  failedFiles: ComputedRef<number>;
  successRate: ComputedRef<number>;
  averageProcessingTime: ComputedRef<number>;
  totalSizeReduction: ComputedRef<number>;

  // 核心方法
  processImages: (files: File[], config: ProcessImageConfig) => Promise<void>;
  processSingle: (
    file: File,
    config: ProcessImageConfig,
  ) => Promise<ProcessedImage>;
  cancelProcessing: () => void;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  retryFailed: () => Promise<void>;
  clearResults: () => void;

  // 配置管理
  updateConfig: (config: Partial<ProcessImageConfig>) => void;
  getConfig: () => ProcessImageConfig;

  // 事件处理
  onProgress: (callback: (progress: ProcessingProgress) => void) => void;
  onComplete: (callback: (results: ProcessedImage[]) => void) => void;
  onError: (callback: (error: ProcessingError) => void) => void;
  onFileProcessed: (callback: (result: ProcessedImage) => void) => void;
}
```

### useErrorHandler

**错误处理 Composable**，统一管理错误和异常。

```typescript
function useErrorHandler(options?: ErrorHandlerOptions): ErrorHandlerComposable;

interface ErrorHandlerComposable {
  // 响应式状态
  errors: Ref<ErrorInfo[]>;
  warnings: Ref<WarningInfo[]>;

  // 计算属性
  hasErrors: ComputedRef<boolean>;
  hasWarnings: ComputedRef<boolean>;
  errorCount: ComputedRef<number>;
  warningCount: ComputedRef<number>;

  // 错误处理
  handleError: (error: Error | string, context?: string) => void;
  handleWarning: (warning: string, context?: string) => void;
  clearErrors: () => void;
  clearWarnings: () => void;
  clearAll: () => void;

  // 错误恢复
  getErrorRecovery: (error: ErrorInfo) => RecoveryAction[];
  applyRecovery: (action: RecoveryAction) => Promise<void>;

  // 错误分析
  analyzeErrors: () => ErrorAnalysis;
  getErrorTrends: () => ErrorTrend[];

  // 通知管理
  showNotification: (
    message: string,
    type: "error" | "warning" | "info",
  ) => void;
  dismissNotification: (id: string) => void;

  // 日志记录
  logError: (error: ErrorInfo) => void;
  exportLogs: () => ErrorLog[];
}
```

## 🧩 组件 API

### ImageUploader

**文件上传组件**，支持拖拽、选择和文件夹上传。

```vue
<template>
  <ImageUploader
    :max-files="10"
    :max-file-size="5000"
    :allowed-types="['image/*']"
    :enable-drag-drop="true"
    :enable-folder-upload="true"
    @files-changed="handleFilesChanged"
    @validation-error="handleValidationError"
    @upload-progress="handleProgress"
  />
</template>
```

**Props**:

```typescript
interface ImageUploaderProps {
  maxFiles?: number;
  maxFileSize?: number; // KB
  allowedTypes?: string[];
  enableDragDrop?: boolean;
  enableFolderUpload?: boolean;
  autoValidate?: boolean;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}
```

**Events**:

```typescript
interface ImageUploaderEvents {
  "files-changed": (files: File[]) => void;
  "file-added": (file: File, index: number) => void;
  "file-removed": (file: File, index: number) => void;
  "validation-error": (errors: ValidationError[]) => void;
  "upload-progress": (progress: number) => void;
  "upload-complete": () => void;
  "upload-error": (error: Error) => void;
}
```

### ProcessingPanel

**处理配置面板**，提供参数调整和预设选择。

```vue
<template>
  <ProcessingPanel
    :config="processingConfig"
    :presets="presetOptions"
    :show-advanced="true"
    @config-changed="handleConfigChanged"
    @preset-selected="handlePresetSelected"
    @validate-config="handleValidate"
  />
</template>
```

**Props**:

```typescript
interface ProcessingPanelProps {
  config: ProcessImageConfig;
  presets?: ProcessingPreset[];
  showAdvanced?: boolean;
  showPresets?: boolean;
  enableLivePreview?: boolean;
  disabled?: boolean;
}

interface ProcessingPreset {
  id: string;
  name: string;
  description?: string;
  config: ProcessImageConfig;
  icon?: string;
  category?: string;
}
```

### ImagePreview

**图像预览组件**，支持网格和列表视图。

```vue
<template>
  <ImagePreview
    :images="processedImages"
    :view-mode="viewMode"
    :items-per-page="12"
    :show-comparison="true"
    :enable-selection="true"
    @image-selected="handleSelection"
    @download-requested="handleDownload"
    @page-changed="handlePageChange"
  />
</template>
```

**Props**:

```typescript
interface ImagePreviewProps {
  images: ProcessedImage[];
  viewMode?: "grid" | "list";
  itemsPerPage?: number;
  showComparison?: boolean;
  enableSelection?: boolean;
  enableZoom?: boolean;
  enableDownload?: boolean;
  loading?: boolean;
}
```

### ProcessResults

**处理结果组件**，显示统计信息和批量操作。

```vue
<template>
  <ProcessResults
    :results="processingResults"
    :show-statistics="true"
    :enable-batch-download="true"
    @download-all="handleDownloadAll"
    @export-results="handleExport"
    @clear-results="handleClear"
  />
</template>
```

## 🔗 工具函数 API

### 图像工具

```typescript
// 图像格式检测
function detectImageFormat(file: File): Promise<string>;

// 图像尺寸获取
function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }>;

// 图像数据读取
function readImageData(file: File): Promise<ImageData>;

// DataURL 转换
function dataURLtoBlob(dataUrl: string): Blob;
function blobToDataURL(blob: Blob): Promise<string>;

// 图像格式转换
function convertFormat(
  sourceDataUrl: string,
  targetFormat: string,
  quality?: number,
): Promise<string>;

// 图像缩放
function resizeImage(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number,
  mode: ResizeMode,
): ImageData;
```

### 文件工具

```typescript
// 文件大小格式化
function formatFileSize(bytes: number): string;

// 文件类型检测
function isImageFile(file: File): boolean;
function isValidImageFormat(format: string): boolean;

// 文件名处理
function generateUniqueFileName(originalName: string): string;
function getFileExtension(filename: string): string;
function changeFileExtension(filename: string, newExt: string): string;

// 批量文件操作
function groupFilesByType(files: File[]): Record<string, File[]>;
function sortFilesBySize(files: File[]): File[];
function filterFilesBySize(files: File[], maxSize: number): File[];
```

### 性能工具

```typescript
// 性能监控
function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>,
): Promise<{ result: T; duration: number }>;

// 内存使用检测
function getMemoryUsage(): MemoryUsage;
function checkMemoryPressure(): MemoryPressure;

// 防抖和节流
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void;

function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number,
): (...args: Parameters<T>) => void;
```

## 🎛️ 配置 API

### 全局配置

```typescript
interface GlobalConfig {
  processing: ProcessingGlobalConfig;
  cache: CacheGlobalConfig;
  ui: UIGlobalConfig;
  performance: PerformanceGlobalConfig;
}

// 配置管理
class ConfigManager {
  static getInstance(): ConfigManager;

  load(configPath?: string): Promise<GlobalConfig>;
  save(config: GlobalConfig): Promise<void>;
  update(path: string, value: any): void;
  get<T>(path: string): T;
  reset(): void;

  // 配置验证
  validate(config: GlobalConfig): ValidationResult;
  getSchema(): JSONSchema;

  // 环境配置
  loadEnvironmentConfig(): void;
  mergeWithDefaults(config: Partial<GlobalConfig>): GlobalConfig;
}
```

### 主题配置

```typescript
interface ThemeConfig {
  colors: ColorPalette;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  breakpoints: BreakpointConfig;
  animations: AnimationConfig;
}

// 主题管理
class ThemeManager {
  loadTheme(name: string): Promise<ThemeConfig>;
  applyTheme(theme: ThemeConfig): void;
  createCustomTheme(options: CustomThemeOptions): ThemeConfig;
  exportTheme(theme: ThemeConfig): string;
  importTheme(themeData: string): ThemeConfig;
}
```

## 📊 事件系统 API

### 事件总线

```typescript
class EventBus {
  static getInstance(): EventBus;

  // 事件监听
  on<T>(event: string, handler: (data: T) => void): void;
  off<T>(event: string, handler: (data: T) => void): void;
  once<T>(event: string, handler: (data: T) => void): void;

  // 事件发射
  emit<T>(event: string, data: T): void;
  emitAsync<T>(event: string, data: T): Promise<void[]>;

  // 事件管理
  clear(event?: string): void;
  hasListeners(event: string): boolean;
  getListenerCount(event: string): number;
}

// 预定义事件
interface AppEvents {
  "files:selected": File[];
  "processing:start": { files: File[]; config: ProcessImageConfig };
  "processing:progress": { current: number; total: number; file: string };
  "processing:complete": ProcessedImage[];
  "processing:error": ProcessingError;
  "cache:cleanup": MemoryUsage;
  "theme:changed": ThemeConfig;
}
```

## 🧪 测试 API

### 测试工具

```typescript
// 测试数据生成
class TestDataGenerator {
  static createMockFile(name: string, size: number, type: string): File;

  static createMockImage(
    width: number,
    height: number,
    format: string,
  ): HTMLImageElement;

  static createMockProcessingConfig(
    overrides?: Partial<ProcessImageConfig>,
  ): ProcessImageConfig;
}

// 测试环境
class TestEnvironment {
  static setup(): void;
  static cleanup(): void;
  static mockImageProcessor(): ImageProcessor;
  static mockCacheManager(): CacheManager;
  static createTestContext(): TestContext;
}
```

---

**API 版本**: v1.0.0  
**最后更新**: 2026-01-17  
**维护者**: Web Image Processor 开发团队

更多详细信息请参考:

- [架构文档](ARCHITECTURE.md)
- [开发指南](CLAUDE.md)
- [用户手册](README.md)
