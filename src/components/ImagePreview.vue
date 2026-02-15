<template>
  <div class="image-preview">
    <!-- 图片网格显示 -->
    <div v-if="images.length > 0" class="preview-grid">
      <div
        v-for="(image, index) in displayImages"
        :key="index"
        class="preview-item"
        :class="{ selected: selectedIndex === index }"
        @click="selectImage(index)"
      >
        <!-- 图片缩略图 -->
        <div class="image-container">
          <img
            :src="image.dataUrl"
            :alt="image.name"
            class="preview-image"
            :class="{ loading: image.loading }"
            @load="onImageLoad(index)"
            @error="onImageError(index)"
          />

          <!-- 加载状态 -->
          <div v-if="image.loading" class="loading-overlay">
            <q-spinner-dots size="2rem" color="primary" />
          </div>

          <!-- 错误状态 -->
          <div v-if="image.error" class="error-overlay">
            <q-icon name="error" size="2rem" color="negative" />
          </div>

          <!-- 悬停操作 -->
          <div class="image-overlay">
            <q-btn
              flat
              round
              dense
              icon="zoom_in"
              color="white"
              class="overlay-btn"
              @click.stop="viewFullscreen(index)"
            >
              <q-tooltip>全屏查看</q-tooltip>
            </q-btn>

            <q-btn
              flat
              round
              dense
              icon="info"
              color="white"
              class="overlay-btn"
              @click.stop="showDetails(index)"
            >
              <q-tooltip>详细信息</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- 图片信息 -->
        <div class="image-info">
          <div class="image-name" :title="image.name">{{ image.name }}</div>
          <div class="image-details">
            <span class="image-size">
              {{
                image.processedSize
                  ? `${image.processedSize.width}×${image.processedSize.height}`
                  : ""
              }}
            </span>
            <span class="file-size">{{
              formatFileSize(image.processedSize?.fileSize || 0)
            }}</span>
            <span class="compression-ratio" v-if="image.sizeReduction">
              -{{ Math.round(image.sizeReduction) }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <q-icon name="image_not_supported" size="4rem" color="grey-5" />
      <h4>暂无图片</h4>
      <p>请先上传并处理图片</p>
    </div>

    <!-- 分页控制 -->
    <div v-if="totalPages > 1" class="pagination-controls">
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :max-pages="5"
        boundary-numbers
      />
      <div class="pagination-info">
        显示 {{ startIndex + 1 }}-{{ endIndex }} / 总计 {{ images.length }} 张
      </div>
    </div>

    <!-- 全屏预览对话框 -->
    <q-dialog
      v-model="fullscreenDialog.show"
      full-width
      full-height
      position="center"
    >
      <q-card class="fullscreen-preview">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ fullscreenDialog.title }}</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="fullscreen-content">
          <div class="fullscreen-image-container">
            <img
              v-if="fullscreenDialog.imageUrl"
              :src="fullscreenDialog.imageUrl"
              :alt="fullscreenDialog.title"
              class="fullscreen-image"
            />
          </div>
        </q-card-section>

        <q-card-section>
          <div class="fullscreen-info">
            <p><strong>文件名:</strong> {{ fullscreenDialog.fileName }}</p>
            <p><strong>尺寸:</strong> {{ fullscreenDialog.dimensions }}</p>
            <p><strong>文件大小:</strong> {{ fullscreenDialog.fileSize }}</p>
            <p>
              <strong>压缩率:</strong> {{ fullscreenDialog.compressionRatio }}
            </p>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 详细信息对话框 -->
    <q-dialog v-model="detailsDialog.show" position="top">
      <q-card class="details-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">图片详细信息</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section>
          <div v-if="detailsDialog.image" class="details-content">
            <div class="detail-group">
              <label>文件名</label>
              <div>{{ detailsDialog.image.name }}</div>
            </div>

            <div class="detail-row">
              <div class="detail-group">
                <label>原始尺寸</label>
                <div>
                  {{ detailsDialog.image.originalSize?.width }}×{{
                    detailsDialog.image.originalSize?.height
                  }}
                </div>
              </div>
              <div class="detail-group">
                <label>处理后尺寸</label>
                <div>
                  {{ detailsDialog.image.processedSize?.width }}×{{
                    detailsDialog.image.processedSize?.height
                  }}
                </div>
              </div>
            </div>

            <div class="detail-row">
              <div class="detail-group">
                <label>原始大小</label>
                <div>
                  {{
                    formatFileSize(
                      detailsDialog.image.originalSize?.fileSize || 0,
                    )
                  }}
                </div>
              </div>
              <div class="detail-group">
                <label>处理后大小</label>
                <div>
                  {{
                    formatFileSize(
                      detailsDialog.image.processedSize?.fileSize || 0,
                    )
                  }}
                </div>
              </div>
            </div>

            <div class="detail-group">
              <label>压缩率</label>
              <div>
                {{
                  detailsDialog.image.sizeReduction
                    ? `-${Math.round(detailsDialog.image.sizeReduction)}%`
                    : "N/A"
                }}
              </div>
            </div>

            <div class="detail-group">
              <label>处理时间</label>
              <div>{{ detailsDialog.image.processingTime || "N/A" }}</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="关闭" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ProcessedImage } from "../utils/ImageProcessor";

interface PreviewImage extends ProcessedImage {
  loading?: boolean;
  error?: boolean;
  processingTime?: string;
}

interface Props {
  /** 图片列表 */
  images: ProcessedImage[];
  /** 每页显示数量 */
  pageSize?: number;
  /** 是否可选中 */
  selectable?: boolean;
  /** 默认视图模式 */
  defaultView?: "grid" | "list";
}

interface Emits {
  (e: "image-selected", index: number, image: ProcessedImage): void;
  (e: "image-view", index: number, image: ProcessedImage): void;
  (e: "image-download", index: number, image: ProcessedImage): void;
}

const props = withDefaults(defineProps<Props>(), {
  pageSize: 12,
  selectable: false,
  defaultView: "grid",
});

const emit = defineEmits<Emits>();

// 响应式数据
const currentPage = ref(1);
const selectedIndex = ref<number | null>(null);

// 全屏预览对话框
const fullscreenDialog = ref({
  show: false,
  title: "",
  imageUrl: "",
  fileName: "",
  dimensions: "",
  fileSize: "",
  compressionRatio: "",
});

// 详细信息对话框
const detailsDialog = ref({
  show: false,
  image: null as PreviewImage | null,
});

// 显示的图片（带加载状态）
const displayImages = computed(() => {
  return props.images
    .slice(startIndex.value, endIndex.value)
    .map((image) => ({
      ...image,
      loading: true,
      error: false,
    }));
});

// 分页相关计算
const totalItems = computed(() => props.images.length);
const totalPages = computed(() => Math.ceil(totalItems.value / props.pageSize));
const startIndex = computed(() => (currentPage.value - 1) * props.pageSize);
const endIndex = computed(() =>
  Math.min(startIndex.value + props.pageSize, totalItems.value),
);

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 选择图片
 */
const selectImage = (index: number): void => {
  const actualIndex = startIndex.value + index;
  selectedIndex.value = actualIndex;
  emit("image-selected", actualIndex, props.images[actualIndex]);
};

/**
 * 查看全屏
 */
const viewFullscreen = (index: number): void => {
  const actualIndex = startIndex.value + index;
  const image = props.images[actualIndex];

  fullscreenDialog.value = {
    show: true,
    title: image.name,
    imageUrl: image.dataUrl,
    fileName: image.name,
    dimensions: `${image.processedSize.width}×${image.processedSize.height}`,
    fileSize: formatFileSize(image.processedSize.fileSize),
    compressionRatio: image.sizeReduction
      ? `-${Math.round(image.sizeReduction)}%`
      : "N/A",
  };

  emit("image-view", actualIndex, image);
};

/**
 * 显示详细信息
 */
const showDetails = (index: number): void => {
  const actualIndex = startIndex.value + index;
  const image = props.images[actualIndex];

  detailsDialog.value = {
    show: true,
    image: {
      ...image,
      processingTime: "N/A", // 可以从处理配置中获取
    },
  };
};

/**
 * 图片加载成功
 */
const onImageLoad = (): void => {
  const displayImage = displayImages.value[0];
  if (displayImage) {
    displayImage.loading = false;
  }
};

/**
 * 图片加载失败
 */
const onImageError = (): void => {
  const displayImage = displayImages.value[0];
  if (displayImage) {
    displayImage.loading = false;
    displayImage.error = true;
  }
};

// 监听页码变化
watch(currentPage, () => {
  selectedIndex.value = null;
});

// 监听图片列表变化
watch(
  () => props.images,
  () => {
    currentPage.value = 1;
    selectedIndex.value = null;
  },
);

// 监听当前页变化，重置加载状态
watch(displayImages, (newImages) => {
  newImages.forEach((image) => {
    if (!image.error) {
      image.loading = true;
    }
  });
});
</script>

<style scoped lang="scss">
.image-preview {
  .preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .preview-item {
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
    background-color: white;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    &.selected {
      border-color: var(--q-primary);
      box-shadow: 0 0 0 2px rgba(var(--q-primary-rgb), 0.2);
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 150px;
      overflow: hidden;
      background-color: #f5f5f5;

      .preview-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 0.3s ease;

        &.loading {
          opacity: 0.5;
        }
      }

      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.8);
      }

      .error-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(244, 67, 54, 0.1);
      }

      .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        opacity: 0;
        transition: opacity 0.2s ease;

        .overlay-btn {
          margin: 0 0.25rem;
        }
      }

      &:hover .image-overlay {
        opacity: 1;
      }
    }

    .image-info {
      padding: 0.75rem;
      background-color: white;

      .image-name {
        font-weight: 500;
        margin-bottom: 0.25rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.9rem;
      }

      .image-details {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        color: #666;

        .image-size {
          font-weight: 500;
          color: #333;
        }

        .compression-ratio {
          color: #4caf50;
          font-weight: 600;
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: #666;

    h4 {
      margin: 1rem 0 0.5rem;
      font-size: 1.2rem;
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
    }
  }

  .pagination-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 2rem;
    padding: 1rem 0;
    border-top: 1px solid #e0e0e0;

    .pagination-info {
      color: #666;
      font-size: 0.9rem;
    }
  }

  .fullscreen-preview {
    .fullscreen-content {
      padding: 0;
      max-height: calc(100vh - 200px);
    }

    .fullscreen-image-container {
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #000;
      border-radius: 8px;
      overflow: hidden;

      .fullscreen-image {
        max-width: 100%;
        max-height: calc(100vh - 250px);
        object-fit: contain;
      }
    }

    .fullscreen-info {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 1rem;

      p {
        margin: 0.25rem 0;
        display: flex;
        justify-content: space-between;

        strong {
          font-weight: 600;
          color: #333;
        }
      }
    }
  }

  .details-card {
    max-width: 500px;
    width: 90vw;

    .details-content {
      .detail-group {
        margin-bottom: 1rem;

        label {
          display: block;
          font-weight: 600;
          color: #666;
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
        }

        div {
          font-size: 1rem;
          color: #333;
        }
      }

      .detail-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
    }
  }
}

// 暗色主题支持
.body--dark .image-preview {
  .preview-item {
    border-color: #555;
    background-color: #2a2a2a;

    &:hover {
      box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
    }

    .image-container {
      background-color: #333;
    }

    .image-info {
      background-color: #2a2a2a;

      .image-name {
        color: #fff;
      }

      .image-details {
        color: #bbb;
      }
    }
  }

  .empty-state {
    color: #bbb;
  }

  .pagination-controls {
    border-color: #555;

    .pagination-info {
      color: #bbb;
    }
  }

  .fullscreen-preview {
    .fullscreen-info {
      background-color: #333;

      p strong {
        color: #fff;
      }

      p {
        color: #bbb;
      }
    }
  }

  .details-card {
    .details-content {
      .detail-group {
        label {
          color: #bbb;
        }

        div {
          color: #fff;
        }
      }
    }
  }
}
</style>
