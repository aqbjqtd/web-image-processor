/* eslint-env node */

const { configure } = require("quasar/wrappers");

module.exports = configure(function (ctx) {
  return {
    supportTS: true,
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
        viteConf.worker = {
          format: "es",
          rollupOptions: {
            output: {
              entryFileNames: `assets/[name].js`,
              chunkFileNames: `assets/[name].js`,
              assetFileNames: `assets/[name].[ext]`,
            },
          },
        };
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
