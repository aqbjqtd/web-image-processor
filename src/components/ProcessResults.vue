<template>
  <div class="process-results">
    <!-- 结果统计 -->
    <div v-if="images.length > 0" class="results-summary">
      <q-card class="summary-card">
        <q-card-section>
          <div class="text-h6">处理结果</div>
        </q-card-section>

        <q-card-section>
          <div class="stats-grid">
            <div class="stat-item">
              <q-icon name="image" size="1.5rem" color="primary" />
              <div class="stat-content">
                <div class="stat-value">{{ images.length }}</div>
                <div class="stat-label">总图片数</div>
              </div>
            </div>

            <div class="stat-item">
              <q-icon name="done_all" size="1.5rem" color="positive" />
              <div class="stat-content">
                <div class="stat-value">{{ completedCount }}</div>
                <div class="stat-label">成功处理</div>
              </div>
            </div>

            <div class="stat-item">
              <q-icon name="error" size="1.5rem" color="negative" />
              <div class="stat-content">
                <div class="stat-value">{{ failedCount }}</div>
                <div class="stat-label">处理失败</div>
              </div>
            </div>

            <div class="stat-item">
              <q-icon name="save" size="1.5rem" color="info" />
              <div class="stat-content">
                <div class="stat-value">{{ formatFileSize(totalSize) }}</div>
                <div class="stat-label">总大小</div>
              </div>
            </div>

            <div class="stat-item">
              <q-icon name="trending_down" size="1.5rem" color="warning" />
              <div class="stat-content">
                <div class="stat-value">{{ averageCompression }}%</div>
                <div class="stat-label">平均压缩</div>
              </div>
            </div>

            <div class="stat-item">
              <q-icon name="schedule" size="1.5rem" color="secondary" />
              <div class="stat-content">
                <div class="stat-value">{{ processingTime }}</div>
                <div class="stat-label">处理时间</div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- 操作工具栏 -->
    <div v-if="images.length > 0" class="toolbar">
      <div class="toolbar-left">
        <q-btn
          flat
          dense
          icon="select_all"
          label="全选"
          @click="selectAll"
          :disable="images.length === 0"
        />

        <q-btn
          flat
          dense
          icon="deselect"
          label="取消选择"
          @click="deselectAll"
          :disable="selectedImages.length === 0"
        />

        <q-chip
          v-if="selectedImages.length > 0"
          color="primary"
          text-color="white"
        >
          已选择 {{ selectedImages.length }} 张
        </q-chip>
      </div>

      <div class="toolbar-right">
        <q-btn
          flat
          dense
          icon="grid_view"
          :color="viewMode === 'grid' ? 'primary' : 'grey-6'"
          @click="setViewMode('grid')"
        >
          <q-tooltip>网格视图</q-tooltip>
        </q-btn>

        <q-btn
          flat
          dense
          icon="view_list"
          :color="viewMode === 'list' ? 'primary' : 'grey-6'"
          @click="setViewMode('list')"
        >
          <q-tooltip>列表视图</q-tooltip>
        </q-btn>

        <q-btn
          v-if="selectedImages.length > 0"
          color="primary"
          icon="download"
          label="下载选中"
          @click="downloadSelected"
        />

        <q-btn
          color="positive"
          icon="download_all"
          label="全部下载"
          @click="downloadAll"
          :disable="completedCount === 0"
        />

        <q-btn
          color="negative"
          icon="delete_sweep"
          label="清空"
          @click="clearAll"
          :disable="images.length === 0"
        />
      </div>
    </div>

    <!-- 网格视图 -->
    <div v-if="viewMode === 'grid'" class="results-grid">
      <div
        v-for="(image, index) in displayImages"
        :key="index"
        class="result-item"
        :class="{ selected: isImageSelected(index) }"
        @click="toggleSelection(index)"
      >
        <!-- 选择框 -->
        <q-checkbox
          v-model="selectedIndexes"
          :val="index"
          class="selection-checkbox"
          @click.stop
        />

        <!-- 图片预览 -->
        <div class="image-container">
          <img
            :src="image.dataUrl"
            :alt="image.name"
            class="result-image"
            @load="onImageLoad(index)"
            @error="onImageError(index)"
          />

          <!-- 状态指示器 -->
          <div class="status-badge" :class="getImageStatus(image)">
            <q-icon :name="getStatusIcon(image)" size="1rem" />
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
            <span v-if="image.sizeReduction" class="compression-badge">
              -{{ Math.round(image.sizeReduction) }}%
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="image-actions">
          <q-btn
            flat
            round
            dense
            icon="visibility"
            color="primary"
            @click.stop="previewImage(index)"
          >
            <q-tooltip>预览</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            icon="download"
            color="positive"
            @click.stop="downloadImage(index)"
          >
            <q-tooltip>下载</q-tooltip>
          </q-btn>

          <q-btn
            flat
            round
            dense
            icon="delete"
            color="negative"
            @click.stop="deleteImage(index)"
          >
            <q-tooltip>删除</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- 列表视图 -->
    <div v-else class="results-list">
      <q-table
        :rows="displayImages"
        :columns="tableColumns"
        row-key="name"
        selection="multiple"
        v-model:selected="selectedTableImages"
        :pagination="{ rowsPerPage: 20 }"
        @request="onTableRequest"
        class="results-table"
      >
        <!-- 自定义单元格渲染 -->
        <template #body-cell-thumbnail="props">
          <q-td :props="props">
            <img
              :src="props.row.dataUrl"
              :alt="props.row.name"
              class="table-thumbnail"
              @click="previewImage(props.pageIndex)"
            />
          </q-td>
        </template>

        <template #body-cell-name="props">
          <q-td :props="props">
            <div class="table-name">{{ props.value }}</div>
          </q-td>
        </template>

        <template #body-cell-size="props">
          <q-td :props="props">
            <div>
              {{ props.row.processedSize?.width }}×{{
                props.row.processedSize?.height
              }}
            </div>
          </q-td>
        </template>

        <template #body-cell-fileSize="props">
          <q-td :props="props">
            <div>
              {{ formatFileSize(props.row.processedSize?.fileSize || 0) }}
            </div>
          </q-td>
        </template>

        <template #body-cell-compression="props">
          <q-td :props="props">
            <q-chip
              v-if="props.row.sizeReduction"
              color="positive"
              text-color="white"
              size="sm"
            >
              -{{ Math.round(props.row.sizeReduction) }}%
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props">
            <div class="table-actions">
              <q-btn
                flat
                round
                dense
                icon="visibility"
                color="primary"
                @click="previewImage(props.pageIndex)"
              />
              <q-btn
                flat
                round
                dense
                icon="download"
                color="positive"
                @click="downloadImage(props.pageIndex)"
              />
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click="deleteImage(props.pageIndex)"
              />
            </div>
          </q-td>
        </template>
      </q-table>
    </div>

    <!-- 空状态 -->
    <div v-if="images.length === 0" class="empty-results">
      <q-icon name="photo_library" size="4rem" color="grey-5" />
      <h3>暂无处理结果</h3>
      <p>请先上传图片并开始处理</p>
    </div>

    <!-- 预览对话框 -->
    <ImagePreview
      v-if="previewDialog.show"
      :images="[previewDialog.image!]"
      :page-size="1"
      @image-view="closePreview"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { QTableColumn } from "quasar";
import { ProcessedImage } from "../utils/ImageProcessor";
import ImagePreview from "./ImagePreview.vue";
import { useErrorHandler } from "../composables/useErrorHandler";

interface Props {
  /** 处理结果图片列表 */
  images: ProcessedImage[];
  /** 是否显示工具栏 */
  showToolbar?: boolean;
  /** 默认视图模式 */
  defaultViewMode?: "grid" | "list";
}

interface Emits {
  (e: "image-selected", indexes: number[]): void;
  (e: "image-preview", index: number, image: ProcessedImage): void;
  (e: "image-download", index: number, image: ProcessedImage): void;
  (e: "image-delete", index: number): void;
  (e: "clear-all"): void;
  (e: "download-selected", indexes: number[]): void;
  (e: "download-all"): void;
}

const props = withDefaults(defineProps<Props>(), {
  showToolbar: true,
  defaultViewMode: "grid",
});

const emit = defineEmits<Emits>();

// 错误处理
const { handleError } = useErrorHandler();

// 响应式数据
const viewMode = ref<"grid" | "list">(props.defaultViewMode);
const selectedIndexes = ref<number[]>([]);
const selectedTableImages = ref<ProcessedImage[]>([]);
const currentPage = ref(1);

// 预览对话框
const previewDialog = ref({
  show: false,
  image: null as ProcessedImage | null,
});

// 表格列定义
const tableColumns: QTableColumn[] = [
  {
    name: "thumbnail",
    label: "预览",
    field: "thumbnail",
    align: "center",
    style: "width: 80px",
  },
  {
    name: "name",
    label: "文件名",
    field: "name",
    align: "left",
  },
  {
    name: "size",
    label: "尺寸",
    field: "size",
    align: "center",
    style: "width: 120px",
  },
  {
    name: "fileSize",
    label: "大小",
    field: "fileSize",
    align: "center",
    style: "width: 100px",
  },
  {
    name: "compression",
    label: "压缩率",
    field: "compression",
    align: "center",
    style: "width: 100px",
  },
  {
    name: "actions",
    label: "操作",
    field: "actions",
    align: "center",
    style: "width: 150px",
  },
];

// 计算属性
const displayImages = computed(() => props.images);
const selectedImages = computed(() => {
  if (viewMode.value === "grid") {
    return selectedIndexes.value.map((index) => props.images[index]);
  } else {
    return selectedTableImages.value;
  }
});

const completedCount = computed(
  () => props.images.filter((img) => !!img.dataUrl).length,
);

const failedCount = computed(
  () => props.images.filter((img) => !img.dataUrl).length,
);

const totalSize = computed(() =>
  props.images.reduce(
    (total, img) => total + (img.processedSize?.fileSize || 0),
    0,
  ),
);

const averageCompression = computed(() => {
  const compressions = props.images
    .filter((img) => img.sizeReduction !== undefined)
    .map((img) => img.sizeReduction || 0);

  if (compressions.length === 0) return 0;
  return Math.round(
    compressions.reduce((sum, comp) => sum + comp, 0) / compressions.length,
  );
});

const processingTime = computed(() => {
  // 这里可以从处理配置中获取实际处理时间
  return "N/A";
});

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
 * 获取图片状态
 */
const getImageStatus = (image: ProcessedImage): string => {
  return image.dataUrl ? "success" : "error";
};

/**
 * 获取状态图标
 */
const getStatusIcon = (image: ProcessedImage): string => {
  return image.dataUrl ? "check_circle" : "error";
};

/**
 * 设置视图模式
 */
const setViewMode = (mode: "grid" | "list"): void => {
  viewMode.value = mode;
};

/**
 * 检查图片是否选中
 */
const isImageSelected = (index: number): boolean => {
  return selectedIndexes.value.includes(index);
};

/**
 * 切换选择状态
 */
const toggleSelection = (index: number): void => {
  const selectedIndex = selectedIndexes.value.indexOf(index);
  if (selectedIndex === -1) {
    selectedIndexes.value.push(index);
  } else {
    selectedIndexes.value.splice(selectedIndex, 1);
  }
};

/**
 * 全选
 */
const selectAll = (): void => {
  if (viewMode.value === "grid") {
    selectedIndexes.value = displayImages.value.map((_, index) => index);
  } else {
    selectedTableImages.value = [...displayImages.value];
  }
};

/**
 * 取消选择
 */
const deselectAll = (): void => {
  selectedIndexes.value = [];
  selectedTableImages.value = [];
};

/**
 * 预览图片
 */
const previewImage = (index: number): void => {
  const image = props.images[index];
  previewDialog.value = {
    show: true,
    image,
  };
  emit("image-preview", index, image);
};

/**
 * 关闭预览
 */
const closePreview = (): void => {
  previewDialog.value.show = false;
};

/**
 * 下载图片
 */
const downloadImage = (index: number): void => {
  const image = props.images[index];
  try {
    const link = document.createElement("a");
    link.href = image.dataUrl;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    emit("image-download", index, image);
  } catch (error) {
    handleError(error as Error, "下载图片");
  }
};

/**
 * 下载选中的图片
 */
const downloadSelected = (): void => {
  const indexes =
    viewMode.value === "grid"
      ? selectedIndexes.value
      : selectedTableImages.value.map((img) => props.images.indexOf(img));

  if (indexes.length === 0) return;

  emit("download-selected", indexes);

  // 下载选中的图片
  indexes.forEach((index) => {
    downloadImage(index);
  });
};

/**
 * 下载全部图片
 */
const downloadAll = (): void => {
  if (completedCount.value === 0) return;

  emit("download-all");

  // 下载所有成功的图片
  props.images.forEach((image, index) => {
    if (image.dataUrl) {
      downloadImage(index);
    }
  });
};

/**
 * 删除图片
 */
const deleteImage = (index: number): void => {
  emit("image-delete", index);
};

/**
 * 清空所有图片
 */
const clearAll = (): void => {
  emit("clear-all");
};

/**
 * 图片加载完成
 */
const onImageLoad = (index: number): void => {
  // 可以在这里处理图片加载完成的逻辑
};

/**
 * 图片加载错误
 */
const onImageError = (index: number): void => {
  // 可以在这里处理图片加载错误的逻辑
};

/**
 * 表格请求处理
 */
const onTableRequest = (props: any): void => {
  // 这里可以实现表格的分页逻辑
  currentPage.value = props.pagination.page;
};

// 监听选中变化，发出事件
watch(selectedImages, (newSelection) => {
  if (viewMode.value === "grid") {
    emit("image-selected", selectedIndexes.value);
  } else {
    const indexes = newSelection.map((img) => props.images.indexOf(img));
    emit("image-selected", indexes);
  }
});
</script>

<style scoped lang="scss">
.process-results {
  .results-summary {
    margin-bottom: 1.5rem;

    .summary-card {
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          transition: all 0.2s ease;

          &:hover {
            background-color: #e9ecef;
            transform: translateY(-1px);
          }

          .stat-content {
            .stat-value {
              font-size: 1.2rem;
              font-weight: 600;
              color: #333;
              line-height: 1.2;
            }

            .stat-label {
              font-size: 0.8rem;
              color: #666;
              margin-top: 0.25rem;
            }
          }
        }
      }
    }
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  }

  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;

    .result-item {
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      overflow: hidden;
      background-color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;

      &:hover {
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        transform: translateY(-4px);
      }

      &.selected {
        border-color: var(--q-primary);
        box-shadow: 0 0 0 2px rgba(var(--q-primary-rgb), 0.2);
      }

      .selection-checkbox {
        position: absolute;
        top: 0.5rem;
        left: 0.5rem;
        z-index: 2;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
      }

      .image-container {
        position: relative;
        width: 100%;
        height: 180px;
        overflow: hidden;
        background-color: #f5f5f5;

        .result-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .status-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: rgba(255, 255, 255, 0.9);

          &.success {
            color: var(--q-positive);
          }

          &.error {
            color: var(--q-negative);
          }
        }
      }

      .image-info {
        padding: 1rem;
        background-color: white;

        .image-name {
          font-weight: 500;
          margin-bottom: 0.5rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.95rem;
        }

        .image-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          color: #666;

          .compression-badge {
            background-color: var(--q-positive);
            color: white;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.75rem;
          }
        }
      }

      .image-actions {
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        display: flex;
        gap: 0.25rem;
        opacity: 0;
        transition: opacity 0.2s ease;
        background-color: rgba(255, 255, 255, 0.9);
        border-radius: 20px;
        padding: 0.25rem;
      }

      &:hover .image-actions {
        opacity: 1;
      }
    }
  }

  .results-list {
    .results-table {
      .table-thumbnail {
        width: 60px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
        cursor: pointer;
      }

      .table-name {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .table-actions {
        display: flex;
        gap: 0.25rem;
        justify-content: center;
      }
    }
  }

  .empty-results {
    text-align: center;
    padding: 4rem 2rem;
    color: #666;

    h3 {
      margin: 1rem 0 0.5rem;
      font-size: 1.4rem;
      font-weight: 600;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
    }
  }
}

// 暗色主题支持
.body--dark .process-results {
  .results-summary {
    .summary-card {
      .stats-grid {
        .stat-item {
          background-color: #2a2a2a;

          &:hover {
            background-color: #333;
          }

          .stat-content {
            .stat-value {
              color: #fff;
            }

            .stat-label {
              color: #bbb;
            }
          }
        }
      }
    }
  }

  .toolbar {
    background-color: #2a2a2a;
    border-color: #555;
  }

  .results-grid {
    .result-item {
      border-color: #555;
      background-color: #2a2a2a;

      &.selected {
        border-color: var(--q-primary);
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

      .image-actions {
        background-color: rgba(42, 42, 42, 0.9);
      }
    }
  }

  .results-list {
    .results-table {
      // Quasar Table 会自动适配暗色主题
    }
  }

  .empty-results {
    color: #bbb;
  }
}
</style>
