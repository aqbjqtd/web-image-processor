<template>
  <q-page class="flex flex-center">
    <div class="column items-center q-gutter-md">
      <h1>图像处理工具</h1>
      <q-btn color="primary" label="选择文件" @click="selectFiles" />
      <div v-if="files.length > 0">已选择 {{ files.length }} 个文件</div>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      style="display: none"
      @change="onFileChange"
    />
  </q-page>
</template>

<script>
import { ref } from "vue";
import { useQuasar } from "quasar";

export default {
  name: "SimpleIndex",
  setup() {
    const $q = useQuasar();
    const files = ref([]);
    const fileInput = ref(null);

    const selectFiles = () => {
      fileInput.value.click();
    };

    const onFileChange = (event) => {
      files.value = Array.from(event.target.files);
      $q.notify({
        type: "positive",
        message: `选择了 ${files.value.length} 个文件`,
      });
    };

    return {
      files,
      fileInput,
      selectFiles,
      onFileChange,
    };
  },
};
</script>
