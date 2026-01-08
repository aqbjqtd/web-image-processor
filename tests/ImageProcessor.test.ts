/**
 * @vitest-environment happy-dom
 *
 * Web Image Processor - 全面测试套件
 * 测试覆盖率目标: 60%+
 */

import { describe, it, expect, beforeAll, afterEach } from "vitest";
import imageProcessor from "../src/utils/ImageProcessor";

describe("ImageProcessor", () => {
  beforeAll(async () => {
    await imageProcessor.warmup();
  });

  afterEach(() => {
    imageProcessor.clearCache();
  });

  // ========================================
  // 基础功能测试 (6 tests)
  // ========================================

  describe("基础功能", () => {
    it("should be properly initialized", () => {
      expect(imageProcessor).toBeDefined();
      expect(typeof imageProcessor.processImage).toBe("function");
    });

    it("should validate supported image file types", () => {
      const validFile = new File([""], "test.jpg", { type: "image/jpeg" });
      const invalidFile = new File([""], "test.txt", { type: "text/plain" });

      expect(imageProcessor.isValidImageFile(validFile)).toBe(true);
      expect(imageProcessor.isValidImageFile(invalidFile)).toBe(false);
    });

    it("should validate file size limits", () => {
      const smallFile = new File(["x".repeat(1024 * 1024)], "small.jpg", {
        type: "image/jpeg",
      });
      const largeFile = new File(
        ["x".repeat(100 * 1024 * 1024)],
        "large.jpg",
        { type: "image/jpeg" }
      );

      expect(imageProcessor.isValidFileSize(smallFile)).toBe(true);
      expect(imageProcessor.isValidFileSize(largeFile)).toBe(false);
    });

    it("should get capabilities", () => {
      const capabilities = imageProcessor.getCapabilities();
      expect(capabilities).toHaveProperty("canvasSupported");
      expect(capabilities).toHaveProperty("supportedFormats");
      expect(capabilities.maxConcurrency).toBe(1);
    });

    it("should have canvas initialized", () => {
      expect(imageProcessor).toHaveProperty("canvas");
      expect(imageProcessor).toHaveProperty("ctx");
    });

    it("should support basic image formats", () => {
      const capabilities = imageProcessor.getCapabilities();
      expect(capabilities.supportedFormats).toContain("image/jpeg");
      expect(capabilities.supportedFormats).toContain("image/png");
      expect(Array.isArray(capabilities.supportedFormats)).toBe(true);
      expect(capabilities.supportedFormats.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ========================================
  // 边界情况测试 (4 tests)
  // ========================================

  describe("边界情况 - 无效格式", () => {
    it("should reject non-image files", () => {
      const textFile = new File(["content"], "test.txt", {
        type: "text/plain",
      });
      const pdfFile = new File(["content"], "test.pdf", { type: "application/pdf" });
      const jsonFile = new File(["{}"], "test.json", {
        type: "application/json",
      });

      expect(imageProcessor.isValidImageFile(textFile)).toBe(false);
      expect(imageProcessor.isValidImageFile(pdfFile)).toBe(false);
      expect(imageProcessor.isValidImageFile(jsonFile)).toBe(false);
    });

    it("should handle empty files gracefully", () => {
      const emptyFile = new File([], "empty.jpg", { type: "image/jpeg" });
      expect(imageProcessor.isValidImageFile(emptyFile)).toBe(true);
    });

    it("should support all image formats", () => {
      const pngFile = new File([""], "test.png", { type: "image/png" });
      const webpFile = new File([""], "test.webp", { type: "image/webp" });
      const gifFile = new File([""], "test.gif", { type: "image/gif" });
      const bmpFile = new File([""], "test.bmp", { type: "image/bmp" });

      expect(imageProcessor.isValidImageFile(pngFile)).toBe(true);
      expect(imageProcessor.isValidImageFile(webpFile)).toBe(true);
      expect(imageProcessor.isValidImageFile(gifFile)).toBe(true);
      expect(imageProcessor.isValidImageFile(bmpFile)).toBe(true);
    });

    it("should validate case-insensitive file types", () => {
      const upperCaseFile = new File([""], "test.JPG", { type: "image/JPEG" });
      const lowerCaseFile = new File([""], "test.jpg", { type: "image/jpeg" });

      expect(imageProcessor.isValidImageFile(upperCaseFile)).toBe(true);
      expect(imageProcessor.isValidImageFile(lowerCaseFile)).toBe(true);
    });
  });

  describe("边界情况 - 大文件处理", () => {
    it("should detect files exceeding 50MB limit", () => {
      const sizeUnderLimit = 49 * 1024 * 1024;
      const fileUnderLimit = new File(
        ["x".repeat(sizeUnderLimit)],
        "under-limit.jpg",
        { type: "image/jpeg" }
      );

      const sizeOverLimit = 51 * 1024 * 1024;
      const fileOverLimit = new File(
        ["x".repeat(sizeOverLimit)],
        "over-limit.jpg",
        { type: "image/jpeg" }
      );

      expect(imageProcessor.isValidFileSize(fileUnderLimit)).toBe(true);
      expect(imageProcessor.isValidFileSize(fileOverLimit)).toBe(false);
    });

    it("should use custom max file size limit", () => {
      const file = new File(["x".repeat(10 * 1024 * 1024)], "10mb.jpg", {
        type: "image/jpeg",
      });

      expect(imageProcessor.isValidFileSize(file)).toBe(true);
      expect(imageProcessor.isValidFileSize(file, 5 * 1024 * 1024)).toBe(false);
    });

    it("should handle exact boundary sizes", () => {
      const exactLimit = new File(
        ["x".repeat(50 * 1024 * 1024)],
        "exact.jpg",
        { type: "image/jpeg" }
      );

      expect(imageProcessor.isValidFileSize(exactLimit)).toBe(true);
    });

    it("should validate very small files", () => {
      const tinyFile = new File(["x"], "tiny.jpg", { type: "image/jpeg" });
      expect(imageProcessor.isValidFileSize(tinyFile)).toBe(true);
    });
  });

  // ========================================
  // 单元测试 - 辅助方法 (4 tests)
  // ========================================

  describe("单元 - 图像尺寸验证", () => {
    it("should validate normal image dimensions", () => {
      const img = { width: 800, height: 600 };
      expect(imageProcessor.isValidImageDimensions(img as HTMLImageElement)).toBe(true);
    });

    it("should reject oversized images", () => {
      const largeImg = { width: 10000, height: 10000 };
      expect(
        imageProcessor.isValidImageDimensions(largeImg as HTMLImageElement, {
          maxWidth: 8192,
          maxHeight: 8192,
        })
      ).toBe(false);
    });

    it("should reject undersized images", () => {
      const tinyImg = { width: 0, height: 0 };
      expect(
        imageProcessor.isValidImageDimensions(tinyImg as HTMLImageElement, {
          minWidth: 1,
          minHeight: 1,
        })
      ).toBe(false);
    });

    it("should handle extreme aspect ratios", () => {
      const wideImg = { width: 8000, height: 100 };
      const tallImg = { width: 100, height: 8000 };

      expect(imageProcessor.isValidImageDimensions(wideImg as HTMLImageElement)).toBe(true);
      expect(imageProcessor.isValidImageDimensions(tallImg as HTMLImageElement)).toBe(true);
    });
  });

  // ========================================
  // 性能测试 (3 tests)
  // ========================================

  describe("性能 - 缓存机制", () => {
    it("should have clearCache method", () => {
      expect(typeof imageProcessor.clearCache).toBe("function");
    });

    it("should clear cache without errors", () => {
      expect(() => {
        imageProcessor.clearCache();
      }).not.toThrow();
    });

    it("should handle multiple cache clears", () => {
      expect(() => {
        imageProcessor.clearCache();
        imageProcessor.clearCache();
        imageProcessor.clearCache();
      }).not.toThrow();
    });
  });

  describe("性能 - 内存管理", () => {
    it("should have getMemoryUsage method", () => {
      expect(typeof imageProcessor.getMemoryUsage).toBe("function");
    });

    it("should return memory info or null", () => {
      const memory = imageProcessor.getMemoryUsage();
      if (memory) {
        expect(memory).toHaveProperty("jsHeapSizeLimit");
        expect(memory).toHaveProperty("totalJSHeapSize");
        expect(memory).toHaveProperty("usedJSHeapSize");
      } else {
        expect(memory).toBeNull();
      }
    });

    it("should have checkAndCleanMemory method", () => {
      expect(typeof imageProcessor.checkAndCleanMemory).toBe("function");
      expect(() => {
        imageProcessor.checkAndCleanMemory();
      }).not.toThrow();
    });
  });

  // ========================================
  // 生命周期测试 (5 tests)
  // ========================================

  describe("生命周期管理", () => {
    it("should have warmup method", async () => {
      await expect(imageProcessor.warmup()).resolves.not.toThrow();
    });

    it("should have cleanup method", async () => {
      await expect(imageProcessor.cleanup()).resolves.not.toThrow();
    });

    it("should have reinitialize method", async () => {
      await expect(imageProcessor.reinitialize()).resolves.not.toThrow();
    });

    it("should have dispose method", () => {
      expect(() => {
        imageProcessor.dispose();
      }).not.toThrow();
    });

    it("should handle full lifecycle", async () => {
      await expect(imageProcessor.warmup()).resolves.not.toThrow();
      await expect(imageProcessor.cleanup()).resolves.not.toThrow();
      await expect(imageProcessor.reinitialize()).resolves.not.toThrow();
      expect(() => {
        imageProcessor.dispose();
      }).not.toThrow();
    });
  });

  // ========================================
  // 方法存在性测试 (2 tests)
  // ========================================

  describe("API - 方法存在性", () => {
    it("should have all required methods", () => {
      expect(typeof imageProcessor.processImage).toBe("function");
      expect(typeof imageProcessor.batchProcessImages).toBe("function");
      expect(typeof imageProcessor.analyzeImageComplexity).toBe("function");
      expect(typeof imageProcessor.selectOptimalFormat).toBe("function");
      expect(typeof imageProcessor.checkTransparency).toBe("function");
      expect(typeof imageProcessor.optimizeImageQuality).toBe("function");
    });

    it("should have all utility methods", () => {
      expect(typeof imageProcessor.isValidImageFile).toBe("function");
      expect(typeof imageProcessor.isValidFileSize).toBe("function");
      expect(typeof imageProcessor.isValidImageDimensions).toBe("function");
      expect(typeof imageProcessor.clearCache).toBe("function");
      expect(typeof imageProcessor.getMemoryUsage).toBe("function");
      expect(typeof imageProcessor.checkAndCleanMemory).toBe("function");
    });
  });

  // ========================================
  // 边界值测试 (3 tests)
  // ========================================

  describe("边界值 - 特殊情况", () => {
    it("should handle minimum dimensions", () => {
      const img = { width: 1, height: 1 };
      expect(imageProcessor.isValidImageDimensions(img as HTMLImageElement)).toBe(true);
    });

    it("should handle maximum allowed dimensions", () => {
      const img = { width: 8192, height: 8192 };
      expect(imageProcessor.isValidImageDimensions(img as HTMLImageElement)).toBe(true);
    });

    it("should validate dimension combinations", () => {
      const normalImg = { width: 1920, height: 1080 };
      const squareImg = { width: 1000, height: 1000 };
      const portraitImg = { width: 1080, height: 1920 };

      expect(imageProcessor.isValidImageDimensions(normalImg as HTMLImageElement)).toBe(true);
      expect(imageProcessor.isValidImageDimensions(squareImg as HTMLImageElement)).toBe(true);
      expect(imageProcessor.isValidImageDimensions(portraitImg as HTMLImageElement)).toBe(true);
    });
  });

  // ========================================
  // 错误处理测试 (2 tests)
  // ========================================

  describe("错误处理", () => {
    it("should handle invalid image objects gracefully", () => {
      // 测试空对象
      const emptyImg = {};
      expect(imageProcessor.isValidImageDimensions(emptyImg as HTMLImageElement, { minWidth: 1, minHeight: 1, maxWidth: 8192, maxHeight: 8192 })).toBe(false);
    });

    it("should handle zero-sized images", () => {
      const zeroImg = { width: 0, height: 0 };
      expect(imageProcessor.isValidImageDimensions(zeroImg as HTMLImageElement, { minWidth: 1, minHeight: 1 })).toBe(false);
    });
  });
});
