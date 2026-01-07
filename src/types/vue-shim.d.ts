declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>
  export default component
}

declare module 'layouts/MainLayout.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>
  export default component
}

declare module 'pages/*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>
  export default component
}

// 扩展Performance接口以支持memory属性
declare interface Performance {
  memory?: {
    jsHeapSizeLimit: number;
    totalJSHeapSize: number;
    usedJSHeapSize: number;
  };
}

// 扩展Window接口以支持gc函数
declare interface Window {
  gc?: () => void;
}