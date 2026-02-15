import { ProcessImageConfig, ProcessedImage } from "./ImageProcessor";
import { CacheManager } from "./CacheManager";
import { logger } from "./logger";

/**
 * 并行处理配置
 */
export interface ParallelConfig {
  /** 最大并发数 */
  maxConcurrency?: number;
  /** 任务超时时间（毫秒） */
  taskTimeout?: number;
  /** 失败重试次数 */
  retryAttempts?: number;
  /** 是否启用内存监控 */
  enableMemoryMonitoring?: boolean;
}

/**
 * 并行处理状态
 */
export interface ParallelProcessingState {
  /** 总任务数 */
  totalTasks: number;
  /** 已完成任务数 */
  completedTasks: number;
  /** 失败任务数 */
  failedTasks: number;
  /** 当前并发数 */
  activeWorkers: number;
  /** 开始时间 */
  startTime: number;
  /** 是否正在处理 */
  isProcessing: boolean;
  /** 是否已暂停 */
  isPaused: boolean;
}

/**
 * 任务结果
 */
export interface TaskResult {
  /** 成功 */
  success: boolean;
  /** 图像数据 */
  data?: ProcessedImage;
  /** 错误信息 */
  error?: string;
  /** 处理时间 */
  processingTime: number;
  /** 任务索引 */
  index: number;
}

/**
 * 并行处理管理器
 * 提供高性能的并发图像处理能力
 */
export class ParallelProcessingManager {
  private config: Required<ParallelConfig>;
  private cacheManager: CacheManager;
  private state: ParallelProcessingState;
  private taskQueue: Array<{
    file: File;
    config: ProcessImageConfig;
    targetWidth: number;
    targetHeight: number;
    resolve: (result: TaskResult) => void;
    reject: (error: Error) => void;
    retryCount: number;
    timeout?: NodeJS.Timeout;
  }> = [];
  private activeTasks: Set<string> = new Set();
  private completedTasks: Set<string> = new Set();
  private processingHistory: Map<string, number> = new Map();

  constructor(cacheManager: CacheManager, config: ParallelConfig = {}) {
    this.config = {
      maxConcurrency:
        config.maxConcurrency ||
        Math.min(4, navigator.hardwareConcurrency || 2),
      taskTimeout: config.taskTimeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      enableMemoryMonitoring: config.enableMemoryMonitoring !== false,
    };

    this.cacheManager = cacheManager;
    this.state = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      activeWorkers: 0,
      startTime: 0,
      isProcessing: false,
      isPaused: false,
    };
  }

  /**
   * 添加任务到队列
   */
  addTask(
    file: File,
    config: ProcessImageConfig,
    targetWidth: number,
    targetHeight: number,
  ): Promise<TaskResult> {
    return new Promise((resolve, reject) => {
      this.generateTaskId(file.name, config);

      this.taskQueue.push({
        file,
        config,
        targetWidth,
        targetHeight,
        resolve,
        reject,
        retryCount: 0,
      });

      this.state.totalTasks++;
      this.processQueue();
    });
  }

  /**
   * 批量处理文件
   */
  async processFiles(
    files: File[],
    config: ProcessImageConfig,
    targetWidth: number,
    targetHeight: number,
  ): Promise<TaskResult[]> {
    this.reset();
    this.state.startTime = Date.now();
    this.state.isProcessing = true;
    this.state.totalTasks = files.length;

    logger.log(
      `开始并行处理 ${files.length} 个文件，并发数: ${this.config.maxConcurrency}`,
    );

    // 检查缓存
    const tasksWithCache = files.map((file) => {
      const cachedResult = this.cacheManager.get(
        file.name,
        config,
        targetWidth,
        targetHeight,
      );

      if (cachedResult) {
        logger.log(`缓存命中: ${file.name}`);
        this.processingHistory.set(file.name, Date.now());
        this.completedTasks.add(file.name);
        this.state.completedTasks++;
        logger.log(`缓存任务完成: ${file.name}`);
        return null;
      }

      return {
        file,
        config,
        targetWidth,
        targetHeight,
        resolve: () => {
          this.completedTasks.add(file.name);
          this.state.completedTasks++;
          logger.log(`任务完成: ${file.name}`);
        },
        reject: (error: Error) => {
          this.state.failedTasks++;
          logger.error(`任务失败: ${file.name}:`, error);
        },
        retryCount: 0,
      };
    });

    // 过滤已缓存的文件
    const uncachedTasks = tasksWithCache.filter(
      (task): task is NonNullable<typeof task> => task !== null,
    );

    if (uncachedTasks.length === 0) {
      logger.log("所有文件都已在缓存中");
      return [];
    }

    // 按文件大小排序，大文件优先处理
    uncachedTasks.sort((a, b) => b.file.size - a.file.size);

    // 并发处理
    const results = await this.processConcurrently(uncachedTasks);

    return results;
  }

  /**
   * 并发处理任务
   */
  private async processConcurrently(
    tasks: Array<{
      file: File;
      config: ProcessImageConfig;
      targetWidth: number;
      targetHeight: number;
      resolve: (result: TaskResult) => void;
      reject: (error: Error) => void;
      retryCount: number;
      timeout?: NodeJS.Timeout;
    }>,
  ): Promise<TaskResult[]> {
    const results: TaskResult[] = [];
    const semaphore = new Semaphore(this.config.maxConcurrency);

    // 创建所有任务Promise
    const taskPromises = tasks.map(async (task, _index) => {
      try {
        // 等待信号量
        await semaphore.acquire();

        this.activeTasks.add(task.file.name);

        // 检查任务是否已完成
        if (this.completedTasks.has(task.file.name)) {
          logger.log(`任务 ${task.file.name} 已完成，跳过`);
          return;
        }

        // 执行任务
        const result = await this.executeTask(task);

        if (result.success && result.data) {
          this.cacheManager.set(
            task.file.name,
            task.config,
            task.targetWidth,
            task.targetHeight,
            result.data,
          );
        }

        return result;
      } finally {
        this.activeTasks.delete(task.file.name);
        semaphore.release();

        // 清理超时
        if (task.timeout) {
          clearTimeout(task.timeout);
        }
      }
    });

    // 等待所有任务完成
    const settledResults = await Promise.allSettled(taskPromises);

    // 收集结果
    for (let i = 0; i < settledResults.length; i++) {
      const result = settledResults[i];
      const task = tasks[i];

      if (result.status === "fulfilled" && result.value) {
        results.push(result.value);
      } else {
        // 任务失败，记录错误
        logger.error(`任务失败: ${task.file.name}`, result);
        this.state.failedTasks++;

        // 检查是否需要重试
        if (task.retryCount < this.config.retryAttempts) {
          logger.log(
            `重试任务: ${task.file.name} (${task.retryCount + 1}/${this.config.retryAttempts})`,
          );

          // 创建重试任务
          const retryTask = {
            ...task,
            retryCount: task.retryCount + 1,
          };

          this.taskQueue.unshift(retryTask);
        }
      }
    }

    return results;
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: {
    file: File;
    config: ProcessImageConfig;
    targetWidth: number;
    targetHeight: number;
    resolve: (result: TaskResult) => void;
    reject: (error: Error) => void;
    retryCount: number;
    timeout?: NodeJS.Timeout;
  }): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // 设置超时
      if (this.config.taskTimeout > 0) {
        task.timeout = setTimeout(() => {
          logger.warn(`任务超时: ${task.file.name}`);
        }, this.config.taskTimeout);
      }

      // 检查内存使用情况
      if (this.config.enableMemoryMonitoring) {
        this.checkMemoryUsage();
      }

      // 动态导入ImageProcessor避免循环依赖
      const { default: imageProcessor } = await import("./ImageProcessor");

      const result = await imageProcessor.processImage(task.file, task.config);
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: result,
        processingTime,
        index: 0,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // 清理超时
      if (task.timeout) {
        clearTimeout(task.timeout);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTime,
        index: 0,
      };
    }
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage(): void {
    const memoryInfo = this.getMemoryInfo();

    if (memoryInfo.usedJSHeapSize > memoryInfo.totalJSHeapSize * 0.8) {
      logger.warn(
        `内存使用率较高: ${(memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100}%`,
      );
      logger.warn("建议减少并发数或启用更积极的缓存清理策略");

      // 可以触发更积极的清理
      this.cacheManager.optimize();
    }
  }

  /**
   * 获取内存信息
   */
  private getMemoryInfo() {
    if (typeof performance !== "undefined" && performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      };
    }

    // 降级处理
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 0,
    };
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.state = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      activeWorkers: 0,
      startTime: 0,
      isProcessing: false,
      isPaused: false,
    };

    this.taskQueue = [];
    this.activeTasks.clear();
    this.completedTasks.clear();
    this.processingHistory.clear();
  }

  /**
   * 暂停处理
   */
  pause(): void {
    this.state.isPaused = true;
    logger.log("处理已暂停");
  }

  /**
   * 恢复处理
   */
  resume(): void {
    this.state.isPaused = false;
    logger.log("处理已恢复");
    this.processQueue();
  }

  /**
   * 停止处理
   */
  stop(): void {
    this.state.isProcessing = false;
    this.state.isPaused = false;

    // 清理所有超时
    this.taskQueue.forEach((task) => {
      if (task.timeout) {
        clearTimeout(task.timeout);
      }
    });

    this.taskQueue = [];
    this.activeTasks.clear();
    this.completedTasks.clear();
    this.processingHistory.clear();

    logger.log("处理已停止");
  }

  /**
   * 获取处理状态
   */
  getState(): ParallelProcessingState {
    return { ...this.state };
  }

  /**
   * 获取处理统计
   */
  getStats(): {
    totalProcessingTime: number;
    averageProcessingTime: number;
    throughput: number; // 文件/秒
  } {
    const totalTime = Date.now() - this.state.startTime;
    const totalProcessed = this.state.completedTasks + this.state.failedTasks;

    const averageTime = totalProcessed > 0 ? totalTime / totalProcessed : 0;
    const throughput = totalTime > 0 ? (totalProcessed * 1000) / totalTime : 0;

    return {
      totalProcessingTime: totalTime,
      averageProcessingTime: Math.round(averageTime),
      throughput: Math.round(throughput),
    };
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(fileName: string, config: ProcessImageConfig): string {
    const configHash = JSON.stringify(config, Object.keys(config).sort());
    return `${fileName}_${configHash}_${Date.now()}`;
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (
      this.state.isPaused ||
      !this.state.isProcessing ||
      this.taskQueue.length === 0
    ) {
      return;
    }

    while (
      this.taskQueue.length > 0 &&
      this.activeTasks.size < this.config.maxConcurrency
    ) {
      const task = this.taskQueue.shift();

      if (!task) {
        continue;
      }

      this.activeTasks.add(task.file.name);

      try {
        const result = await this.executeTask(task);

        if (result.success) {
          this.completedTasks.add(task.file.name);
          this.state.completedTasks++;
          task.resolve(result);
          this.processingHistory.set(task.file.name, Date.now());
        } else {
          this.state.failedTasks++;
          task.reject(new Error(result.error || "Unknown error"));
        }
      } catch (error) {
        logger.error(`任务执行失败: ${task.file.name}`, error);
        this.state.failedTasks++;
        task.reject(error as Error);
      } finally {
        this.activeTasks.delete(task.file.name);
      }
    }
  }
}

/**
 * 信号量实现
 */
class Semaphore {
  private permits: number;
  private waitQueue: Array<{
    resolve: () => void;
    reject: (error?: Error) => void;
  }> = [];
  private waitQueueHead = 0;

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waitQueue.push({ resolve, reject: () => {} });
      }
    });
  }

  release(): void {
    this.permits++;

    if (this.waitQueue.length > 0 && this.permits > 0) {
      const waiter = this.waitQueue.shift();
      if (waiter) {
        this.permits--;
        waiter.resolve();
      }
    }
  }
}

/**
 * 默认导出
 */
export default ParallelProcessingManager;
