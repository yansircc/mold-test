import type { Rectangle, Point2D } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";
import type { BalanceScore } from "@/types/algorithm/balance/types";
import { calculateDetailedFlowScore } from "./flow";

import { geometryScorer } from "./geometry";
import { normalizeProducts } from "./geometry/utils/normalization";
import { calculateDistributionScore } from "./distribution";

/**
 * 验证输入数据的有效性
 * @param layout 产品布局数组
 * @param products 产品信息数组
 * @returns 是否有效
 */
function validateInput(layout: Rectangle[], products: Product[]): boolean {
  return (
    Array.isArray(layout) &&
    Array.isArray(products) &&
    layout.length > 0 &&
    products.length > 0 &&
    layout.length === products.length
  );
}

/**
 * 计算总体平衡分数
 * @param layout 产品布局数组
 * @param products 产品信息数组
 * @param injectionPoint 注胶点位置
 * @returns 平衡评分结果
 */
export function calculateBalanceScore(
  layout: Rectangle[],
  products: Product[],
  injectionPoint: Point2D,
): BalanceScore {
  // 1. 验证输入数据
  if (!validateInput(layout, products)) {
   throw new Error("Invalid input data");
  }

  try {
    // 2. 计算各个维度的分数
    const normalizedProducts = normalizeProducts(products);
    const geometryScore = geometryScorer.calculateScore(normalizedProducts);
    const flowScore = calculateDetailedFlowScore(
      layout,
      products,
      injectionPoint,
    );

    // 创建布局映射，确保键是数字类型
    const layoutMap = layout.reduce<Record<number, Rectangle>>(
      (acc, rect, i) => {
        acc[i] = rect;
        return acc;
      },
      {},
    );

    const distributionScore = calculateDistributionScore(
      layoutMap,
      products,
    );

    // const distributionScore = calculateDistributionScore(
    //   layoutMap,
    //   products,
    // );

    // 3. 定义权重
    const weights = {
      geometry: 0.3, // 几何特征权重
      flow: 0.4, // 流动平衡权重
      distribution: 0.3, // 分布均匀性权重
    };

    // 4. 计算加权总分
    const total = Math.min(
      100,
      weights.geometry * geometryScore.overall +
        weights.flow * flowScore.overall +
        weights.distribution * distributionScore.overall,
    );

    // 5. 计算置信度（基于数据完整性）
    const confidence = calculateConfidence(products);

    // 6. 返回最终结果
    return {
      total,
      details: {
        geometry: geometryScore,
        flow: flowScore,
        distribution: distributionScore,
      },
      confidence,
    };
  } catch (error) {
    console.error("Error calculating balance score:", error);
    throw error;
  }
}

/**
 * 计算评分置信度
 * @param products 产品数组
 * @returns 置信度 (0-1)
 */
function calculateConfidence(products: Product[]): number {
  // 检查关键数据的完整性
  const validDataPoints = products.filter(
    (product) =>
      product.cadData?.volume != null &&
      product.cadData?.surfaceArea != null &&
      product.dimensions?.length != null &&
      product.dimensions?.width != null &&
      product.dimensions?.height != null,
  );

  // 计算置信度
  return validDataPoints.length / products.length;
}

// 导出所有子模块的评分函数
export * from "./geometry";
export * from "./flow";
export * from "./distribution";
