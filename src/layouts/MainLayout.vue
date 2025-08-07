<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="text-weight-bold">
          <q-icon name="image" class="q-mr-sm" />
          现代图像处理工具
        </q-toolbar-title>

        <q-btn flat round dense icon="info" @click="showInfo">
          <q-tooltip>关于</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { ref } from "vue";
import { useQuasar } from "quasar";

export default {
  setup() {
    const $q = useQuasar();
    const drawer = ref(false);

    const showInfo = () => {
      $q.dialog({
        title: "关于现代图像处理工具",
        message: `
          <div style="line-height: 1.6;">
            <p><strong>版本:</strong> v3.0</p>
            <p><strong>技术栈:</strong> Vue.js 3 + Quasar Framework + WebAssembly</p>
            <p><strong>功能特性:</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>高性能图像批量处理</li>
              <li>多种图像格式支持</li>
              <li>WebAssembly加速处理</li>
              <li>Web Workers后台处理</li>
              <li>PWA离线支持</li>
            </ul>
            <p><strong>支持格式:</strong> JPEG, PNG, WebP, AVIF, GIF, BMP</p>
          </div>
        `,
        html: true,
        ok: {
          label: "确定",
          color: "primary",
        },
      });
    };

    return {
      drawer,
      showInfo,
    };
  },
};
</script>
