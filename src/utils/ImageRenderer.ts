/**
 * 图像渲染工具类 - 统一的图像绘制逻辑
 * 消除 ImageProcessor 和 imageWorker 中的代码重复
 */
export class ImageRenderer {
  /**
   * 使用指定模式绘制图像
   * @param image - 源图像（支持多种类型）
   * @param mode - 绘制模式
   * @param canvasWidth - 画布宽度
   * @param canvasHeight - 画布高度
   * @param context - 渲染上下文
   */
  static drawImageWithMode(
    image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
    mode: string,
    canvasWidth: number,
    canvasHeight: number,
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  ): void {
    const originalWidth = image.width;
    const originalHeight = image.height;

    switch (mode) {
      case "stretch":
        // 拉伸模式：直接填充整个画布
        context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
        break;

      case "keep_ratio_pad":
        // 保持比例填充模式：居中显示，空白区域填充背景
        ImageRenderer.drawImageKeepRatioPad(
          image,
          originalWidth,
          originalHeight,
          canvasWidth,
          canvasHeight,
          context,
        );
        break;

      case "keep_ratio_crop":
        // 保持比例裁剪模式：裁剪以完全填充画布
        ImageRenderer.drawImageKeepRatioCrop(
          image,
          originalWidth,
          originalHeight,
          canvasWidth,
          canvasHeight,
          context,
        );
        break;

      default:
        console.warn(`未知的绘制模式: ${mode}，使用默认拉伸模式`);
        context.drawImage(image, 0, 0, canvasWidth, canvasHeight);
        break;
    }
  }

  /**
   * 保持比例填充绘制
   * 计算合适的绘制尺寸和位置，保持原图比例，居中显示
   */
  private static drawImageKeepRatioPad(
    image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
    originalWidth: number,
    originalHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  ): void {
    const aspectRatio = originalWidth / originalHeight;
    const canvasAspectRatio = canvasWidth / canvasHeight;

    let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

    if (aspectRatio > canvasAspectRatio) {
      // 图像更宽，以画布宽度为准
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / aspectRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      // 图像更高，以画布高度为准
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * aspectRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    }

    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  }

  /**
   * 保持比例裁剪绘制
   * 裁剪图像以完全填充画布，保持原图比例
   */
  private static drawImageKeepRatioCrop(
    image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
    originalWidth: number,
    originalHeight: number,
    canvasWidth: number,
    canvasHeight: number,
    context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  ): void {
    const aspectRatio = originalWidth / originalHeight;
    const canvasAspectRatio = canvasWidth / canvasHeight;

    let sourceX: number,
      sourceY: number,
      sourceWidth: number,
      sourceHeight: number;

    if (aspectRatio > canvasAspectRatio) {
      // 图像更宽，裁剪左右部分
      sourceHeight = originalHeight;
      sourceWidth = originalHeight * canvasAspectRatio;
      sourceX = (originalWidth - sourceWidth) / 2;
      sourceY = 0;
    } else {
      // 图像更高，裁剪上下部分
      sourceWidth = originalWidth;
      sourceHeight = originalWidth / canvasAspectRatio;
      sourceX = 0;
      sourceY = (originalHeight - sourceHeight) / 2;
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvasWidth,
      canvasHeight,
    );
  }
}
