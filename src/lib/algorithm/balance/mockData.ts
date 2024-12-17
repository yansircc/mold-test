import type { Rectangle, Point2D } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";

/**
 * Mock product data for testing
 * 测试用模拟产品数据
 */
export const mockProducts: Product[] = [
  {
    // 左上象限
    id: 1,
    name: "Product 1",
    weight: 100,
    dimensions: {
      length: 30,
      width: 30,
      height: 20,
    },
    cadData: {
      volume: 100,
      surfaceArea: 200,
      boundingBox: {
        center: { x: 25, y: 25, z: 10 },
        dimensions: { x: 30, y: 30, z: 20 },
      },
      centerOfMass: { x: 25, y: 25, z: 10 },
    },
  },
  {
    // 右上象限
    id: 2,
    name: "Product 2",
    weight: 100,
    dimensions: {
      length: 30,
      width: 30,
      height: 20,
    },
    cadData: {
      volume: 100,
      surfaceArea: 200,
      boundingBox: {
        center: { x: 75, y: 25, z: 10 },
        dimensions: { x: 30, y: 30, z: 20 },
      },
      centerOfMass: { x: 75, y: 25, z: 10 },
    },
  },
  {
    // 左下象限
    id: 3,
    name: "Product 3",
    weight: 100,
    dimensions: {
      length: 30,
      width: 30,
      height: 20,
    },
    cadData: {
      volume: 100,
      surfaceArea: 200,
      boundingBox: {
        center: { x: 25, y: 75, z: 10 },
        dimensions: { x: 30, y: 30, z: 20 },
      },
      centerOfMass: { x: 25, y: 75, z: 10 },
    },
  },
  {
    // 右下象限
    id: 4,
    name: "Product 4",
    weight: 100,
    dimensions: {
      length: 30,
      width: 30,
      height: 20,
    },
    cadData: {
      volume: 100,
      surfaceArea: 200,
      boundingBox: {
        center: { x: 75, y: 75, z: 10 },
        dimensions: { x: 30, y: 30, z: 20 },
      },
      centerOfMass: { x: 75, y: 75, z: 10 },
    },
  },
];

// 使用 CAD 数据中的 center 计算注胶点
export function calculateInjectionPoint(
  products: (Product | null | undefined)[],
): Point2D {
  if (!products.length) {
    return { x: 0, y: 0 };
  }

  // 过滤掉 null 和 undefined，并计算有效产品的中心点平均值
  const validProducts = products.filter(
    (p): p is Product => p?.cadData?.boundingBox?.center !== undefined,
  );

  if (!validProducts.length) {
    return { x: 0, y: 0 };
  }

  const centerSum = validProducts.reduce(
    (sum, product) => {
      const center = product.cadData?.boundingBox.center;
      if (!center) return sum;

      return {
        x: sum.x + center.x,
        y: sum.y + center.y,
      };
    },
    { x: 0, y: 0 },
  );

  return {
    x: centerSum.x / validProducts.length,
    y: centerSum.y / validProducts.length,
  };
}

// 注入点位置（使用 CAD 数据计算）
export const mockInjectionPoint: Point2D =
  calculateInjectionPoint(mockProducts);

// 布局结果 - 使用 CAD 数据中的位置信息
export const mockLayout: Rectangle[] = mockProducts
  .filter((p): p is Product => p !== null && p !== undefined)
  .map((product) => ({
    x: product.cadData?.boundingBox.center.x ?? 0,
    y: product.cadData?.boundingBox.center.y ?? 0,
    width: product.cadData?.boundingBox.dimensions.x ?? 0,
    length: product.cadData?.boundingBox.dimensions.y ?? 0,
  }));
