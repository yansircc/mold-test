import { describe, it, expect } from 'vitest'
import { calculateMinArea } from '../min-area'
import type { Rectangle2D } from '@/types/core/geometry';
import type { PlacedRectangle } from '@/types/algorithm/layout/types';
import { getProductDimensions } from '@/types/domain/product';
import { mockProducts } from '../balance/mockData'

describe('calculateMinArea', () => {
  it('应该计算出正确的最小面积 - 大型矩形', () => {
    const rectangles: Rectangle2D[] = [
      { length: 300, width: 100 },
      { length: 250, width: 100 },
      { length: 230, width: 180 },
    ]

    const result = calculateMinArea(rectangles)
    console.log('大型矩形布局结果:', JSON.stringify(result, null, 2))

    // Width and length may be swapped but area should be the same
    const expectedArea = 122850
    expect(result.width * result.length).toBe(expectedArea)

    // Additional checks to ensure the layout is valid
    expect(result.layout).toBeDefined()
    expect(result.layout.length).toBe(rectangles.length)
  })

  it('应该计算出正确的最小面积 - 小型矩形', () => {
    const rectangles: Rectangle2D[] = [
      { length: 120, width: 60 },
      { length: 120, width: 60 },
      { length: 40, width: 40 },
      { length: 40, width: 40 },
    ]

    const result = calculateMinArea(rectangles)
    console.log('小型矩形布局结果:', JSON.stringify(result, null, 2))

    // Width and length may be swapped but area should be the same
    const expectedArea = 28500
    expect(result.width * result.length).toBe(expectedArea)

    // Additional checks
    expect(result.layout).toBeDefined()
    expect(result.layout.length).toBe(rectangles.length)
  })

  it('应该计算出正确的最小面积 - Mock数据', () => {
    const rectangles = mockProducts.map(getProductDimensions)
    const result = calculateMinArea(rectangles)
    console.log('Mock数据布局结果:', JSON.stringify(result, null, 2))

    // Check layout validity
    expect(result.layout).toBeDefined()
    expect(result.layout.length).toBe(rectangles.length)

    // Check that all rectangles are placed within bounds
    for (const rect of result.layout) {
      expect(rect.x + rect.width).toBeLessThanOrEqual(result.width)
      expect(rect.y + rect.length).toBeLessThanOrEqual(result.length)
    }

    // Check for overlaps
    for (let i = 0; i < result.layout.length; i++) {
      for (let j = i + 1; j < result.layout.length; j++) {
        const a: PlacedRectangle = result.layout[i]!
        const b: PlacedRectangle = result.layout[j]!
        const hasOverlap = (
          a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.length &&
          a.y + a.length > b.y
        )
        expect(hasOverlap).toBe(false)
      }
    }
  })
})

// bun test src/lib/algorithm/__test__/min-area.test.ts