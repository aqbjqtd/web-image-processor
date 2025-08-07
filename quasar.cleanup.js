module.exports = {
  // 开发服务器配置
  devServer: {
    port: 9000,
    host: "0.0.0.0",
    // 优雅退出处理
    setupExitSignals: true,
    // 在进程退出时清理资源
    onBeforeExit: () => {
      console.log("正在清理开发服务器资源...");
      // 清理Web Workers和其他资源
      if (global.gc) {
        global.gc();
      }
    },
  },

  // Vite配置
  viteOptions: {
    server: {
      // 启用优雅关闭
      force: true,
      // 监听进程退出信号
      middlewareMode: false,
    },

    // 构建配置
    build: {
      // 清理输出目录
      emptyOutDir: true,
      // 在构建前清理缓存
      cleanCacheBeforeBuild: true,
    },
  },

  // 监听进程信号
  process: {
    signals: ["SIGINT", "SIGTERM", "SIGQUIT"],
    cleanup: true,
  },
};
