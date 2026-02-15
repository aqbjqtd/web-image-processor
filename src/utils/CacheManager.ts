import { MEMORY_CONFIG } from "./ImageConfig";
import { ProcessedImage, ProcessImageConfig } from "./ImageProcessor";
import { logger } from "./logger";

/**
 * 缓存条目接口
 */
export interface CacheEntry {
  /** 缓存键 */
  key: string;
  /** 处理后的图像数据 */
  data: ProcessedImage;
  /** 缓存时间戳 */
  timestamp: number;
  /** 缓存大小（字节） */
  size: number;
  /** 访问次数 */
  accessCount: number;
  /** 最后访问时间 */
  lastAccessed: number;
}

/**
 * 内存感知缓存管理器
 * 提供智能的缓存策略，基于内存使用情况自动调整缓存大小
 */
export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private memoryThreshold: number;
  private currentMemoryUsage: number = 0;
  private maxCacheSize: number;
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;

  constructor(maxCacheSize: number) {
    this.maxCacheSize = maxCacheSize;
    this.memoryThreshold = MEMORY_CONFIG.CLEANUP_THRESHOLD;
  }

  /**
   * 生成缓存键
   */
  private generateKey(
    fileName: string,
    config: ProcessImageConfig,
    targetWidth: number,
    targetHeight: number,
  ): string {
    const configHash = this.hashObject(config);
    return `${fileName}_${targetWidth}x${targetHeight}_${configHash}`;
  }

  /**
   * 对象哈希
   */
  private hashObject(obj: ProcessImageConfig): string {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * 获取缓存条目大小
   */
  private getEntrySize(entry: CacheEntry): number {
    // 估算缓存条目的大小
    const dataSize = entry.data.dataUrl.length * 0.75; // Base64 编码后的字节数
    const metadataSize =
      JSON.stringify({
        key: entry.key,
        timestamp: entry.timestamp,
        size: entry.size,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
      }).length * 2; // UTF-16 编码，估算每个字符2字节

    return dataSize + metadataSize;
  }

  /**
   * 获取当前内存使用量
   */
  private calculateMemoryUsage(): void {
    this.currentMemoryUsage = 0;

    for (const entry of this.cache.values()) {
      this.currentMemoryUsage += this.getEntrySize(entry);
    }
  }

  /**
   * 检查是否需要清理缓存
   */
  private shouldEvict(): boolean {
    this.calculateMemoryUsage();

    // 基于内存使用量的清理
    if (this.currentMemoryUsage > this.memoryThreshold) {
      logger.warn(
        `内存使用量 ${this.currentMemoryUsage} 超过阈值 ${this.memoryThreshold}，开始清理缓存`,
      );
      return true;
    }

    // 基于缓存数量的清理
    if (this.cache.size > this.maxCacheSize) {
      logger.warn(
        `缓存数量 ${this.cache.size} 超过最大值 ${this.maxCacheSize}，开始清理缓存`,
      );
      return true;
    }

    return false;
  }

  /**
   * 清理缓存
   */
  private evict(): void {
    if (this.cache.size === 0) return;

    const entries = Array.from(this.cache.entries());

    // 按最近最少使用（LRU）策略排序
    entries.sort((a, b) => {
      if (a[1].lastAccessed !== b[1].lastAccessed) {
        return a[1].lastAccessed - b[1].lastAccessed;
      }
      return b[1].accessCount - a[1].accessCount;
    });

    // 清理最少使用的条目，直到满足内存限制
    let clearedCount = 0;
    for (const [key, entry] of entries) {
      if (this.currentMemoryUsage <= this.memoryThreshold * 0.8) {
        break;
      }

      this.cache.delete(key);
      this.currentMemoryUsage -= this.getEntrySize(entry);
      clearedCount++;
      this.evictionCount++;
    }

    logger.log(
      `清理了 ${clearedCount} 个缓存条目，释放 ${clearedCount} bytes 内存`,
    );
  }

  /**
   * 获取缓存条目
   */
  get(
    fileName: string,
    config: ProcessImageConfig,
    targetWidth: number,
    targetHeight: number,
  ): ProcessedImage | null {
    const key = this.generateKey(fileName, config, targetWidth, targetHeight);
    const entry = this.cache.get(key);

    if (entry) {
      // 更新访问信息
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.hitCount++;
      return entry.data;
    } else {
      this.missCount++;
      return null;
    }
  }

  /**
   * 设置缓存条目
   */
  set(
    fileName: string,
    config: ProcessImageConfig,
    targetWidth: number,
    targetHeight: number,
    data: ProcessedImage,
  ): void {
    const key = this.generateKey(fileName, config, targetWidth, targetHeight);
    const now = Date.now();

    const entry: CacheEntry = {
      key,
      data,
      timestamp: now,
      size: data.processedSize?.fileSize || 0,
      accessCount: 1,
      lastAccessed: now,
    };

    this.cache.set(key, entry);

    // 检查是否需要清理缓存
    if (this.shouldEvict()) {
      this.evict();
    }
  }

  /**
   * 检查缓存是否存在
   */
  has(
    fileName: string,
    config: ProcessImageConfig,
    targetWidth: number,
    targetHeight: number,
  ): boolean {
    const key = this.generateKey(fileName, config, targetWidth, targetHeight);
    return this.cache.has(key);
  }

  /**
   * 删除缓存条目
   */
  delete(
    fileName: string,
    config: ProcessImageConfig,
    targetWidth: number,
    targetHeight: number,
  ): boolean {
    const key = this.generateKey(fileName, config, targetWidth, targetHeight);
    const entry = this.cache.get(key);

    if (entry) {
      this.currentMemoryUsage -= this.getEntrySize(entry);
    }

    return this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.currentMemoryUsage = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    logger.log("缓存已清空");
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
    evictionCount: number;
  } {
    this.calculateMemoryUsage();

    const totalRequests = this.hitCount + this.missCount;
    const hitRate =
      totalRequests > 0 ? (this.hitCount / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: this.currentMemoryUsage,
      evictionCount: this.evictionCount,
    };
  }

  /**
   * 获取缓存条目详细信息
   */
  getDetailedStats(): Array<{
    key: string;
    fileName: string;
    size: number;
    accessCount: number;
    lastAccessed: Date;
  }> {
    this.calculateMemoryUsage();

    const entries = Array.from(this.cache.values()).map((entry) => ({
      key: entry.key,
      fileName: entry.data.name,
      size: entry.size,
      accessCount: entry.accessCount,
      lastAccessed: new Date(entry.lastAccessed),
    }));

    return entries;
  }

  /**
   * 预热缓存
   * 为常用配置预热缓存
   */
  async preload(
    configs: Array<{
      fileName: string;
      config: ProcessImageConfig;
      targetWidth: number;
      targetHeight: number;
    }>,
  ): Promise<void> {
    logger.log(`开始预热缓存，${configs.length} 个配置`);

    for (const config of configs) {
      if (
        this.has(
          config.fileName,
          config.config,
          config.targetWidth,
          config.targetHeight,
        )
      ) {
        logger.log(`跳过已缓存: ${config.fileName}`);
        continue;
      }

      // 这里可以添加预热逻辑，比如预先生成缓存条目
      logger.log(`预热缓存: ${config.fileName}`);
    }

    logger.log("缓存预热完成");
  }

  /**
   * 优化缓存
   * 清理过期或无效的缓存条目
   */
  optimize(): void {
    const now = Date.now();
    const entriesToEvict: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      const maxAge = 24 * 60 * 60 * 1000; // 24小时

      // 清理过期条目
      if (age > maxAge) {
        entriesToEvict.push(key);
      }
    }

    // 批量删除
    entriesToEvict.forEach((key) => {
      this.cache.delete(key);
    });

    if (entriesToEvict.length > 0) {
      logger.log(`清理了 ${entriesToEvict.length} 个过期缓存条目`);
    }
  }

  /**
   * 导出缓存数据
   */
  export(): string {
    const data = {
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        data: entry.data,
        metadata: {
          timestamp: entry.timestamp,
          size: entry.size,
          accessCount: entry.accessCount,
          lastAccessed: entry.lastAccessed,
        },
      })),
      stats: this.getStats(),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * 导入缓存数据
   */
  import(data: string): void {
    try {
      const parsed = JSON.parse(data);

      this.clear();

      for (const item of parsed.entries) {
        const { data, metadata } = item;

        const entry: CacheEntry = {
          key: item.key,
          data,
          timestamp: metadata.timestamp,
          size: metadata.size,
          accessCount: metadata.accessCount,
          lastAccessed: metadata.lastAccessed,
        };

        this.cache.set(item.key, entry);
      }

      logger.log(`导入了 ${parsed.entries.length} 个缓存条目`);
    } catch (error) {
      logger.error("导入缓存失败:", error);
    }
  }
}

/**
 * 默认导出
 */
export default CacheManager;
