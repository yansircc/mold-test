import { describe, expect, test } from "vitest";
import { calculateDetailedFlowScore } from "../index";
import type { Rectangle, Point2D } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";

const createTestProduct = (
  id: number,
  dimensions = { length: 50, width: 50, height: 10 },
  weight = 1,
  flowLength?: number,
): Product => {
  return {
    id,
    name: `Product ${id}`,
    weight,
    dimensions,
    flowData: {
      calculatedFlowPath: flowLength
        ? { length: flowLength, path: [] }
        : undefined,
    },
  };
};

describe("流动平衡分数计算", () => {
  // 基础测试用例
  test("应该处理空布局", () => {
    const layout: Rectangle[] = [];
    const products: Product[] = [];
    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBe(0);
  });

  test("应该处理单个产品布局", () => {
    const layout: Rectangle[] = [{ x: 0, y: 0, length: 50, width: 50 }];

    const products: Product[] = [createTestProduct(1)];
    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(90); // 单个产品应该获得高分
    expect(score.flowPathBalance).toBe(100);
  });

  // 对称布局测试
  test("应该计算水平对称布局分数", () => {
    const layout: Rectangle[] = [
      { x: -100, y: 0, length: 50, width: 50 },
      { x: 100, y: 0, length: 50, width: 50 },
    ];

    const products: Product[] = [createTestProduct(1), createTestProduct(2)];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(80);
    expect(score.flowPathBalance).toBeGreaterThan(90);
  });

  test("应该计算垂直对称布局分数", () => {
    const layout: Rectangle[] = [
      { x: 0, y: -100, length: 50, width: 50 },
      { x: 0, y: 100, length: 50, width: 50 },
    ];

    const products: Product[] = [createTestProduct(1), createTestProduct(2)];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(80);
    expect(score.flowPathBalance).toBeGreaterThan(90);
  });

  test("应该计算四重对称布局分数", () => {
    const layout: Rectangle[] = [
      { x: -100, y: -100, length: 50, width: 50 },
      { x: 100, y: -100, length: 50, width: 50 },
      { x: -100, y: 100, length: 50, width: 50 },
      { x: 100, y: 100, length: 50, width: 50 },
    ];

    const products: Product[] = [
      createTestProduct(1),
      createTestProduct(2),
      createTestProduct(3),
      createTestProduct(4),
    ];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(85); // 四重对称应该获得很高的分数
    expect(score.flowPathBalance).toBeGreaterThan(95);
  });

  // 渐进布局测试
  test("应该计算水平渐进布局分数", () => {
    const layout: Rectangle[] = [
      { x: 0, y: 0, length: 50, width: 50 },
      { x: 60, y: 0, length: 50, width: 50 },
      { x: 120, y: 0, length: 50, width: 50 },
    ];

    const products: Product[] = [
      createTestProduct(1),
      createTestProduct(2),
      createTestProduct(3),
    ];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(70);
    expect(score.flowPathBalance).toBeGreaterThan(80);
  });

  test("应该计算垂直渐进布局分数", () => {
    const layout: Rectangle[] = [
      { x: 0, y: 0, length: 50, width: 50 },
      { x: 0, y: 60, length: 50, width: 50 },
      { x: 0, y: 120, length: 50, width: 50 },
    ];

    const products: Product[] = [
      createTestProduct(1),
      createTestProduct(2),
      createTestProduct(3),
    ];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(70);
    expect(score.flowPathBalance).toBeGreaterThan(80);
  });

  test("应该处理不同间距的渐进布局", () => {
    const layout: Rectangle[] = [
      { x: 0, y: 0, length: 50, width: 50 },
      { x: 70, y: 0, length: 50, width: 50 },
      { x: 150, y: 0, length: 50, width: 50 },
    ];

    const products: Product[] = [
      createTestProduct(1),
      createTestProduct(2),
      createTestProduct(3),
    ];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(65); // 由于间隙不均匀，分数应该略低
    expect(score.flowPathBalance).toBeGreaterThan(75);
  });

  // 复杂布局测试
  test("应该处理混合对称和渐进布局", () => {
    const layout: Rectangle[] = [
      { x: -120, y: 0, length: 50, width: 50 },
      { x: -60, y: 0, length: 50, width: 50 },
      { x: 60, y: 0, length: 50, width: 50 },
      { x: 120, y: 0, length: 50, width: 50 },
    ];

    const products: Product[] = [
      createTestProduct(1),
      createTestProduct(2),
      createTestProduct(3),
      createTestProduct(4),
    ];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(70); // 应该同时检测到对称性和渐进性
  });

  test("应该处理环形布局", () => {
    const radius = 100;
    const layout: Rectangle[] = Array.from({ length: 8 }, (_, i) => {
      const angle = (i * Math.PI * 2) / 8;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        length: 50,
        width: 50,
      };
    });

    const products: Product[] = Array.from({ length: 8 }, (_, i) =>
      createTestProduct(i + 1),
    );

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(85); // 环形布局应该获得高分
    expect(score.flowPathBalance).toBeGreaterThan(90);
  });

  // 边界情况和错误处理
  test("应该处理布局和产品数量不匹配的情况", () => {
    const layout: Rectangle[] = [{ x: 0, y: 0, length: 50, width: 50 }];

    const products: Product[] = [createTestProduct(1), createTestProduct(2)];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBe(0);
  });

  test("应该处理预定义流动长度的产品", () => {
    const layout: Rectangle[] = [
      { x: -100, y: 0, length: 50, width: 50 },
      { x: 100, y: 0, length: 50, width: 50 },
    ];

    const products: Product[] = [
      createTestProduct(1, undefined, 1, 1000),
      createTestProduct(2, undefined, 1, 1000),
    ];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(80); // 应该使用预定义的流动长度
  });

  test("应该处理不同重量的产品", () => {
    const layout: Rectangle[] = [
      { x: -100, y: 0, length: 50, width: 50 },
      { x: 100, y: 0, length: 50, width: 50 },
    ];

    const products: Product[] = [
      createTestProduct(1, undefined, 2), // 双重重量
      createTestProduct(2, undefined, 1),
    ];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(70); // 应该处理重量差异
  });

  test("应该处理不同尺寸的产品", () => {
    const layout: Rectangle[] = [
      { x: -100, y: 0, length: 50, width: 50 },
      { x: 100, y: 0, length: 100, width: 100 }, // 更大的产品
    ];

    const products: Product[] = [
      createTestProduct(1),
      createTestProduct(2, { length: 100, width: 100, height: 10 }),
    ];

    const injectionPoint: Point2D = { x: 0, y: 0 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(65); // 应该处理尺寸差异
  });

  test("应该处理非零注射点", () => {
    const layout: Rectangle[] = [
      { x: 0, y: 0, length: 50, width: 50 },
      { x: 60, y: 0, length: 50, width: 50 },
    ];

    const products: Product[] = [createTestProduct(1), createTestProduct(2)];

    const injectionPoint: Point2D = { x: 30, y: 30 };

    const score = calculateDetailedFlowScore(layout, products, injectionPoint);
    expect(score.overall).toBeGreaterThan(70); // 应该处理偏移注射点
  });
});

// 运行测试命令：bun test src/lib/algorithm/balance/scores/flow/__tests__/flow.test.ts
