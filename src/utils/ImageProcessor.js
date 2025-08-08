/**
 * 现代化图片处理工具类 v3.0
 * 基于Canvas API的轻量级图像处理
 * 适用于最低配置VPS部署
 * 支持多种图片格式和基础处理模式
 */

class ImageProcessor {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.initCanvas();
  }

  /**
   * 初始化Canvas
   */
  initCanvas() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    // 启用高质量渲染（仅在支持的环境中）
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
    }
  }

  /**
   * 处理单张图片
   * @param {File} file - 图片文件
   * @param {Object} config - 处理配置
   * @returns {Promise<Object>} 处理后的图片数据
   */
  async processImage(file, config) {
    // 输入验证
    if (!file) {
      throw new Error("文件不能为空");
    }

    if (!this.isValidImageFile(file)) {
      throw new Error(`不支持的文件格式: ${file.type}`);
    }

    if (!this.isValidFileSize(file)) {
      throw new Error(
        `文件过大: ${Math.round(file.size / 1024 / 1024)}MB，最大支持50MB`,
      );
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const img = new Image();

          img.onload = async () => {
            try {
              const processedImageData = await this.processImageData(
                img,
                config,
                file.name,
              );

              resolve(processedImageData);
            } catch (error) {
              reject(error);
            }
          };

          img.onerror = () => {
            reject(new Error(`无法加载图片: ${file.name}`));
          };

          img.src = e.target.result;
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error(`无法读取文件: ${file.name}`));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * 处理图片数据（基础Canvas处理）
   * @param {HTMLImageElement} img - 图片元素
   * @param {Object} config - 处理配置
   * @param {string} fileName - 文件名
   * @returns {Promise<Object>} 处理后的图片数据
   */
  async processImageData(img, config, fileName) {
    const originalWidth = img.width;
    const originalHeight = img.height;

    let targetWidth, targetHeight;

    // 计算目标尺寸
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

    // 设置Canvas尺寸
    this.canvas.width = targetWidth;
    this.canvas.height = targetHeight;

    // 清空Canvas
    this.ctx.clearRect(0, 0, targetWidth, targetHeight);

    // 如果是填充模式，先填充白色背景
    if (config.resizeMode === "keep_ratio_pad") {
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // 绘制图片
    this.drawImageWithMode(img, config.resizeMode, targetWidth, targetHeight);

    // 优化图片质量
    const optimizedDataUrl = await this.optimizeImageQuality(
      config.maxFileSize,
    );

    // 计算文件大小
    const fileSize = this.getDataUrlSize(optimizedDataUrl);

    return {
      name: this.generateFileName(fileName),
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
        fileSize < (img.src ? this.getDataUrlSize(img.src) : fileSize)
          ? Math.round((1 - fileSize / this.getDataUrlSize(img.src)) * 100)
          : 0,
    };
  }

  /**
   * 计算目标尺寸
   * @param {number} originalWidth - 原始宽度
   * @param {number} originalHeight - 原始高度
   * @param {number} targetWidth - 目标宽度
   * @param {number} targetHeight - 目标高度
   * @param {string} mode - 调整模式
   * @returns {Object} 计算后的尺寸
   */
  calculateTargetDimensions(
    originalWidth,
    originalHeight,
    targetWidth,
    targetHeight,
    mode,
  ) {
    if (mode === "stretch") {
      return { width: targetWidth, height: targetHeight };
    }

    const aspectRatio = originalWidth / originalHeight;
    const targetAspectRatio = targetWidth / targetHeight;

    if (mode === "keep_ratio_pad") {
      // 保持比例，填充空白
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
      // 保持比例，裁剪多余部分
      if (aspectRatio > targetAspectRatio) {
        return {
          width: Math.round(targetHeight * aspectRatio),
          height: targetHeight,
        };
      } else {
        return {
          width: targetWidth,
          height: Math.round(targetWidth / aspectRatio),
        };
      }
    }

    return { width: targetWidth, height: targetHeight };
  }

  /**
   * 根据模式绘制图片
   * @param {HTMLImageElement} img - 图片元素
   * @param {string} mode - 绘制模式
   * @param {number} canvasWidth - Canvas宽度
   * @param {number} canvasHeight - Canvas高度
   */
  drawImageWithMode(img, mode, canvasWidth, canvasHeight) {
    const originalWidth = img.width;
    const originalHeight = img.height;

    if (mode === "stretch") {
      // 拉伸模式：直接拉伸到目标尺寸
      this.ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    } else if (mode === "keep_ratio_pad") {
      // 保持比例填充模式：居中绘制，保持比例
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

      this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    } else if (mode === "keep_ratio_crop") {
      // 保持比例裁剪模式：裁剪多余部分
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

      this.ctx.drawImage(
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

  /**
   * 优化图片质量
   * @param {number} maxFileSize - 最大文件大小（KB）
   * @returns {Promise<string>} 优化后的DataURL
   */
  async optimizeImageQuality(maxFileSize) {
    const maxSizeBytes = maxFileSize * 1024;
    let quality = 0.9;
    let dataUrl = this.canvas.toDataURL("image/jpeg", quality);
    let currentSize = this.getDataUrlSize(dataUrl);

    // 如果初始大小已经小于限制，直接返回
    if (currentSize <= maxSizeBytes) {
      return dataUrl;
    }

    // 使用二分查找法快速找到最优质量
    let minQuality = 0.1;
    let maxQuality = 0.9;
    let bestDataUrl = null;

    while (maxQuality - minQuality > 0.01) {
      quality = (minQuality + maxQuality) / 2;
      dataUrl = this.canvas.toDataURL("image/jpeg", quality);
      currentSize = this.getDataUrlSize(dataUrl);

      if (currentSize <= maxSizeBytes) {
        bestDataUrl = dataUrl;
        minQuality = quality;
      } else {
        maxQuality = quality;
      }
    }

    // 如果找到合适的质量，返回最佳结果
    if (bestDataUrl) {
      return bestDataUrl;
    }

    // 如果仍然无法满足大小要求，使用最低质量
    return this.canvas.toDataURL("image/jpeg", 0.1);
  }

  /**
   * 获取DataURL的大小（字节）
   * @param {string} dataUrl - DataURL
   * @returns {number} 大小（字节）
   */
  getDataUrlSize(dataUrl) {
    const base64 = dataUrl.split(",")[1];
    return Math.round(base64.length * 0.75);
  }

  /**
   * 生成处理后的文件名
   * @param {string} originalName - 原始文件名
   * @param {Object} config - 配置对象
   * @returns {string} 新文件名
   */
  generateFileName(originalName, config = {}) {
    const { format, suffix = "_processed" } = config;
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");

    let extension = ".jpg"; // 默认扩展名
    let processingSuffix = suffix;

    if (format) {
      switch (format) {
        case "image/png":
          extension = ".png";
          break;
        case "image/webp":
          extension = ".webp";
          break;
        case "image/jpeg":
        default:
          extension = ".jpg";
          break;
      }
    }

    const timestamp = new Date().getTime();
    return `${nameWithoutExt}${processingSuffix}_${timestamp}${extension}`;
  }

  /**
   * 批量处理图片（简化版，仅支持串行处理）
   * @param {Array<File>} files - 文件数组
   * @param {Object} config - 处理配置
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Array>} 处理结果数组
   */
  async batchProcessImages(files, config, progressCallback) {
    const results = [];

    // 串行处理以节约内存
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
      } catch (error) {
        console.error(`处理文件 ${files[i].name} 时出错:`, error);
        results.push({
          success: false,
          file: files[i],
          error: error.message,
          index: i,
        });
      }
    }

    return results;
  }

  /**
   * 获取处理能力信息
   * @returns {Object} 能力信息
   */
  getCapabilities() {
    return {
      canvasSupported: typeof HTMLCanvasElement !== "undefined",
      supportedFormats: ["image/jpeg", "image/png", "image/webp"],
      maxConcurrency: 1, // 低配置环境仅支持单线程
    };
  }

  /**
   * 获取内存使用情况
   * @returns {Object} 内存使用信息
   */
  getMemoryUsage() {
    const usage = {
      jsHeapSizeLimit: 0,
      totalJSHeapSize: 0,
      usedJSHeapSize: 0,
    };

    if (performance.memory) {
      usage.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
      usage.totalJSHeapSize = performance.memory.totalJSHeapSize;
      usage.usedJSHeapSize = performance.memory.usedJSHeapSize;
    }

    return usage;
  }

  /**
   * 预热处理引擎
   * @returns {Promise<void>}
   */
  async warmup() {
    try {
      // 创建一个小的测试图像
      const testCanvas = document.createElement("canvas");
      testCanvas.width = 100;
      testCanvas.height = 100;
      const testCtx = testCanvas.getContext("2d");
      testCtx.fillStyle = "#ff0000";
      testCtx.fillRect(0, 0, 100, 100);

      console.log("图像处理引擎预热完成");
    } catch (error) {
      console.warn("图像处理引擎预热失败:", error);
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    try {
      if (this.canvas) {
        this.canvas = null;
        this.ctx = null;
      }

      console.log("图像处理器资源已清理");
    } catch (error) {
      console.error("清理图像处理器资源时出错:", error);
    }
  }

  /**
   * 重新初始化处理器
   * @returns {Promise<void>}
   */
  async reinitialize() {
    await this.cleanup();
    this.initCanvas();
    await this.warmup();
  }

  /**
   * 验证图片文件类型
   * @param {File} file - 文件对象
   * @returns {boolean} 是否为有效的图片文件
   */
  isValidImageFile(file) {
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

  /**
   * 验证文件大小
   * @param {File} file - 文件对象
   * @param {number} maxSize - 最大大小（字节）
   * @returns {boolean} 是否在大小限制内
   */
  isValidFileSize(file, maxSize = 50 * 1024 * 1024) {
    // 默认50MB
    return file.size <= maxSize;
  }

  /**
   * 验证图片尺寸
   * @param {HTMLImageElement} img - 图片元素
   * @param {Object} limits - 尺寸限制
   * @returns {boolean} 是否在尺寸限制内
   */
  isValidImageDimensions(img, limits = {}) {
    const {
      maxWidth = 8192,
      maxHeight = 8192,
      minWidth = 1,
      minHeight = 1,
    } = limits;

    return (
      img.width >= minWidth &&
      img.height >= minHeight &&
      img.width <= maxWidth &&
      img.height <= maxHeight
    );
  }

  /**
   * 销毁处理器实例
   */
  dispose() {
    this.cleanup();
  }
}

// 创建单例实例
const imageProcessor = new ImageProcessor();

export default imageProcessor;
