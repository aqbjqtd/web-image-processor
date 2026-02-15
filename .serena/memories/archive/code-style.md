---
title: "代码风格指南 - Web Image Processor"
priority: normal
type: style-guide
tags: ["代码规范", "编码风格", "最佳实践"]
created_at: "2025-01-06"
updated_at: "2025-01-06"
auto_load: false
summary: "TypeScript和Vue.js的代码风格指南和最佳实践"
---

# 代码风格指南

本文档定义 Web Image Processor 项目的代码风格和最佳实践，确保代码质量和一致性。

---

## TypeScript 代码风格

### 1. 命名规范

#### 变量和函数
```typescript
// ✅ Good: camelCase
const imageProcessor = new ImageProcessor();
function processImage() {}

// ❌ Bad: 其他命名风格
const Image_Processor = new ImageProcessor();
function Process_Image() {}
```

#### 类和接口
```typescript
// ✅ Good: PascalCase
class ImageProcessor {}
interface ProcessOptions {}
type ImageFormat = 'jpeg' | 'png' | 'webp';

// ❌ Bad: 其他命名风格
class imageProcessor {}
interface processOptions {}
```

#### 常量
```typescript
// ✅ Good: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_QUALITY = 0.8;

// ❌ Bad: 其他命名风格
const maxFileSize = 10 * 1024 * 1024;
const default_quality = 0.8;
```

#### 私有成员
```typescript
// ✅ Good: 使用 # 前缀（TypeScript 3.8+）
class ImageProcessor {
  #workers: Map<string, Worker>;
  #queue: ProcessTask[];

  constructor() {
    this.#workers = new Map();
    this.#queue = [];
  }
}

// ✅ Also Good: 使用 _ 前缀（传统方式）
class ImageProcessor {
  private _workers: Map<string, Worker>;
  private _queue: ProcessTask[];
}
```

### 2. 类型注解

#### 函数参数和返回值
```typescript
// ✅ Good: 明确的类型注解
async compress(
  image: HTMLImageElement,
  options: ProcessOptions
): Promise<Blob> {
  // 实现逻辑
}

// ❌ Bad: 缺少类型注解
async compress(image, options) {
  // 实现逻辑
}
```

#### 可选参数
```typescript
// ✅ Good: 明确可选参数
function resize(
  image: HTMLImageElement,
  width?: number,
  height?: number
): Promise<Blob> {
  // 实现逻辑
}

// ❌ Bad: 不明确的可选性
function resize(
  image: HTMLImageElement,
  width: number | undefined,
  height: number | undefined
): Promise<Blob> {
  // 实现逻辑
}
```

#### 类型断言
```typescript
// ✅ Good: 使用 as 进行类型断言
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

// ❌ Bad: 使用尖括号语法（JSX中不兼容）
const canvas = <HTMLCanvasElement>document.getElementById('canvas');

// ✅ Better: 使用类型守卫
function isCanvasElement(element: HTMLElement): element is HTMLCanvasElement {
  return element.tagName === 'CANVAS';
}
```

### 3. 接口和类型

#### 接口定义
```typescript
// ✅ Good: 清晰的接口定义
interface ProcessOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  maxSize?: number; // KB
  resizeMode?: 'stretch' | 'contain' | 'cover';
}

// ✅ Good: 使用类型别名定义联合类型
type ImageFormat = 'jpeg' | 'png' | 'webp';
type ResizeMode = 'stretch' | 'contain' | 'cover';

// ✅ Good: 使用枚举（有限值集）
enum ImageFormat {
  JPEG = 'jpeg',
  PNG = 'png',
  WEBP = 'webp'
}
```

#### 泛型
```typescript
// ✅ Good: 使用泛型增加复用性
function createWorker<T extends WorkerMessage>(
  type: string,
  handler: (message: T) => void
): Worker {
  // 实现逻辑
}

// 使用
const worker = createWorker<ProcessMessage>('image', (msg) => {
  console.log(msg.payload);
});
```

### 4. 异步编程

#### async/await 优先
```typescript
// ✅ Good: 使用 async/await
async function processImages(files: File[]): Promise<Blob[]> {
  const results: Blob[] = [];
  for (const file of files) {
    const result = await processImage(file);
    results.push(result);
  }
  return results;
}

// ⚠️ Acceptable: Promise链（简单场景）
function processImages(files: File[]): Promise<Blob[]> {
  return Promise.all(files.map(file => processImage(file)));
}

// ❌ Bad: 回调地狱
function processImages(files: File[], callback: (results: Blob[]) => void) {
  // ...
}
```

#### 错误处理
```typescript
// ✅ Good: 完整的错误处理
async function processImage(file: File): Promise<Blob> {
  try {
    const image = await loadImage(file);
    return await compressImage(image);
  } catch (error) {
    if (error instanceof Error) {
      console.error('处理失败:', error.message);
      throw new ProcessError('图像处理失败', error);
    }
    throw error;
  }
}

// ✅ Good: 自定义错误类型
class ProcessError extends Error {
  constructor(
    message: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ProcessError';
  }
}
```

### 5. 代码组织

#### 导入顺序
```typescript
// 1. Vue相关
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

// 2. 第三方库
import { Notify } from 'quasar';

// 3. 内部模块（使用别名）
import { ImageProcessor } from '@/utils/ImageProcessor';
import { useFileStore } from '@/stores/files';

// 4. 类型导入
import type { ProcessOptions } from '@/types';

// 5. CSS导入（如果有）
import './styles.css';
```

#### 文件结构
```typescript
// 1. 导入
import { ref, computed } from 'vue';

// 2. 类型定义
interface ComponentProps {
  title: string;
  items: string[];
}

// 3. 常量定义
const DEFAULT_TITLE = 'Image Processor';

// 4. 组件定义
export default defineComponent({
  name: 'ComponentName',
  props: {
    // ...
  },
  setup(props) {
    // 5. 响应式状态
    const count = ref(0);

    // 6. 计算属性
    const doubleCount = computed(() => count.value * 2);

    // 7. 方法
    function increment() {
      count.value++;
    }

    // 8. 生命周期
    onMounted(() => {
      console.log('Component mounted');
    });

    // 9. 返回
    return {
      count,
      doubleCount,
      increment
    };
  }
});
```

---

## Vue.js 代码风格

### 1. 组件定义

#### setup() 函数
```vue
<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

export default defineComponent({
  name: 'ImageProcessor',
  props: {
    title: {
      type: String,
      required: true
    },
    maxSize: {
      type: Number,
      default: 1024 * 1024 // 1MB
    }
  },

  emits: ['update:progress', 'complete'],

  setup(props, { emit }) {
    const progress = ref(0);
    const processing = ref(false);

    const progressPercent = computed(() => `${progress.value}%`);

    function updateProgress(value: number) {
      progress.value = value;
      emit('update:progress', value);
    }

    return {
      progress,
      processing,
      progressPercent,
      updateProgress
    };
  }
});
</script>
```

#### `<script setup>` 语法（推荐）
```vue
<script lang="ts" setup>
import { ref, computed } from 'vue';

// Props定义
interface Props {
  title: string;
  maxSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxSize: 1024 * 1024
});

// Emits定义
interface Emits {
  (e: 'update:progress', value: number): void;
  (e: 'complete'): void;
}

const emit = defineEmits<Emits>();

// 响应式状态
const progress = ref(0);

// 计算属性
const progressPercent = computed(() => `${progress.value}%`);

// 方法
function updateProgress(value: number) {
  progress.value = value;
  emit('update:progress', value);
}
</script>
```

### 2. 模板语法

#### 属性绑定
```vue
<template>
  <!-- ✅ Good: 简洁的属性绑定 -->
  <q-input
    v-model="searchText"
    label="搜索"
    dense
    outlined
  />

  <!-- ✅ Good: 复杂对象使用 :bind -->
  <input
    v-bind="inputAttrs"
  />

  <!-- ❌ Bad: 过度使用v-bind -->
  <q-input
    v-bind:label="labelText"
    v-bind:model-value="searchText"
    v-bind:dense="true"
  />
</template>
```

#### 列表渲染
```vue
<template>
  <!-- ✅ Good: 使用key -->
  <div
    v-for="file in files"
    :key="file.id"
    class="file-item"
  >
    {{ file.name }}
  </div>

  <!-- ❌ Bad: 缺少key -->
  <div v-for="file in files">
    {{ file.name }}
  </div>
</template>
```

#### 事件处理
```vue
<template>
  <!-- ✅ Good: 简洁的事件处理 -->
  <button @click="handleClick">
    点击
  </button>

  <!-- ✅ Good: 内联简单逻辑 -->
  <button @click="count++">
    增加
  </button>

  <!-- ❌ Bad: 复杂逻辑直接写在模板中 -->
  <button @click="count++; save(); updateUI();">
    复杂操作
  </button>
</template>
```

### 3. 样式

#### Scoped样式
```vue
<style lang="scss" scoped>
// ✅ Good: 使用scoped避免样式污染
.image-processor {
  padding: 16px;

  &__header {
    font-size: 18px;
    font-weight: bold;
  }

  &__content {
    margin-top: 12px;
  }
}
</style>
```

#### BEM命名
```vue
<style lang="scss" scoped>
// ✅ Good: BEM命名规范
.image-card {
  &__header {
    // Block__Element
  }

  &--large {
    // Block--Modifier
  }

  &__header--active {
    // Block__Element--Modifier
  }
}
</style>
```

---

## 通用最佳实践

### 1. 注释规范

#### JSDoc注释
```typescript
/**
 * 压缩图像到指定质量
 * @param image - 要压缩的图像
 * @param quality - 压缩质量（0-1）
 * @returns 压缩后的图像Blob
 * @throws {ProcessError} 当压缩失败时
 */
async function compress(
  image: HTMLImageElement,
  quality: number
): Promise<Blob> {
  // 实现逻辑
}
```

#### 代码注释
```typescript
// ✅ Good: 解释"为什么"而非"做什么"
// 使用串行处理避免内存溢出（问题：#001）
for (const file of files) {
  await processImage(file);
}

// ❌ Bad: 重复代码逻辑
// 循环处理每个文件
for (const file of files) {
  await processImage(file);
}
```

### 2. 错误处理

#### 统一错误处理
```typescript
// ✅ Good: 自定义错误类型
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// 使用
throw new AppError(
  '图像处理失败',
  'PROCESS_ERROR',
  { file: file.name }
);
```

### 3. 性能优化

#### 防抖和节流
```typescript
import { debounce } from 'quasar';

// ✅ Good: 防抖输入
const handleInput = debounce((value: string) => {
  search(value);
}, 300);

// 使用
<input @input="handleInput" />
```

#### 计算属性缓存
```vue
<script setup>
import { computed } from 'vue';

// ✅ Good: 使用计算属性（有缓存）
const filteredList = computed(() => {
  return items.value.filter(item => item.active);
});

// ❌ Bad: 使用方法（每次都重新计算）
function filteredList() {
  return items.value.filter(item => item.active);
}
</script>
```

---

## 工具配置

### ESLint配置
```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  extends: [
    'plugin:vue/vue3-essential',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'vue/multi-word-component-names': 'off'
  }
};
```

### Prettier配置
```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

---

## 代码审查清单

### 提交代码前检查
- [ ] 代码符合ESLint规范
- [ ] 代码通过Prettier格式化
- [ ] 所有函数都有类型注解
- [ ] 复杂逻辑有注释说明
- [ ] 错误处理完善
- [ ] 无console.log遗留
- [ ] 性能优化考虑（大数据、循环等）

---

**文档版本**: 1.0
**最后更新**: 2025-01-06
**维护者**: Web Image Processor Team
