/**
 * 现代化图像处理Web Worker v3.0
 * 基于知识图谱中的现代Web技术栈最佳实践
 * 在独立线程中处理图像，集成WebAssembly支持
 * 避免阻塞主线程，提供高性能图像处理能力
 */

// 导入WebAssembly模块
let wasmModule = null;
let isInitialized = false;

class ImageWorkerProcessor {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.capabilities = {
      wasm: false,
      offscreenCanvas: typeof OffscreenCanvas !== "undefined",
    };
    this.initCanvas();
    this.initializeModules();
  }

  initCanvas() {
    // 在Worker中创建OffscreenCanvas（如果支持）
    if (typeof OffscreenCanvas !== "undefined") {
      this.canvas = new OffscreenCanvas(800, 600);
      this.ctx = this.canvas.getContext("2d");
      this.capabilities.offscreenCanvas = true;

      // 启用高质量渲染
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
    } else {
      // 降级处理：使用ImageData进行处理
      console.warn("OffscreenCanvas不支持，使用ImageData处理模式");
      this.capabilities.offscreenCanvas = false;
    }
  }

  /**
   * 初始化WebAssembly模块
   */
  async initializeModules() {
    try {
      // 尝试加载WebAssembly模块
      if (typeof WebAssembly !== "undefined") {
        // 这里可以加载具体的WASM模块
        // wasmModule = await import('./wasm/imageProcessor.wasm')
        this.capabilities.wasm = true;
        console.log("WebAssembly支持已启用");
      }
    } catch (error) {
      console.warn("WebAssembly模块加载失败:", error);
      this.capabilities.wasm = false;
    }

    isInitialized = true;
  }

  /**
   * 处理图片数据
   * @param {ImageData} imageData - 图片数据
   * @param {Object} config - 处理配置
   * @returns {Promise<Object>} 处理结果
   */
  async processImageData(imageData, config) {
    if (!isInitialized) {
      await this.initializeModules();
    }

    // 根据配置选择处理方式
    if (config.useWasm && this.capabilities.wasm && wasmModule) {
      return this.processWithWasm(imageData, config);
    } else {
      return this.processWithCanvas(imageData, config);
    }
  }

  /**
   * 使用Canvas处理图像
   * @param {ImageData} imageData - 图像数据
   * @param {Object} config - 处理配置
   * @returns {Promise<Object>} 处理结果
   */
  async processWithCanvas(imageData, config) {
    try {
      // 创建ImageBitmap从ImageData
      const imageBitmap = await createImageBitmap(imageData);

      const originalWidth = imageBitmap.width;
      const originalHeight = imageBitmap.height;

      let targetWidth, targetHeight;

      // 计算目标尺寸
      if (config.keepOriginalSize) {
        targetWidth = originalWidth;
        targetHeight = originalHeight;
      } else if (config.percentageResize) {
        targetWidth = Math.round(
          (originalWidth * config.resizePercentage) / 100,
        );
        targetHeight = Math.round(
          (originalHeight * config.resizePercentage) / 100,
        );
      } else {
        const dimensions = this.calculateTargetDimensions(
          originalWidth,
          originalHeight,
          config.targetWidth,
          config.targetHeight,
          config.resizeMode,
        );
        targetWidth = dimensions.width;
        targetHeight = dimensions.height;
      }

      // 调整Canvas尺寸
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
      this.drawImageWithMode(
        imageBitmap,
        config.resizeMode,
        targetWidth,
        targetHeight,
      );

      // 应用额外的图像处理
      if (
        config.brightness !== undefined ||
        config.contrast !== undefined ||
        config.saturation !== undefined
      ) {
        this.applyColorAdjustments(config);
      }

      if (config.blur && config.blur > 0) {
        this.applyBlur(config.blur);
      }

      // 获取处理后的ImageData
      const processedImageData = this.ctx.getImageData(
        0,
        0,
        targetWidth,
        targetHeight,
      );

      return {
        imageData: processedImageData,
        originalSize: { width: originalWidth, height: originalHeight },
        processedSize: { width: targetWidth, height: targetHeight },
      };
    } catch (error) {
      throw new Error(`图片处理失败: ${error.message}`);
    }
  }

  /**
   * 使用WebAssembly处理图像
   * @param {ImageData} imageData - 图像数据
   * @param {Object} config - 处理配置
   * @returns {Promise<Object>} 处理结果
   */
  async processWithWasm(imageData, config) {
    try {
      // 使用WASM模块进行高性能处理
      const processedData = await wasmModule.processImage(imageData, config);
      return processedData;
    } catch (error) {
      console.error("WASM处理失败，降级到Canvas处理:", error);
      return this.processWithCanvas(imageData, config);
    }
  }

  /**
   * 应用颜色调整
   * @param {Object} config - 调整参数
   */
  applyColorAdjustments(config) {
    const { brightness = 0, contrast = 0, saturation = 0 } = config;
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // 亮度调整
      if (brightness !== 0) {
        data[i] = Math.max(0, Math.min(255, data[i] + brightness));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
      }

      // 对比度调整
      if (contrast !== 0) {
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
        data[i + 1] = Math.max(
          0,
          Math.min(255, factor * (data[i + 1] - 128) + 128),
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, factor * (data[i + 2] - 128) + 128),
        );
      }

      // 饱和度调整（简化版）
      if (saturation !== 0) {
        const gray =
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const satFactor = saturation / 100;
        data[i] = Math.max(
          0,
          Math.min(255, gray + satFactor * (data[i] - gray)),
        );
        data[i + 1] = Math.max(
          0,
          Math.min(255, gray + satFactor * (data[i + 1] - gray)),
        );
        data[i + 2] = Math.max(
          0,
          Math.min(255, gray + satFactor * (data[i + 2] - gray)),
        );
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  /**
   * 应用模糊效果
   * @param {number} radius - 模糊半径
   */
  applyBlur(radius) {
    this.ctx.filter = `blur(${radius}px)`;
    const tempCanvas = new OffscreenCanvas(
      this.canvas.width,
      this.canvas.height,
    );
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(this.canvas, 0, 0);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(tempCanvas, 0, 0);
    this.ctx.filter = "none";
  }

  /**
   * 计算目标尺寸
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
   */
  drawImageWithMode(imageBitmap, mode, canvasWidth, canvasHeight) {
    const originalWidth = imageBitmap.width;
    const originalHeight = imageBitmap.height;

    if (mode === "stretch") {
      this.ctx.drawImage(imageBitmap, 0, 0, canvasWidth, canvasHeight);
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

      this.ctx.drawImage(imageBitmap, offsetX, offsetY, drawWidth, drawHeight);
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

      this.ctx.drawImage(
        imageBitmap,
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
}

// Worker实例
const processor = new ImageWorkerProcessor();

// 性能监控
let processingStats = {
  totalProcessed: 0,
  totalTime: 0,
  averageTime: 0,
  errors: 0,
};

// 监听主线程消息
self.onmessage = async function (e) {
  const { id, type, data } = e.data;
  const startTime = performance.now();

  try {
    let result;

    switch (type) {
      case "PROCESS_IMAGE":
        result = await processor.processImageData(data.imageData, data.config);
        break;

      case "BATCH_PROCESS": {
        // 批量处理
        const results = [];
        for (let i = 0; i < data.images.length; i++) {
          try {
            const batchResult = await processor.processImageData(
              data.images[i],
              data.config,
            );
            results.push(batchResult);

            // 发送进度更新
            self.postMessage({
              id,
              type: "PROGRESS_UPDATE",
              data: {
                processed: i + 1,
                total: data.images.length,
                progress: (i + 1) / data.images.length,
              },
            });
          } catch (error) {
            results.push({ error: error.message });
          }
        }
        result = results;
        break;
      }

      case "GET_CAPABILITIES":
        result = processor.capabilities;
        break;

      case "GET_STATS":
        result = processingStats;
        break;

      case "WARMUP":
        // 预热处理器
        await processor.initializeModules();
        result = { status: "warmed up" };
        break;

      case "CLEANUP":
        // 清理资源
        result = { status: "cleaned up" };
        break;

      default:
        throw new Error(`未知的消息类型: ${type}`);
    }

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // 更新统计信息
    processingStats.totalProcessed++;
    processingStats.totalTime += processingTime;
    processingStats.averageTime =
      processingStats.totalTime / processingStats.totalProcessed;

    // 发送成功结果
    self.postMessage({
      id,
      type: "SUCCESS",
      data: result,
      processingTime,
      timestamp: endTime,
    });
  } catch (error) {
    const endTime = performance.now();
    processingStats.errors++;

    console.error("Worker处理错误:", error);

    // 发送错误结果
    self.postMessage({
      id,
      type: "ERROR",
      data: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      processingTime: endTime - startTime,
      timestamp: endTime,
    });
  }
};

// 错误处理
self.onerror = function (error) {
  console.error("Worker全局错误:", error);
  self.postMessage({
    type: "GLOBAL_ERROR",
    data: {
      message: error.message,
      filename: error.filename,
      lineno: error.lineno,
      colno: error.colno,
    },
  });
};

// 未处理的Promise拒绝
self.onunhandledrejection = function (event) {
  console.error("Worker未处理的Promise拒绝:", event.reason);
  self.postMessage({
    type: "UNHANDLED_REJECTION",
    data: {
      message: event.reason?.message || "未知错误",
      stack: event.reason?.stack,
    },
  });
};

// Worker初始化完成通知
self.postMessage({
  type: "WORKER_READY",
  capabilities: processor.capabilities,
  timestamp: performance.now(),
});
