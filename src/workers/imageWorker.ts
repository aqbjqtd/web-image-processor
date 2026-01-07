/// <reference lib="webworker" />

import { ProcessImageConfig } from './../utils/ImageProcessor';

class ImageWorker {
  private canvas: OffscreenCanvas | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | null = null;

  constructor() {
    this.initCanvas();
  }

  private initCanvas(): void {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(1, 1);
      this.ctx = this.canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | null;
    } else {
      throw new Error("OffscreenCanvas not supported, falling back to main thread");
    }
  }

  async processImage(data: { imageData: ImageData, config: ProcessImageConfig, targetWidth: number, targetHeight: number }): Promise<{ success: boolean, dataUrl?: string, fileSize?: number, processedSize?: { width: number, height: number, fileSize: number }, error?: string }> {
    const { imageData, config, targetWidth, targetHeight } = data;

    try {
      if (!this.canvas || !this.ctx) {
        throw new Error('Canvas not initialized');
      }
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;

      const imageBitmap = await createImageBitmap(imageData);

      this.ctx.clearRect(0, 0, targetWidth, targetHeight);

      if (config.resizeMode === "keep_ratio_pad") {
        this.ctx.fillStyle = "#FFFFFF";
        this.ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      this.drawImageWithMode(imageBitmap, config.resizeMode, targetWidth, targetHeight);

      const optimizedDataUrl = await this.optimizeImageQuality(config.maxFileSize);
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private drawImageWithMode(imageBitmap: ImageBitmap, mode: string, canvasWidth: number, canvasHeight: number): void {
    if (!this.ctx) return;
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

      this.ctx.drawImage(imageBitmap, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvasWidth, canvasHeight);
    }
  }

  private async optimizeImageQuality(maxFileSize: number): Promise<string> {
    if (!this.canvas) throw new Error('Canvas not initialized');
    const maxSizeBytes = maxFileSize * 1024;
    let quality = 0.9;

    let blob = await this.canvas.convertToBlob({ type: "image/jpeg", quality: quality });

    if (blob.size <= maxSizeBytes) {
      return await this.blobToDataUrl(blob);
    }

    let minQuality = 0.01;
    let maxQuality = 0.9;
    let bestBlob: Blob | null = null;

    while (maxQuality - minQuality > 0.005) {
      quality = (minQuality + maxQuality) / 2;
      blob = await this.canvas.convertToBlob({ type: "image/jpeg", quality: quality });

      if (blob.size <= maxSizeBytes) {
        bestBlob = blob;
        minQuality = quality;
      } else {
        maxQuality = quality;
      }
    }

    if (bestBlob && bestBlob.size <= maxSizeBytes) {
      return await this.blobToDataUrl(bestBlob);
    }

    blob = await this.canvas.convertToBlob({ type: "image/jpeg", quality: 0.01 });
    return await this.blobToDataUrl(blob);
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
        self.postMessage({ id, type: "PROCESS_IMAGE_RESULT", success: true, data: result });
        break;
      }
      case "CHECK_SUPPORT": {
        self.postMessage({ id, type: "CHECK_SUPPORT_RESULT", success: true, data: { offscreenCanvasSupported: !!self.OffscreenCanvas, imageBitmapSupported: !!self.createImageBitmap } });
        break;
      }
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    self.postMessage({ id, type: "ERROR", success: false, error: errorMessage });
  }
};
