import { describe, expect, it } from 'vitest';
import { findOptimalDistribution } from '../distributing';
import type { Product } from '@/types/domain/product';

describe('findOptimalDistribution', () => {
  it('应该找到所有可能的分组方案', () => {
    const products: Product[] = [
      {
        id: 1,
        name: 'Product A',
        dimensions: { width: 10, length: 10, height: 5 },
        cadData: {
          boundingBox: {
            center: { x: 0, y: 0, z: 0 },
            dimensions: { x: 10, y: 10, z: 5 }
          },
          volume: 500,
          surfaceArea: 350,
          centerOfMass: { x: 0, y: 0, z: 0 }
        }
      },
      {
        id: 2,
        name: 'Product B',
        dimensions: { width: 8, length: 8, height: 4 },
        cadData: {
          boundingBox: {
            center: { x: 0, y: 0, z: 0 },
            dimensions: { x: 8, y: 8, z: 4 }
          },
          volume: 400,
          surfaceArea: 224,
          centerOfMass: { x: 0, y: 0, z: 0 }
        }
      },
      {
        id: 3,
        name: 'Product C',
        dimensions: { width: 6, length: 6, height: 3 },
        cadData: {
          boundingBox: {
            center: { x: 0, y: 0, z: 0 },
            dimensions: { x: 6, y: 6, z: 3 }
          },
          volume: 300,
          surfaceArea: 180,
          centerOfMass: { x: 0, y: 0, z: 0 }
        }
      }
    ];

    const result = findOptimalDistribution(products, true);

    // 应该有5种可能的分组方案：
    // 1. [A,B,C] - 所有产品在一个模具中
    // 2. [A] + [B,C] - A单独一个模具，B和C一起
    // 3. [B] + [A,C] - B单独一个模具，A和C一起
    // 4. [C] + [A,B] - C单独一个模具，A和B一起
    // 5. [A] + [B] + [C] - 每个产品单独一个模具
    expect(result.totalSolutions).toBe(5);
    
    // 验证每种方案的模具数量
    const distributionsByMoldCount = result.solutions.reduce((acc, solution) => {
      const moldCount = solution.distributions.length;
      acc[moldCount] = (acc[moldCount] ?? 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // 应该有1种单模具方案，3种双模具方案，1种三模具方案
    expect(distributionsByMoldCount[1]).toBe(1); // 一个模具的方案数
    expect(distributionsByMoldCount[2]).toBe(3); // 两个模具的方案数
    expect(distributionsByMoldCount[3]).toBe(1); // 三个模具的方案数
  });
});

// bun test src/lib/algorithm/__test__/distribution.test.ts