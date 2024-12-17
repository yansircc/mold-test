import { describe, test } from "vitest";
import { calculateDistributionScore } from "../index";
import type { Rectangle } from "@/types/core/geometry";
import type { Product, Dimensions3D } from "@/types/domain/product";

describe("分布平衡评分测试", () => {
  // 生产相关常量
  // const PRODUCTION = {
  //   MIN_GAP: 20,
  //   SAFE_GAP: 30,
  //   COOLING_GAP: 50,
  // } as const;

  // 产品尺寸常量
  const SIZES = {
    SMALL: { length: 50, width: 50, height: 25 } as Dimensions3D,
    MEDIUM: { length: 100, width: 100, height: 50 } as Dimensions3D,
    LARGE: { length: 200, width: 200, height: 100 } as Dimensions3D,
  } as const;

  // 辅助函数：创建带尺寸的产品
  function createSizedProduct(
    id: number,
    weight: number,
    dimensions: Dimensions3D,
  ): Product {
    return {
      id,
      name: `产品${id}`,
      weight,
      dimensions,
    };
  }

  // // 辅助函数：创建考虑实际产品尺寸和间距的布局
  // function createLayout(
  //   positions: [number, number][],
  //   products: Product[],
  //   minGap: number = PRODUCTION.MIN_GAP,
  // ): Record<number, Rectangle> {
  //   return positions.reduce(
  //     (layout, [x, y], index) => {
  //       const product = products[index];
  //       if (!product) return layout;

  //       // 添加间距到位置坐标
  //       const gappedX = x + (x > 0 ? minGap : -minGap);
  //       const gappedY = y + (y > 0 ? minGap : -minGap);

  //       layout[product.id] = {
  //         x: gappedX,
  //         y: gappedY,
  //         width: product.dimensions?.width ?? 0,
  //         length: product.dimensions?.length ?? 0,
  //       };
  //       return layout;
  //     },
  //     {} as Record<number, Rectangle>,
  //   );
  // }

  // // 辅助函数：检测布局是否满足最小间距要求
  // function checkMinimumGap(
  //   layout: Record<number, Rectangle>,
  //   minGap: number = PRODUCTION.MIN_GAP,
  // ): boolean {
  //   const rectangles = Object.values(layout);
  //   if (rectangles.length < 2) return true;

  //   for (let i = 0; i < rectangles.length; i++) {
  //     for (let j = i + 1; j < rectangles.length; j++) {
  //       const r1 = rectangles[i]!;
  //       const r2 = rectangles[j]!;

  //       const horizontalGap = Math.min(
  //         Math.abs(r1.x - (r2.x + r2.width)),
  //         Math.abs(r2.x - (r1.x + r1.width)),
  //       );
  //       const verticalGap = Math.min(
  //         Math.abs(r1.y - (r2.y + r2.length)),
  //         Math.abs(r2.y - (r1.y + r1.length)),
  //       );

  //       if (r1.x < r2.x + r2.width && r2.x < r1.x + r1.width) {
  //         if (verticalGap < minGap) return false;
  //       }
  //       if (r1.y < r2.y + r2.length && r2.y < r1.y + r1.length) {
  //         if (horizontalGap < minGap) return false;
  //       }
  //       if (horizontalGap < minGap && verticalGap < minGap) {
  //         return false;
  //       }
  //     }
  //   }
  //   return true;
  // }

  

  describe("多场景综合测试", () => {

    test("分布平衡打分测试", () => {
      // 测试算法对不同重量产品的平衡布局能力
      const products = [
        createSizedProduct(0, 400, SIZES.MEDIUM), // 重物品
        createSizedProduct(1, 400, SIZES.MEDIUM), // 中等物品
        createSizedProduct(2, 400, SIZES.MEDIUM), // 轻物品
      ];

      console.log("products:", products); 
      // const baseRadius = 300;
      const layout = [
        { x: 0, y: 0, width: 200, length: 200 },
        { x: 200, y: 0, width: 200, length: 200 },
        { x: 400, y: 0, width: 200, length: 200 },
      ];

      const layoutMap = layout.reduce<Record<number, Rectangle>>(
        (acc, rect, i) => {
          acc[i] = rect;
          return acc;
        },
        {},
      );

      console.log("layoutMap:", layoutMap);
      // const positions = products.map((p, i): [number, number] => {
      //   if (i === 0) return [0, 0];
      //   const angle = ((i - 1) * Math.PI * 2) / (products.length - 1);
      //   // 轻的产品放得更远以平衡重的产品
      //   const radius = baseRadius * Math.sqrt(800 / p.weight!);
      //   return [radius * Math.cos(angle), radius * Math.sin(angle)];
      // });

      // const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      // expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layoutMap, products);


      console.log("result score:", result);
      // 由于重量差异大，完全对称是不可能的，60-70分的对称性是合理的
      // expect(result.score).toBeGreaterThan(70);
      // expect(result.details.volumeBalance.symmetry).toBeGreaterThan(60);
      // expect(result.details.centerDeviation).toBeGreaterThan(70);
      // expect(result.details.isotropy).toBeGreaterThan(70);
    });
  });
});

// bun test src/lib/algorithm/balance/scores/distribution/__tests__/distribution.test.ts