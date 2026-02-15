/// <reference lib="webworker" />

import { ProcessImageConfig } from "./../utils/ImageProcessor";
import { ImageRenderer } from "../utils/ImageRenderer";
import {
  COMPRESSION_CONFIG,
} from "../utils/CompressionLogic";

class ImageWorker {
  private canvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;

  constructor() {
    this.initCanvas();
  }

  private initCanvas(): void {
    if (typeof OffscreenCanvas !== "undefined") {
      this.canvas = new OffscreenCanvas(1, 1);
      this.ctx = this.canvas.getContext(
        "2d",
      ) as OffscreenCanvasRenderingContext2D | null;
    } else {
      throw new Error(
        "OffscreenCanvas not supported, falling back to main thread",
      );
    }
  }

  async processImage(data: {
    imageData: ImageData;
    config: ProcessImageConfig;
    targetWidth: number;
    targetHeight: number;
  }): Promise<{
    success: boolean;
    dataUrl?: string;
    fileSize?: number;
    processedSize?: { width: number; height: number; fileSize: number };
    error?: string;
  }> {
    const { imageData, config, targetWidth, targetHeight } = data;

    try {
      if (!this.canvas || !this.ctx) {
        throw new Error("Canvas not initialized");
      }
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;

      const imageBitmap = await createImageBitmap(imageData);

      this.ctx.clearRect(0, 0, targetWidth, targetHeight);

      if (config.resizeMode === "keep_ratio_pad") {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      this.drawImageWithMode(
        imageBitmap,
        config.resizeMode,
        targetWidth,
        targetHeight,
      );

      // 使用共享压缩逻辑模块
      const optimizedDataUrl = await this.optimizeImageQuality(
        config.maxFileSize,
      );
      const fileSize = this.getDataUrlSize(optimizedDataUrl);

      return {
        success: true,
        dataUrl: optimizedDataUrl,
        fileSize: fileSize,
        processedSize: {
          width: targetWidth,
          height: targetHeight,
          fileSize: fileSize,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private drawImageWithMode(
    imageBitmap: ImageBitmap,
    mode: string,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    if (!this.ctx) {
      console.warn("Worker绘制上下文为空，无法绘制图像");
      return;
    }

    // 使用统一的图像渲染器
    ImageRenderer.drawImageWithMode(
      imageBitmap,
      mode,
      canvasWidth,
      canvasHeight,
      this.ctx,
    );
  }

  /**
   * 使用共享压缩逻辑优化图像质量
   * 注意：OffscreenCanvas 使用 convertToBlob 而非 toDataURL
   */
  private async optimizeImageQuality(
    maxFileSize: number,
  ): Promise<string> {
    if (!this.canvas) throw new Error("Canvas not initialized");

    // OffscreenCanvas 使用 convertToBlob，然后转换为 DataURL
    const maxSizeBytes = maxFileSize * 1024;
    let quality = COMPRESSION_CONFIG.INITIAL_QUALITY;

    // 尝试初始质量
    let blob = await this.canvas.convertToBlob({
      type: "image/jpeg",
      quality: quality,
    });

    if (blob.size <= maxSizeBytes) {
      return this.blobToDataUrl(blob);
    }

    // 二分查找优化
    let minQuality = COMPRESSION_CONFIG.MIN_QUALITY;
    let maxQuality = COMPRESSION_CONFIG.INITIAL_QUALITY;
    let bestBlob: Blob | null = null;

    while (maxQuality - minQuality > COMPRESSION_CONFIG.QUALITY_STEP) {
      quality = (minQuality + maxQuality) / 2;
      blob = await this.canvas.convertToBlob({
        type: "image/jpeg",
        quality: quality,
      });

      if (blob.size <= maxSizeBytes) {
        bestBlob = blob;
        minQuality = quality;
      } else {
        maxQuality = quality;
      }
    }

    if (bestBlob && bestBlob.size <= maxSizeBytes) {
      return this.blobToDataUrl(bestBlob);
    }

    // 最终降级
    blob = await this.canvas.convertToBlob({
      type: "image/jpeg",
      quality: COMPRESSION_CONFIG.MIN_QUALITY,
    });
    return this.blobToDataUrl(blob);
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private getDataUrlSize(dataUrl: string): number {
    const base64 = dataUrl.split(",")[1];
    if (!base64) return 0;
    return Math.round(base64.length * 0.75);
  }
}

const worker = new ImageWorker();

self.onmessage = async function (e: MessageEvent) {
  const { id, type, data } = e.data;

  try {
    switch (type) {
      case "PROCESS_IMAGE": {
        const result = await worker.processImage(data);
        self.postMessage({
          id,
          type: "PROCESS_IMAGE_RESULT",
          success: true,
          data: result,
        });
        break;
      }
      case "CHECK_SUPPORT": {
        self.postMessage({
          id,
          type: "CHECK_SUPPORT_RESULT",
          success: true,
          data: {
            offscreenCanvasSupported: !!self.OffscreenCanvas,
            imageBitmapSupported: !!self.createImageBitmap,
          },
        });
        break;
      }
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    self.postMessage({
      id,
      type: "ERROR",
      success: false,
      error: errorMessage,
    });
  }
};
