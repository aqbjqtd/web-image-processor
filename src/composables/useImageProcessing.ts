import { ref, type Ref } from "vue";
import { ProcessImageConfig, ProcessedImage } from "../utils/ImageProcessor";
import { ImageFile } from "./useFileUpload";

/**
 * 图像处理 Composable
 * 管理图像处理流程、配置、状态等核心逻辑
 */
export interface UseImageProcessingOptions {
  /** 默认并发数量 */
  concurrency?: number;
  /** 是否启用进度回调 */
  enableProgress?: boolean;
}

export interface ProcessingProgress {
  /** 总文件数 */
  total: number;
  /** 已处理数 */
  processed: number;
  /** 当前处理的文件名 */
  currentFile?: string;
  /** 处理进度百分比 */
  percentage: number;
  /** 预估剩余时间（秒） */
  estimatedTimeRemaining?: number;
}

export interface UseImageProcessingReturn {
  /** 处理配置 */
  config: Ref<ProcessImageConfig>;
  /** 处理进度 */
  progress: Ref<ProcessingProgress>;
  /** 是否正在处理 */
  isProcessing: Ref<boolean>;
  /** 是否暂停 */
  isPaused: Ref<boolean>;
  /** 错误信息 */
  error: Ref<string | null>;
  /** 处理结果 */
  results: Ref<ProcessedImage[]>;

  /** 设置处理配置 */
  setConfig: (newConfig: Partial<ProcessImageConfig>) => void;
  /** 重置为默认配置 */
  resetConfig: () => void;

  /** 处理单个文件 */
  processFile: (
    file: ImageFile,
    config?: ProcessImageConfig,
  ) => Promise<ProcessedImage>;
  /** 批量处理文件 */
  processFiles: (
    files: ImageFile[],
    config?: ProcessImageConfig,
  ) => Promise<ProcessedImage[]>;
  /** 暂停处理 */
  pauseProcessing: () => void;
  /** 恢复处理 */
  resumeProcessing: () => void;
  /** 停止处理 */
  stopProcessing: () => void;

  /** 获取处理统计 */
  getProcessingStats: () => {
    totalFiles: number;
    processedFiles: number;
    failedFiles: number;
    averageProcessingTime: number;
    totalProcessingTime: number;
  };
}

/**
 * 默认处理配置
 */
const defaultConfig: ProcessImageConfig = {
  resizeOption: "custom",
  resizePercentage: 100,
  targetWidth: 1920,
  targetHeight: 1080,
  resizeMode: "keep_ratio_pad",
  maxFileSize: 300,
  concurrency: 1,
  useWasm: false,
};

/**
 * 图像处理逻辑 Composable
 */
export function useImageProcessing(
  options: UseImageProcessingOptions = {},
): UseImageProcessingReturn {
  // 配置选项
  const { concurrency = Math.min(4, navigator.hardwareConcurrency || 2) } =
    options;

  // 响应式数据
  const config = ref<ProcessImageConfig>({ ...defaultConfig });
  const progress = ref<ProcessingProgress>({
    total: 0,
    processed: 0,
    percentage: 0,
  });
  const isProcessing = ref(false);
  const isPaused = ref(false);
  const error = ref<string | null>(null);
  const results = ref<ProcessedImage[]>([]);

  // 内部状态
  let processingController: AbortController | null = null;
  let processingTimes: number[] = [];

  /**
   * 设置处理配置
   */
  const setConfig = (newConfig: Partial<ProcessImageConfig>): void => {
    config.value = { ...config.value, ...newConfig };
  };

  /**
   * 重置为默认配置
   */
  const resetConfig = (): void => {
    config.value = { ...defaultConfig };
  };

  /**
   * 处理单个文件
   */
  const processFile = async (
    file: ImageFile,
    processConfig?: ProcessImageConfig,
  ): Promise<ProcessedImage> => {
    const finalConfig = processConfig || config.value;

    try {
      // 动态导入 ImageProcessor 避免循环依赖
      const { default: imageProcessor } = await import(
        "../utils/ImageProcessor"
      );

      const result = await imageProcessor.processImage(file, finalConfig);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      throw new Error(`处理文件 ${file.name} 失败: ${errorMessage}`);
    }
  };

  /**
   * 并发处理文件队列
   */
  const processConcurrently = async (
    files: ImageFile[],
    finalConfig: ProcessImageConfig,
  ): Promise<ProcessedImage[]> => {
    const results: ProcessedImage[] = [];
    const processingPromises: Promise<void>[] = [];
    let currentIndex = 0;

    const processNext = async (): Promise<void> => {
      if (
        currentIndex >= files.length ||
        isPaused.value ||
        !processingController
      ) {
        return;
      }

      const file = files[currentIndex++];
      const fileStartTime = Date.now();

      try {
        // 更新进度信息
        progress.value = {
          total: files.length,
          processed: currentIndex - 1,
          currentFile: file.name,
          percentage: Math.round(((currentIndex - 1) / files.length) * 100),
        };

        const result = await processFile(file, finalConfig);
        results.push(result);

        // 记录处理时间
        const processingTime = Date.now() - fileStartTime;
        processingTimes.push(processingTime);

        // 更新文件状态
        file.status = "completed";
        file.processedData = result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        file.status = "error";
        file.error = errorMessage;

        console.error(`文件处理失败: ${file.name}`, err);
      }

      // 继续处理下一个文件
      await processNext();
    };

    // 启动并发处理
    for (let i = 0; i < Math.min(concurrency, files.length); i++) {
      processingPromises.push(processNext());
    }

    await Promise.all(processingPromises);
    return results;
  };

  /**
   * 批量处理文件
   */
  const processFiles = async (
    files: ImageFile[],
    processConfig?: ProcessImageConfig,
  ): Promise<ProcessedImage[]> => {
    if (files.length === 0) {
      return [];
    }

    // 重置状态
    error.value = null;
    results.value = [];
    processingTimes = [];
    processingController = new AbortController();

    try {
      isProcessing.value = true;
      isPaused.value = false;

      const finalConfig = processConfig || config.value;

      // 初始化进度
      progress.value = {
        total: files.length,
        processed: 0,
        percentage: 0,
      };

      // 更新所有文件状态为处理中
      files.forEach((file) => {
        if (file.status === "pending") {
          file.status = "processing";
        }
      });

      let finalResults: ProcessedImage[] = [];

      // 根据并发数选择处理策略
      if (concurrency > 1 && finalConfig.concurrency !== 1) {
        finalResults = await processConcurrently(files, finalConfig);
      } else {
        // 串行处理（原有逻辑）
        for (let i = 0; i < files.length; i++) {
          if (!processingController || isPaused.value) {
            break;
          }

          const file = files[i];
          const fileStartTime = Date.now();

          try {
            progress.value = {
              total: files.length,
              processed: i,
              currentFile: file.name,
              percentage: Math.round((i / files.length) * 100),
            };

            const result = await processFile(file, finalConfig);
            finalResults.push(result);

            // 记录处理时间
            const processingTime = Date.now() - fileStartTime;
            processingTimes.push(processingTime);

            // 更新文件状态
            file.status = "completed";
            file.processedData = result;
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : "Unknown error";
            file.status = "error";
            file.error = errorMessage;

            console.error(`文件处理失败: ${file.name}`, err);
          }
        }
      }

      // 最终进度更新
      progress.value = {
        ...progress.value,
        processed: files.length,
        percentage: 100,
      };

      results.value = finalResults;
      return finalResults;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      error.value = errorMessage;
      throw err;
    } finally {
      isProcessing.value = false;
      processingController = null;
    }
  };

  /**
   * 暂停处理
   */
  const pauseProcessing = (): void => {
    isPaused.value = true;
  };

  /**
   * 恢复处理
   */
  const resumeProcessing = (): void => {
    isPaused.value = false;
  };

  /**
   * 停止处理
   */
  const stopProcessing = (): void => {
    if (processingController) {
      processingController.abort();
      processingController = null;
    }

    isProcessing.value = false;
    isPaused.value = false;
  };

  /**
   * 获取处理统计信息
   */
  const getProcessingStats = () => {
    const totalFiles = results.value.length;
    const processedFiles = results.value.filter(
      (result) => !!result.dataUrl,
    ).length;
    const failedFiles = totalFiles - processedFiles;

    let averageProcessingTime = 0;
    let totalProcessingTime = 0;

    if (processingTimes.length > 0) {
      totalProcessingTime = processingTimes.reduce(
        (sum, time) => sum + time,
        0,
      );
      averageProcessingTime = totalProcessingTime / processingTimes.length;
    }

    return {
      totalFiles,
      processedFiles,
      failedFiles,
      averageProcessingTime,
      totalProcessingTime,
    };
  };

  return {
    // 响应式数据
    config,
    progress,
    isProcessing,
    isPaused,
    error,
    results,

    // 配置方法
    setConfig,
    resetConfig,

    // 处理方法
    processFile,
    processFiles,
    pauseProcessing,
    resumeProcessing,
    stopProcessing,

    // 统计方法
    getProcessingStats,
  };
}

/**
 * 默认导出
 */
export default useImageProcessing;
