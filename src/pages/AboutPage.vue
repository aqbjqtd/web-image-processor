<template>
  <q-page class="q-pa-md">
    <div class="text-h3 q-mb-md">关于现代图像处理工具</div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h5">项目介绍</div>
        <p>
          这是一个基于Vue.js 3和Quasar Framework开发的现代化图像批量处理工具。
        </p>
        <p>支持多种图像格式的处理，包括尺寸调整、格式转换、质量优化等功能。</p>
      </q-card-section>
    </q-card>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h5">主要特性</div>
        <ul>
          <li>支持多种图像格式 (PNG, JPG, JPEG, BMP, GIF, WebP)</li>
          <li>批量处理功能</li>
          <li>多种尺寸调整模式</li>
          <li>质量优化和文件大小控制</li>
          <li>现代化的用户界面</li>
          <li>响应式设计</li>
        </ul>
      </q-card-section>
    </q-card>

    <q-card>
      <q-card-section>
        <div class="text-h5">技术栈</div>
        <div class="row q-gutter-sm">
          <q-chip color="primary" text-color="white" icon="code"
            >Vue.js 3</q-chip
          >
          <q-chip color="secondary" text-color="white" icon="layers"
            >Quasar Framework</q-chip
          >
          <q-chip color="accent" text-color="white" icon="palette"
            >Canvas API</q-chip
          >
          <q-chip color="positive" text-color="white" icon="speed"
            >Web Workers</q-chip
          >
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "AboutPage",
});
</script>
