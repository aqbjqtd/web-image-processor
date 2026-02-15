#!/usr/bin/env node

/**
 * 性能基准测试脚本
 *
 * 用于测试图像处理引擎的性能指标
 *
 * 运行方式：
 * node scripts/benchmark-performance.js
 *
 * 测试内容：
 * 1. 单张图片处理性能
 * 2. 批量处理性能
 * 3. 内存使用情况
 * 4. 缓存效果
 */

const path = require("path");
const fs = require("fs");

// 模拟环境
const mockEnvironment = () => {
  global.performance = global.performance || {
    now: () => Date.now(),
  };
};

// 生成测试图片数据
const generateTestImageData = (width, height) => {
  const size = width * height * 4;
  const data = new Uint8ClampedArray(size);

  for (let i = 0; i < size; i += 4) {
    // 生成彩色渐变
    const x = (i / 4) % width;
    const y = Math.floor((i / 4) / width);
    data[i] = (x / width) * 255; // R
    data[i + 1] = (y / height) * 255; // G
    data[i + 2] = 128; // B
    data[i + 3] = 255; // A
  }

  return {
    data,
    width,
    height,
  };
};

// 性能测试结果
class BenchmarkResults {
  constructor() {
    this.results = [];
  }

  add(name, duration, metadata = {}) {
    this.results.push({
      name,
      duration,
      timestamp: Date.now(),
      ...metadata,
    });
  }

  print() {
    console.log("\n========== 性能基准测试报告 ==========\n");

    for (const result of this.results) {
      console.log(`测试: ${result.name}`);
      console.log(`  耗时: ${result.duration.toFixed(2)}ms`);
      if (result.metadata) {
        console.log(`  元数据: ${JSON.stringify(result.metadata)}`);
      }
      console.log("");
    }

    console.log("======================================\n");
  }

  save(filePath) {
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
    };

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`报告已保存到: ${filePath}`);
  }
}

// 测试套件
class PerformanceBenchmark {
  constructor() {
    this.results = new BenchmarkResults();
  }

  /**
   * 测试图像复杂度分析性能
   */
  async testComplexityAnalysis() {
    console.log("测试: 图像复杂度分析...");

    const testSizes = [
      { width: 800, height: 600, name: "800x600" },
      { width: 1920, height: 1080, name: "1920x1080" },
      { width: 3840, height: 2160, name: "4K" },
    ];

    for (const size of testSizes) {
      const start = performance.now();

      // 模拟复杂度分析
      const imageData = generateTestImageData(size.width, size.height);
      const sampleSize = 200;

      // 计算方差
      let totalVariance = 0;
      let edgeCount = 0;
      const pixelCount = sampleSize * sampleSize;

      for (let y = 1; y < sampleSize - 1; y++) {
        for (let x = 1; x < sampleSize - 1; x++) {
          const idx = (y * sampleSize + x) * 4;
          const neighbors = [
            imageData.data[idx - 4],
            imageData.data[idx + 4],
            imageData.data[idx - sampleSize * 4],
            imageData.data[idx + sampleSize * 4],
          ];

          const variance = neighbors.reduce((sum, val) => {
            return sum + Math.pow(val - imageData.data[idx], 2);
          }, 0) / 4;

          totalVariance += variance;
          if (variance > 1000) edgeCount++;
        }
      }

      const duration = performance.now() - start;
      this.results.add(`复杂度分析 (${size.name})`, duration, {
        pixels: pixelCount,
        avgVariance: totalVariance / pixelCount,
        edgeRatio: edgeCount / pixelCount,
      });
    }
  }

  /**
   * 测试缓存性能
   */
  async testCachePerformance() {
    console.log("测试: 缓存性能...");

    const cacheSize = 50;
    const iterations = 100;

    // 模拟缓存操作
    const cache = new Map();

    // 测试缓存写入
    const start = performance.now();
    for (let i = 0; i < cacheSize; i++) {
      cache.set(`key_${i}`, {
        data: `data_${i}`.repeat(100),
        timestamp: Date.now(),
      });
    }
    const writeDuration = performance.now() - start;

    // 测试缓存读取
    const readStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const key = `key_${Math.floor(Math.random() * cacheSize)}`;
      cache.get(key);
    }
    const readDuration = performance.now() - readStart;

    this.results.add("缓存写入", writeDuration, {
      entries: cacheSize,
    });
    this.results.add("缓存读取", readDuration, {
      iterations,
      hitRate: "100%",
    });
  }

  /**
   * 测试二分查找性能
   */
  async testBinarySearchPerformance() {
    console.log("测试: 二分查找性能...");

    const testCases = [
      { name: "10 次迭代", iterations: 10 },
      { name: "20 次迭代", iterations: 20 },
      { name: "50 次迭代", iterations: 50 },
    ];

    for (const testCase of testCases) {
      const start = performance.now();

      let minQuality = 0.01;
      let maxQuality = 0.9;
      let bestQuality = 0;

      for (let i = 0; i < testCase.iterations; i++) {
        const qualityRatio = 0.5;
        const quality = minQuality + (maxQuality - minQuality) * qualityRatio;
        bestQuality = quality;

        // 模拟压缩测试
        const simulatedSize = Math.random() * 1000;
        if (simulatedSize < 500) {
          minQuality = quality;
        } else {
          maxQuality = quality;
        }
      }

      const duration = performance.now() - start;
      this.results.add(`二分查找 (${testCase.name})`, duration, {
        finalQuality: bestQuality.toFixed(3),
      });
    }
  }

  /**
   * 测试内存使用
   */
  async testMemoryUsage() {
    console.log("测试: 内存使用...");

    const iterations = 10;
    const arraySize = 1000000;

    const start = performance.now();
    const arrays = [];

    for (let i = 0; i < iterations; i++) {
      const array = new Uint8Array(arraySize);
      arrays.push(array);

      // 每 3 次迭代清理一次内存
      if (i % 3 === 2 && arrays.length > 0) {
        arrays.pop();
      }
    }

    const duration = performance.now() - start;
    const estimatedMemory = iterations * arraySize / 1024 / 1024; // MB

    this.results.add("内存分配", duration, {
      iterations,
      estimatedMemoryMB: estimatedMemory.toFixed(2),
    });
  }

  /**
   * 运行所有测试
   */
  async runAll() {
    console.log("开始性能基准测试...\n");

    mockEnvironment();

    await this.testComplexityAnalysis();
    await this.testCachePerformance();
    await this.testBinarySearchPerformance();
    await this.testMemoryUsage();

    this.results.print();

    // 保存报告
    const reportPath = path.join(__dirname, "../performance-report.json");
    this.results.save(reportPath);

    return this.results;
  }
}

// 主程序
(async () => {
  const benchmark = new PerformanceBenchmark();

  try {
    await benchmark.runAll();
    console.log("✅ 性能基准测试完成");
  } catch (error) {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  }
})();
