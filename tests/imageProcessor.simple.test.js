import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// 由于ImageProcessor导出的是实例而不是类，需要特殊处理
const createImageProcessorInstance = async () => {
  const { default: imageProcessor } = await import('../src/utils/ImageProcessor.js')
  return imageProcessor
}

// Mock Canvas API
const mockCanvas = {
  getContext: vi.fn(() => ({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    putImageData: vi.fn(),
    clearRect: vi.fn()
  })),
  width: 100,
  height: 100,
  toBlob: vi.fn((callback) => {
    callback(new Blob(['test'], { type: 'image/jpeg' }))
  })
}

// Mock Document createElement
vi.stubGlobal('document', {
  createElement: vi.fn(() => mockCanvas)
})

// Mock FileReader
class MockFileReader {
  constructor() {
    this.onload = null
    this.onerror = null
  }
  
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,fake-data'
      this.onload({ target: this })
    }, 0)
  }
}

vi.stubGlobal('FileReader', MockFileReader)

// Mock Image
class MockImage {
  constructor() {
    this.onload = null
    this.onerror = null
    this.width = 100
    this.height = 100
  }
  
  set src(value) {
    setTimeout(() => {
      this.onload()
    }, 0)
  }
}

vi.stubGlobal('Image', MockImage)

// Mock File
class MockFile {
  constructor(name, type, size = 1024) {
    this.name = name
    this.type = type
    this.size = size
  }
}

describe('ImageProcessor', () => {
  let processor
  
  beforeEach(async () => {
    processor = await createImageProcessorInstance()
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Basic Tests', () => {
    it('should initialize correctly', () => {
      expect(processor.canvas).toBeDefined()
      expect(processor.ctx).toBeDefined()
      expect(processor.ctx.imageSmoothingEnabled).toBe(true)
      expect(processor.ctx.imageSmoothingQuality).toBe('high')
    })
    
    it('should initialize with WASM status based on environment', () => {
      // 在测试环境下WASM会被启用（因为跳过了模块加载）
      expect(processor.wasmEnabled).toBe(true)
    })
  })
  
  describe('File Validation Tests', () => {
    it('should validate supported image formats', () => {
      const jpegFile = new MockFile('test.jpg', 'image/jpeg')
      const pngFile = new MockFile('test.png', 'image/png')
      const webpFile = new MockFile('test.webp', 'image/webp')
      const txtFile = new MockFile('test.txt', 'text/plain')
      
      expect(processor.isValidImageFile(jpegFile)).toBe(true)
      expect(processor.isValidImageFile(pngFile)).toBe(true)
      expect(processor.isValidImageFile(webpFile)).toBe(true)
      expect(processor.isValidImageFile(txtFile)).toBe(false)
    })
    
    it('should validate file size limits', () => {
      const smallFile = new MockFile('small.jpg', 'image/jpeg', 1024)
      const largeFile = new MockFile('large.jpg', 'image/jpeg', 60 * 1024 * 1024) // 60MB > 50MB limit
      
      expect(processor.isValidFileSize(smallFile)).toBe(true)
      expect(processor.isValidFileSize(largeFile)).toBe(false)
    })
  })
})