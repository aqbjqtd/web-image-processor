// src/utils/PerformanceMonitor.ts

/**
 * 性能统计结果接口
 */
export interface PerformanceStats {
  count: number;        // 操作次数
  avg: number;          // 平均耗时 (ms)
  min: number;          // 最小耗时 (ms)
  max: number;          // 最大耗时 (ms)
  p95: number;          // P95 耗时 (ms) - 95%的操作在这个时间内完成
}

/**
 * 性能监控类
 *
 * 用于记录和分析图像处理操作的性能指标
 * 支持记录操作耗时、计算统计数据、重置监控数据
 *
 * @example
 * ```typescript
 * import performanceMonitor from './utils/PerformanceMonitor';
 *
 * // 记录操作
 * const start = performance.now();
 * await processImage(file, config);
 * const duration = performance.now() - start;
 * performanceMonitor.recordOperation('processImage', duration);
 *
 * // 获取统计
 * const stats = performanceMonitor.getStats('processImage');
 * console.log(`平均耗时: ${stats.avg}ms`);
 * ```
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * 记录操作耗时
   *
   * @param operation - 操作名称 (如: 'processImage', 'optimizeImageQuality')
   * @param duration - 操作耗时 (毫秒)
   */
  recordOperation(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }

  /**
   * 获取指定操作的统计数据
   *
   * @param operation - 操作名称
   * @returns 统计数据，如果操作不存在则返回 null
   */
  getStats(operation: string): PerformanceStats | null {
    const durations = this.metrics.get(operation);
    if (!durations || durations.length === 0) return null;

    const sorted = [...durations].sort((a, b) => a - b);
    const count = durations.length;
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count,
      avg: sum / count,
      min: sorted[0],
      max: sorted[count - 1],
      p95: sorted[Math.floor(count * 0.95)],
    };
  }

  /**
   * 重置所有监控数据
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * 获取所有操作的统计数据
   *
   * @returns 包含所有操作统计数据的对象
   */
  getAllStats(): Record<string, PerformanceStats> {
    const result: Record<string, PerformanceStats> = {};
    for (const [operation] of this.metrics) {
      const stats = this.getStats(operation);
      if (stats) {
        result[operation] = stats;
      }
    }
    return result;
  }

  /**
   * 获取所有已记录的操作名称
   *
   * @returns 操作名称数组
   */
  getOperations(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * 打印性能统计报告到控制台
   *
   * @param operation - 可选，指定要打印的操作名称。如果不指定，打印所有操作
   */
  printReport(operation?: string): void {
    if (operation) {
      const stats = this.getStats(operation);
      if (!stats) {
        console.log(`[PerformanceMonitor] 操作 "${operation}" 没有统计数据`);
        return;
      }

      console.log(`[PerformanceMonitor] 操作 "${operation}" 统计:`);
      console.log(`  次数: ${stats.count}`);
      console.log(`  平均: ${stats.avg.toFixed(2)}ms`);
      console.log(`  最小: ${stats.min.toFixed(2)}ms`);
      console.log(`  最大: ${stats.max.toFixed(2)}ms`);
      console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
    } else {
      const allStats = this.getAllStats();
      const operations = Object.keys(allStats);

      if (operations.length === 0) {
        console.log('[PerformanceMonitor] 没有统计数据');
        return;
      }

      console.log('[PerformanceMonitor] 性能统计报告:');
      console.log('================================');

      for (const op of operations) {
        const stats = allStats[op];
        console.log(`\n操作: ${op}`);
        console.log(`  次数: ${stats.count}`);
        console.log(`  平均: ${stats.avg.toFixed(2)}ms`);
        console.log(`  最小: ${stats.min.toFixed(2)}ms`);
        console.log(`  最大: ${stats.max.toFixed(2)}ms`);
        console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
      }

      console.log('\n================================');
    }
  }
}

// 单例导出
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
