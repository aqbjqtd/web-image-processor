<template>
  <q-page class="image-processor-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">现代图像处理工具</h1>
      <p class="page-subtitle">高效、智能的批量图像处理解决方案</p>
      
      <!-- 隐私保护说明 -->
      <div class="privacy-section">
        <h3 class="privacy-title">隐私保护承诺</h3>
        <div class="privacy-grid">
          <div class="privacy-item">
            <q-icon name="cloud_off" class="privacy-icon" />
            <div class="privacy-text">
              <div class="privacy-label">本地处理</div>
              <div class="privacy-desc">图片仅在本地浏览器处理</div>
            </div>
          </div>
          <div class="privacy-item">
            <q-icon name="block" class="privacy-icon" />
            <div class="privacy-text">
              <div class="privacy-label">零上传</div>
              <div class="privacy-desc">不会上传任何图片到服务器</div>
            </div>
          </div>
          <div class="privacy-item">
            <q-icon name="delete" class="privacy-icon" />
            <div class="privacy-text">
              <div class="privacy-label">即时清理</div>
              <div class="privacy-desc">处理完成后自动清理内存</div>
            </div>
          </div>
          <div class="privacy-item">
            <q-icon name="security" class="privacy-icon" />
            <div class="privacy-text">
              <div class="privacy-label">数据安全</div>
              <div class="privacy-desc">所有数据仅存在于您的设备</div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 上传与配置 -->
      <q-card flat class="content-panel">
        <div class="section-header">
          <q-icon name="upload_file" class="section-icon" />
          <h2 class="section-title">上传与配置</h2>
        </div>

        <!-- 文件上传 -->
        <div
          class="upload-zone"
          :class="{ 'drag-active': isDragOver }"
          @drop="onDrop"
          @dragover="onDragOver"
          @dragleave="onDragLeave"
          @click="triggerFileSelect"
        >
          <q-icon name="cloud_upload" size="48px" class="upload-icon" />
          <div class="upload-text">拖拽文件或点击选择</div>
          <div class="upload-hint">支持PNG, JPG, WebP等格式</div>
        </div>
        <div class="upload-actions">
          <q-btn
            unelevated
            color="primary"
            icon="add_photo_alternate"
            label="选择图片"
            @click="triggerFileSelect"
            class="upload-btn"
          />
          <q-btn
            outline
            color="primary"
            icon="folder_open"
            label="选择文件夹"
            @click="selectFolder"
            class="upload-btn"
          />
        </div>

        <q-separator class="q-my-md" />

        <!-- 处理配置 -->
        <div class="config-content">
          <div v-if="resizeOption === 'custom'" class="config-row">
            <q-input
              v-model.number="targetWidth"
              type="number"
              outlined
              dense
              label="宽度 (px)"
            />
            <q-input
              v-model.number="targetHeight"
              type="number"
              outlined
              dense
              label="高度 (px)"
            />
          </div>

          <q-select
            v-if="resizeOption === 'custom'"
            v-model="resizeMode"
            :options="resizeModeOptions"
            outlined
            dense
            label="调整模式"
            emit-value
            map-options
            class="q-mt-md"
          />

          <q-option-group
            v-model="resizeOption"
            :options="[
              { label: '指定尺寸', value: 'custom' },
              { label: '保持原始尺寸', value: 'original' },
              { label: '百分比缩放', value: 'percentage' },
            ]"
            color="primary"
            inline
          />

          <div v-if="resizeOption === 'percentage'" class="config-row q-mt-md">
            <q-input
              v-model.number="resizePercentage"
              type="number"
              outlined
              dense
              label="缩放比例 (%)"
            />
          </div>

          <!-- 文件大小限制设置 -->
          <div class="config-row q-mt-md">
            <q-input
              v-model.number="maxFileSize"
              type="number"
              outlined
              dense
              label="文件大小限制 (KB)"
              min="50"
              max="5000"
              hint="默认300KB，范围50-5000KB"
            />
          </div>
        </div>

        <div class="process-button-container">
          <q-btn
            v-if="!processing"
            unelevated
            color="positive"
            icon="play_arrow"
            label="开始处理"
            :disable="fileList.length === 0"
            @click="startProcessing"
            class="process-btn"
            size="lg"
          />
          <q-btn
            v-else
            outline
            color="negative"
            icon="stop"
            label="停止处理"
            @click="stopProcessing"
            class="process-btn"
            size="lg"
          />
        </div>

        <div v-if="processing" class="progress-section">
          <div class="progress-info">
            <span>处理进度: {{ processedCount }}/{{ totalCount }}</span>
            <span>{{ Math.round(progress * 100) }}%</span>
          </div>
          <q-linear-progress
            :value="progress"
            color="positive"
            size="10px"
            rounded
          />
        </div>
      </q-card>

      <!-- 输出文件 -->
      <q-card flat class="content-panel">
        <div class="section-header">
          <q-icon name="collections" class="section-icon" />
          <h2 class="section-title">处理结果</h2>
          <q-space />
          <q-btn
            v-if="processedImages.length > 0"
            flat
            color="primary"
            icon="download"
            label="全部下载"
            @click="downloadAll"
          />
          <q-btn
            v-if="processedImages.length > 0"
            flat
            color="negative"
            icon="delete_sweep"
            @click="clearProcessedImages"
          >
            <q-tooltip>清空列表</q-tooltip>
          </q-btn>
        </div>

        <div v-if="processedImages.length > 0" class="file-list">
          <q-card
            v-for="(image, index) in processedImages"
            :key="index"
            class="file-item"
          >
            <div class="file-preview">
              <img
                :src="image.dataUrl"
                :alt="image.name"
                class="file-thumbnail"
                @click="previewImage(image)"
              />
            </div>
            <div class="file-info">
              <div class="file-name" :title="image.name">{{ image.name }}</div>
              <div class="file-details">
                <span>{{
                  image.processedSize
                    ? `${image.processedSize.width}×${image.processedSize.height}`
                    : ""
                }}</span>
                <span>{{ getFileFormat(image.name) }}</span>
              </div>
            </div>
            <q-card-actions class="file-actions">
              <q-btn
                flat
                round
                dense
                icon="visibility"
                @click="previewImage(image)"
              />
              <q-btn
                flat
                round
                dense
                icon="download"
                @click="downloadSingle(image)"
              />
              <q-btn
                flat
                round
                dense
                icon="delete"
                @click="removeProcessedImage(index)"
              />
            </q-card-actions>
          </q-card>
        </div>

        <div v-else class="output-content empty-state">
          <q-icon name="photo_library" class="empty-icon" />
          <div class="empty-text">暂无处理完成的文件</div>
          <div class="empty-hint">处理结果将在这里显示</div>
        </div>
      </q-card>
    </div>


    <!-- 隐藏文件输入与预览 -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept=".jpg,.jpeg,.png,.bmp,.gif,.webp"
      style="display: none"
      @change="onFileInputChange"
    />
    <q-dialog v-model="showPreview" class="preview-dialog">
      <q-card class="preview-card">
        <q-img :src="previewImageData.dataUrl" class="preview-image" />
        <q-card-section class="text-center">
          <div class="text-h6">{{ previewImageData.name }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="关闭" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useQuasar } from "quasar";
import imageProcessor from "../utils/ImageProcessor.ts";
import type { ProcessedImage } from "../utils/ImageProcessor.ts";

const $q = useQuasar();

// 响应式数据
const fileList = ref<File[]>([]);
const processing = ref<boolean>(false);
const progress = ref<number>(0);
const processedCount = ref<number>(0);
const totalCount = ref<number>(0);
const processedImages = ref<ProcessedImage[]>([]);
const showPreview = ref<boolean>(false);
const previewImageData = ref<ProcessedImage | null>(null);
const isDragOver = ref<boolean>(false);
const fileInput = ref<HTMLInputElement | null>(null);

// 配置选项
const targetWidth = ref<number>(800);
const targetHeight = ref<number>(600);
const resizeOption = ref<"custom" | "original" | "percentage">("custom");
const resizePercentage = ref<number>(80);
const resizeMode = ref<"keep_ratio_pad" | "keep_ratio_crop" | "stretch">(
  "keep_ratio_pad",
);
const maxFileSize = ref<number>(300);

const resizeModeOptions = [
  { label: "保持比例填充", value: "keep_ratio_pad" },
  { label: "保持比例裁剪", value: "keep_ratio_crop" },
  { label: "拉伸填充", value: "stretch" },
];

// 计算属性 - 移除未使用的completedCount变量

// 图片处理器实例
// const imageProcessor = new ImageProcessor()

// 文件操作函数
const triggerFileSelect = (): void => {
  fileInput.value.click();
};

const onFileInputChange = (event: Event): void => {
  const files = Array.from(event.target.files);
  addFiles(files);
};

const addFiles = (files: File[]): void => {
  const imageFiles = files.filter((file) =>
    /\.(jpg|jpeg|png|bmp|gif|webp)$/i.test(file.name),
  );
  const existingNames = new Set(fileList.value.map((f) => f.name));
  const newFiles = imageFiles.filter((file) => !existingNames.has(file.name));

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

const onDrop = (event: DragEvent): void => {
  event.preventDefault();
  isDragOver.value = false;
  const files = Array.from(event.dataTransfer.files);
  addFiles(files);
};

const onDragOver = (event: DragEvent): void => {
  event.preventDefault();
  isDragOver.value = true;
};

const onDragLeave = (event: DragEvent): void => {
  event.preventDefault();
  isDragOver.value = false;
};

const selectFolder = (): void => {
  const input = document.createElement("input");
  input.type = "file";
  input.webkitdirectory = true;
  input.multiple = true;
  input.accept = ".jpg,.jpeg,.png,.bmp,.gif,.webp";

  input.onchange = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  input.click();
};

// 处理函数
const startProcessing = async (): Promise<void> => {
  if (fileList.value.length === 0) {
    $q.notify({
      type: "warning",
      message: "请先选择要处理的图片文件",
      position: "top",
      timeout: 3000,
    });
    return;
  }

  processing.value = true;
  processedCount.value = 0;
  totalCount.value = fileList.value.length;
  progress.value = 0;

  const config = {
    resizeOption: resizeOption.value,
    resizePercentage: resizePercentage.value,
    targetWidth: targetWidth.value,
    targetHeight: targetHeight.value,
    resizeMode: resizeMode.value,
    maxFileSize: maxFileSize.value, // 使用用户设置的文件大小限制
    concurrency: 4,
    useWasm: false, // or use a dedicated switch
  };

  try {
    for (let i = 0; i < fileList.value.length; i++) {
      if (!processing.value) break;

      const file = fileList.value[i];
      const processedImage = await imageProcessor.processImage(file, config);

      processedImages.value.push(processedImage);
      processedCount.value++;
      progress.value = processedCount.value / totalCount.value;
    }

    if (processing.value) {
      fileList.value = []; // 清空待处理文件
      $q.notify({
        type: "positive",
        message: `成功处理 ${processedCount.value} 张图片`,
        position: "top",
        timeout: 3000,
      });
    }
  } catch (error) {
    console.error("处理失败:", error);
    $q.notify({
      type: "negative",
      message: `处理失败: ${error.message}`,
      position: "top",
      timeout: 5000,
    });
  } finally {
    processing.value = false;
  }
};

const stopProcessing = (): void => {
  processing.value = false;
  $q.notify({
    type: "info",
    message: "处理已停止",
    position: "top",
    timeout: 2000,
  });
};

// 预览和下载函数
const previewImage = (image: ProcessedImage): void => {
  previewImageData.value = image;
  showPreview.value = true;
};

const downloadSingle = (image: ProcessedImage): void => {
  if (!image || !image.dataUrl) {
    $q.notify({
      type: "warning",
      message: "图片数据无效",
      position: "top",
      timeout: 2000,
    });
    return;
  }

  const link = document.createElement("a");
  link.download = image.name;
  link.href = image.dataUrl;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  $q.notify({
    type: "positive",
    message: `正在下载: ${image.name}`,
    position: "top",
    timeout: 2000,
  });
};

const downloadAll = (): void => {
  if (processedImages.value.length === 0) {
    $q.notify({
      type: "warning",
      message: "没有可下载的图片",
      position: "top",
      timeout: 2000,
    });
    return;
  }

  processedImages.value.forEach((image, index) => {
    setTimeout(() => {
      downloadSingle(image);
    }, index * 200);
  });

  $q.notify({
    type: "positive",
    message: `开始下载 ${processedImages.value.length} 张图片`,
    position: "top",
    timeout: 3000,
  });
};

const removeProcessedImage = (index: number): void => {
  processedImages.value.splice(index, 1);
  $q.notify({
    type: "info",
    message: "文件已删除",
    position: "top",
    timeout: 1000,
  });
};

const clearProcessedImages = (): void => {
  processedImages.value = [];
  $q.notify({
    type: "info",
    message: "已处理文件已清空",
    position: "top",
    timeout: 2000,
  });
};

// 工具函数
const getFileFormat = (filename: string): string => {
  const ext = filename.split(".").pop().toUpperCase();
  return ext === "JPG" ? "JPEG" : ext;
};

// 生命周期
onMounted(async () => {
  try {
    await imageProcessor.warmup();
    $q.notify({
      type: "positive",
      message: "图像处理引擎已就绪",
      timeout: 2000,
    });
  } catch (error) {
    console.warn("处理器预热失败:", error);
  }
});

onBeforeUnmount(async () => {
  if (processing.value) {
    processing.value = false;
  }
  if (imageProcessor) {
    await imageProcessor.cleanup();
    imageProcessor.dispose();
  }
  // 清理资源
  processedImages.value.forEach((image) => {
    if (image.dataUrl && image.dataUrl.startsWith("blob:")) {
      URL.revokeObjectURL(image.dataUrl);
    }
  });
  processedImages.value = [];
});
</script>

<style scoped>
.image-processor-page {
  padding: 24px;
  background-color: #f8f9fa;
  min-height: 100vh;
  font-family: "Roboto", sans-serif;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 32px 20px;
  background: linear-gradient(135deg, #5c6bc0 0%, #3f51b5 100%);
  border-radius: 12px;
  color: white;
}

.page-title {
  font-size: 2.8rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.page-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-top: 8px;
  margin-bottom: 24px;
}

.privacy-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 20px;
  margin-top: 24px;
}

.privacy-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  margin: 0 0 16px 0;
  text-align: center;
}

.privacy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.privacy-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 12px;
}

.privacy-icon {
  font-size: 1.4rem;
  color: #4caf50;
}

.privacy-text {
  flex: 1;
}

.privacy-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: white;
  margin-bottom: 2px;
}

.privacy-desc {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.2;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.content-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e0e0e0;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.section-icon {
  font-size: 1.8rem;
  color: #3f51b5;
  margin-right: 12px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #212121;
}

.upload-zone {
  border: 2px dashed #bdbdbd;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
  margin-bottom: 20px;
}

.upload-zone.drag-active,
.upload-zone:hover {
  border-color: #3f51b5;
  background-color: #e8eaf6;
}

.upload-icon {
  color: #7986cb;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #424242;
  margin-bottom: 8px;
  font-weight: 500;
}

.upload-hint {
  font-size: 14px;
  color: #757575;
}

.upload-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.upload-btn {
  flex-grow: 1;
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.config-label {
  font-size: 14px;
  font-weight: 500;
  color: #424242;
  margin-bottom: 4px;
}

.process-button-container {
  margin-top: 16px;
}

.process-btn {
  width: 100%;
  height: 48px;
}

.progress-section {
  margin-top: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
  color: #424242;
}

.output-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #e0e0e0;
}

.output-content.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #757575;
}

.empty-icon {
  font-size: 4rem;
  color: #9fa8da;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: #424242;
  margin-bottom: 8px;
}

.file-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.file-item {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  transition: all 0.3s ease;
}

.file-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.file-preview {
  position: relative;
  height: 180px;
  background-color: #f5f5f5;
}

.file-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-info {
  padding: 16px;
}

.file-name {
  font-weight: 500;
  color: #212121;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #616161;
}

.file-actions {
  padding: 0 8px 8px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.preview-card {
  max-width: 90vw;
  max-height: 90vh;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

@media (max-width: 960px) {
  .main-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .page-title {
    font-size: 2.2rem;
  }
  .page-subtitle {
    font-size: 1rem;
  }
  .file-list {
    grid-template-columns: 1fr;
  }
}
</style>
