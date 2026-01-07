import { ProcessImageConfig, ProcessedImage } from './ImageProcessor';

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

class WorkerManager {
  private workers: Worker[] = [];
  private workerQueue: Worker[] = [];
  private tasks: Map<string, Task> = new Map();
  private taskIdCounter = 0;
  private maxWorkers: number;
  private workerSupported = false;
  private initialized = false;

  constructor() {
    this.maxWorkers = typeof navigator !== 'undefined' ? Math.min(4, navigator.hardwareConcurrency || 2) : 2;
  }

  async init(): Promise<boolean> {
    if (this.initialized) {
      return this.workerSupported;
    }

    try {
      if (typeof Worker === "undefined") {
        console.warn("Web Workers not supported");
        this.workerSupported = false;
        this.initialized = true;
        return false;
      }

      const testWorker = await this.createWorker();
      const support = await this.checkWorkerSupport(testWorker);
      
      // Type assertion for worker support check result
      const supportData = support as { offscreenCanvasSupported: boolean; imageBitmapSupported: boolean };
      if (supportData.offscreenCanvasSupported && supportData.imageBitmapSupported) {
        this.workerSupported = true;
        this.workerQueue.push(testWorker);

        for (let i = 1; i < this.maxWorkers; i++) {
          const worker = await this.createWorker();
          this.workerQueue.push(worker);
        }
        console.log(`Worker管理器初始化成功，创建了${this.maxWorkers}个Worker`);
      } else {
        console.warn("Worker功能支持不完整，回退到主线程处理");
        testWorker.terminate();
        this.workerSupported = false;
      }
    } catch (error) {
      console.warn("Worker初始化失败:", error);
      this.workerSupported = false;
    }

    this.initialized = true;
    return this.workerSupported;
  }

  private async createWorker(): Promise<Worker> {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker(new URL("../workers/imageWorker.ts", import.meta.url));
        worker.onerror = (error) => {
          console.error("Worker错误:", error);
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

  private async checkWorkerSupport(worker: Worker): Promise<{ offscreenCanvasSupported: boolean; imageBitmapSupported: boolean; }> {
    return new Promise((resolve, reject) => {
        const taskId = this.generateTaskId();
        const timeout = setTimeout(() => {
            reject(new Error("Worker支持检查超时"));
        }, 5000);

        this.tasks.set(taskId, {
            resolve: (data) => {
                clearTimeout(timeout);
                resolve(data as { offscreenCanvasSupported: boolean; imageBitmapSupported: boolean });
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
      console.warn("收到未知任务的Worker响应:", id);
      return;
    }

    if (this.workerQueue.indexOf(worker) === -1) {
      this.workerQueue.push(worker);
    }

    this.tasks.delete(id);

    if (success) {
      task.resolve(data as { offscreenCanvasSupported: boolean; imageBitmapSupported: boolean });
    } else {
      task.reject(new Error(error || "Worker任务失败"));
    }
  }

  async processImage(imageData: ImageData, config: ProcessImageConfig, targetWidth: number, targetHeight: number): Promise<ProcessedImage> {
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
          // Type assertion for process image result
          resolve(data as ProcessedImage);
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

  private async getAvailableWorker(): Promise<Worker> {
    return new Promise((resolve) => {
      const checkForWorker = () => {
        if (this.workerQueue.length > 0) {
          const worker = this.workerQueue.shift()!;
          resolve(worker);
        } else {
          setTimeout(checkForWorker, 10);
        }
      };
      checkForWorker();
    });
  }

  private generateTaskId(): string {
    return `task_${this.taskIdCounter++}_${Date.now()}`;
  }

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

  dispose(): void {
    this.workers.forEach((worker) => {
      worker.terminate();
    });

    this.workers = [];
    this.workerQueue = [];
    this.tasks.clear();
    this.initialized = false;
    this.workerSupported = false;

    console.log("Worker管理器已清理");
  }
}

const workerManager = new WorkerManager();
export default workerManager;
