/**
 * 现代化图片处理工具类 v3.0
 * 基于知识图谱中的现代Web技术栈最佳实践
 * 集成WebAssembly、Web Workers和Canvas API
 * 支持多种图片格式和高性能处理模式
 */
import wasmManager from "./WasmManager.js";

class ImageProcessor {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.worker = null;
    this.wasmEnabled = false;
    this.initCanvas();
    this.initializeEngines();
  }

  /**
   * 初始化Canvas
   */
  initCanvas() {
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");

    // 启用高质量渲染
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
  }

  /**
   * 初始化WASM引擎
   */
  async initializeEngines() {
    try {
      // 初始化WASM管理器
      await wasmManager.initialize();
      this.wasmEnabled = true;
      console.log("WebAssembly引擎已启用");
    } catch (error) {
      console.warn("WebAssembly引擎初始化失败:", error);
      this.wasmEnabled = false;
    }
  }

  /**
   * 处理单张图片
   * @param {File} file - 图片文件
   * @param {Object} config - 处理配置
   * @returns {Promise<Object>} 处理后的图片数据
   */
  async processImage(file, config) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const img = new Image();

          img.onload = async () => {
            try {
              // 根据配置选择处理方式
              let processedImageData;

              if (config.useWasm && this.wasmEnabled) {
                processedImageData = await this.processImageWithWasm(
                  img,
                  config,
                  file.name,
                );
              } else {
                processedImageData = await this.processImageData(
                  img,
                  config,
                  file.name,
                );
              }

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
   * 使用WASM引擎处理图片
   * @param {HTMLImageElement} img - 图片元素
   * @param {Object} config - 处理配置
   * @param {string} fileName - 文件名
   * @returns {Promise<Object>} 处理后的图片数据
   */
  async processImageWithWasm(img, config, fileName) {
    try {
      // 获取WASM图像处理模块
      const wasmProcessor = await wasmManager.getModule("imageProcessor");

      if (!wasmProcessor) {
        throw new Error("WASM图像处理模块未加载");
      }

      // 设置画布尺寸
      this.canvas.width = img.width;
      this.canvas.height = img.height;
      this.ctx.drawImage(img, 0, 0);

      const imageData = this.ctx.getImageData(0, 0, img.width, img.height);

      // 使用WASM进行高性能图像处理
      const processedData = await wasmProcessor.processImage(imageData, config);

      this.ctx.putImageData(processedData, 0, 0);

      return this.canvasToResult(this.canvas, fileName, config);
    } catch (error) {
      console.error("WASM图像处理失败:", error);
      // 降级到基础处理
      return this.processImageData(img, config, fileName);
    }
  }

  /**
   * 应用基础处理（尺寸调整、质量压缩等）
   * @param {HTMLCanvasElement} sourceCanvas - 源画布
   * @param {Object} config - 处理配置
   * @returns {Promise<HTMLCanvasElement>} 处理后的画布
   */
  async applyBasicProcessing(sourceCanvas, config) {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    // 计算目标尺寸
    let { width, height } = this.calculateDimensions(
      sourceCanvas.width,
      sourceCanvas.height,
      config,
    );

    tempCanvas.width = width;
    tempCanvas.height = height;

    // 启用高质量缩放
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";

    // 如果需要填充背景色
    if (config.backgroundColor) {
      tempCtx.fillStyle = config.backgroundColor;
      tempCtx.fillRect(0, 0, width, height);
    }

    tempCtx.drawImage(sourceCanvas, 0, 0, width, height);

    return tempCanvas;
  }

  /**
   * 计算目标尺寸
   * @param {number} originalWidth - 原始宽度
   * @param {number} originalHeight - 原始高度
   * @param {Object} config - 配置对象
   * @returns {Object} 目标尺寸
   */
  calculateDimensions(originalWidth, originalHeight, config) {
    let {
      width,
      height,
      maxWidth,
      maxHeight,
      maintainAspectRatio = true,
      scale,
    } = config;

    // 如果指定了缩放比例
    if (scale && scale !== 1) {
      return {
        width: Math.round(originalWidth * scale),
        height: Math.round(originalHeight * scale),
      };
    }

    // 如果没有指定尺寸，返回原始尺寸
    if (!width && !height && !maxWidth && !maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    // 处理最大尺寸限制
    if (maxWidth || maxHeight) {
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;

      if (maxWidth && originalWidth > maxWidth) {
        targetWidth = maxWidth;
        targetHeight = maintainAspectRatio
          ? targetWidth / aspectRatio
          : originalHeight;
      }

      if (maxHeight && targetHeight > maxHeight) {
        targetHeight = maxHeight;
        targetWidth = maintainAspectRatio
          ? targetHeight * aspectRatio
          : originalWidth;
      }

      width = targetWidth;
      height = targetHeight;
    }

    // 处理指定尺寸
    if (width && !height && maintainAspectRatio) {
      height = width / aspectRatio;
    } else if (height && !width && maintainAspectRatio) {
      width = height * aspectRatio;
    } else if (!width && !height) {
      width = originalWidth;
      height = originalHeight;
    }

    return {
      width: Math.round(width || originalWidth),
      height: Math.round(height || originalHeight),
    };
  }

  /**
   * 将画布转换为结果对象
   * @param {HTMLCanvasElement} canvas - 画布
   * @param {string} fileName - 文件名
   * @param {Object} config - 处理配置
   * @returns {Object} 结果对象
   */
  canvasToResult(canvas, fileName, config) {
    const format = config.format || "image/jpeg";
    const quality = config.quality || 0.9;

    return {
      canvas: canvas,
      dataUrl: canvas.toDataURL(format, quality),
      blob: new Promise((resolve) => canvas.toBlob(resolve, format, quality)),
      fileName: this.generateFileName(fileName, config),
      width: canvas.width,
      height: canvas.height,
      format: format,
      quality: quality,
    };
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
    const { format, suffix = "_processed", useWasm } = config;
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");

    let extension = ".jpg"; // 默认扩展名
    let processingSuffix = suffix;

    // 根据处理类型添加后缀
    if (useWasm) {
      processingSuffix += "_wasm";
    }

    if (format) {
      switch (format) {
        case "image/png":
          extension = ".png";
          break;
        case "image/webp":
          extension = ".webp";
          break;
        case "image/avif":
          extension = ".avif";
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
   * 批量处理图片
   * @param {Array<File>} files - 文件数组
   * @param {Object} config - 处理配置
   * @param {Function} progressCallback - 进度回调
   * @returns {Promise<Array>} 处理结果数组
   */
  async batchProcessImages(files, config, progressCallback) {
    const results = [];
    const total = files.length;
    const concurrency = config.concurrency || 3; // 并发处理数量

    // 如果启用并发处理
    if (concurrency > 1 && total > 1) {
      return this.batchProcessConcurrent(
        files,
        config,
        progressCallback,
        concurrency,
      );
    }

    // 串行处理
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
   * 并发批量处理图片
   * @param {Array<File>} files - 文件数组
   * @param {Object} config - 处理配置
   * @param {Function} progressCallback - 进度回调
   * @param {number} concurrency - 并发数量
   * @returns {Promise<Array>} 处理结果数组
   */
  async batchProcessConcurrent(files, config, progressCallback, concurrency) {
    const results = new Array(files.length);
    let completed = 0;
    const total = files.length;

    const processFile = async (file, index) => {
      try {
        const result = await this.processImage(file, config);
        results[index] = {
          success: true,
          file: file,
          result: result,
          index: index,
        };
      } catch (error) {
        results[index] = {
          success: false,
          file: file,
          error: error.message,
          index: index,
        };
      }

      completed++;

      // 调用进度回调
      if (progressCallback) {
        progressCallback({
          processed: completed,
          total: total,
          progress: completed / total,
          currentFile: file.name,
          results: results.filter((r) => r !== undefined),
        });
      }
    };

    // 创建并发处理队列
    const promises = [];
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = [];
      for (let j = i; j < Math.min(i + concurrency, files.length); j++) {
        batch.push(processFile(files[j], j));
      }
      promises.push(Promise.all(batch));
    }

    await Promise.all(promises);
    return results;
  }

  /**
   * 获取处理能力信息
   * @returns {Object} 能力信息
   */
  getCapabilities() {
    return {
      wasmEnabled: this.wasmEnabled,
      workerSupported: typeof Worker !== "undefined",
      canvasSupported: typeof HTMLCanvasElement !== "undefined",
      webglSupported: this.checkWebGLSupport(),
      supportedFormats: ["image/jpeg", "image/png", "image/webp", "image/avif"],
      maxConcurrency: navigator.hardwareConcurrency || 4,
    };
  }

  /**
   * 检查WebGL支持
   * @returns {boolean} 是否支持WebGL
   */
  checkWebGLSupport() {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    } catch (e) {
      return false;
    }
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
      wasmMemory: 0,
    };

    if (performance.memory) {
      usage.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
      usage.totalJSHeapSize = performance.memory.totalJSHeapSize;
      usage.usedJSHeapSize = performance.memory.usedJSHeapSize;
    }

    if (this.wasmEnabled) {
      usage.wasmMemory = wasmManager.getMemoryUsage();
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

      // 测试基础处理
      const testConfig = { width: 50, height: 50, quality: 0.8 };
      await this.applyBasicProcessing(testCanvas, testConfig);

      // AI功能已移除，跳过AI引擎预热

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
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }

      if (this.canvas) {
        this.canvas = null;
        this.ctx = null;
      }

      this.aiEnabled = false;

      // 清理WASM模块
      if (this.wasmEnabled) {
        await wasmManager.cleanup();
        this.wasmEnabled = false;
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
    await this.initializeEngines();
    await this.warmup();
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
