import { ref } from "vue";
import { useQuasar } from "quasar";

/**
 * 错误处理 Composable
 * 统一管理应用错误处理和用户通知
 */
export interface ErrorInfo {
  /** 错误代码 */
  code?: string;
  /** 错误消息 */
  message: string;
  /** 错误上下文 */
  context?: string;
  /** 错误详情 */
  details?: unknown;
  /** 错误时间戳 */
  timestamp: number;
  /** 错误严重级别 */
  severity: "info" | "warning" | "error" | "critical";
  /** 是否已显示给用户 */
  shown: boolean;
}

export interface UseErrorHandlerOptions {
  /** 是否自动显示通知 */
  autoNotify?: boolean;
  /** 最大错误记录数 */
  maxErrors?: number;
  /** 是否启用控制台日志 */
  enableConsoleLog?: boolean;
}

export interface UseErrorHandlerReturn {
  /** 错误历史 */
  errors: { value: ErrorInfo[] };
  /** 最后一个错误 */
  lastError: { value: ErrorInfo | null };

  /** 处理错误 */
  handleError: (
    error: Error | string,
    context?: string,
    severity?: ErrorInfo["severity"],
  ) => void;
  /** 处理成功消息 */
  handleSuccess: (message: string, context?: string) => void;
  /** 处理警告 */
  handleWarning: (message: string, context?: string) => void;
  /** 处理信息 */
  handleInfo: (message: string, context?: string) => void;

  /** 清空错误历史 */
  clearErrors: () => void;
  /** 标记错误为已读 */
  markAsRead: (index: number) => void;
  /** 标记所有错误为已读 */
  markAllAsRead: () => void;

  /** 获取错误统计 */
  getErrorStats: () => {
    total: number;
    unread: number;
    bySeverity: Record<string, number>;
  };

  /** 获取格式化的错误消息 */
  formatErrorMessage: (error: Error | string, context?: string) => string;
  /** 判断错误类型 */
  isErrorType: (error: unknown, expectedType: string) => boolean;
  /** 异步错误处理包装器 */
  withErrorHandling: <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    errorSeverity?: ErrorInfo["severity"],
  ) => Promise<T | null>;
  /** 同步错误处理包装器 */
  withSyncErrorHandling: <T>(
    syncFn: () => T,
    context?: string,
    errorSeverity?: ErrorInfo["severity"],
  ) => T | null;
}

/**
 * 预定义错误消息
 */
export const ERROR_MESSAGES = {
  // 文件相关错误
  FILE_TOO_LARGE: "文件大小超过限制",
  INVALID_FILE_TYPE: "不支持的文件类型",
  FILE_UPLOAD_FAILED: "文件上传失败",
  FILE_NOT_FOUND: "文件不存在",

  // 图像处理错误
  IMAGE_PROCESSING_FAILED: "图像处理失败",
  IMAGE_TOO_SMALL: "图像尺寸过小",
  IMAGE_TOO_LARGE: "图像尺寸过大",
  INVALID_IMAGE_FORMAT: "无效的图像格式",

  // 网络错误
  NETWORK_ERROR: "网络连接错误",
  TIMEOUT_ERROR: "请求超时",

  // 系统错误
  MEMORY_ERROR: "内存不足",
  PERMISSION_DENIED: "权限不足",
  UNKNOWN_ERROR: "未知错误",

  // 验证错误
  VALIDATION_ERROR: "输入验证失败",
  CONFIGURATION_ERROR: "配置错误",
} as const;

/**
 * 错误处理逻辑 Composable
 */
export function useErrorHandler(
  options: UseErrorHandlerOptions = {},
): UseErrorHandlerReturn {
  // 配置选项
  const {
    autoNotify = true,
    maxErrors = 100,
    enableConsoleLog = true,
  } = options;

  // Quasar 插件
  const { notify } = useQuasar();

  // 响应式数据
  const errors = ref<ErrorInfo[]>([]);
  const lastError = ref<ErrorInfo | null>(null);

  /**
   * 创建错误信息对象
   */
  const createErrorInfo = (
    error: Error | string,
    context?: string,
    severity: ErrorInfo["severity"] = "error",
  ): ErrorInfo => {
    const message = typeof error === "string" ? error : error.message;
    const code =
      typeof error === "object" && error instanceof Error
        ? (error as { code?: string }).code
        : undefined;
    const details = typeof error === "object" ? error : undefined;

    return {
      code,
      message,
      context,
      details,
      timestamp: Date.now(),
      severity,
      shown: false,
    };
  };

  /**
   * 格式化错误消息
   */
  const formatErrorMessage = (
    error: Error | string,
    context?: string,
  ): string => {
    const baseMessage = typeof error === "string" ? error : error.message;
    return context ? `[${context}] ${baseMessage}` : baseMessage;
  };

  /**
   * 判断错误类型
   */
  const isErrorType = (error: unknown, expectedType: string): boolean => {
    if (typeof error === "string") {
      return error.includes(expectedType);
    }

    if (error instanceof Error) {
      return (
        error.message.includes(expectedType) || error.name === expectedType
      );
    }

    return false;
  };

  /**
   * 显示通知
   */
  const showNotification = (
    message: string,
    type: "positive" | "negative" | "warning" | "info",
    context?: string,
  ): void => {
    const fullMessage = formatErrorMessage(message, context);

    notify({
      type,
      message: fullMessage,
      position: "top",
      timeout: type === "positive" ? 2000 : 5000,
      actions: [
        {
          label: "关闭",
          color: "white",
          handler: () => {},
        },
      ],
    });
  };

  /**
   * 处理错误
   */
  const handleError = (
    error: Error | string,
    context?: string,
    severity: ErrorInfo["severity"] = "error",
  ): void => {
    const errorInfo = createErrorInfo(error, context, severity);

    // 添加到错误历史
    errors.value.push(errorInfo);
    lastError.value = errorInfo;

    // 限制错误历史长度
    if (errors.value.length > maxErrors) {
      errors.value = errors.value.slice(-maxErrors);
    }

    // 控制台日志
    if (enableConsoleLog) {
      const logMethod =
        severity === "error" || severity === "critical"
          ? "error"
          : severity === "warning"
            ? "warn"
            : "log";
      console[logMethod](
        `[${severity.toUpperCase()}]`,
        formatErrorMessage(error, context),
        error,
      );
    }

    // 自动通知
    if (autoNotify) {
      let notificationType: "negative" | "warning" | "info";

      switch (severity) {
        case "critical":
        case "error":
          notificationType = "negative";
          break;
        case "warning":
          notificationType = "warning";
          break;
        case "info":
          notificationType = "info";
          break;
      }

      showNotification(errorInfo.message, notificationType, context);
    }

    // 标记为已显示
    errorInfo.shown = true;
  };

  /**
   * 处理成功消息
   */
  const handleSuccess = (message: string, context?: string): void => {
    if (autoNotify) {
      showNotification(message, "positive", context);
    }

    if (enableConsoleLog) {
      console.log(`[SUCCESS] ${formatErrorMessage(message, context)}`);
    }
  };

  /**
   * 处理警告消息
   */
  const handleWarning = (message: string, context?: string): void => {
    const errorInfo = createErrorInfo(message, context, "warning");
    errors.value.push(errorInfo);

    if (autoNotify) {
      showNotification(message, "warning", context);
    }

    if (enableConsoleLog) {
      console.warn(`[WARNING] ${formatErrorMessage(message, context)}`);
    }
  };

  /**
   * 处理信息消息
   */
  const handleInfo = (message: string, context?: string): void => {
    if (autoNotify) {
      showNotification(message, "info", context);
    }

    if (enableConsoleLog) {
      console.log(`[INFO] ${formatErrorMessage(message, context)}`);
    }
  };

  /**
   * 清空错误历史
   */
  const clearErrors = (): void => {
    errors.value = [];
    lastError.value = null;
  };

  /**
   * 标记错误为已读
   */
  const markAsRead = (index: number): void => {
    if (index >= 0 && index < errors.value.length) {
      errors.value[index].shown = true;
    }
  };

  /**
   * 标记所有错误为已读
   */
  const markAllAsRead = (): void => {
    errors.value.forEach((error) => {
      error.shown = true;
    });
  };

  /**
   * 获取错误统计
   */
  const getErrorStats = () => {
    const total = errors.value.length;
    const unread = errors.value.filter((error) => !error.shown).length;
    const bySeverity: Record<string, number> = {};

    errors.value.forEach((error) => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });

    return {
      total,
      unread,
      bySeverity,
    };
  };

  /**
   * 异步错误处理包装器
   */
  const withErrorHandling = async <T>(
    asyncFn: () => Promise<T>,
    context?: string,
    errorSeverity: ErrorInfo["severity"] = "error",
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, context, errorSeverity);
      return null;
    }
  };

  /**
   * 同步错误处理包装器
   */
  const withSyncErrorHandling = <T>(
    syncFn: () => T,
    context?: string,
    errorSeverity: ErrorInfo["severity"] = "error",
  ): T | null => {
    try {
      return syncFn();
    } catch (error) {
      handleError(error as Error, context, errorSeverity);
      return null;
    }
  };

  return {
    // 响应式数据
    errors,
    lastError,

    // 处理方法
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,

    // 管理方法
    clearErrors,
    markAsRead,
    markAllAsRead,

    // 工具方法
    getErrorStats,
    formatErrorMessage,
    isErrorType,

    // 包装器方法
    withErrorHandling,
    withSyncErrorHandling,
  };
}

/**
 * 默认导出
 */
export default useErrorHandler;
