<template>
  <q-page class="modern-dashboard">
    <!-- 主容器 -->
    <div class="main-container">
      <!-- 上传区域 -->
      <div class="upload-section">
        <q-card flat class="upload-card">
          <q-card-section class="upload-content">
            <q-icon name="cloud_upload" size="xl" color="primary" />
            <h2 class="upload-title">拖放文件到此处或</h2>
            <q-btn
              unelevated
              color="primary"
              icon="add_photo_alternate"
              label="选择图片文件"
              @click="triggerFileSelect"
              class="upload-btn"
              size="lg"
            />
          </q-card-section>
        </q-card>
      </div>

      <!-- 文件处理区域 -->
      <div v-if="fileList.length > 0" class="process-section">
        <div class="file-list-header">
          <h3>待处理文件 ({{ fileList.length }})</h3>
          <q-btn
            unelevated
            color="positive"
            icon="play_arrow"
            label="开始处理"
            @click="processFiles"
            :disable="fileList.length === 0"
            class="process-btn"
          />
        </div>

        <div class="file-list">
          <q-card
            v-for="(file, index) in fileList"
            :key="index"
            class="file-item"
          >
            <q-card-section horizontal>
              <q-icon name="image" size="md" color="primary" class="q-mr-md" />
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size) }}</div>
              </div>
              <q-space />
              <q-btn
                flat
                round
                icon="close"
                @click="removeFile(index)"
                class="remove-btn"
              />
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInput"
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.bmp,.gif,.webp"
        style="display: none"
        @change="onFileInputChange"
      />
    </div>
  </q-page>
</template>

<script>
import { ref } from "vue";
import { useQuasar } from "quasar";

export default {
  name: "MediumIndex",
  setup() {
    const $q = useQuasar();

    // 数据状态
    const fileList = ref([]);
    const processedImages = ref([]);
    const fileInput = ref(null);

    // 文件操作函数
    const triggerFileSelect = () => {
      fileInput.value.click();
    };

    const onFileInputChange = (event) => {
      const files = Array.from(event.target.files);
      addFiles(files);
    };

    const addFiles = (files) => {
      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|bmp|gif|webp)$/i.test(file.name),
      );
      const existingNames = new Set(fileList.value.map((f) => f.name));
      const newFiles = imageFiles.filter(
        (file) => !existingNames.has(file.name),
      );

      fileList.value = [...fileList.value, ...newFiles];

      if (newFiles.length > 0) {
        $q.notify({
          type: "positive",
          message: `已添加 ${newFiles.length} 个图片文件`,
          position: "top",
          timeout: 2000,
        });
      }
    };

    const removeFile = (index) => {
      fileList.value.splice(index, 1);
      $q.notify({
        type: "info",
        message: "文件已移除",
        position: "top",
        timeout: 1000,
      });
    };

    const processFiles = async () => {
      $q.notify({
        type: "ongoing",
        message: "正在处理文件...",
        position: "top",
      });

      // 模拟处理过程
      await new Promise((resolve) => setTimeout(resolve, 2000));

      processedImages.value = [...fileList.value];
      fileList.value = [];

      $q.notify({
        type: "positive",
        message: `已成功处理 ${processedImages.value.length} 个文件`,
        position: "top",
        timeout: 3000,
      });
    };

    const formatFileSize = (bytes) => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return {
      // 状态数据
      fileList,
      processedImages,
      fileInput,

      // 方法
      triggerFileSelect,
      onFileInputChange,
      addFiles,
      removeFile,
      processFiles,
      formatFileSize,
    };
  },
};
</script>

<style lang="scss" scoped>
.modern-dashboard {
  padding: 24px;
  background: #f8f9fa;
  min-height: 100vh;
}

.main-container {
  max-width: 1200px;
  margin: 0 auto;
}

.upload-section {
  margin-bottom: 32px;
}

.upload-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
  border: 2px dashed #e9ecef;
  background: white;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--q-primary);
  }
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px;
  text-align: center;
}

.upload-title {
  margin: 16px 0 24px;
  color: #495057;
  font-weight: 500;
}

.upload-btn {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
}

.process-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.file-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    color: #495057;
    font-weight: 600;
  }
}

.process-btn {
  padding: 10px 20px;
  font-size: 15px;
  border-radius: 8px;
}

.file-list {
  display: grid;
  gap: 12px;
}

.file-item {
  border-radius: 8px;
  transition: all 0.2s;
  border: 1px solid #e9ecef;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    border-color: #dee2e6;
  }
}

.file-info {
  padding: 8px 0;
}

.file-name {
  font-weight: 500;
  color: #212529;
}

.file-size {
  font-size: 13px;
  color: #868e96;
}

.remove-btn {
  color: #868e96;

  &:hover {
    color: #fa5252;
  }
}
</style>
