/**
 * Service Worker - 基于知识图谱中的离线缓存策略和PWA最佳实践
 * 实现应用资源缓存、离线支持和性能优化
 */

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import {
  StaleWhileRevalidate,
  CacheFirst,
  NetworkFirst,
} from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { BackgroundSyncPlugin } from "workbox-background-sync";

// 预缓存应用资源
precacheAndRoute(self.__WB_MANIFEST);

// 清理过期缓存
cleanupOutdatedCaches();

// 缓存策略配置
const CACHE_NAMES = {
  STATIC: "static-cache-v1",
  IMAGES: "images-cache-v1",
  WASM: "wasm-cache-v1",
  API: "api-cache-v1",
};

// 静态资源缓存策略 - CacheFirst
registerRoute(
  ({ request }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font",
  new CacheFirst({
    cacheName: CACHE_NAMES.STATIC,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// WebAssembly文件缓存策略 - CacheFirst（长期缓存）
registerRoute(
  ({ url }) => url.pathname.endsWith(".wasm"),
  new CacheFirst({
    cacheName: CACHE_NAMES.WASM,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1年
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// 图像资源缓存策略 - StaleWhileRevalidate
registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.IMAGES,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7天
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// HTML文档缓存策略 - NetworkFirst
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "pages-cache-v1",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 1天
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// 后台同步插件（如果需要API调用）
const bgSyncPlugin = new BackgroundSyncPlugin("api-queue", {
  maxRetentionTime: 24 * 60, // 24小时
});

// API请求缓存策略 - NetworkFirst with Background Sync
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: CACHE_NAMES.API,
    networkTimeoutSeconds: 3,
    plugins: [
      bgSyncPlugin,
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 5 * 60, // 5分钟
        purgeOnQuotaError: true,
      }),
    ],
  }),
);

// 消息处理 - 与主线程通信
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: "2.0.0" });
  }

  if (event.data && event.data.type === "CACHE_URLS") {
    // 预缓存指定URL
    const urls = event.data.payload;
    cacheUrls(urls);
  }
});

// 安装事件
self.addEventListener("install", () => {
  console.log("Service Worker 安装中...");
  // 强制激活新的Service Worker
  self.skipWaiting();
});

// 激活事件
self.addEventListener("activate", (event) => {
  console.log("Service Worker 已激活");
  // 立即控制所有客户端
  event.waitUntil(self.clients.claim());
});

// 推送通知处理
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// 通知点击处理
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open") {
    event.waitUntil(self.clients.openWindow("/"));
  }
});

// 工具函数：缓存指定URL
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAMES.STATIC);
  await cache.addAll(urls);
}

// 错误处理
self.addEventListener("error", (event) => {
  console.error("Service Worker 错误:", event.error);
});

self.addEventListener("unhandledrejection", (event) => {
  console.error("Service Worker 未处理的Promise拒绝:", event.reason);
});
