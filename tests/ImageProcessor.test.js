/**
 * @vitest-environment happy-dom
 */

import { describe, it, expect, beforeAll } from 'vitest'

describe('ImageProcessor', () => {
  let ImageProcessor

  beforeAll(async () => {
    // 动态导入以确保DOM环境已设置
    const module = await import('../src/utils/ImageProcessor.js')
    ImageProcessor = module.default
  })

  it('should be properly initialized', () => {
    expect(ImageProcessor).toBeDefined()
    expect(typeof ImageProcessor.processImage).toBe('function')
  })

  it('should validate supported image file types', () => {
    const validFile = { type: 'image/jpeg' }
    const invalidFile = { type: 'text/plain' }
    
    expect(ImageProcessor.isValidImageFile(validFile)).toBe(true)
    expect(ImageProcessor.isValidImageFile(invalidFile)).toBe(false)
  })

  it('should validate file size limits', () => {
    const smallFile = { size: 1024 * 1024 } // 1MB
    const largeFile = { size: 100 * 1024 * 1024 } // 100MB
    
    expect(ImageProcessor.isValidFileSize(smallFile)).toBe(true)
    expect(ImageProcessor.isValidFileSize(largeFile)).toBe(false)
  })

  it('should get capabilities', () => {
    const capabilities = ImageProcessor.getCapabilities()
    expect(capabilities).toHaveProperty('canvasSupported')
    expect(capabilities).toHaveProperty('supportedFormats')
    expect(capabilities.maxConcurrency).toBe(1)
  })

  it('should have canvas initialized (if supported)', () => {
    // 在测试环境中，Canvas可能不完全支持
    if (ImageProcessor.canvas) {
      expect(ImageProcessor.canvas).toBeTruthy()
    }
    // 至少应该有canvas属性定义
    expect(ImageProcessor).toHaveProperty('canvas')
    expect(ImageProcessor).toHaveProperty('ctx')
  })

  it('should support basic image formats', () => {
    const capabilities = ImageProcessor.getCapabilities()
    expect(capabilities.supportedFormats).toContain('image/jpeg')
    expect(capabilities.supportedFormats).toContain('image/png')
    expect(capabilities.supportedFormats).toContain('image/webp')
  })
})