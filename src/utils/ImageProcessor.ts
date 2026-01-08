
// src/utils/ImageProcessor.ts
import performanceMonitor from './PerformanceMonitor';

export interface BatchProcessResult {
  success: boolean;
  file: File;
  result?: ProcessedImage;
  error?: string;
  index: number;
}

export interface ProcessImageConfig {
  resizeOption: 'custom' | 'original' | 'percentage';
  resizePercentage: number;
  targetWidth: number;
  targetHeight: number;
  resizeMode: 'keep_ratio_pad' | 'keep_ratio_crop' | 'stretch';
  maxFileSize: number;
  concurrency?: number;
  useWasm?: boolean;
  progressive?: boolean;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  suffix?: string;
}

export interface ProcessedImage {
  name: string;
  dataUrl: string;
  originalSize: {
    width: number;
    height: number;
    fileSize: number;
  };
  processedSize: {
    width: number;
    height: number;
    fileSize: number;
  };
  sizeReduction: number;
}

export interface Dimensions {
  width: number;
  height: number;
  originalWidth?: number;
  originalHeight?: number;
}

export interface ComplexityResult {
  avgVariance: number;
  edgeRatio: number;
  uniqueColors: number;
  colorComplexityRatio: number;
  complexityScore: number;
  recommendedStartQuality: number;
}

export interface OptimalFormatResult {
  primaryFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  fallbackFormats: string[];
  reason: string;
}

export interface Capabilities {
  canvasSupported: boolean;
  supportedFormats: string[];
  maxConcurrency: number;
}

export interface MemoryInfo {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}

class ImageProcessor {
  // ========== 常量定义 ==========

  // 文件大小限制
  private static readonly MAX_DIRECT_MEMORY_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly MIN_FILE_SIZE = 50; // 50KB
  private static readonly MAX_FILE_SIZE = 5000; // 5000KB (5MB)

  // 图像分析
  private static readonly COMPLEXITY_SAMPLE_SIZE = 200;
  private static readonly EDGE_DETECTION_THRESHOLD = 400;

  // 二分查找
  private static readonly BINARY_SEARCH_PRECISION = 0.005;
  private static readonly BINARY_SEARCH_MAX_ITERATIONS = 20;
  private static readonly BINARY_SEARCH_MIN_QUALITY = 0.01;
  private static readonly BINARY_SEARCH_MAX_QUALITY = 0.9;

  // 缓存
  private static readonly MAX_CACHE_SIZE = 50;

  // 内存管理
  private static readonly MEMORY_CLEANUP_THRESHOLD = 0.85; // 85%

  // 格式选择
  private static readonly WEBP_QUALITY_THRESHOLD = 0.85;
  private static readonly PHOTO_IMAGE_THRESHOLD = 0.6;
  private static readonly PNG_SIZE_THRESHOLD = 300; // KB

  // 图像尺寸限制
  private static readonly MAX_DIMENSION = 8192;
  private static readonly MIN_DIMENSION = 1;

  // 实例属性
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private compressionCache: Map<string, { dataUrl: string; lastAccessed: number; createdAt: number; }> = new Map();
  private maxCacheSize = ImageProcessor.MAX_CACHE_SIZE;

  constructor() {
    this.initCanvas();
  }

  private initCanvas(): void {
    if (typeof document === 'undefined') return;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
    }
  }

  async processImage(file: File, config: ProcessImageConfig): Promise<ProcessedImage> {
    const start = performance.now();

    this.checkAndCleanMemory();

    if (file.size > ImageProcessor.MAX_DIRECT_MEMORY_SIZE) {
      const result = await this.processImageChunked(file, config);

      const duration = performance.now() - start;
      performanceMonitor.recordOperation('processImage.chunked', duration);

      return result;
    }

    if (!this.isValidImageFile(file)) {
      throw new Error(`不支持的文件格式: ${file.type}`);
    }

    if (!this.isValidFileSize(file)) {
      throw new Error(
        `文件大小超出限制: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          const img = new Image();
          img.onload = async () => {
            try {
              if (!this.isValidImageDimensions(img)) {
                throw new Error(`图像尺寸超出限制: ${img.width}x${img.height}`);
              }

              const result = await this.processImageData(
                img,
                config,
                file.name,
              );

              const duration = performance.now() - start;
              performanceMonitor.recordOperation('processImage', duration);

              resolve(result);
            } catch (error) {
              reject(error);
            }
          };

          img.onerror = () => {
            reject(new Error("图像加载失败"));
          };

          if (e.target?.result) {
            img.src = e.target.result as string;
          } else {
            reject(new Error("文件读取结果为空"));
          }
          
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error("文件读取失败"));
      };

      reader.readAsDataURL(file);
    });
  }

  async processImageData(img: HTMLImageElement, config: ProcessImageConfig, fileName: string): Promise<ProcessedImage> {
    const originalWidth = img.width;
    const originalHeight = img.height;

    let targetWidth: number, targetHeight: number;

    switch (config.resizeOption) {
      case "original":
        targetWidth = originalWidth;
        targetHeight = originalHeight;
        break;
      case "percentage":
        targetWidth = Math.round(
          (originalWidth * config.resizePercentage) / 100,
        );
        targetHeight = Math.round(
          (originalHeight * config.resizePercentage) / 100,
        );
        break;
      case "custom":
      default: {
        const dimensions = this.calculateTargetDimensions(
          originalWidth,
          originalHeight,
          config.targetWidth,
          config.targetHeight,
          config.resizeMode,
        );
        targetWidth = dimensions.width;
        targetHeight = dimensions.height;
        break;
      }
    }
    
    if (!this.canvas || !this.ctx) {
        throw new Error("Canvas not initialized");
    }

    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    this.ctx.clearRect(0, 0, targetWidth, targetHeight);

    if (config.resizeMode === "keep_ratio_pad") {
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    this.drawImageWithMode(img, config.resizeMode, targetWidth, targetHeight);

    const optimizedDataUrl = await this.optimizeImageQuality(
      config.maxFileSize,
      img,
      config,
    );

    const fileSize = this.getDataUrlSize(optimizedDataUrl);

    return {
      name: this.generateFileName(fileName, config),
      dataUrl: optimizedDataUrl,
      originalSize: {
        width: originalWidth,
        height: originalHeight,
        fileSize: img.src ? this.getDataUrlSize(img.src) : 0,
      },
      processedSize: {
        width: targetWidth,
        height: targetHeight,
        fileSize: fileSize,
      },
      sizeReduction:
        img.src && fileSize < this.getDataUrlSize(img.src)
          ? Math.round((1 - fileSize / this.getDataUrlSize(img.src)) * 100)
          : 0,
    };
  }

  calculateTargetDimensions(
    originalWidth: number,
    originalHeight: number,
    targetWidth: number,
    targetHeight: number,
    mode: 'keep_ratio_pad' | 'keep_ratio_crop' | 'stretch',
  ): Dimensions {
    if (mode === "stretch") {
      return { width: targetWidth, height: targetHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    if (mode === "keep_ratio_pad") {
      if (aspectRatio > targetAspectRatio) {
        return {
          width: targetWidth,
          height: Math.round(targetWidth / aspectRatio),
        };
      } else {
        return {
          width: Math.round(targetHeight * aspectRatio),
          height: targetHeight,
        };
      }
    } else if (mode === "keep_ratio_crop") {
        return { width: targetWidth, height: targetHeight };
    }

    return { width: targetWidth, height: targetHeight };
  }

  drawImageWithMode(img: HTMLImageElement | HTMLCanvasElement, mode: string, canvasWidth: number, canvasHeight: number, context: CanvasRenderingContext2D | null = this.ctx): void {
    if (!context) return;
    const originalWidth = img.width;
    const originalHeight = img.height;

    if (mode === "stretch") {
      context.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    } else if (mode === "keep_ratio_pad") {
      const aspectRatio = originalWidth / originalHeight;
      const canvasAspectRatio = canvasWidth / canvasHeight;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (aspectRatio > canvasAspectRatio) {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / aspectRatio;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
      } else {
        drawWidth = canvasHeight * aspectRatio;
        drawHeight = canvasHeight;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
      }

      context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    } else if (mode === "keep_ratio_crop") {
      const aspectRatio = originalWidth / originalHeight;
      const canvasAspectRatio = canvasWidth / canvasHeight;

      let sourceX, sourceY, sourceWidth, sourceHeight;

      if (aspectRatio > canvasAspectRatio) {
        sourceHeight = originalHeight;
        sourceWidth = originalHeight * canvasAspectRatio;
        sourceX = (originalWidth - sourceWidth) / 2;
        sourceY = 0;
      } else {
        sourceWidth = originalWidth;
        sourceHeight = originalWidth / canvasAspectRatio;
        sourceX = 0;
        sourceY = (originalHeight - sourceHeight) / 2;
      }

      context.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvasWidth,
        canvasHeight,
      );
    }
  }

  private generateCacheKey(width: number, height: number, maxFileSize: number, resizeMode: string, imageHash: string): string {
    return `${width}x${height}_${maxFileSize}kb_${resizeMode}_${imageHash}`;
  }

  private generateImageHash(img: HTMLImageElement): string {
    const hashSize = 8;
    const hashCanvas = document.createElement("canvas");
    hashCanvas.width = hashSize;
    hashCanvas.height = hashSize;
    const hashCtx = hashCanvas.getContext("2d");
    if (!hashCtx) return '';

    hashCtx.drawImage(img, 0, 0, hashSize, hashSize);
    const imageData = hashCtx.getImageData(0, 0, hashSize, hashSize);
    const data = imageData.data;

    let hash = "";
    for (let i = 0; i < data.length; i += 16) {
      hash += data[i].toString(16);
    }
    return hash;
  }
  
  private getFromCache(cacheKey: string): string | null {
    if (this.compressionCache.has(cacheKey)) {
      const cached = this.compressionCache.get(cacheKey)!;
      cached.lastAccessed = Date.now();
      return cached.dataUrl;
    }
    return null;
  }

  private saveToCache(cacheKey: string, dataUrl: string): void {
    if (this.compressionCache.size >= this.maxCacheSize) {
      let oldestKey: string | null = null;
      let oldestTime = Date.now();

      for (const [key, value] of this.compressionCache) {
        if (value.lastAccessed < oldestTime) {
          oldestTime = value.lastAccessed;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.compressionCache.delete(oldestKey);
      }
    }

    this.compressionCache.set(cacheKey, {
      dataUrl,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
    });
  }

  clearCache(): void {
    this.compressionCache.clear();
  }
  
  analyzeImageComplexity(img: HTMLImageElement): ComplexityResult {
    const sampleSize = Math.min(ImageProcessor.COMPLEXITY_SAMPLE_SIZE, img.width, img.height);
    const sampleCanvas = document.createElement("canvas");
    sampleCanvas.width = sampleSize;
    sampleCanvas.height = sampleSize;
    const sampleCtx = sampleCanvas.getContext("2d");
    if (!sampleCtx) throw new Error("Could not get 2d context for complexity analysis");

    sampleCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const imageData = sampleCtx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;

    let totalVariance = 0;
    let edgeCount = 0;
    const colorMap: Map<string, number> = new Map();

    for (let y = 0; y < sampleSize; y++) {
      for (let x = 0; x < sampleSize; x++) {
        const idx = (y * sampleSize + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        const colorKey = `${Math.floor(r / 16)}-${Math.floor(g / 16)}-${Math.floor(b / 16)}`;
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);

        if (x > 0 && y > 0 && x < sampleSize - 1 && y < sampleSize - 1) {
          const neighbors = [
            data[((y - 1) * sampleSize + (x - 1)) * 4],
            data[((y - 1) * sampleSize + x) * 4],
            data[((y - 1) * sampleSize + (x + 1)) * 4],
            data[(y * sampleSize + (x - 1)) * 4],
            data[(y * sampleSize + (x + 1)) * 4],
            data[((y + 1) * sampleSize + (x - 1)) * 4],
            data[((y + 1) * sampleSize + x) * 4],
            data[((y + 1) * sampleSize + (x + 1)) * 4],
          ];

          const variance =
            neighbors.reduce((sum, val) => sum + Math.pow(val - r, 2), 0) / 8;
          totalVariance += variance;

          if (variance > ImageProcessor.EDGE_DETECTION_THRESHOLD) edgeCount++;
        }
      }
    }

    const pixelCount = sampleSize * sampleSize;
    const avgVariance = totalVariance / pixelCount;
    const edgeRatio = edgeCount / pixelCount;
    const uniqueColors = colorMap.size;
    const colorComplexityRatio = uniqueColors / pixelCount;

    const complexityScore = Math.min(
      1,
      (avgVariance / 1000) * 0.4 + edgeRatio * 0.3 + colorComplexityRatio * 0.3,
    );

    return {
      avgVariance,
      edgeRatio,
      uniqueColors,
      colorComplexityRatio,
      complexityScore,
      recommendedStartQuality: Math.max(0.3, 0.95 - complexityScore * 0.4),
    };
  }

  selectOptimalFormat(img: HTMLImageElement, complexity: ComplexityResult): OptimalFormatResult {
    const hasTransparency = this.checkTransparency(img);
    const isPhotographic = complexity.complexityScore > ImageProcessor.PHOTO_IMAGE_THRESHOLD;
    const isSimpleGraphic =
      complexity.uniqueColors < 256 && complexity.edgeRatio < 0.1;

    let recommendedFormats: Array<'image/png' | 'image/webp' | 'image/jpeg'> = [];

    if (hasTransparency) {
      recommendedFormats = ["image/png", "image/webp"];
    } else if (isSimpleGraphic) {
      recommendedFormats = ["image/png", "image/webp", "image/jpeg"];
    } else if (isPhotographic) {
      recommendedFormats = ["image/jpeg", "image/webp"];
    } else {
      recommendedFormats = ["image/webp", "image/jpeg", "image/png"];
    }

    const supportedFormats = this.getSupportedFormats();
    const availableFormats = recommendedFormats.filter((format) =>
      supportedFormats.includes(format),
    );

    return {
      primaryFormat: availableFormats[0] || "image/jpeg",
      fallbackFormats: availableFormats.slice(1),
      reason: this.getFormatSelectionReason(
        hasTransparency,
        isPhotographic,
        isSimpleGraphic,
      ),
    };
  }

  checkTransparency(img: HTMLImageElement): boolean {
    const sampleSize = 50;
    const testCanvas = document.createElement("canvas");
    testCanvas.width = sampleSize;
    testCanvas.height = sampleSize;
    const testCtx = testCanvas.getContext("2d");
    if (!testCtx) return false;
    
    testCtx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const imageData = testCtx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;

    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }

    return false;
  }
  
  getSupportedFormats(): string[] {
    const formats = ["image/jpeg", "image/png"];
    try {
      const testCanvas = document.createElement("canvas");
      testCanvas.width = 1;
      testCanvas.height = 1;
      const webpSupported =
        testCanvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
      if (webpSupported) {
        formats.push("image/webp");
      }
    } catch {
      console.warn("WebP支持检测失败");
    }
    return formats;
  }

  getFormatSelectionReason(hasTransparency: boolean, isPhotographic: boolean, isSimpleGraphic: boolean): string {
    if (hasTransparency) return "检测到透明度，选择PNG格式";
    if (isSimpleGraphic) return "简单图形，PNG格式压缩效果更好";
    if (isPhotographic) return "摄影图像，JPEG格式更适合";
    return "根据图像特征自动选择最优格式";
  }

  // ========== 优化相关辅助方法 ==========

  /**
   * 尝试从缓存中获取压缩结果
   */
  private tryGetFromCache(
    maxFileSize: number,
    img: HTMLImageElement | null,
    config: Partial<ProcessImageConfig>,
    canvas: HTMLCanvasElement,
  ): string | null {
    if (!img || !config.resizeMode) return null;

    const maxSizeBytes = maxFileSize * 1024;
    const imageHash = this.generateImageHash(img);
    const cacheKey = this.generateCacheKey(
      canvas.width,
      canvas.height,
      maxFileSize,
      config.resizeMode,
      imageHash,
    );

    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult && this.getDataUrlSize(cachedResult) <= maxSizeBytes) {
      return cachedResult;
    }

    return null;
  }

  /**
   * 分析图像并选择最优格式
   */
  private analyzeAndSelectFormat(
    img: HTMLImageElement | null,
  ): { format: 'image/jpeg' | 'image/png' | 'image/webp'; quality: number } {
    let quality = ImageProcessor.BINARY_SEARCH_MAX_QUALITY;
    let selectedFormat: 'image/jpeg' | 'image/png' | 'image/webp' = "image/jpeg";

    if (img) {
      const complexity = this.analyzeImageComplexity(img);
      quality = complexity.recommendedStartQuality;
      const formatSelection = this.selectOptimalFormat(img, complexity);
      selectedFormat = formatSelection.primaryFormat;
    }

    return { format: selectedFormat, quality };
  }

  /**
   * 使用二分查找优化压缩质量
   */
  private async optimizeWithBinarySearch(
    maxFileSize: number,
    img: HTMLImageElement | null,
    config: Partial<ProcessImageConfig>,
    canvas: HTMLCanvasElement,
    format: 'image/jpeg' | 'image/png' | 'image/webp',
    startQuality: number,
  ): Promise<string | null> {
    const maxSizeBytes = maxFileSize * 1024;
    let dataUrl: string;

    // 尝试初始质量
    try {
      dataUrl = canvas.toDataURL(format, startQuality);
    } catch {
      dataUrl = canvas.toDataURL(format, startQuality);
    }
    let currentSize = this.getDataUrlSize(dataUrl);

    // 如果初始质量就满足要求，直接返回
    if (currentSize <= maxSizeBytes) {
      this.saveToCacheIfNeeded(img, config, canvas, maxFileSize, dataUrl);
      return dataUrl;
    }

    // 二分查找优化
    let minQuality = ImageProcessor.BINARY_SEARCH_MIN_QUALITY;
    let maxQuality = ImageProcessor.BINARY_SEARCH_MAX_QUALITY;
    let bestDataUrl: string | null = null;
    let precision = ImageProcessor.BINARY_SEARCH_PRECISION;

    // 根据文件大小比例调整精度
    const targetRatio = currentSize / maxSizeBytes;
    if (targetRatio > 2.0) {
      precision = 0.02;
    } else if (targetRatio > 1.5) {
      precision = 0.01;
    }

    let iterationCount = 0;

    while (
      maxQuality - minQuality > precision &&
      iterationCount < ImageProcessor.BINARY_SEARCH_MAX_ITERATIONS
    ) {
      iterationCount++;

      // 根据当前文件大小调整质量比例
      let qualityRatio = 0.5;
      if (currentSize > maxSizeBytes * 1.5) {
        qualityRatio = 0.3;
      } else if (currentSize < maxSizeBytes * 0.8) {
        qualityRatio = 0.7;
      }

      const quality = minQuality + (maxQuality - minQuality) * qualityRatio;

      try {
        dataUrl = canvas.toDataURL(format, quality);
      } catch {
        dataUrl = canvas.toDataURL(format, quality);
      }
      currentSize = this.getDataUrlSize(dataUrl);

      if (currentSize <= maxSizeBytes) {
        bestDataUrl = dataUrl;
        minQuality = quality;
        if (currentSize > maxSizeBytes * 0.9) {
          precision = Math.min(precision, 0.002);
        }
      } else {
        maxQuality = quality;
      }
    }

    if (bestDataUrl && this.getDataUrlSize(bestDataUrl) <= maxSizeBytes) {
      this.saveToCacheIfNeeded(img, config, canvas, maxFileSize, bestDataUrl);
      return bestDataUrl;
    }

    return null;
  }

  /**
   * 线性搜索降级方案
   */
  private async linearSearchFallback(
    maxFileSize: number,
    img: HTMLImageElement | null,
    config: Partial<ProcessImageConfig>,
    canvas: HTMLCanvasElement,
    format: 'image/jpeg' | 'image/png' | 'image/webp',
    startQuality: number,
  ): Promise<string | null> {
    const maxSizeBytes = maxFileSize * 1024;
    let dataUrl: string;
    let currentSize: number;

    for (let q = startQuality; q >= ImageProcessor.BINARY_SEARCH_MIN_QUALITY; q -= 0.01) {
      try {
        dataUrl = canvas.toDataURL(format, q);
      } catch {
        dataUrl = canvas.toDataURL(format, q);
      }
      currentSize = this.getDataUrlSize(dataUrl);

      if (currentSize <= maxSizeBytes) {
        this.saveToCacheIfNeeded(img, config, canvas, maxFileSize, dataUrl);
        return dataUrl;
      }
    }

    return null;
  }

  /**
   * 保存到缓存（如果条件满足）
   */
  private saveToCacheIfNeeded(
    img: HTMLImageElement | null,
    config: Partial<ProcessImageConfig>,
    canvas: HTMLCanvasElement,
    maxFileSize: number,
    dataUrl: string,
  ): void {
    if (!img || !config.resizeMode) return;

    const imageHash = this.generateImageHash(img);
    const cacheKey = this.generateCacheKey(
      canvas.width,
      canvas.height,
      maxFileSize,
      config.resizeMode,
      imageHash,
    );
    this.saveToCache(cacheKey, dataUrl);
  }

  /**
   * 主优化方法 - 重构后的版本
   */
  async optimizeImageQuality(
    maxFileSize: number,
    img: HTMLImageElement | null = null,
    config: Partial<ProcessImageConfig> = {},
    canvas: HTMLCanvasElement | null = this.canvas,
  ): Promise<string> {
    if (!canvas) throw new Error("Canvas not available");

    // 1. 检查缓存
    const cachedResult = this.tryGetFromCache(maxFileSize, img, config, canvas);
    if (cachedResult) return cachedResult;

    // 2. 分析并选择格式
    const { format, quality: startQuality } = this.analyzeAndSelectFormat(img);

    // 3. 二分查找优化
    const binarySearchResult = await this.optimizeWithBinarySearch(
      maxFileSize,
      img,
      config,
      canvas,
      format,
      startQuality,
    );

    if (binarySearchResult) return binarySearchResult;

    // 4. 线性搜索降级
    const linearSearchResult = await this.linearSearchFallback(
      maxFileSize,
      img,
      config,
      canvas,
      format,
      startQuality,
    );

    if (linearSearchResult) return linearSearchResult;

    // 5. 最终降级：尺寸缩减
    const finalResult = await this.fallbackSizeReduction(maxFileSize * 1024);
    this.saveToCacheIfNeeded(img, config, canvas, maxFileSize, finalResult);

    return finalResult;
  }

  async fallbackSizeReduction(maxSizeBytes: number): Promise<string> {
    if (!this.canvas) throw new Error("Canvas not available");
    const originalWidth = this.canvas.width;
    const originalHeight = this.canvas.height;
    
    for (let scale = 0.9; scale >= 0.1; scale -= 0.1) {
      const newWidth = Math.max(1, Math.round(originalWidth * scale));
      const newHeight = Math.max(1, Math.round(originalHeight * scale));

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = newWidth;
      tempCanvas.height = newHeight;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) continue;
      
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = "high";

      tempCtx.drawImage(this.canvas, 0, 0, newWidth, newHeight);
      
      for (let q = 0.9; q >= 0.01; q -= 0.1) {
        const dataUrl = tempCanvas.toDataURL("image/jpeg", q);
        if (this.getDataUrlSize(dataUrl) <= maxSizeBytes) {
          return dataUrl;
        }
      }
    }
    
    const minCanvas = document.createElement("canvas");
    minCanvas.width = 1;
    minCanvas.height = 1;
    const minCtx = minCanvas.getContext("2d");
    if(minCtx) {
        minCtx.fillStyle = "#FFFFFF";
        minCtx.fillRect(0, 0, 1, 1);
    }
    
    return minCanvas.toDataURL("image/jpeg", 0.01);
  }

  getDataUrlSize(dataUrl: string): number {
    const base64 = dataUrl.split(",")[1];
    if (!base64) return 0;
    return Math.round(base64.length * 0.75);
  }
  
  generateFileName(originalName: string, config: Partial<ProcessImageConfig> = {}): string {
    const { format, suffix = "_processed" } = config;
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");

    let extension = ".jpg";
    switch (format) {
      case "image/png":
        extension = ".png";
        break;
      case "image/webp":
        extension = ".webp";
        break;
    }
    
    const timestamp = new Date().getTime();
    return `${nameWithoutExt}${suffix}_${timestamp}${extension}`;
  }

  async batchProcessImages(
    files: File[], 
    config: ProcessImageConfig, 
    progressCallback?: (progress: { processed: number; total: number; progress: number; currentFile: string; results: BatchProcessResult[] }) => void
    ): Promise<BatchProcessResult[]> {
    const results: BatchProcessResult[] = [];
    for (let i = 0; i < files.length; i++) {
       try {
        const result = await this.processImage(files[i], config);
        results.push({
          success: true,
          file: files[i],
          result: result,
          index: i,
        });

        if (progressCallback) {
          progressCallback({
            processed: i + 1,
            total: files.length,
            progress: (i + 1) / files.length,
            currentFile: files[i].name,
            results: results,
          });
        }
      } catch (error: unknown) {
        console.error(`处理文件 ${files[i].name} 时出错:`, error);
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        results.push({
          success: false,
          file: files[i],
          error: errorMessage,
          index: i,
        });
      }
    }
    return results;
  }

  getCapabilities(): Capabilities {
    return {
      canvasSupported: typeof HTMLCanvasElement !== "undefined",
      supportedFormats: this.getSupportedFormats(),
      maxConcurrency: 1, 
    };
  }

  async processImageChunked(file: File, config: ProcessImageConfig): Promise<ProcessedImage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e: ProgressEvent<FileReader>) => {
        try {
          const img = new Image();
          img.onload = async () => {
            const maxChunkSize = 2048;
            const scale = Math.min(
              1,
              maxChunkSize / Math.max(img.width, img.height),
            );
            const chunkWidth = Math.round(img.width * scale);
            const chunkHeight = Math.round(img.height * scale);

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = chunkWidth;
            tempCanvas.height = chunkHeight;
            const tempCtx = tempCanvas.getContext("2d");
            if (!tempCtx) throw new Error("Could not get 2d context for chunking");
            tempCtx.drawImage(img, 0, 0, chunkWidth, chunkHeight);

            const imageData = tempCtx.getImageData(
              0,
              0,
              chunkWidth,
              chunkHeight,
            );
            const result = await this.processImageDataFromChunk(
              imageData,
              config,
              file.name,
              {
                width: img.width,
                height: img.height,
                originalWidth: img.width,
                originalHeight: img.height,
              },
            );
            resolve(result);
          };
          if (e.target?.result) {
            img.src = e.target.result as string;
          } else {
            reject(new Error("文件读取结果为空"));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  async processImageDataFromChunk(imageData: ImageData, config: ProcessImageConfig, fileName: string, originalSize: Dimensions): Promise<ProcessedImage> {
    const { targetWidth, targetHeight, resizeMode } = config;
    const { originalWidth, originalHeight, width, height } = originalSize;

    // 使用实际的宽高作为原始尺寸，如果未提供则使用 width/height
    const origWidth = originalWidth ?? width;
    const origHeight = originalHeight ?? height;

    const dimensions = this.calculateTargetDimensions(
      origWidth,
      origHeight,
      targetWidth,
      targetHeight,
      resizeMode,
    );

    if(!this.canvas) throw new Error("Canvas is not initialized.");

    this.canvas.width = dimensions.width;
    this.canvas.height = dimensions.height;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = origWidth;
    tempCanvas.height = origHeight;
    const tempCtx = tempCanvas.getContext("2d");
    if(!tempCtx) throw new Error("Could not create temp canvas context.")

    const tempImg = await createImageBitmap(imageData);
    tempCtx.drawImage(tempImg, 0, 0, origWidth, origHeight);

    this.drawImageWithMode(
      tempCanvas,
      resizeMode,
      dimensions.width,
      dimensions.height,
    );

    const optimizedDataUrl = await this.optimizeImageQuality(
      config.maxFileSize,
      null, // 不使用 img 参数，直接使用 canvas
      config,
      tempCanvas,
    );
    const fileSize = this.getDataUrlSize(optimizedDataUrl);

    return {
      name: this.generateFileName(fileName, config),
      dataUrl: optimizedDataUrl,
      originalSize: {
        width: origWidth,
        height: origHeight,
        fileSize: 0,
      },
      processedSize: {
        width: dimensions.width,
        height: dimensions.height,
        fileSize,
      },
      sizeReduction: 0,
    };
  }

  getMemoryUsage(): MemoryInfo | null {
    if (typeof performance === 'undefined' || !('memory' in performance)) return null;
    const memory = (performance as Performance & { memory?: MemoryInfo }).memory;
    if (!memory) return null;
    return {
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      totalJSHeapSize: memory.totalJSHeapSize,
      usedJSHeapSize: memory.usedJSHeapSize,
    };
  }

  checkAndCleanMemory(): void {
    const memory = this.getMemoryUsage();
    if (!memory) return;

    const memoryUsageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
    if (memoryUsageRatio > ImageProcessor.MEMORY_CLEANUP_THRESHOLD) {
      console.warn(
        `高内存使用率 (${(memoryUsageRatio * 100).toFixed(2)}%)，正在清理缓存...`,
      );
      this.clearCache();

      // 类型守卫：检查 gc 函数是否存在
      if (typeof window.gc === 'function') {
        window.gc();
      }
    }
  }

  async warmup(): Promise<void> {
    try {
      this.initCanvas();
      console.log("图像处理引擎预热完成");
    } catch (error) {
      console.warn("图像处理引擎预热失败:", error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      this.canvas = null;
      this.ctx = null;
      console.log("图像处理器资源已清理");
    } catch (error) {
      console.error("清理图像处理器资源时出错:", error);
    }
  }

  async reinitialize(): Promise<void> {
    await this.cleanup();
    await this.warmup();
  }
  
  isValidImageFile(file: File): boolean {
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
    ];

    return supportedTypes.includes(file.type.toLowerCase());
  }
  
  isValidFileSize(file: File, maxSize = ImageProcessor.MAX_DIRECT_MEMORY_SIZE): boolean {
    return file.size <= maxSize;
  }

  isValidImageDimensions(img: HTMLImageElement, limits: Partial<Dimensions & {maxWidth: number, maxHeight: number, minWidth: number, minHeight: number}> = {}): boolean {
    const {
      maxWidth = ImageProcessor.MAX_DIMENSION,
      maxHeight = ImageProcessor.MAX_DIMENSION,
      minWidth = ImageProcessor.MIN_DIMENSION,
      minHeight = ImageProcessor.MIN_DIMENSION,
    } = limits;

    return (
      img.width >= minWidth &&
      img.height >= minHeight &&
      img.width <= maxWidth &&
      img.height <= maxHeight
    );
  }

  dispose(): void {
    this.cleanup();
  }

  // ========== 性能监控 ==========

  /**
   * 获取性能统计数据
   *
   * @returns 所有操作的性能统计
   */
  getPerformanceStats(): Record<string, import('./PerformanceMonitor').PerformanceStats> {
    return performanceMonitor.getAllStats();
  }

  /**
   * 重置性能监控数据
   */
  resetPerformanceStats(): void {
    performanceMonitor.reset();
  }

  /**
   * 打印性能报告
   *
   * @param operation - 可选，指定要打印的操作名称
   */
  printPerformanceReport(operation?: string): void {
    performanceMonitor.printReport(operation);
  }
}

const imageProcessor = new ImageProcessor();
export default imageProcessor;
