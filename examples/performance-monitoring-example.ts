/**
 * 性能监控使用示例
 *
 * 演示如何使用性能监控系统来追踪和优化图像处理操作
 */

import imageProcessor from '../src/utils/ImageProcessor';

// ============================================================================
// 示例 1: 基本性能监控
// ============================================================================

async function basicMonitoring() {
  console.log('=== 示例 1: 基本性能监控 ===\n');

  // 准备测试文件
  const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

  // 配置处理参数
  const config = {
    resizeOption: 'custom' as const,
    resizePercentage: 100,
    targetWidth: 1920,
    targetHeight: 1080,
    resizeMode: 'keep_ratio_pad' as const,
    maxFileSize: 500,
  };

  // 处理图像（自动记录性能）
  const start = performance.now();
  const result = await imageProcessor.processImage(file, config);
  const duration = performance.now() - start;

  console.log(`处理完成，耗时: ${duration.toFixed(2)}ms`);
  console.log(`压缩率: ${result.sizeReduction}%\n`);

  // 查看性能统计
  const stats = imageProcessor.getPerformanceStats();
  console.log('性能统计:', stats);
}

// ============================================================================
// 示例 2: 批量处理监控
// ============================================================================

async function batchMonitoring() {
  console.log('\n=== 示例 2: 批量处理监控 ===\n');

  // 模拟多个文件
  const files = Array.from({ length: 10 }, (_, i) =>
    new File([''], `image${i}.jpg`, { type: 'image/jpeg' })
  );

  const config = {
    resizeOption: 'custom' as const,
    resizePercentage: 100,
    targetWidth: 1920,
    targetHeight: 1080,
    resizeMode: 'keep_ratio_pad' as const,
    maxFileSize: 500,
  };

  // 批量处理（带进度回调）
  const results = await imageProcessor.batchProcessImages(
    files,
    config,
    (progress) => {
      console.log(
        `处理进度: ${progress.processed}/${progress.total} ` +
        `(${(progress.progress * 100).toFixed(1)}%)`
      );
    }
  );

  // 打印完整性能报告
  imageProcessor.printPerformanceReport();

  // 分析结果
  const successCount = results.filter((r) => r.success).length;
  console.log(`\n成功: ${successCount}/${results.length}`);
}

// ============================================================================
// 示例 3: 缓存效果监控
// ============================================================================

async function cacheMonitoring() {
  console.log('\n=== 示例 3: 缓存效果监控 ===\n');

  const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
  const config = {
    resizeOption: 'custom' as const,
    resizePercentage: 100,
    targetWidth: 1920,
    targetHeight: 1080,
    resizeMode: 'keep_ratio_pad' as const,
    maxFileSize: 500,
  };

  // 第一次处理（无缓存）
  console.log('第一次处理（无缓存）...');
  const start1 = performance.now();
  await imageProcessor.processImage(file, config);
  const duration1 = performance.now() - start1;
  console.log(`耗时: ${duration1.toFixed(2)}ms\n`);

  // 第二次处理（有缓存）
  console.log('第二次处理（有缓存）...');
  const start2 = performance.now();
  await imageProcessor.processImage(file, config);
  const duration2 = performance.now() - start2;
  console.log(`耗时: ${duration2.toFixed(2)}ms\n`);

  // 计算缓存加速比
  const speedup = duration1 / duration2;
  console.log(`缓存加速: ${speedup.toFixed(2)}x\n`);

  // 查看缓存统计
  imageProcessor.printPerformanceReport('processImage');
}

// ============================================================================
// 示例 4: 性能基准测试
// ============================================================================

async function performanceBenchmark() {
  console.log('\n=== 示例 4: 性能基准测试 ===\n');

  const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
  const config = {
    resizeOption: 'custom' as const,
    resizePercentage: 100,
    targetWidth: 1920,
    targetHeight: 1080,
    resizeMode: 'keep_ratio_pad' as const,
    maxFileSize: 500,
  };

  const iterations = 10;
  const durations: number[] = [];

  // 多次运行测试
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await imageProcessor.processImage(file, config);
    const duration = performance.now() - start;
    durations.push(duration);
    console.log(`第 ${i + 1} 次: ${duration.toFixed(2)}ms`);
  }

  // 统计分析
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  const sorted = [...durations].sort((a, b) => a - b);
  const p95 = sorted[Math.floor(durations.length * 0.95)];

  console.log('\n基准测试结果:');
  console.log(`  平均: ${avg.toFixed(2)}ms`);
  console.log(`  最小: ${min.toFixed(2)}ms`);
  console.log(`  最大: ${max.toFixed(2)}ms`);
  console.log(`  P95: ${p95.toFixed(2)}ms\n`);

  // 查看详细统计
  imageProcessor.printPerformanceReport();
}

// ============================================================================
// 示例 5: 内存监控
// ============================================================================

async function memoryMonitoring() {
  console.log('\n=== 示例 5: 内存监控 ===\n');

  // 获取内存使用情况
  const memory = imageProcessor.getMemoryUsage();

  if (!memory) {
    console.log('当前环境不支持内存监控');
    return;
  }

  const usedMB = memory.usedJSHeapSize / 1024 / 1024;
  const totalMB = memory.totalJSHeapSize / 1024 / 1024;
  const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
  const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

  console.log('内存使用情况:');
  console.log(`  已用: ${usedMB.toFixed(2)} MB`);
  console.log(`  总计: ${totalMB.toFixed(2)} MB`);
  console.log(`  限制: ${limitMB.toFixed(2)} MB`);
  console.log(`  使用率: ${(usageRatio * 100).toFixed(2)}%\n`);

  // 检查是否需要清理
  if (usageRatio > 0.85) {
    console.log('⚠️  内存使用率过高，正在清理...');
    imageProcessor.checkAndCleanMemory();
  }
}

// ============================================================================
// 运行所有示例
// ============================================================================

async function runAllExamples() {
  try {
    await basicMonitoring();
    await batchMonitoring();
    await cacheMonitoring();
    await performanceBenchmark();
    await memoryMonitoring();

    console.log('\n✅ 所有示例运行完成\n');

    // 重置性能统计
    imageProcessor.resetPerformanceStats();
  } catch (error) {
    console.error('❌ 示例运行失败:', error);
    process.exit(1);
  }
}

// 导出示例函数
export {
  basicMonitoring,
  batchMonitoring,
  cacheMonitoring,
  performanceBenchmark,
  memoryMonitoring,
  runAllExamples,
};

// 如果直接运行此文件
if (require.main === module) {
  runAllExamples();
}
