/**
 * 图像处理配置常量
 * 集中管理所有图像处理相关的配置参数
 */

// 文件大小限制配置（单位：KB）
export const FILE_SIZE_LIMITS = {
  /** 直接处理的最大文件大小（50MB） */
  MAX_DIRECT_MEMORY: 50 * 1024 * 1024,
  /** 最小文件大小 */
  MIN: 50,
  /** 最大文件大小 */
  MAX: 5000,
} as const;

// 图像复杂度分析配置
export const COMPLEXITY_CONFIG = {
  /** 采样大小 */
  SAMPLE_SIZE: 200,
  /** 边缘检测阈值 */
  EDGE_THRESHOLD: 400,
  /** 复杂度计算因子 */
  COMPLEXITY_FACTOR: 0.7,
} as const;

// 图像压缩配置
export const COMPRESSION_CONFIG = {
  /** 初始质量 */
  INITIAL_QUALITY: 0.9,
  /** 最小质量 */
  MIN_QUALITY: 0.01,
  /** 质量调整步长 */
  QUALITY_STEP: 0.005,
  /** 最大迭代次数 */
  MAX_ITERATIONS: 20,
  /** 默认格式 */
  DEFAULT_FORMAT: "image/jpeg" as const,
  /** 降级质量 */
  FALLBACK_QUALITY: 0.8,
} as const;

// 类型声明，避免 const 断言导致的类型问题
export type QualityRange = 0.01 | 0.9 | 0.005 | 0.8;

// 图像绘制模式配置
export const RESIZE_MODES = {
  /** 拉伸模式 */
  STRETCH: "stretch" as const,
  /** 保持比例填充 */
  KEEP_RATIO_PAD: "keep_ratio_pad" as const,
  /** 保持比例裁剪 */
  KEEP_RATIO_CROP: "keep_ratio_crop" as const,
} as const;

// 图像格式配置
export const IMAGE_FORMATS = {
  /** JPEG格式 */
  JPEG: "image/jpeg" as const,
  /** PNG格式 */
  PNG: "image/png" as const,
  /** WebP格式 */
  WEBP: "image/webp" as const,
} as const;

// 图像尺寸限制
export const SIZE_LIMITS = {
  /** 最大宽度 */
  MAX_WIDTH: 8192,
  /** 最大高度 */
  MAX_HEIGHT: 8192,
  /** 最小宽度 */
  MIN_WIDTH: 1,
  /** 最小高度 */
  MIN_HEIGHT: 1,
} as const;

// Worker管理配置
export const WORKER_CONFIG = {
  /** 最大Worker数量 */
  MAX_WORKERS: 4,
  /** 默认Worker数量 */
  DEFAULT_WORKERS: 2,
  /** 任务超时时间（毫秒） */
  TASK_TIMEOUT: 30000,
  /** 支持检查超时时间（毫秒） */
  SUPPORT_CHECK_TIMEOUT: 5000,
} as const;

// 内存管理配置
export const MEMORY_CONFIG = {
  /** 内存清理阈值（字节） */
  CLEANUP_THRESHOLD: 100 * 1024 * 1024, // 100MB
  /** 缓存最大数量 */
  MAX_CACHE_SIZE: 50,
  /** 内存检查间隔（毫秒） */
  MEMORY_CHECK_INTERVAL: 30000, // 30秒
  /** JS堆内存使用率阈值 */
  HEAP_THRESHOLD: 0.85, // 85%
} as const;

// 性能监控配置
export const PERFORMANCE_CONFIG = {
  /** 慢处理阈值（毫秒） */
  SLOW_PROCESSING_THRESHOLD: 5000, // 5秒
  /** 性能统计保留数量 */
  STATS_LIMIT: 100,
  /** 自动启用性能监控 */
  AUTO_ENABLE: true,
} as const;

// 验证配置
export const VALIDATION_CONFIG = {
  /** 允许的图像类型 */
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
  ] as const,
  /** 最大文件名长度 */
  MAX_FILENAME_LENGTH: 255,
  /** 错误消息前缀 */
  ERROR_PREFIX: "ImageProcessor:",
} as const;

// 类型导出
export type ResizeMode = (typeof RESIZE_MODES)[keyof typeof RESIZE_MODES];
export type ImageFormat = (typeof IMAGE_FORMATS)[keyof typeof IMAGE_FORMATS];
export type AllowedType = (typeof VALIDATION_CONFIG.ALLOWED_TYPES)[number];
