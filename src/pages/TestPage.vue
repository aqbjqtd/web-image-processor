<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">测试页面</div>
    <q-card class="q-pa-md">
      <q-card-section>
        <div class="text-h6">这是一个测试页面</div>
        <p>如果你能看到这个页面，说明Vue和Quasar基本配置是正常的。</p>

        <div class="q-mt-md">
          <q-btn
            color="primary"
            label="测试按钮"
            @click="showMessage"
            class="q-mr-sm"
          />
          <q-btn color="secondary" label="切换主题" @click="toggleTheme" />
        </div>

        <div class="q-mt-md">
          <p>文件列表长度: {{ testData.length }}</p>
          <q-input
            v-model="testInput"
            label="测试输入"
            outlined
            class="q-mt-sm"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useQuasar } from "quasar";

export default defineComponent({
  name: "TestPage",
  setup() {
    const $q = useQuasar();
    const testData = ref([1, 2, 3]);
    const testInput = ref("");

    const showMessage = () => {
      $q.notify({
        type: "positive",
        message: "测试消息显示成功！",
        position: "top",
      });
    };

    const toggleTheme = () => {
      $q.dark.toggle();
    };

    return {
      testData,
      testInput,
      showMessage,
      toggleTheme,
    };
  },
});
</script>

<style scoped>
.q-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}
</style>
