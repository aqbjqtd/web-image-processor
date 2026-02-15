<template>
  <div class="image-uploader">
    <!-- 拖拽上传区域 -->
    <div
      class="upload-area"
      :class="{
        'drag-over': isDragOver,
        'has-files': hasFiles,
      }"
      @dragenter="handleDragEnter"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="triggerFileInput"
    >
      <div class="upload-content">
        <q-icon
          :name="isDragOver ? 'cloud_upload' : 'add_photo_alternate'"
          size="3rem"
          :color="isDragOver ? 'primary' : 'grey-6'"
        />
        <h3 class="upload-title">
          {{ isDragOver ? "释放文件到这里" : "点击或拖拽图片到这里" }}
        </h3>
        <p class="upload-subtitle">
          支持 JPG, PNG, WebP, GIF, BMP 格式 • 最大
          {{ formatFileSize(maxFileSize) }}
        </p>

        <!-- 文件选择按钮 -->
        <q-btn
          color="primary"
          label="选择文件"
          icon="folder_open"
          class="q-mt-md"
          @click.stop="triggerFileInput"
        />
      </div>

      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="hidden-file-input"
        @change="handleFileSelect"
      />
    </div>

    <!-- 文件列表 -->
    <div v-if="hasFiles" class="file-list-container">
      <div class="file-list-header">
        <h4>已选择的文件 ({{ totalFiles }})</h4>
        <q-btn flat dense icon="clear_all" label="清空" @click="clearFiles" />
      </div>

      <div class="file-list">
        <div
          v-for="(file, index) in files"
          :key="index"
          class="file-item"
          :class="{ error: file.status === 'error' }"
        >
          <!-- 文件预览 -->
          <div class="file-preview">
            <img
              v-if="file.preview"
              :src="file.preview"
              :alt="file.name"
              class="preview-image"
            />
            <q-icon v-else name="image" size="2rem" color="grey-5" />
          </div>

          <!-- 文件信息 -->
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-details">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-type">{{ getFileExtension(file) }}</span>
            </div>

            <!-- 状态指示器 -->
            <div class="file-status">
              <q-chip
                v-if="file.status === 'pending'"
                size="sm"
                color="grey-5"
                text-color="white"
              >
                <q-icon name="schedule" class="q-mr-xs" />
                等待处理
              </q-chip>

              <q-chip
                v-else-if="file.status === 'processing'"
                size="sm"
                color="primary"
                text-color="white"
              >
                <q-spinner-dots size="sm" class="q-mr-xs" />
                处理中
              </q-chip>

              <q-chip
                v-else-if="file.status === 'completed'"
                size="sm"
                color="positive"
                text-color="white"
              >
                <q-icon name="check_circle" class="q-mr-xs" />
                已完成
              </q-chip>

              <q-chip
                v-else-if="file.status === 'error'"
                size="sm"
                color="negative"
                text-color="white"
              >
                <q-icon name="error" class="q-mr-xs" />
                处理失败
              </q-chip>
            </div>

            <!-- 错误信息 -->
            <div v-if="file.error" class="file-error">
              {{ file.error }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="file-actions">
            <q-btn
              flat
              dense
              round
              icon="preview"
              color="primary"
              @click="previewFile(file)"
              :disable="!file.preview"
            >
              <q-tooltip>预览</q-tooltip>
            </q-btn>

            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              @click="removeFile(index)"
            >
              <q-tooltip>删除</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览对话框 -->
    <q-dialog v-model="previewDialog.show" position="top">
      <q-card class="preview-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ previewDialog.fileName }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <img
            v-if="previewDialog.imageUrl"
            :src="previewDialog.imageUrl"
            :alt="previewDialog.fileName"
            class="preview-full-image"
          />
        </q-card-section>

        <q-card-section>
          <div class="preview-info">
            <p><strong>文件名:</strong> {{ previewDialog.fileName }}</p>
            <p>
              <strong>文件大小:</strong>
              {{ formatFileSize(previewDialog.fileSize) }}
            </p>
            <p><strong>文件类型:</strong> {{ previewDialog.fileType }}</p>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useQuasar } from "quasar";
import useFileUpload, { type ImageFile } from "../composables/useFileUpload";

interface Props {
  /** 最大文件大小（字节） */
  maxFileSize?: number;
  /** 允许的文件类型 */
  acceptedTypes?: string[];
  /** 最大文件数量 */
  maxFiles?: number;
}

interface Emits {
  (e: "files-selected", files: ImageFile[]): void;
  (e: "file-removed", index: number): void;
  (e: "files-cleared"): void;
}

const props = withDefaults(defineProps<Props>(), {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  acceptedTypes: () => [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
  ],
  maxFiles: 100,
});

const emit = defineEmits<Emits>();

// Quasar 插件
useQuasar();

// 使用文件上传 Composable
const {
  files,
  isDragOver,
  totalFiles,
  hasFiles,
  addFiles,
  removeFile,
  clearFiles,
  getFileExtension,
  formatFileSize,
  handleDragEnter,
  handleDragLeave,
  handleDragOver,
  handleDrop,
} = useFileUpload({
  maxFileSize: props.maxFileSize,
  acceptedTypes: props.acceptedTypes,
  maxFiles: props.maxFiles,
});

// 文件输入引用
const fileInput = ref<HTMLInputElement>();

// 预览对话框状态
const previewDialog = ref({
  show: false,
  imageUrl: "",
  fileName: "",
  fileSize: 0,
  fileType: "",
});

/**
 * 触发文件选择器
 */
const triggerFileInput = (): void => {
  fileInput.value?.click();
};

/**
 * 处理文件选择
 */
const handleFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const selectedFiles = target.files;

  if (selectedFiles && selectedFiles.length > 0) {
    const newFiles = Array.from(selectedFiles);
    addFiles(newFiles);
    emit("files-selected", files.value.slice(-newFiles.length));
  }

  // 重置文件输入
  if (target) {
    target.value = "";
  }
};

/**
 * 预览文件
 */
const previewFile = (file: ImageFile): void => {
  if (!file.preview) return;

  previewDialog.value = {
    show: true,
    imageUrl: file.preview,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  };
};

// 生命周期
onMounted(() => {
  // 可以在这里添加其他初始化逻辑
});

onBeforeUnmount(() => {
  // 清理预览URL
  files.value.forEach((file) => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
  });
});
</script>

<style scoped lang="scss">
.image-uploader {
  .upload-area {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #f9f9f9;
    position: relative;

    &:hover {
      border-color: var(--q-primary);
      background-color: #f0f8ff;
    }

    &.drag-over {
      border-color: var(--q-primary);
      background-color: #e3f2fd;
      transform: scale(1.02);
    }

    &.has-files {
      margin-bottom: 1rem;
    }

    .upload-content {
      pointer-events: none;
    }

    .upload-title {
      margin: 1rem 0 0.5rem;
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
    }

    .upload-subtitle {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .hidden-file-input {
      display: none;
    }
  }

  .file-list-container {
    .file-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      padding: 0.5rem;
      background-color: #f5f5f5;
      border-radius: 6px;

      h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }
    }

    .file-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      margin-bottom: 0.5rem;
      background-color: white;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      &.error {
        border-color: #f44336;
        background-color: #ffebee;
      }

      .file-preview {
        width: 48px;
        height: 48px;
        border-radius: 4px;
        overflow: hidden;
        margin-right: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f5f5f5;

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .file-info {
        flex: 1;
        min-width: 0;

        .file-name {
          font-weight: 500;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .file-details {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.5rem;
        }

        .file-status {
          margin-bottom: 0.25rem;
        }

        .file-error {
          font-size: 0.8rem;
          color: #f44336;
          margin-top: 0.25rem;
        }
      }

      .file-actions {
        display: flex;
        gap: 0.25rem;
        margin-left: 1rem;
      }
    }
  }

  .preview-card {
    max-width: 600px;
    max-height: 80vh;
  }

  .preview-full-image {
    max-width: 100%;
    max-height: 400px;
    border-radius: 4px;
  }

  .preview-info {
    p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
    }
  }
}

// 暗色主题支持
.body--dark .image-uploader {
  .upload-area {
    background-color: #2a2a2a;
    border-color: #555;
    color: #fff;

    &:hover {
      background-color: #333;
      border-color: var(--q-primary);
    }

    &.drag-over {
      background-color: #1e3a5f;
      border-color: var(--q-primary);
    }

    .upload-title {
      color: #fff;
    }

    .upload-subtitle {
      color: #bbb;
    }
  }

  .file-list-container {
    .file-list-header {
      background-color: #333;
    }

    .file-item {
      background-color: #2a2a2a;
      border-color: #555;
      color: #fff;

      &:hover {
        box-shadow: 0 2px 4px rgba(255, 255, 255, 0.1);
      }

      &.error {
        background-color: #4a1f1f;
        border-color: #f44336;
      }

      .file-details {
        color: #bbb;
      }
    }
  }
}
</style>
