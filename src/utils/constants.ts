/**
 * 全局常量定义
 *
 * 使用 as const 确保类型安全
 * 所有魔法值应在此文件中定义为命名常量
 */

/**
 * 文件大小限制（KB）
 */
export const FILE_SIZE_LIMITS = {
  MIN: 50, // 最小文件大小 50KB
  MAX: 5000, // 最大文件大小 5000KB (5MB)
} as const;

/** 默认文件大小 1000KB (1MB) */
export const DEFAULT_FILE_SIZE = 1000;

/**
 * 图像尺寸限制（像素）
 */
export const DIMENSION_LIMITS = {
  MIN: 1,
  MAX: 8192, // 最大支持 8192x8192
} as const;

/**
 * 内存管理阈值
 */
export const MEMORY_THRESHOLDS = {
  CLEANUP_RATIO: 0.85, // 85% 内存使用率触发清理
  WARNING_RATIO: 0.9, // 90% 内存使用率显示警告
} as const;

/**
 * 压缩质量范围（0-1）
 */
export const QUALITY_RANGE = {
  MIN: 0.01, // 最低质量
  MAX: 0.95, // 最高质量
  DEFAULT: 0.8, // 默认质量
  STEP: 0.1, // 质量调整步长
} as const;

/**
 * 图像复杂度评分范围（0-1）
 */
export const COMPLEXITY_SCORE = {
  MIN: 0, // 最简单
  MAX: 1, // 最复杂
  LOW_THRESHOLD: 0.3, // 低复杂度阈值
  HIGH_THRESHOLD: 0.7, // 高复杂度阈值
} as const;

/**
 * 图像分析参数
 */
export const IMAGE_ANALYSIS = {
  SAMPLE_SIZE: 50, // 采样大小 50x50
  UNIQUE_COLORS_LOW: 256, // 低颜色数量阈值（适合 PNG）
  EDGE_RATIO_LOW: 0.1, // 低边缘比阈值
} as const;

/**
 * 格式选择阈值
 */
export const FORMAT_THRESHOLDS = {
  PHOTO_IMAGE: 0.6, // 摄影图像阈值
  TRANSPARENCY_PIXELS: 0, // 透明像素检测阈值
} as const;

/**
 * 二分查找参数
 */
export const BINARY_SEARCH = {
  MIN_QUALITY: 0.01, // 最低质量
  MAX_QUALITY: 0.9, // 最高质量
  QUALITY_STEP: 0.1, // 质量步长
} as const;

/**
 * 降级压缩参数
 */
export const FALLBACK_COMPRESSION = {
  DEFAULT_QUALITY: 0.8, // 默认质量
  START_QUALITY: 0.5, // 起始质量
  MIN_QUALITY: 0.3, // 最低质量
  GOOD_RATIO: 0.7, // 良好压缩比阈值
  MAX_SIZE_RATIO: 0.8, // 最大尺寸比例
} as const;

/**
 * 缩放参数
 */
export const SCALE_PARAMS = {
  START: 0.9, // 起始缩放比例
  END: 0.1, // 结束缩放比例
  STEP: 0.1, // 缩放步长
} as const;

/**
 * 质量推荐参数
 */
export const QUALITY_RECOMMENDATION = {
  MIN_START: 0.3, // 最低起始质量
  MAX_START: 0.95, // 最高起始质量
  COMPLEXITY_FACTOR: 0.4, // 复杂度影响因子
} as const;

/**
 * 复杂度分析权重
 */
export const COMPLEXITY_WEIGHTS = {
  VARIANCE: 0.4, // 方差权重
  EDGE: 0.3, // 边缘权重
  COLOR: 0.3, // 颜色权重
  VARIANCE_DIVISOR: 1000, // 方差除数
} as const;

/**
 * 批量处理参数
 */
export const BATCH_PROCESSING = {
  DISPLAY_SIZE_UNIT: 1024, // 文件大小显示单位（字节转 KB）
} as const;

/**
 * 性能监控参数
 */
export const PERFORMANCE = {
  MEMORY_MULTIPLIER: 100, // 内存使用率显示倍数
} as const;

/**
 * Worker 配置
 */
export const WORKER_CONFIG = {
  MAX_WORKERS: 4, // 最大 Worker 数量
  DEFAULT_WORKERS: 2, // 默认 Worker 数量
  TIMEOUT: 30000, // Worker 超时时间（30秒）
} as const;

/**
 * 缓存配置
 */
export const CACHE_CONFIG = {
  MAX_SIZE: 50, // 最大缓存条目数
} as const;

/**
 * 类型导出
 */
export type FileSizeLimits = typeof FILE_SIZE_LIMITS;
export type DimensionLimits = typeof DIMENSION_LIMITS;
export type MemoryThresholds = typeof MEMORY_THRESHOLDS;
export type QualityRange = typeof QUALITY_RANGE;
export type ComplexityScore = typeof COMPLEXITY_SCORE;
export type ImageAnalysis = typeof IMAGE_ANALYSIS;
export type FormatThresholds = typeof FORMAT_THRESHOLDS;
export type BinarySearch = typeof BINARY_SEARCH;
export type FallbackCompression = typeof FALLBACK_COMPRESSION;
export type ScaleParams = typeof SCALE_PARAMS;
export type QualityRecommendation = typeof QUALITY_RECOMMENDATION;
export type ComplexityWeights = typeof COMPLEXITY_WEIGHTS;
export type BatchProcessing = typeof BATCH_PROCESSING;
export type Performance = typeof PERFORMANCE;
export type WorkerConfig = typeof WORKER_CONFIG;
export type CacheConfigType = typeof CACHE_CONFIG;
