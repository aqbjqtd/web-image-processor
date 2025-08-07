<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script>
import { defineComponent, onBeforeUnmount } from "vue";

export default defineComponent({
  name: "App",
  setup() {
    // 添加页面卸载前的清理逻辑
    const handleBeforeUnload = (event) => {
      // 如果有正在进行的处理，提示用户
      if (window.imageProcessing) {
        event.preventDefault();
        event.returnValue = "图片正在处理中，确定要离开吗？";
        return "图片正在处理中，确定要离开吗？";
      }
    };

    // 处理进程退出信号
    const handleUnload = () => {
      // 清理全局资源
      if (window.imageProcessor) {
        window.imageProcessor.dispose();
      }
    };

    // 监听浏览器关闭和刷新事件
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    // 组件卸载时清理事件监听器
    onBeforeUnmount(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    });

    return {};
  },
});
</script>
