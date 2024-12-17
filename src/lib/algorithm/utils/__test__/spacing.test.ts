import { describe, it, expect } from 'vitest'
import { calculateSpacing } from '../spacing'

describe('calculateSpacing', () => {
  it('应该根据最大尺寸返回正确的间距', () => {
    // 测试边界值
    expect(calculateSpacing(200)).toBe(30)
    expect(calculateSpacing(300)).toBe(35)
    expect(calculateSpacing(400)).toBe(40)
    expect(calculateSpacing(500)).toBe(45)
    expect(calculateSpacing(600)).toBe(50)
    expect(calculateSpacing(700)).toBe(55)
    expect(calculateSpacing(800)).toBe(60)
    expect(calculateSpacing(900)).toBe(65)
    expect(calculateSpacing(1000)).toBe(70)
  })

  it('应该对边界值以内的数值返回正确的间距', () => {
    expect(calculateSpacing(150)).toBe(30)
    expect(calculateSpacing(250)).toBe(35)
    expect(calculateSpacing(350)).toBe(40)
    expect(calculateSpacing(450)).toBe(45)
    expect(calculateSpacing(550)).toBe(50)
    expect(calculateSpacing(650)).toBe(55)
    expect(calculateSpacing(750)).toBe(60)
    expect(calculateSpacing(850)).toBe(65)
    expect(calculateSpacing(950)).toBe(70)
  })

  it('应该在超出最大尺寸时抛出错误', () => {
    expect(() => calculateSpacing(1001)).toThrow('Max dimension exceeded')
    expect(() => calculateSpacing(2000)).toThrow('Max dimension exceeded')
  })
})
