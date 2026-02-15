import { SIZE_LIMITS, VALIDATION_CONFIG } from "./ImageConfig";

// 类型声明，避免 const 断言导致的类型问题
export type AllowedFileType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/gif"
  | "image/bmp";

// 用于类型转换的辅助函数
const convertToAllowedType = (type: string): AllowedFileType => {
  return type as AllowedFileType;
};

/**
 * 验证结果
 */
export interface ValidationResult {
  /** 验证是否通过 */
  isValid: boolean;
  /** 错误信息 */
  errors: ValidationError[];
  /** 警告信息 */
  warnings: ValidationWarning[];
  /** 建议信息 */
  suggestions: ValidationSuggestion[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误代码 */
  code: string;
  /** 错误字段 */
  field: string;
  /** 错误消息 */
  message: string;
  /** 错误值 */
  value?: unknown;
  /** 严重级别 */
  severity: "critical" | "error" | "warning";
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告代码 */
  code: string;
  /** 警告字段 */
  field: string;
  /** 警告消息 */
  message: string;
  /** 警告值 */
  value?: unknown;
}

/**
 * 验证建议
 */
export interface ValidationSuggestion {
  /** 建议代码 */
  code: string;
  /** 建议字段 */
  field: string;
  /** 建议消息 */
  message: string;
  /** 建议值 */
  suggestedValue?: unknown;
}

/**
 * 文件验证配置
 */
export interface FileValidationConfig {
  /** 最大文件大小（字节） */
  maxFileSize?: number;
  /** 最小文件大小（字节） */
  minFileSize?: number;
  /** 允许的文件类型 */
  allowedTypes?: AllowedFileType[];
  /** 最大文件名长度 */
  maxFileNameLength?: number;
}

// 用于类型转换的辅助函数
const asAllowedType = (type: string): AllowedFileType => {
  return type as AllowedFileType;
};

/**
 * 图像验证配置
 */
export interface ImageValidationConfig {
  /** 最大宽度 */
  maxWidth?: number;
  /** 最大高度 */
  maxHeight?: number;
  /** 最小宽度 */
  minWidth?: number;
  /** 最小高度 */
  minHeight?: number;
  /** 是否允许透明度 */
  allowTransparency?: boolean;
  /** 是否验证像素比 */
  validatePixelRatio?: boolean;
}

/**
 * 图像验证器
 * 提供全面的文件和图像验证功能
 */
export class ImageValidator {
  // 预定义的验证错误代码
  static readonly ERROR_CODES = {
    FILE_TOO_LARGE: "FILE_TOO_LARGE",
    FILE_TOO_SMALL: "FILE_TOO_SMALL",
    INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
    INVALID_FILE_NAME: "INVALID_FILE_NAME",
    IMAGE_TOO_LARGE: "IMAGE_TOO_LARGE",
    IMAGE_TOO_SMALL: "IMAGE_TOO_SMALL",
    INVALID_PIXEL_RATIO: "INVALID_PIXEL_RATIO",
    TRANSPARENCY_NOT_ALLOWED: "TRANSPARENCY_NOT_ALLOWED",
    CORRUPTED_IMAGE: "CORRUPTED_IMAGE",
    UNSUPPORTED_FORMAT: "UNSUPPORTED_FORMAT",
  } as const;

  // 预定义的验证警告代码
  static readonly WARNING_CODES = {
    LARGE_FILE_SIZE: "LARGE_FILE_SIZE",
    HIGH_RESOLUTION: "HIGH_RESOLUTION",
    OPTIMIZATION_SUGGESTED: "OPTIMIZATION_SUGGESTED",
    FORMAT_NOT_OPTIMAL: "FORMAT_NOT_OPTIMAL",
  } as const;

  /**
   * 验证文件
   */
  static validateFile(
    file: File,
    config: FileValidationConfig = {},
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // 默认配置
    const {
      maxFileSize = 50 * 1024 * 1024, // 50MB
      minFileSize = 1,
      allowedTypes = VALIDATION_CONFIG.ALLOWED_TYPES,
      maxFileNameLength = VALIDATION_CONFIG.MAX_FILENAME_LENGTH,
    } = config;

    // 验证文件大小
    if (file.size > maxFileSize) {
      errors.push({
        code: this.ERROR_CODES.FILE_TOO_LARGE,
        field: "size",
        message: `文件大小超过限制: ${this.formatFileSize(file.size)} > ${this.formatFileSize(maxFileSize)}`,
        value: file.size,
        severity: "error",
      });
    }

    if (file.size < minFileSize) {
      errors.push({
        code: this.ERROR_CODES.FILE_TOO_SMALL,
        field: "size",
        message: `文件大小过小: ${this.formatFileSize(file.size)} < ${this.formatFileSize(minFileSize)}`,
        value: file.size,
        severity: "error",
      });
    }

    // 验证文件类型
    if (!allowedTypes.includes(file.type as AllowedFileType)) {
      errors.push({
        code: this.ERROR_CODES.INVALID_FILE_TYPE,
        field: "type",
        message: `不支持的文件类型: ${file.type}`,
        value: file.type,
        severity: "error",
      });
    }

    // 验证文件名
    if (file.name.length > maxFileNameLength) {
      errors.push({
        code: this.ERROR_CODES.INVALID_FILE_NAME,
        field: "name",
        message: `文件名过长: ${file.name.length} > ${maxFileNameLength}`,
        value: file.name.length,
        severity: "warning",
      });
    }

    // 文件大小警告
    if (
      file.size > maxFileSize * 0.8 &&
      !errors.some((e) => e.code === this.ERROR_CODES.FILE_TOO_LARGE)
    ) {
      warnings.push({
        code: this.WARNING_CODES.LARGE_FILE_SIZE,
        field: "size",
        message: `文件大小较大，可能影响处理性能`,
        value: file.size,
      });
    }

    // 格式建议
    const optimalFormat = this.suggestOptimalFormat(file);
    if (optimalFormat && optimalFormat !== file.type) {
      suggestions.push({
        code: "FORMAT_SUGGESTION",
        field: "format",
        message: `建议使用 ${optimalFormat} 格式以获得更好的压缩效果`,
        suggestedValue: optimalFormat,
      });
    }

    return {
      isValid:
        errors.filter(
          (e) => e.severity === "critical" || e.severity === "error",
        ).length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * 验证图像
   */
  static async validateImage(
    image: HTMLImageElement,
    config: ImageValidationConfig = {},
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // 默认配置
    const {
      maxWidth = SIZE_LIMITS.MAX_WIDTH,
      maxHeight = SIZE_LIMITS.MAX_HEIGHT,
      minWidth = SIZE_LIMITS.MIN_WIDTH,
      minHeight = SIZE_LIMITS.MIN_HEIGHT,
      validatePixelRatio = true,
    } = config;

    // allowTransparency 在后续验证中使用（第389行）

    // 验证图像尺寸
    if (image.width > maxWidth) {
      errors.push({
        code: this.ERROR_CODES.IMAGE_TOO_LARGE,
        field: "width",
        message: `图像宽度过大: ${image.width} > ${maxWidth}`,
        value: image.width,
        severity: "error",
      });
    }

    if (image.height > maxHeight) {
      errors.push({
        code: this.ERROR_CODES.IMAGE_TOO_LARGE,
        field: "height",
        message: `图像高度过大: ${image.height} > ${maxHeight}`,
        value: image.height,
        severity: "error",
      });
    }

    if (image.width < minWidth) {
      errors.push({
        code: this.ERROR_CODES.IMAGE_TOO_SMALL,
        field: "width",
        message: `图像宽度过小: ${image.width} < ${minWidth}`,
        value: image.width,
        severity: "error",
      });
    }

    if (image.height < minHeight) {
      errors.push({
        code: this.ERROR_CODES.IMAGE_TOO_SMALL,
        field: "height",
        message: `图像高度过小: ${image.height} < ${minHeight}`,
        value: image.height,
        severity: "error",
      });
    }

    // 验证像素比
    if (validatePixelRatio) {
      const pixelRatio = this.calculatePixelRatio(image);
      if (pixelRatio > 2 || pixelRatio < 0.5) {
        errors.push({
          code: this.ERROR_CODES.INVALID_PIXEL_RATIO,
          field: "pixelRatio",
          message: `像素比异常: ${pixelRatio}`,
          value: pixelRatio,
          severity: "warning",
        });
      }
    }

    // 高分辨率警告
    const totalPixels = image.width * image.height;
    if (totalPixels > 8 * 1024 * 1024) {
      // 8MP
      warnings.push({
        code: this.WARNING_CODES.HIGH_RESOLUTION,
        field: "resolution",
        message: `高分辨率图像可能处理较慢: ${totalPixels} 像素`,
        value: totalPixels,
      });
    }

    // 尺寸优化建议
    const optimalSize = this.suggestOptimalSize(image);
    if (
      optimalSize &&
      (optimalSize.width !== image.width || optimalSize.height !== image.height)
    ) {
      suggestions.push({
        code: "SIZE_SUGGESTION",
        field: "dimensions",
        message: `建议调整为 ${optimalSize.width}×${optimalSize.height} 以获得最佳效果`,
        suggestedValue: optimalSize,
      });
    }

    return {
      isValid:
        errors.filter(
          (e) => e.severity === "critical" || e.severity === "error",
        ).length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * 验证图像数据
   */
  static async validateImageData(
    imageData: ImageData,
    config: ImageValidationConfig = {},
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // 验证数据完整性
      if (
        !imageData ||
        !imageData.data ||
        !imageData.width ||
        !imageData.height
      ) {
        errors.push({
          code: this.ERROR_CODES.CORRUPTED_IMAGE,
          field: "data",
          message: "图像数据损坏或不完整",
          severity: "critical",
        });
        return { isValid: false, errors, warnings, suggestions };
      }

      // 验证数据大小
      const expectedDataLength = imageData.width * imageData.height * 4; // RGBA
      if (imageData.data.length !== expectedDataLength) {
        errors.push({
          code: this.ERROR_CODES.CORRUPTED_IMAGE,
          field: "data",
          message: "图像数据长度不匹配",
          severity: "critical",
          value: imageData.data.length,
        });
      }

      // 检查透明度
      const hasTransparency = this.hasTransparency(imageData);
      if (!config.allowTransparency && hasTransparency) {
        errors.push({
          code: this.ERROR_CODES.TRANSPARENCY_NOT_ALLOWED,
          field: "transparency",
          message: "不支持透明度通道",
          severity: "error",
        });
      }
    } catch (error) {
      errors.push({
        code: this.ERROR_CODES.CORRUPTED_IMAGE,
        field: "data",
        message: `图像数据验证失败: ${error}`,
        severity: "critical",
      });
    }

    return {
      isValid:
        errors.filter(
          (e) => e.severity === "critical" || e.severity === "error",
        ).length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * 批量验证文件
   */
  static validateFiles(
    files: File[],
    config?: FileValidationConfig,
  ): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];
    const allSuggestions: ValidationSuggestion[] = [];
    let isValid = true;

    files.forEach((file, index) => {
      const result = this.validateFile(file, config);

      if (!result.isValid) {
        isValid = false;
      }

      // 添加文件索引到错误信息
      result.errors.forEach((error) => {
        allErrors.push({
          ...error,
          field: `file[${index}].${error.field}`,
        });
      });

      result.warnings.forEach((warning) => {
        allWarnings.push({
          ...warning,
          field: `file[${index}].${warning.field}`,
        });
      });

      result.suggestions.forEach((suggestion) => {
        allSuggestions.push({
          ...suggestion,
          field: `file[${index}].${suggestion.field}`,
        });
      });
    });

    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: allSuggestions,
    };
  }

  /**
   * 检查透明度
   */
  private static hasTransparency(imageData: ImageData): boolean {
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
      // Alpha channel
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  }

  /**
   * 计算像素比
   */
  private static calculatePixelRatio(image: HTMLImageElement): number {
    // 这里可以添加更复杂的像素比计算逻辑
    // 目前返回简单的宽高比
    return image.width / image.height;
  }

  /**
   * 建议最佳格式
   */
  private static suggestOptimalFormat(file: File): string | null {
    const extension = file.name.split(".").pop()?.toLowerCase();

    // 根据文件扩展名和类型建议格式
    if (file.type === "image/png" || extension === "png") {
      return "image/webp";
    }

    if (
      file.type === "image/jpeg" ||
      extension === "jpg" ||
      extension === "jpeg"
    ) {
      return null; // JPEG 已经是很好的选择
    }

    return null;
  }

  /**
   * 建议最佳尺寸
   */
  private static suggestOptimalSize(
    image: HTMLImageElement,
  ): { width: number; height: number } | null {
    const commonSizes = [
      { width: 1920, height: 1080 }, // 1080p
      { width: 1280, height: 720 }, // 720p
      { width: 854, height: 480 }, // 480p
      { width: 2560, height: 1440 }, // 2K
      { width: 3840, height: 2160 }, // 4K
    ];

    // 找到最接近的标准尺寸
    const currentRatio = image.width / image.height;

    for (const size of commonSizes) {
      const sizeRatio = size.width / size.height;

      // 检查是否需要调整
      if (Math.abs(currentRatio - sizeRatio) < 0.1) {
        if (image.width > size.width || image.height > size.height) {
          return size;
        }
      }
    }

    return null;
  }

  /**
   * 格式化文件大小
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * 验证配置预设
   */
  static readonly VALIDATION_PRESETS = {
    STRICT: {
      name: "严格模式",
      description: "最严格的验证标准",
      fileConfig: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ["image/jpeg", "image/png"].map(convertToAllowedType),
        maxFileNameLength: 100,
      },
      imageConfig: {
        maxWidth: 2048,
        maxHeight: 2048,
        allowTransparency: false,
        validatePixelRatio: true,
      },
    },
    MODERATE: {
      name: "适中模式",
      description: "平衡验证和用户体验",
      fileConfig: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [...VALIDATION_CONFIG.ALLOWED_TYPES].map(
          convertToAllowedType,
        ) as AllowedFileType[],
        maxFileNameLength: 255,
      },
      imageConfig: {
        maxWidth: 4096,
        maxHeight: 4096,
        allowTransparency: true,
        validatePixelRatio: true,
      },
    },
    RELAXED: {
      name: "宽松模式",
      description: "宽松的验证标准",
      fileConfig: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ["image/jpeg", "image/png"].map(asAllowedType),
        maxFileNameLength: 100,
      },
      imageConfig: {
        maxWidth: 8192,
        maxHeight: 8192,
        allowTransparency: true,
        validatePixelRatio: false,
      },
    },
  } as const;

  /**
   * 使用预设验证
   */
  static async validateWithPreset(
    file: File,
    image: HTMLImageElement,
    preset: keyof typeof ImageValidator.VALIDATION_PRESETS,
  ): Promise<{ fileResult: ValidationResult; imageResult: ValidationResult }> {
    const presetConfig = ImageValidator.VALIDATION_PRESETS[preset];

    const fileResult = this.validateFile(file, presetConfig.fileConfig);
    const imageResult = await this.validateImage(
      image,
      presetConfig.imageConfig,
    );

    return {
      fileResult,
      imageResult,
    } as { fileResult: ValidationResult; imageResult: ValidationResult };
  }
}

/**
 * 默认导出
 */
export default ImageValidator;
