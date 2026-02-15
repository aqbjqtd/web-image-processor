import { ProcessImageConfig, ProcessedImage } from "./ImageProcessor";
import { logger } from "./logger";

// 类型定义
interface Task {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

interface WorkerStatus {
  supported: boolean;
  initialized: boolean;
  totalWorkers: number;
  availableWorkers: number;
  activeTasks: number;
  maxWorkers: number;
}

/**
 * Web Worker 管理器（单例模式）
 *
 * 管理多个 Web Worker 进行并行图像处理，避免阻塞主线程：
 *
 * - Worker 池管理（最多 4 个 Worker）
 * - 任务队列机制
 * - 自动降级到主线程（OffscreenCanvas 不支持时）
 * - 任务超时控制（默认 30 秒）
 *
 * @example
 * ```typescript
 * import workerManager from './utils/WorkerManager';
 *
 * // 初始化 Worker 池
 * const supported = await workerManager.init();
 * if (!supported) {
 *   console.log('Worker 不支持，将使用主线程处理');
 * }
 *
 * // 处理图像
 * try {
 *   const result = await workerManager.processImage(imageData, config, 1920, 1080);
 *   console.log('处理完成:', result);
 * } catch (error) {
 *   console.error('处理失败:', error);
 * }
 *
 * // 查看状态
 * const status = workerManager.getStatus();
 * console.log('可用 Worker:', status.availableWorkers);
 *
 * // 清理资源
 * workerManager.dispose();
 * ```
 */
class WorkerManager {
  private workers: Worker[] = [];
  private workerQueue: Worker[] = [];
  private tasks: Map<string, Task> = new Map();
  private taskIdCounter = 0;
  private maxWorkers: number;
  private workerSupported = false;
  private initialized = false;

  constructor() {
    this.maxWorkers =
      typeof navigator !== "undefined"
        ? Math.min(4, navigator.hardwareConcurrency || 2)
        : 2;
  }

  /**
   * 初始化 Worker 池
   *
   * 创建指定数量的 Worker 并检测功能支持：
   * - OffscreenCanvas 支持
   * - ImageBitmap 支持
   *
   * @returns Promise<boolean> - 是否成功初始化 Worker 池
   */
  async init(): Promise<boolean> {
    if (this.initialized) {
      return this.workerSupported;
    }

    try {
      if (typeof Worker === "undefined") {
        logger.warn("Web Workers not supported");
        this.workerSupported = false;
        this.initialized = true;
        return false;
      }

      const testWorker = await this.createWorker();
      const support = await this.checkWorkerSupport(testWorker);

      if (support.offscreenCanvasSupported && support.imageBitmapSupported) {
        this.workerSupported = true;
        this.workerQueue.push(testWorker);

        for (let i = 1; i < this.maxWorkers; i++) {
          const worker = await this.createWorker();
          this.workerQueue.push(worker);
        }
        logger.log(`Worker管理器初始化成功，创建了${this.maxWorkers}个Worker`);
      } else {
        logger.warn("Worker功能支持不完整，回退到主线程处理");
        testWorker.terminate();
        this.workerSupported = false;
      }
    } catch (error) {
      logger.warn("Worker初始化失败:", error);
      this.workerSupported = false;
    }

    this.initialized = true;
    return this.workerSupported;
  }

  private async createWorker(): Promise<Worker> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(
          new URL("../workers/imageWorker.ts", import.meta.url),
        );
        worker.onerror = (error) => {
          logger.error("Worker错误:", error);
          reject(error);
        };
        worker.onmessage = (e: MessageEvent) => {
          this.handleWorkerMessage(worker, e);
        };
        this.workers.push(worker);
        resolve(worker);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 验证 Size 对象的结构
   * Size 对象包含 width、height 和 fileSize 属性
   */
  private isValidSize(size: unknown): size is {
    width: number;
    height: number;
    fileSize: number;
  } {
    if (typeof size !== "object" || size === null) {
      return false;
    }

    const obj = size as Record<string, unknown>;
    return (
      "width" in obj &&
      "height" in obj &&
      "fileSize" in obj &&
      typeof obj.width === "number" &&
      typeof obj.height === "number" &&
      typeof obj.fileSize === "number" &&
      !isNaN(obj.width) &&
      !isNaN(obj.height) &&
      !isNaN(obj.fileSize) &&
      obj.width > 0 &&
      obj.height > 0 &&
      obj.fileSize >= 0
    );
  }

  // 类型守卫函数，确保 Worker 支持检查返回的数据类型安全
  private isWorkerSupportData(data: unknown): data is {
    offscreenCanvasSupported: boolean;
    imageBitmapSupported: boolean;
  } {
    if (typeof data !== "object" || data === null) {
      return false;
    }

    const obj = data as Record<string, unknown>;
    return (
      "offscreenCanvasSupported" in obj &&
      "imageBitmapSupported" in obj &&
      typeof obj.offscreenCanvasSupported === "boolean" &&
      typeof obj.imageBitmapSupported === "boolean"
    );
  }

  // 类型守卫函数，确保图像处理结果数据类型安全
  private isProcessedImage(data: unknown): data is ProcessedImage {
    if (typeof data !== "object" || data === null) {
      return false;
    }

    const obj = data as Record<string, unknown>;

    // 验证必需的顶级属性
    if (
      !("name" in obj) ||
      !("dataUrl" in obj) ||
      !("originalSize" in obj) ||
      !("processedSize" in obj) ||
      !("sizeReduction" in obj)
    ) {
      return false;
    }

    // 验证基本属性类型
    if (
      typeof obj.name !== "string" ||
      typeof obj.dataUrl !== "string" ||
      typeof obj.sizeReduction !== "number"
    ) {
      return false;
    }

    // 验证嵌套的 Size 对象结构
    if (!this.isValidSize(obj.originalSize)) {
      return false;
    }

    if (!this.isValidSize(obj.processedSize)) {
      return false;
    }

    // 验证 sizeReduction 是有效数字
    if (isNaN(obj.sizeReduction)) {
      return false;
    }

    return true;
  }

  private async checkWorkerSupport(worker: Worker): Promise<{
    offscreenCanvasSupported: boolean;
    imageBitmapSupported: boolean;
  }> {
    return new Promise((resolve, reject) => {
      const taskId = this.generateTaskId();
      const timeout = setTimeout(() => {
        reject(new Error("Worker支持检查超时"));
      }, 5000);

      this.tasks.set(taskId, {
        resolve: (data) => {
          clearTimeout(timeout);
          if (this.isWorkerSupportData(data)) {
            resolve(data);
          } else {
            reject(new Error("Worker支持检查返回数据格式错误"));
          }
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      worker.postMessage({
        id: taskId,
        type: "CHECK_SUPPORT",
      });
    });
  }

  private handleWorkerMessage(worker: Worker, e: MessageEvent): void {
    const { id, success, data, error } = e.data;
    const task = this.tasks.get(id);

    if (!task) {
      logger.warn("收到未知任务的Worker响应:", id);
      return;
    }

    if (this.workerQueue.indexOf(worker) === -1) {
      this.workerQueue.push(worker);
    }

    this.tasks.delete(id);

    if (success) {
      if (this.isWorkerSupportData(data)) {
        task.resolve(data);
      } else {
        task.reject(new Error("Worker返回数据格式错误"));
      }
    } else {
      task.reject(new Error(error || "Worker任务失败"));
    }
  }

  /**
   * 使用 Worker 处理图像
   *
   * @param imageData - 图像数据
   * @param config - 处理配置
   * @param targetWidth - 目标宽度
   * @param targetHeight - 目标高度
   * @returns Promise<ProcessedImage> - 处理后的图像数据
   * @throws {Error} - 如果 Worker 不可用
   */
  async processImage(
    imageData: ImageData,
    config: ProcessImageConfig,
    targetWidth: number,
    targetHeight: number,
  ): Promise<ProcessedImage> {
    if (!this.workerSupported) {
      throw new Error("Worker不可用，请使用主线程处理");
    }

    const worker = await this.getAvailableWorker();

    return new Promise((resolve, reject) => {
      const taskId = this.generateTaskId();
      const timeout = setTimeout(() => {
        reject(new Error("图像处理超时"));
      }, 30000);

      this.tasks.set(taskId, {
        resolve: (data: unknown) => {
          clearTimeout(timeout);
          if (this.isProcessedImage(data)) {
            resolve(data);
          } else {
            reject(new Error("Worker返回图像处理结果格式错误"));
          }
        },
        reject: (error: unknown) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      worker.postMessage({
        id: taskId,
        type: "PROCESS_IMAGE",
        data: {
          imageData,
          config,
          targetWidth,
          targetHeight,
        },
      });
    });
  }

  /**
   * 获取可用 Worker，带超时机制
   * @throws {Error} 当 30 秒内无可用 Worker 时抛出超时错误
   */
  private async getAvailableWorker(): Promise<Worker> {
    const WORKER_TIMEOUT = 30000; // 30 秒超时
    const POLL_INTERVAL = 10; // 10 毫秒轮询间隔

    const workerPromise = new Promise<Worker>((resolve) => {
      const checkForWorker = () => {
        if (this.workerQueue.length > 0) {
          const worker = this.workerQueue.shift()!;
          resolve(worker);
        } else {
          setTimeout(checkForWorker, POLL_INTERVAL);
        }
      };
      checkForWorker();
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            `获取 Worker 超时：${WORKER_TIMEOUT}ms 内无可用 Worker。` +
              `当前状态：总数=${this.workers.length}，空闲=${this.workerQueue.length}，活动任务=${this.tasks.size}`,
          ),
        );
      }, WORKER_TIMEOUT);
    });

    return Promise.race([workerPromise, timeoutPromise]);
  }

  /**
   * 生成唯一任务 ID
   *
   * @returns 任务 ID (格式: task_{counter}_{timestamp})
   */
  private generateTaskId(): string {
    return `task_${this.taskIdCounter++}_${Date.now()}`;
  }

  /**
   * 获取 Worker 状态
   *
   * @returns Worker 状态信息
   */
  getStatus(): WorkerStatus {
    return {
      supported: this.workerSupported,
      initialized: this.initialized,
      totalWorkers: this.workers.length,
      availableWorkers: this.workerQueue.length,
      activeTasks: this.tasks.size,
      maxWorkers: this.maxWorkers,
    };
  }

  /**
   * 清理所有 Worker 资源
   *
   * 终止所有 Worker 并清空任务队列
   */
  dispose(): void {
    this.workers.forEach((worker) => {
      worker.terminate();
    });

    this.workers = [];
    this.workerQueue = [];
    this.tasks.clear();
    this.initialized = false;
    this.workerSupported = false;

    logger.log("Worker管理器已清理");
  }
}

const workerManager = new WorkerManager();
export default workerManager;
