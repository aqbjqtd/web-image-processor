import { vi } from 'vitest'
import 'vitest-canvas-mock'

// 全局模拟设置

// 模拟浏览器API
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// 模拟ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// 模拟IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// 模拟WebAssembly（用于不支持的环境）
global.WebAssembly = {
  compile: vi.fn(() => Promise.resolve({})),
  instantiate: vi.fn(() => Promise.resolve({ instance: { exports: {} } })),
  instantiateStreaming: vi.fn(() => Promise.resolve({ instance: { exports: {} } })),
  Memory: vi.fn().mockImplementation(() => ({ buffer: new ArrayBuffer(0) })),
  Table: vi.fn(),
  Module: vi.fn(),
  Instance: vi.fn(),
  validate: vi.fn(() => true),
  CompileError: Error,
  RuntimeError: Error,
  LinkError: Error
}

// 模拟URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// 模拟Blob
if (typeof Blob === 'undefined') {
  global.Blob = class MockBlob {
    constructor(parts = [], options = {}) {
      this.parts = parts
      this.type = options.type || ''
      this.size = parts.reduce((size, part) => size + (part.length || 0), 0)
    }
    
    slice(start = 0, end = this.size, contentType = '') {
      return new MockBlob(this.parts.slice(start, end), { type: contentType })
    }
    
    stream() {
      return new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(this.size))
          controller.close()
        }
      })
    }
    
    text() {
      return Promise.resolve(this.parts.join(''))
    }
    
    arrayBuffer() {
      return Promise.resolve(new ArrayBuffer(this.size))
    }
  }
}

// 模拟File API
if (typeof File === 'undefined') {
  global.File = class MockFile extends Blob {
    constructor(parts, name, options = {}) {
      super(parts, options)
      this.name = name
      this.lastModified = options.lastModified || Date.now()
      this.webkitRelativePath = options.webkitRelativePath || ''
    }
  }
}

// 模拟FileReader
if (typeof FileReader === 'undefined') {
  global.FileReader = class MockFileReader {
    constructor() {
      this.readyState = 0
      this.result = null
      this.error = null
      this.onload = null
      this.onerror = null
      this.onabort = null
      this.onloadstart = null
      this.onloadend = null
      this.onprogress = null
    }
    
    readAsDataURL(file) {
      setTimeout(() => {
        this.readyState = 2
        this.result = `data:${file.type};base64,${btoa('mock-file-content')}`
        if (this.onload) this.onload({ target: this })
      }, 0)
    }
    
    readAsArrayBuffer(file) {
      setTimeout(() => {
        this.readyState = 2
        this.result = new ArrayBuffer(file.size || 0)
        if (this.onload) this.onload({ target: this })
      }, 0)
    }
    
    abort() {
      this.readyState = 2
      if (this.onabort) this.onabort({ target: this })
    }
  }
}

// 模拟Image对象
if (typeof Image === 'undefined') {
  global.Image = class MockImage {
    constructor() {
      this.src = ''
      this.width = 0
      this.height = 0
      this.onload = null
      this.onerror = null
      this.crossOrigin = null
    }
    
    set src(value) {
      this._src = value
      setTimeout(() => {
        this.width = 100
        this.height = 100
        if (this.onload) this.onload()
      }, 0)
    }
    
    get src() {
      return this._src
    }
  }
}

// 模拟Worker
if (typeof Worker === 'undefined') {
  global.Worker = class MockWorker {
    constructor(url) {
      this.url = url
      this.onmessage = null
      this.onerror = null
    }
    
    postMessage(data) {
      // 模拟异步消息处理
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage({ data: { type: 'mock-response', original: data } })
        }
      }, 0)
    }
    
    terminate() {
      // 清理资源
    }
    
    addEventListener(event, handler) {
      if (event === 'message') {
        this.onmessage = handler
      } else if (event === 'error') {
        this.onerror = handler
      }
    }
    
    removeEventListener(event, handler) {
      if (event === 'message' && this.onmessage === handler) {
        this.onmessage = null
      } else if (event === 'error' && this.onerror === handler) {
        this.onerror = null
      }
    }
  }
}

// 模拟localStorage
if (typeof localStorage === 'undefined') {
  const localStorageMock = (() => {
    let store = {}
    return {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value.toString()
      }),
      removeItem: vi.fn((key) => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      }),
      get length() {
        return Object.keys(store).length
      },
      key: vi.fn((index) => {
        const keys = Object.keys(store)
        return keys[index] || null
      })
    }
  })()
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })
}

// 模拟fetch（如果需要）
if (typeof fetch === 'undefined') {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob())
    })
  )
}

// 设置测试环境变量
process.env.NODE_ENV = 'test'

// 抑制控制台警告（可选）
const originalWarn = console.warn
console.warn = (...args) => {
  // 过滤掉某些已知的警告
  if (args[0]?.includes?.('Vue warn')) {
    return
  }
  originalWarn.call(console, ...args)
}