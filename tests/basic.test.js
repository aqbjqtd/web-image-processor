import { describe, it, expect } from 'vitest'

describe('Basic Test', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2)
  })
  
  it('should test string operations', () => {
    const str = 'Hello World'
    expect(str.length).toBe(11)
    expect(str.toUpperCase()).toBe('HELLO WORLD')
  })
  
  it('should test array operations', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr.length).toBe(5)
    expect(arr.includes(3)).toBe(true)
    expect(arr.filter(x => x > 3)).toEqual([4, 5])
  })
  
  it('should test object operations', () => {
    const obj = { name: 'Test', value: 42 }
    expect(obj.name).toBe('Test')
    expect(obj.value).toBe(42)
    expect(Object.keys(obj)).toEqual(['name', 'value'])
  })
})