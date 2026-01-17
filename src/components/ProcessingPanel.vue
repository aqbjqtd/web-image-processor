<template>
  <div class="processing-panel">
    <q-card class="config-card">
      <q-card-section>
        <div class="text-h6">图像处理配置</div>
      </q-card-section>

      <q-card-section>
        <!-- 调整选项 -->
        <div class="config-group">
          <label class="config-label">调整选项</label>
          <q-select
            v-model="localConfig.resizeOption"
            :options="resizeOptions"
            emit-value
            map-options
            outlined
            dense
          />
        </div>

        <!-- 百分比调整 -->
        <div
          v-if="localConfig.resizeOption === 'percentage'"
          class="config-group"
        >
          <label class="config-label">缩放比例 (%)</label>
          <q-slider
            v-model="localConfig.resizePercentage"
            :min="10"
            :max="200"
            :step="5"
            markers
            label
            label-always
          />
          <div class="percentage-value">
            {{ localConfig.resizePercentage }}%
          </div>
        </div>

        <!-- 自定义尺寸 -->
        <div v-if="localConfig.resizeOption === 'custom'" class="config-group">
          <div class="size-inputs">
            <div class="size-input">
              <label class="config-label">宽度 (px)</label>
              <q-input
                v-model.number="localConfig.targetWidth"
                type="number"
                outlined
                dense
                :min="1"
                :max="8192"
                @update:model-value="validateDimensions"
              />
            </div>
            <div class="size-separator">×</div>
            <div class="size-input">
              <label class="config-label">高度 (px)</label>
              <q-input
                v-model.number="localConfig.targetHeight"
                type="number"
                outlined
                dense
                :min="1"
                :max="8192"
                @update:model-value="validateDimensions"
              />
            </div>
            <div class="size-presets">
              <q-btn
                v-for="preset in sizePresets"
                :key="preset.label"
                flat
                dense
                size="sm"
                :label="preset.label"
                @click="applyPreset(preset)"
              />
            </div>
          </div>
        </div>

        <!-- 调整模式 -->
        <div
          v-if="localConfig.resizeOption !== 'original'"
          class="config-group"
        >
          <label class="config-label">调整模式</label>
          <q-option-group
            v-model="localConfig.resizeMode"
            :options="resizeModeOptions"
            inline
          />
          <div class="mode-description">
            {{ getResizeModeDescription(localConfig.resizeMode) }}
          </div>
        </div>

        <!-- 文件大小限制 -->
        <div class="config-group">
          <label class="config-label">目标文件大小 (KB)</label>
          <q-slider
            v-model.number="localConfig.maxFileSize"
            :min="50"
            :max="5000"
            :step="50"
            markers
            label
            label-always
          />
          <div class="size-value">{{ localConfig.maxFileSize }} KB</div>
          <div class="size-warning" v-if="localConfig.maxFileSize > 1000">
            <q-icon name="warning" color="orange" />
            <span>大文件可能影响质量</span>
          </div>
        </div>

        <!-- 高级选项 -->
        <q-expansion-item
          icon="settings"
          label="高级选项"
          class="advanced-section"
        >
          <q-card-section>
            <!-- 并发数 -->
            <div class="config-group">
              <label class="config-label">并发处理数</label>
              <q-slider
                v-model.number="localConfig.concurrency"
                :min="1"
                :max="4"
                :step="1"
                markers
                label
                label-always
              />
              <div class="concurrency-value">
                {{ localConfig.concurrency }} 个文件
              </div>
            </div>

            <!-- 格式选择 -->
            <div class="config-group">
              <label class="config-label">输出格式</label>
              <q-select
                v-model="localConfig.format"
                :options="formatOptions"
                emit-value
                map-options
                outlined
                dense
                clearable
                placeholder="自动选择"
              />
            </div>
          </q-card-section>
        </q-expansion-item>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="重置" @click="resetConfig" />
        <q-btn
          flat
          label="预设"
          icon="bookmark"
          @click="showPresetsDialog = true"
        />
        <q-btn
          color="primary"
          label="应用配置"
          icon="check"
          @click="applyConfig"
        />
      </q-card-actions>
    </q-card>

    <!-- 预设配置对话框 -->
    <q-dialog v-model="showPresetsDialog" position="top">
      <q-card class="presets-card">
        <q-card-section>
          <div class="text-h6">配置预设</div>
        </q-card-section>

        <q-card-section>
          <div class="presets-grid">
            <div
              v-for="preset in configPresets"
              :key="preset.name"
              class="preset-item"
              :class="{ active: selectedPreset?.name === preset.name }"
              @click="selectPreset(preset)"
            >
              <div class="preset-name">{{ preset.name }}</div>
              <div class="preset-description">{{ preset.description }}</div>
              <div class="preset-details">
                <q-chip
                  v-for="tag in preset.tags"
                  :key="tag"
                  size="sm"
                  color="primary"
                  text-color="white"
                >
                  {{ tag }}
                </q-chip>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn
            color="primary"
            label="应用预设"
            :disable="!selectedPreset"
            @click="applySelectedPreset"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ProcessImageConfig } from "../utils/ImageProcessor";
import { useErrorHandler } from "../composables/useErrorHandler";

interface Props {
  /** 当前配置 */
  modelValue: ProcessImageConfig;
  /** 是否禁用配置 */
  disabled?: boolean;
}

interface Emits {
  (e: "update:modelValue", config: ProcessImageConfig): void;
  (e: "config-change", config: ProcessImageConfig): void;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const emit = defineEmits<Emits>();

// 错误处理
const { handleError } = useErrorHandler();

// 本地配置
const localConfig = ref<ProcessImageConfig>({ ...props.modelValue });

// 对话框状态
const showPresetsDialog = ref(false);
const selectedPreset = ref<(typeof configPresets)[0] | null>(null);

// 配置选项
const resizeOptions = [
  { label: "原始尺寸", value: "original" },
  { label: "按比例缩放", value: "percentage" },
  { label: "自定义尺寸", value: "custom" },
];

const resizeModeOptions = [
  { label: "拉伸填充", value: "stretch" },
  { label: "保持比例（填充）", value: "keep_ratio_pad" },
  { label: "保持比例（裁剪）", value: "keep_ratio_crop" },
];

const formatOptions = [
  { label: "JPEG（推荐照片）", value: "image/jpeg" },
  { label: "PNG（推荐图形）", value: "image/png" },
  { label: "WebP（现代格式）", value: "image/webp" },
];

// 尺寸预设
const sizePresets = [
  { label: "4K", width: 3840, height: 2160 },
  { label: "2K", width: 2560, height: 1440 },
  { label: "1080p", width: 1920, height: 1080 },
  { label: "720p", width: 1280, height: 720 },
  { label: "480p", width: 854, height: 480 },
];

// 配置预设
const configPresets = [
  {
    name: "高质量照片",
    description: "保持高画质，适合专业摄影",
    tags: ["照片", "高质量"],
    config: {
      resizeOption: "custom",
      targetWidth: 1920,
      targetHeight: 1080,
      resizeMode: "keep_ratio_pad",
      maxFileSize: 800,
      concurrency: 1,
      format: "image/jpeg",
    } as ProcessImageConfig,
  },
  {
    name: "网页优化",
    description: "平衡质量和大小，适合网页使用",
    tags: ["网页", "优化"],
    config: {
      resizeOption: "custom",
      targetWidth: 1200,
      targetHeight: 800,
      resizeMode: "keep_ratio_pad",
      maxFileSize: 200,
      concurrency: 2,
      format: "image/jpeg",
    } as ProcessImageConfig,
  },
  {
    name: "社交媒体",
    description: "适配主流社交媒体平台",
    tags: ["社交", "移动"],
    config: {
      resizeOption: "custom",
      targetWidth: 1080,
      targetHeight: 1080,
      resizeMode: "keep_ratio_crop",
      maxFileSize: 150,
      concurrency: 2,
      format: "image/jpeg",
    } as ProcessImageConfig,
  },
  {
    name: "快速预览",
    description: "小尺寸，快速加载",
    tags: ["预览", "快速"],
    config: {
      resizeOption: "percentage",
      resizePercentage: 50,
      resizeMode: "keep_ratio_pad",
      maxFileSize: 100,
      concurrency: 4,
      format: "image/webp",
    } as ProcessImageConfig,
  },
];

/**
 * 获取调整模式描述
 */
const getResizeModeDescription = (mode: string): string => {
  const descriptions: Record<string, string> = {
    stretch: "拉伸图像以完全填充目标尺寸，可能改变宽高比",
    keep_ratio_pad: "保持原始宽高比，填充空白区域",
    keep_ratio_crop: "保持原始宽高比，裁剪多余部分",
  };
  return descriptions[mode] || "";
};

/**
 * 验证尺寸输入
 */
const validateDimensions = (): void => {
  if (localConfig.value.targetWidth < 1) {
    localConfig.value.targetWidth = 1;
  }
  if (localConfig.value.targetHeight < 1) {
    localConfig.value.targetHeight = 1;
  }
  if (localConfig.value.targetWidth > 8192) {
    localConfig.value.targetWidth = 8192;
  }
  if (localConfig.value.targetHeight > 8192) {
    localConfig.value.targetHeight = 8192;
  }
};

/**
 * 应用尺寸预设
 */
const applyPreset = (preset: (typeof sizePresets)[0]): void => {
  localConfig.value.targetWidth = preset.width;
  localConfig.value.targetHeight = preset.height;
};

/**
 * 重置配置
 */
const resetConfig = (): void => {
  localConfig.value = {
    resizeOption: "custom",
    resizePercentage: 100,
    targetWidth: 1920,
    targetHeight: 1080,
    resizeMode: "keep_ratio_pad",
    maxFileSize: 300,
    concurrency: 1,
    useWasm: false,
  };
  applyConfig();
};

/**
 * 应用配置
 */
const applyConfig = (): void => {
  emit("update:modelValue", { ...localConfig.value });
  emit("config-change", { ...localConfig.value });
};

/**
 * 选择预设
 */
const selectPreset = (preset: (typeof configPresets)[0]): void => {
  selectedPreset.value = preset;
};

/**
 * 应用选中的预设
 */
const applySelectedPreset = (): void => {
  if (selectedPreset.value) {
    localConfig.value = { ...selectedPreset.value.config };
    applyConfig();
  }
};

// 监听外部配置变化
watch(
  () => props.modelValue,
  (newConfig) => {
    localConfig.value = { ...newConfig };
  },
  { deep: true },
);

// 监听本地配置变化
watch(
  localConfig,
  () => {
    emit("update:modelValue", { ...localConfig.value });
  },
  { deep: true },
);
</script>

<style scoped lang="scss">
.processing-panel {
  .config-card {
    max-width: 600px;
    margin: 0 auto;
  }

  .config-group {
    margin-bottom: 1.5rem;

    .config-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }
  }

  .percentage-value,
  .size-value,
  .concurrency-value {
    text-align: center;
    margin-top: 0.5rem;
    font-weight: 600;
    color: var(--q-primary);
  }

  .size-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    color: #f57c00;
    font-size: 0.9rem;
  }

  .size-inputs {
    .size-input {
      margin-bottom: 1rem;
    }

    .size-separator {
      text-align: center;
      font-weight: 600;
      color: #666;
      margin: 0.5rem 0;
    }

    .size-presets {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 1rem;
    }
  }

  .mode-description {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #f5f5f5;
    border-radius: 4px;
    font-size: 0.9rem;
    color: #666;
  }

  .advanced-section {
    margin-top: 1rem;
  }

  .presets-card {
    max-width: 600px;
    max-height: 80vh;
  }

  .presets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .preset-item {
    padding: 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--q-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &.active {
      border-color: var(--q-primary);
      background-color: #e3f2fd;
    }

    .preset-name {
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .preset-description {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 1rem;
    }

    .preset-details {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
  }
}

// 暗色主题支持
.body--dark .processing-panel {
  .config-label {
    color: #fff;
  }

  .mode-description {
    background-color: #333;
    color: #ccc;
  }

  .preset-item {
    border-color: #555;
    color: #fff;

    &:hover {
      border-color: var(--q-primary);
      background-color: #2a2a2a;
    }

    &.active {
      background-color: #1e3a5f;
      border-color: var(--q-primary);
    }

    .preset-name {
      color: #fff;
    }

    .preset-description {
      color: #bbb;
    }
  }
}
</style>
