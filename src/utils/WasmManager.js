/**
 * WebAssembly模块管理器
 * 基于知识图谱中的WebAssembly最佳实践
 * 负责WASM模块的加载、初始化和生命周期管理
 */

class WasmManager {
  constructor() {
    this.modules = new Map();
    this.loadingPromises = new Map();
    this.initialized = false;
  }

  /**
   * 初始化WASM环境
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // 检查WebAssembly支持
      if (typeof window !== 'undefined') {
        if (!("WebAssembly" in window)) {
          throw new Error("当前浏览器不支持WebAssembly");
        }
      } else {
        // Node.js环境检查
        if (typeof WebAssembly === 'undefined') {
          throw new Error("当前浏览器不支持WebAssembly");
        }
      }

      // 测试环境下跳过WASM模块加载
      if (process.env.NODE_ENV === 'test') {
        console.log("测试环境：跳过WASM模块加载");
        this.initialized = true;
        return;
      }

      // 预加载核心模块
      await this.preloadCoreModules();

      this.initialized = true;
      console.log("WASM环境初始化完成");
    } catch (error) {
      console.error("WASM环境初始化失败:", error);
      throw error;
    }
  }

  /**
   * 预加载核心模块
   */
  async preloadCoreModules() {
    const coreModules = [
      {
        name: "imageProcessor",
        url: "/wasm/image-processor.wasm",
        priority: "high",
      },

      {
        name: "opencv",
        url: "/wasm/opencv.wasm",
        priority: "medium",
      },
    ];

    // 并行加载高优先级模块
    const highPriorityModules = coreModules.filter(
      (m) => m.priority === "high",
    );
    await Promise.all(
      highPriorityModules.map((module) =>
        this.loadModule(module.name, module.url),
      ),
    );

    // 后台加载中优先级模块
    const mediumPriorityModules = coreModules.filter(
      (m) => m.priority === "medium",
    );
    mediumPriorityModules.forEach((module) => {
      this.loadModule(module.name, module.url).catch(console.error);
    });
  }

  /**
   * 加载WASM模块
   * @param {string} name - 模块名称
   * @param {string} url - 模块URL
   * @param {Object} imports - 导入对象
   * @returns {Promise<WebAssembly.Instance>}
   */
  async loadModule(name, url, imports = {}) {
    // 避免重复加载
    if (this.modules.has(name)) {
      return this.modules.get(name);
    }

    // 如果正在加载，返回加载Promise
    if (this.loadingPromises.has(name)) {
      return this.loadingPromises.get(name);
    }

    const loadingPromise = this._loadModuleInternal(name, url, imports);
    this.loadingPromises.set(name, loadingPromise);

    try {
      const module = await loadingPromise;
      this.modules.set(name, module);
      this.loadingPromises.delete(name);
      return module;
    } catch (error) {
      this.loadingPromises.delete(name);
      throw error;
    }
  }

  /**
   * 内部模块加载实现
   */
  async _loadModuleInternal(name, url, imports) {
    try {
      console.log(`开始加载WASM模块: ${name}`);
      const startTime = performance.now();

      // 构建完整URL
      let fullUrl = url;
      if (!url.startsWith('http') && !url.startsWith('/')) {
        // 相对路径转换为绝对路径
        fullUrl = new URL(url, window.location.origin).href;
      } else if (url.startsWith('/')) {
        // 绝对路径转换为完整URL
        fullUrl = new URL(url, window.location.origin).href;
      }

      // 获取WASM字节码
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(
          `加载WASM模块失败: ${response.status} ${response.statusText}`,
        );
      }

      const bytes = await response.arrayBuffer();

      // 编译和实例化
      const module = await WebAssembly.compile(bytes);
      const instance = await WebAssembly.instantiate(module, imports);

      const loadTime = performance.now() - startTime;
      console.log(`WASM模块 ${name} 加载完成，耗时: ${loadTime.toFixed(2)}ms`);

      return {
        module,
        instance,
        exports: instance.exports,
        memory: instance.exports.memory,
        loadTime,
      };
    } catch (error) {
      console.error(`WASM模块 ${name} 加载失败:`, error);
      throw error;
    }
  }

  /**
   * 获取模块
   * @param {string} name - 模块名称
   * @returns {Object|null}
   */
  getModule(name) {
    return this.modules.get(name) || null;
  }

  /**
   * 检查模块是否已加载
   * @param {string} name - 模块名称
   * @returns {boolean}
   */
  hasModule(name) {
    return this.modules.has(name);
  }

  /**
   * 卸载模块
   * @param {string} name - 模块名称
   */
  unloadModule(name) {
    if (this.modules.has(name)) {
      const module = this.modules.get(name);

      // 清理内存
      if (module.memory) {
        // WASM内存会被垃圾回收器自动清理
      }

      this.modules.delete(name);
      console.log(`WASM模块 ${name} 已卸载`);
    }
  }

  /**
   * 获取内存使用情况
   * @param {string} moduleName - 模块名称（可选）
   * @returns {Object}
   */
  getMemoryUsage(moduleName) {
    if (moduleName) {
      const module = this.getModule(moduleName);
      if (!module || !module.memory) {
        return null;
      }

      const memory = module.memory;
      return {
        pages: memory.buffer.byteLength / 65536,
        bytes: memory.buffer.byteLength,
        maxPages: memory.maximum || "unlimited",
      };
    }
    
    // 返回所有模块的内存使用情况
    let totalBytes = 0;
    const moduleUsages = [];
    
    for (const [name, module] of this.modules) {
      if (module.memory) {
        const bytes = module.memory.buffer.byteLength;
        totalBytes += bytes;
        moduleUsages.push({
          name,
          bytes,
          pages: bytes / 65536
        });
      }
    }
    
    return {
      totalBytes,
      moduleUsages,
      moduleCount: this.modules.size
    };
  }

  /**
   * 创建共享内存缓冲区
   * @param {number} size - 缓冲区大小（字节）
   * @returns {SharedArrayBuffer|ArrayBuffer}
   */
  createSharedBuffer(size) {
    try {
      // 尝试创建SharedArrayBuffer（如果支持）
      if (typeof SharedArrayBuffer !== "undefined") {
        return new SharedArrayBuffer(size);
      }
    } catch (error) {
      console.warn("SharedArrayBuffer不可用，使用ArrayBuffer替代");
    }

    return new ArrayBuffer(size);
  }

  /**
   * 获取所有已加载模块的信息
   * @returns {Array}
   */
  getLoadedModules() {
    return Array.from(this.modules.entries()).map(([name, module]) => ({
      name,
      loadTime: module.loadTime,
      memoryUsage: this.getMemoryUsage(name),
    }));
  }

  /**
   * 清理所有模块
   */
  async cleanup() {
    console.log("清理WASM管理器...");

    // 卸载所有模块
    for (const name of this.modules.keys()) {
      this.unloadModule(name);
    }

    // 清理加载Promise
    this.loadingPromises.clear();

    this.initialized = false;
  }

  /**
   * 清理所有模块（同步版本）
   */
  dispose() {
    console.log("清理WASM管理器...");

    // 卸载所有模块
    for (const name of this.modules.keys()) {
      this.unloadModule(name);
    }

    // 清理加载Promise
    this.loadingPromises.clear();

    this.initialized = false;
  }
}

// 单例实例
const wasmManager = new WasmManager();

export default wasmManager;
export { WasmManager };
