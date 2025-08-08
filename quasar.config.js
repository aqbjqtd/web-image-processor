/* eslint-env node */

const { configure } = require("quasar/wrappers");

module.exports = configure(function (ctx) {
  // 优雅退出处理
  function setupExitSignals() {
    const customCleanup = () => {
      console.log("执行自定义清理操作...");

      // 强制清理子进程
      try {
        const { execSync } = require("child_process");
        if (process.platform === "win32") {
          // Windows下强制清理node进程
          try {
            const result = execSync(
              'tasklist /FI "IMAGENAME eq node.exe" /FO CSV',
              { encoding: "utf8" },
            );
            const lines = result
              .split("\n")
              .filter((line) => line.includes("node.exe"));
            if (lines.length > 0) {
              console.log(`发现 ${lines.length} 个 node 进程，正在清理...`);
            }
          } catch (e) {
            // 忽略错误
          }
        }
      } catch (e) {
        console.log("清理进程时出错:", e.message);
      }
    };

    const forceExit = () => {
      console.log("强制退出进程...");
      process.exit(0);
    };

    const handleExit = (signal) => {
      console.log(`收到退出信号 ${signal}，开始执行优雅退出...`);
      customCleanup();

      // 设置强制退出超时，确保进程最终退出
      const forceExitTimeout = setTimeout(forceExit, 3000);

      // 执行额外的清理操作后，延迟一小段时间再退出进程
      setTimeout(() => {
        console.log("清理完成，进程即将退出。");
        clearTimeout(forceExitTimeout);
        process.exit(0);
      }, 500);
    };

    // Windows特殊处理
    if (process.platform === "win32") {
      const readline = require("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.on("SIGINT", () => {
        process.emit("SIGINT");
      });

      // 监听控制台关闭事件
      process.on("SIGHUP", () => handleExit("SIGHUP"));
    }

    // 监听各种退出信号
    process.on("SIGINT", () => handleExit("SIGINT"));
    process.on("SIGTERM", () => handleExit("SIGTERM"));
    process.on("SIGBREAK", () => handleExit("SIGBREAK"));

    // 监听异常退出
    process.on("uncaughtException", (err) => {
      console.error("未捕获的异常:", err);
      forceExit();
    });

    process.on("unhandledRejection", (reason) => {
      console.error("未处理的Promise拒绝:", reason);
      forceExit();
    });
  }

  setupExitSignals();

  return {
    css: ["app.scss"],

    extras: ["roboto-font", "material-icons"],

    build: {
      target: {
        browser: ["es2021", "edge90", "firefox90", "chrome90", "safari13.1"],
        node: "node18",
      },
      vueRouterMode: "hash",
      env: {
        NODE_ENV: ctx.dev ? "development" : "production",
      },
      // vitePlugins: [
      //   ['vite-plugin-wasm', {}],
      //   ['vite-plugin-top-level-await', {}]
      // ],
      extendViteConf(viteConf) {
        // WebAssembly支持
        viteConf.optimizeDeps = viteConf.optimizeDeps || {};
        viteConf.optimizeDeps.exclude = viteConf.optimizeDeps.exclude || [];
        viteConf.optimizeDeps.exclude.push("opencv-js");

        // Worker支持
        viteConf.worker = viteConf.worker || {};
        viteConf.worker.format = "es";
      },
    },

    devServer: {
      open: true,
      port: 9000,
      host: "0.0.0.0",
    },

    framework: {
      config: {},
      plugins: ["Notify", "Dialog", "Loading", "Dark"],
    },

    animations: [],

    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: ["render"],
    },

    pwa: {
      workboxMode: "injectManifest",
      injectPwaMetaTags: true,
      swFilename: "sw.js",
      manifestFilename: "manifest.json",
      useCredentialsForManifestTag: false,
      extendManifestJson(json) {
        json.name = "智能图像处理工具";
        json.short_name = "图像处理";
        json.description = "基于WebAssembly的本地图像处理应用";
        json.theme_color = "#1976d2";
        json.background_color = "#ffffff";
        json.display = "standalone";
        json.orientation = "portrait";
        json.categories = ["productivity", "photo"];
        json.screenshots = [
          {
            src: "icons/screenshot-wide.png",
            sizes: "1280x720",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "icons/screenshot-narrow.png",
            sizes: "750x1334",
            type: "image/png",
            form_factor: "narrow",
          },
        ];
      },
      extendPWACustomSWConf(esbuildConf) {
        // Service Worker自定义配置
        esbuildConf.target = "es2020";
      },
    },

    capacitor: {
      hideSplashscreen: true,
    },

    electron: {
      inspectPort: 5858,
      bundler: "builder",
      builder: {
        appId: "modern-image-processor",
      },
    },
  };
});
