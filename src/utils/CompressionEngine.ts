import { COMPRESSION_CONFIG, COMPLEXITY_CONFIG } from "./ImageConfig";

// 类型声明，避免 const 断言导致的类型问题
export type QualityRange = 0.01 | 0.9 | 0.005 | 0.8 | 0.1;

/**
 * 图像压缩结果
 */
export interface CompressionResult {
  /** 压缩后的 data URL */
  dataUrl: string;
  /** 压缩后的文件大小（字节） */
  fileSize: number;
  /** 使用的质量参数 */
  quality: number;
  /** 压缩率 */
  compressionRatio?: number;
  /** 压缩耗时（毫秒） */
  processingTime: number;
}

/**
 * 图像分析结果
 */
export interface ComplexityResult {
  /** 整体复杂度评分 */
  score: number;
  /** 边缘复杂度 */
  edgeComplexity: number;
  /** 颜色复杂度 */
  colorComplexity: number;
  /** 建议的初始质量 */
  recommendedStartQuality: number;
  /** 是否为摄影图像 */
  isPhotographic: boolean;
  /** 是否有透明度 */
  hasTransparency: boolean;
}

/**
 * 图像压缩引擎
 * 专门处理图像压缩和优化算法
 */
export class CompressionEngine {
  /**
   * 智能压缩图像至目标文件大小
   * 使用多种策略组合以达到最佳压缩效果
   */
  async optimizeImageQuality(
    canvas: HTMLCanvasElement,
    targetSize: number,
    format: "image/jpeg" | "image/png" | "image/webp" = "image/jpeg",
    startQuality: number = COMPRESSION_CONFIG.INITIAL_QUALITY,
  ): Promise<string | null> {
    const startTime = Date.now();
    const maxSizeBytes = targetSize * 1024;

    try {
      // 快速尝试初始质量
      const dataUrl = await this.tryCompression(canvas, format, startQuality);
      const currentSize = this.getDataUrlSize(dataUrl);

      // 如果初始质量就满足要求，直接返回
      if (currentSize <= maxSizeBytes) {
        console.log(
          `初始质量 ${startQuality} 满足要求，大小: ${currentSize} bytes`,
        );
        return dataUrl;
      }

      // 智能压缩策略选择
      const strategy = this.selectCompressionStrategy(
        currentSize,
        maxSizeBytes,
      );
      console.log(`选择压缩策略: ${strategy}`);

      switch (strategy) {
        case "binary_search":
          return await this.binarySearchOptimization(
            canvas,
            format,
            maxSizeBytes,
            startQuality,
          );

        case "adaptive_steps":
          return await this.adaptiveStepsOptimization(
            canvas,
            format,
            maxSizeBytes,
            startQuality,
          );

        case "format_switch":
          return await this.formatSwitchOptimization(
            canvas,
            maxSizeBytes,
            startQuality,
          );

        default:
          return await this.fallbackCompression(canvas, maxSizeBytes);
      }
    } catch (error) {
      console.error("图像压缩失败:", error);
      return await this.fallbackCompression(canvas, targetSize);
    } finally {
      const processingTime = Date.now() - startTime;
      console.log(`压缩完成，耗时: ${processingTime}ms`);
    }
  }

  /**
   * 尝试压缩
   */
  private async tryCompression(
    canvas: HTMLCanvasElement,
    format: string,
    quality: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 选择最佳压缩策略
   */
  private selectCompressionStrategy(
    currentSize: number,
    targetSize: number,
  ): string {
    const ratio = currentSize / targetSize;

    if (ratio <= 1.5) {
      return "binary_search"; // 小幅压缩，二分查找最快
    } else if (ratio <= 3) {
      return "adaptive_steps"; // 中等压缩，自适应步长
    } else if (ratio <= 10) {
      return "format_switch"; // 大幅压缩，尝试格式切换
    } else {
      return "fallback"; // 极大压缩，使用降级方案
    }
  }

  /**
   * 二分查找优化
   * 适用于小幅到中等压缩需求
   */
  private async binarySearchOptimization(
    canvas: HTMLCanvasElement,
    format: string,
    maxSizeBytes: number,
    startQuality: number,
  ): Promise<string | null> {
    let minQuality: number = COMPRESSION_CONFIG.MIN_QUALITY;
    let maxQuality: number = startQuality;
    let bestDataUrl: string | null = null;

    let iterationCount = 0;

    while (maxQuality - minQuality > COMPRESSION_CONFIG.QUALITY_STEP) {
      iterationCount++;
      if (iterationCount > COMPRESSION_CONFIG.MAX_ITERATIONS) {
        break;
      }

      const midQuality = (minQuality + maxQuality) / 2;

      try {
        const dataUrl = await this.tryCompression(canvas, format, midQuality);
        const currentSize = this.getDataUrlSize(dataUrl);

        if (currentSize <= maxSizeBytes) {
          bestDataUrl = dataUrl;
          minQuality = midQuality;
        } else {
          maxQuality = midQuality;
        }
      } catch (error) {
        maxQuality = midQuality;
      }
    }

    return bestDataUrl;
  }

  /**
   * 自适应步长优化
   * 适用于中等压缩需求，根据压缩效果动态调整
   */
  private async adaptiveStepsOptimization(
    canvas: HTMLCanvasElement,
    format: string,
    maxSizeBytes: number,
    startQuality: number,
  ): Promise<string | null> {
    let currentQuality = startQuality;
    let bestDataUrl: string | null = null;

    while (currentQuality > COMPRESSION_CONFIG.MIN_QUALITY) {
      try {
        const dataUrl = await this.tryCompression(
          canvas,
          format,
          currentQuality,
        );
        const currentSize = this.getDataUrlSize(dataUrl);

        if (currentSize <= maxSizeBytes) {
          bestDataUrl = dataUrl;
          break;
        }

        // 自适应调整步长
        const reductionRatio = currentSize / maxSizeBytes;
        const stepSize = Math.max(
          COMPRESSION_CONFIG.QUALITY_STEP,
          Math.min(0.1 as number, currentQuality * 0.1),
        );

        currentQuality -= stepSize;
      } catch (error) {
        currentQuality -= COMPRESSION_CONFIG.QUALITY_STEP;
      }
    }

    return bestDataUrl;
  }

  /**
   * 格式切换优化
   * 尝试不同格式以找到最佳压缩效果
   */
  private async formatSwitchOptimization(
    canvas: HTMLCanvasElement,
    maxSizeBytes: number,
    startQuality: number,
  ): Promise<string | null> {
    const formats = ["image/webp", "image/jpeg", "image/png"] as const;
    const results: Array<{ format: string; dataUrl: string; size: number }> =
      [];

    // 尝试多种格式
    for (const format of formats) {
      try {
        const quality = format === "image/png" ? undefined : startQuality;
        const dataUrl = await this.tryCompression(
          canvas,
          format,
          quality || 0.9,
        );
        const size = this.getDataUrlSize(dataUrl);

        if (size <= maxSizeBytes) {
          results.push({ format, dataUrl, size });
        }
      } catch (error) {
        console.warn(`格式 ${format} 压缩失败:`, error);
      }
    }

    // 选择最佳结果（最小文件大小）
    if (results.length > 0) {
      results.sort((a, b) => a.size - b.size);
      console.log(
        `最佳格式: ${results[0].format}, 大小: ${results[0].size} bytes`,
      );
      return results[0].dataUrl;
    }

    // 如果没有满足要求的结果，选择最小的
    return this.binarySearchOptimization(
      canvas,
      "image/jpeg",
      maxSizeBytes,
      startQuality,
    );
  }

  /**
   * 降级压缩方案
   * 当其他方法都失败时的最后保障
   */
  private async fallbackCompression(
    canvas: HTMLCanvasElement,
    maxSizeBytes: number,
  ): Promise<string | null> {
    console.log("使用降级压缩方案");

    // 使用最低质量和最兼容的格式
    try {
      const dataUrl = await this.tryCompression(
        canvas,
        "image/jpeg",
        COMPRESSION_CONFIG.MIN_QUALITY,
      );
      return dataUrl;
    } catch (error) {
      console.error("降级压缩也失败:", error);

      // 最后的尝试：使用 PNG 格式
      try {
        return await this.tryCompression(canvas, "image/png", 0.9);
      } catch (fallbackError) {
        console.error("所有压缩方法都失败:", fallbackError);
        return null;
      }
    }
  }

  /**
   * 批量压缩优化
   * 为多个图像选择最佳压缩参数
   */
  async batchOptimize(
    images: Array<{ canvas: HTMLCanvasElement; name: string }>,
    targetSize: number,
    format?: string,
  ): Promise<CompressionResult[]> {
    const results: CompressionResult[] = [];

    // 分析第一个图像以确定最佳策略
    const firstImage = images[0];
    if (firstImage) {
      const initialDataUrl = await this.tryCompression(
        firstImage.canvas,
        format || "image/jpeg",
        COMPRESSION_CONFIG.INITIAL_QUALITY,
      );
      const initialSize = this.getDataUrlSize(initialDataUrl);
      const strategy = this.selectCompressionStrategy(initialSize, targetSize);

      console.log(`批量压缩策略: ${strategy}`);
    }

    // 并行处理所有图像
    const promises = images.map(async (image, index) => {
      const startTime = Date.now();

      try {
        const optimizedDataUrl = await this.optimizeImageQuality(
          image.canvas,
          targetSize,
          (format as any) || "image/jpeg",
        );

        if (optimizedDataUrl) {
          const fileSize = this.getDataUrlSize(optimizedDataUrl);
          const processingTime = Date.now() - startTime;

          // 计算压缩率（需要原始大小，这里假设）
          const compressionRatio = 0; // 需要从外部传入原始大小

          return {
            dataUrl: optimizedDataUrl,
            fileSize,
            quality: COMPRESSION_CONFIG.INITIAL_QUALITY, // 估算值
            compressionRatio,
            processingTime,
          } as CompressionResult;
        }

        return null;
      } catch (error) {
        console.error(`图像 ${image.name} 压缩失败:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(promises);

    // 过滤空结果并返回
    return batchResults.filter(
      (result) => result !== null,
    ) as CompressionResult[];
  }

  /**
   * 获取 Data URL 大小
   */
  private getDataUrlSize(dataUrl: string): number {
    const base64 = dataUrl.split(",")[1];
    if (!base64) return 0;
    return Math.round(base64.length * 0.75); // Base64 编码后的字节数
  }

  /**
   * 压缩质量预设
   */
  static readonly QUALITY_PRESETS = {
    HIGH_QUALITY: {
      name: "高质量",
      description: "最佳画质，适合专业用途",
      startQuality: 0.95,
      strategy: "binary_search",
    },
    BALANCED: {
      name: "平衡",
      description: "平衡质量和大小，适合日常使用",
      startQuality: 0.85,
      strategy: "adaptive_steps",
    },
    SMALL_SIZE: {
      name: "小尺寸",
      description: "优先减小文件大小",
      startQuality: 0.7,
      strategy: "format_switch",
    },
    WEB_OPTIMIZED: {
      name: "网页优化",
      description: "为网页使用优化",
      startQuality: 0.8,
      strategy: "format_switch",
    },
  } as const;

  /**
   * 使用预设压缩
   */
  async compressWithPreset(
    canvas: HTMLCanvasElement,
    targetSize: number,
    preset: keyof typeof CompressionEngine.QUALITY_PRESETS,
    format?: string,
  ): Promise<CompressionResult | null> {
    const presetConfig = CompressionEngine.QUALITY_PRESETS[preset];
    const startTime = Date.now();

    try {
      let dataUrl: string | null = null;

      // 根据预设策略选择压缩方法
      switch (presetConfig.strategy) {
        case "binary_search":
          dataUrl = await this.binarySearchOptimization(
            canvas,
            format || "image/jpeg",
            targetSize,
            presetConfig.startQuality,
          );
          break;

        case "adaptive_steps":
          dataUrl = await this.adaptiveStepsOptimization(
            canvas,
            format || "image/jpeg",
            targetSize,
            presetConfig.startQuality,
          );
          break;

        case "format_switch":
          dataUrl = await this.formatSwitchOptimization(
            canvas,
            targetSize,
            presetConfig.startQuality,
          );
          break;
      }

      if (dataUrl) {
        const fileSize = this.getDataUrlSize(dataUrl);
        const processingTime = Date.now() - startTime;

        return {
          dataUrl,
          fileSize,
          quality: presetConfig.startQuality,
          compressionRatio: 0, // 需要原始大小
          processingTime,
        };
      }

      return null;
    } catch (error) {
      console.error(`预设压缩失败 (${preset}):`, error);
      return null;
    }
  }
}

/**
 * 默认导出
 */
export default CompressionEngine;
