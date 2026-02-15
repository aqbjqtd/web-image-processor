import { ref, computed, type Ref } from "vue";
import { useQuasar } from "quasar";
import { ProcessedImage } from "../utils/ImageProcessor";
import { logger } from "../utils/logger";

/**
 * 文件上传 Composable
 * 管理文件选择、验证、拖拽等上传相关逻辑
 */
export interface ImageFile extends File {
  /** 预览URL */
  preview?: string;
  /** 处理状态 */
  status: "pending" | "processing" | "completed" | "error";
  /** 处理后的数据 */
  processedData?: ProcessedImage;
  /** 错误信息 */
  error?: string;
}

export interface UseFileUploadOptions {
  /** 最大文件大小（字节），默认50MB */
  maxFileSize?: number;
  /** 允许的文件类型 */
  acceptedTypes?: string[];
  /** 最大文件数量 */
  maxFiles?: number;
}

export interface UseFileUploadReturn {
  /** 文件列表 */
  files: Ref<ImageFile[]>;
  /** 是否正在拖拽 */
  isDragOver: Ref<boolean>;
  /** 总文件数 */
  totalFiles: Ref<number>;
  /** 待处理文件数 */
  pendingFiles: Ref<number>;
  /** 处理中文件数 */
  processingFiles: Ref<number>;
  /** 已完成文件数 */
  completedFiles: Ref<number>;
  /** 是否有文件 */
  hasFiles: Ref<boolean>;
  /** 添加文件 */
  addFiles: (newFiles: File[]) => void;
  /** 移除文件 */
  removeFile: (index: number) => void;
  /** 清空所有文件 */
  clearFiles: () => void;
  /** 获取文件扩展名 */
  getFileExtension: (file: File) => string;
  /** 格式化文件大小 */
  formatFileSize: (bytes: number) => string;
  /** 验证文件 */
  validateFile: (file: File) => { valid: boolean; error?: string };
  /** 生成预览 */
  generatePreview: (file: ImageFile) => Promise<void>;
  /** 拖拽处理方法 */
  handleDragEnter: (e: DragEvent) => void;
  handleDragLeave: (e: DragEvent) => void;
  handleDragOver: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => void;
  /** 状态更新方法 */
  updateFileStatus: (
    index: number,
    status: ImageFile["status"],
    processedData?: ProcessedImage,
    error?: string,
  ) => void;
  updateMultipleFileStatus: (
    updates: Array<{
      index: number;
      status: ImageFile["status"];
      processedData?: ProcessedImage;
      error?: string;
    }>,
  ) => void;
}

/**
 * 文件上传逻辑 Composable
 */
export function useFileUpload(
  options: UseFileUploadOptions = {},
): UseFileUploadReturn {
  // Quasar 通知插件
  const $q = useQuasar();

  // 默认配置
  const {
    maxFileSize = 50 * 1024 * 1024, // 50MB
    acceptedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/bmp",
    ],
    maxFiles = 100,
  } = options;

  // 响应式数据
  const files = ref<ImageFile[]>([]);
  const isDragOver = ref(false);

  // 计算属性
  const totalFiles = computed(() => files.value.length);
  const pendingFiles = computed(
    () => files.value.filter((file) => file.status === "pending").length,
  );
  const processingFiles = computed(
    () => files.value.filter((file) => file.status === "processing").length,
  );
  const completedFiles = computed(
    () => files.value.filter((file) => file.status === "completed").length,
  );
  const hasFiles = computed(() => files.value.length > 0);

  /**
   * 验证单个文件
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // 检查文件类型
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `不支持的文件类型: ${file.type}，请使用: ${acceptedTypes.join(", ")}`,
      };
    }

    // 检查文件大小
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `文件大小超过限制: ${(file.size / 1024 / 1024).toFixed(2)}MB > ${(maxFileSize / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    // 检查文件数量
    if (files.value.length >= maxFiles) {
      return {
        valid: false,
        error: `文件数量超过限制: ${maxFiles}`,
      };
    }

    return { valid: true };
  };

  /**
   * 添加文件到列表
   */
  const addFiles = (newFiles: File[]): void => {
    const validFiles: ImageFile[] = [];

    for (const file of newFiles) {
      const validation = validateFile(file);

      if (validation.valid) {
        const imageFile: ImageFile = Object.assign(file, {
          status: "pending" as const,
        });
        validFiles.push(imageFile);

        // 异步生成预览
        generatePreview(imageFile);
      } else {
        // 使用 Quasar Notify 显示错误
        $q.notify({
          type: "negative",
          message: validation.error || "文件验证失败",
          position: "top",
          timeout: 3000,
          actions: [{ label: "关闭", color: "white" }],
        });
      }
    }

    if (validFiles.length > 0) {
      files.value.push(...validFiles);
    }
  };

  /**
   * 生成文件预览
   */
  const generatePreview = async (file: ImageFile): Promise<void> => {
    if (!file.type.startsWith("image/")) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        file.preview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      logger.warn("生成预览失败:", error);
    }
  };

  /**
   * 移除指定文件
   */
  const removeFile = (index: number): void => {
    if (index >= 0 && index < files.value.length) {
      // 注意：file.preview 是 base64 dataURL，由 FileReader 生成
      // 不需要使用 URL.revokeObjectURL 清理
      // Blob URL 才需要使用 URL.revokeObjectURL 清理
      files.value.splice(index, 1);
    }
  };

  /**
   * 清空所有文件
   */
  const clearFiles = (): void => {
    // 注意：file.preview 是 base64 dataURL，由 FileReader 生成
    // 不需要使用 URL.revokeObjectURL 清理
    // Blob URL 才需要使用 URL.revokeObjectURL 清理
    files.value = [];
  };

  /**
   * 获取文件扩展名
   */
  const getFileExtension = (file: File): string => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    return extension || "unknown";
  };

  /**
   * 格式化文件大小
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  /**
   * 处理拖拽进入
   */
  const handleDragEnter = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    isDragOver.value = true;
  };

  /**
   * 处理拖拽离开
   */
  const handleDragLeave = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    isDragOver.value = false;
  };

  /**
   * 处理拖拽悬停
   */
  const handleDragOver = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    isDragOver.value = true;
  };

  /**
   * 处理文件放置
   */
  const handleDrop = (e: DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    isDragOver.value = false;

    const droppedFiles = e.dataTransfer?.files;
    if (droppedFiles && droppedFiles.length > 0) {
      addFiles(Array.from(droppedFiles));
    }
  };

  /**
   * 更新文件状态
   */
  const updateFileStatus = (
    index: number,
    status: ImageFile["status"],
    processedData?: ProcessedImage,
    error?: string,
  ): void => {
    if (index >= 0 && index < files.value.length) {
      const file = files.value[index];
      file.status = status;
      if (processedData) {
        file.processedData = processedData;
      }
      if (error) {
        file.error = error;
      }
    }
  };

  /**
   * 批量更新文件状态
   */
  const updateMultipleFileStatus = (
    updates: Array<{
      index: number;
      status: ImageFile["status"];
      processedData?: ProcessedImage;
      error?: string;
    }>,
  ): void => {
    updates.forEach(({ index, status, processedData, error }) => {
      updateFileStatus(index, status, processedData, error);
    });
  };

  return {
    // 响应式数据
    files,
    isDragOver,
    totalFiles,
    pendingFiles,
    processingFiles,
    completedFiles,
    hasFiles,

    // 方法
    addFiles,
    removeFile,
    clearFiles,
    getFileExtension,
    formatFileSize,
    validateFile,
    generatePreview,

    // 拖拽处理方法
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,

    // 状态更新方法
    updateFileStatus,
    updateMultipleFileStatus,
  };
}

/**
 * 默认导出
 */
export default useFileUpload;
