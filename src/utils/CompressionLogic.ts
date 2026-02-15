/**
 * 压缩逻辑模块
 * 提取共享的压缩算法，供主线程和 Worker 使用
 */

/**
 * 压缩配置常量
 */
export const COMPRESSION_CONFIG = {
  /** 初始质量值 */
  INITIAL_QUALITY: 0.9,
  /** 最小质量值 */
  MIN_QUALITY: 0.01,
  /** 质量调整步长 */
  QUALITY_STEP: 0.005,
  /** 降级质量值 */
  FALLBACK_QUALITY: 0.8,
  /** 默认格式 */
  DEFAULT_FORMAT: "image/jpeg",
  /** 最大迭代次数 */
  MAX_ITERATIONS: 20,
};

/**
 * 压缩结果接口
 */
export interface CompressionResult {
  /** 压缩后的数据 */
  dataUrl: string;
  /** 最终使用的质量值 */
  quality: number;
  /** 文件大小（字节） */
  fileSize: number;
}

/**
 * Canvas 接口 - 支持 HTMLCanvasElement 和 OffscreenCanvas
 */
export interface CanvasLike {
  toDataURL(format?: string, quality?: number): string;
  width: number;
  height: number;
}

/**
 * 数据 URL 大小计算工具
 */
export function getDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1];
  if (!base64) return 0;
  return Math.round(base64.length * 0.75);
}

/**
 * Blob 转 DataURL 工具
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * 使用二分查找算法优化压缩质量
 *
 * === 算法原理 ===
 *
 * 本函数使用二分查找算法寻找满足文件大小限制的最高质量值：
 *
 * 1. **初始尝试**：使用起始质量进行压缩
 * 2. **二分查找**：如果初始质量超出限制，使用二分查找找到最优质量
 * 3. **自适应调整**：根据当前文件大小动态调整质量比例
 * 4. **降级处理**：如果无法满足大小要求，返回最低质量的结果
 *
 * === 二分查找算法 ===
 * ```
 * low = 0.01, high = startQuality
 * while (high - low > precision):
 *     mid = (low + high) / 2
 *     size = compress(mid)
 *     if size <= maxSize:
 *         best = size
 *         low = mid  // 尝试更高质量
 *     else:
 *         high = mid  // 降低质量
 * return best or fallback
 * ```
 *
 * === 复杂度分析 ===
 *
 * 时间复杂度: O(log n * m)，其中 n 为质量搜索范围，m 为单次压缩时间
 * 空间复杂度: O(1)，仅需常数空间存储中间结果
 *
 * @param canvas - Canvas 对象（HTMLCanvasElement 或 OffscreenCanvas）
 * @param maxSizeBytes - 目标文件大小（字节）
 * @param format - 图像格式
 * @param startQuality - 起始质量值（默认 0.9）
 * @returns Promise<CompressionResult> - 压缩结果
 */
export async function optimizeWithBinarySearch(
  canvas: CanvasLike,
  maxSizeBytes: number,
  format: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  startQuality: number = COMPRESSION_CONFIG.INITIAL_QUALITY,
): Promise<CompressionResult> {
  let dataUrl: string;
  let fileSize: number;

  // 尝试初始质量
  try {
    dataUrl = canvas.toDataURL(format, startQuality);
  } catch {
    // 降级到默认格式和质量
    dataUrl = canvas.toDataURL(
      COMPRESSION_CONFIG.DEFAULT_FORMAT,
      COMPRESSION_CONFIG.FALLBACK_QUALITY,
    );
  }
  fileSize = getDataUrlSize(dataUrl);

  // 如果初始质量就满足要求，直接返回
  if (fileSize <= maxSizeBytes) {
    return { dataUrl, quality: startQuality, fileSize };
  }

  // 二分查找优化
  let minQuality: number = COMPRESSION_CONFIG.MIN_QUALITY;
  let maxQuality: number = startQuality;
  let bestDataUrl: string | null = null;
  let bestQuality: number = COMPRESSION_CONFIG.MIN_QUALITY;

  let iterationCount = 0;
  while (
    maxQuality - minQuality > COMPRESSION_CONFIG.QUALITY_STEP
  ) {
    iterationCount++;
    if (iterationCount > COMPRESSION_CONFIG.MAX_ITERATIONS) break;

    // 根据当前文件大小调整质量比例
    let qualityRatio = 0.5;
    if (fileSize > maxSizeBytes * 1.5) {
      qualityRatio = 0.3;
    } else if (fileSize < maxSizeBytes * 0.8) {
      qualityRatio = 0.7;
    }

    const quality = minQuality + (maxQuality - minQuality) * qualityRatio;

    try {
      dataUrl = canvas.toDataURL(format, quality);
    } catch {
      dataUrl = canvas.toDataURL(
        COMPRESSION_CONFIG.DEFAULT_FORMAT,
        COMPRESSION_CONFIG.FALLBACK_QUALITY,
      );
    }
    fileSize = getDataUrlSize(dataUrl);

    if (fileSize <= maxSizeBytes) {
      bestDataUrl = dataUrl;
      bestQuality = quality;
      minQuality = quality;
    } else {
      maxQuality = quality;
    }
  }

  if (bestDataUrl && getDataUrlSize(bestDataUrl) <= maxSizeBytes) {
    return {
      dataUrl: bestDataUrl,
      quality: bestQuality,
      fileSize: getDataUrlSize(bestDataUrl),
    };
  }

  // 最终降级：返回最低质量的结果
  try {
    dataUrl = canvas.toDataURL(
      format,
      COMPRESSION_CONFIG.MIN_QUALITY,
    );
  } catch {
    dataUrl = canvas.toDataURL(
      COMPRESSION_CONFIG.DEFAULT_FORMAT,
      COMPRESSION_CONFIG.MIN_QUALITY,
    );
  }

  return {
    dataUrl,
    quality: COMPRESSION_CONFIG.MIN_QUALITY,
    fileSize: getDataUrlSize(dataUrl),
  };
}

/**
 * 线性搜索降级方案
 * 当二分查找失败时使用线性搜索逐步降低质量
 *
 * @param canvas - Canvas 对象
 * @param maxSizeBytes - 目标文件大小（字节）
 * @param format - 图像格式
 * @param startQuality - 起始质量值
 * @returns Promise<CompressionResult | null> - 压缩结果或 null
 */
export async function linearSearchFallback(
  canvas: CanvasLike,
  maxSizeBytes: number,
  format: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  startQuality: number = COMPRESSION_CONFIG.INITIAL_QUALITY,
): Promise<CompressionResult | null> {
  let dataUrl: string;
  let fileSize: number;

  for (
    let q = startQuality;
    q >= COMPRESSION_CONFIG.MIN_QUALITY;
    q -= COMPRESSION_CONFIG.QUALITY_STEP * 2
  ) {
    try {
      dataUrl = canvas.toDataURL(format, Math.max(q, COMPRESSION_CONFIG.MIN_QUALITY));
    } catch {
      continue;
    }
    fileSize = getDataUrlSize(dataUrl);

    if (fileSize <= maxSizeBytes) {
      return {
        dataUrl,
        quality: q,
        fileSize,
      };
    }
  }

  return null;
}

/**
 * 压缩优化主入口
 * 依次尝试二分查找和线性搜索
 *
 * @param canvas - Canvas 对象
 * @param maxFileSizeKB - 目标文件大小（KB）
 * @param format - 图像格式
 * @param startQuality - 起始质量值
 * @returns Promise<CompressionResult> - 压缩结果
 */
export async function optimizeCompression(
  canvas: CanvasLike,
  maxFileSizeKB: number,
  format: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
  startQuality: number = COMPRESSION_CONFIG.INITIAL_QUALITY,
): Promise<CompressionResult> {
  const maxSizeBytes = maxFileSizeKB * 1024;

  // 1. 尝试二分查找
  const binaryResult = await optimizeWithBinarySearch(
    canvas,
    maxSizeBytes,
    format,
    startQuality,
  );

  if (binaryResult.fileSize <= maxSizeBytes) {
    return binaryResult;
  }

  // 2. 线性搜索降级
  const linearResult = await linearSearchFallback(
    canvas,
    maxSizeBytes,
    format,
    startQuality,
  );

  if (linearResult) {
    return linearResult;
  }

  // 3. 返回最低质量的结果
  return binaryResult;
}
