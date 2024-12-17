import type {
  NormalizedProduct,
  EfficiencyScore,
} from "@/types/algorithm/balance/geometry";
import type { GeometryScoreConfig } from "../config";
import { applyNonlinearMapping } from "../utils/math";

export class EfficiencyCalculator {
  constructor(private config: GeometryScoreConfig) {}

  calculateEfficiencyScores(products: NormalizedProduct[]): EfficiencyScore {
    if (products.length === 0) {
      return {
        planarDensity: 0,
        volumeUtilization: 0,
        heightDistribution: 0,
      };
    }

    // 1. 计算平面密度
    const planarDensity = this.calculatePlanarDensityScore(products);

    // 2. 计算体积利用率
    const volumeUtilization = this.calculateVolumeUtilizationScore(products);

    // 3. 计算高度分布
    const heightDistribution = this.calculateHeightDistributionScore(products);

    // 将分数归一化到0-100范围
    return {
      planarDensity: Math.round(planarDensity * 100),
      volumeUtilization: Math.round(volumeUtilization * 100),
      heightDistribution: Math.round(heightDistribution * 100),
    };
  }

  /**
   * 计算平面密度评分
   */
  calculatePlanarDensityScore(products: NormalizedProduct[]): number {
    if (products.length === 0) return 0;
    if (products.length === 1) return 1;

    const result = this.calculatePlanarDensity(products);
    return result.score / 100;
  }

  calculatePlanarDensity(products: NormalizedProduct[]): {
    totalArea: number;
    boundingArea: number;
    density: string;
    score: number;
  } {
    if (products.length === 0)
      return { totalArea: 0, boundingArea: 0, density: "0.000", score: 0 };
    if (products.length === 1)
      return { totalArea: 0, boundingArea: 0, density: "1.000", score: 100 };

    // 计算实际占用面积
    const totalArea = products.reduce((sum, p) => {
      if (!p.dimensions) return sum;
      const { length = 0, width = 0 } = p.dimensions;
      return sum + length * width;
    }, 0);

    // 如果没有坐标信息，使用最小边界盒估算
    const hasCoordinates = products.some(
      (p) =>
        p.dimensions &&
        typeof p.dimensions.x === "number" &&
        typeof p.dimensions.y === "number",
    );

    let boundingArea: number;
    if (hasCoordinates) {
      // 使用坐标计算边界
      let maxX = -Infinity;
      let maxY = -Infinity;
      let minX = Infinity;
      let minY = Infinity;

      products.forEach((p) => {
        if (!p.dimensions) return;
        const { length = 0, width = 0 } = p.dimensions;
        const x = p.dimensions.x ?? 0;
        const y = p.dimensions.y ?? 0;
        maxX = Math.max(maxX, x + length);
        maxY = Math.max(maxY, y + width);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
      });

      boundingArea = (maxX - minX) * (maxY - minY);
    } else {
      // 使用最小边界盒估算
      let totalLength = 0;
      let maxWidth = 0;
      let minWidth = Infinity;
      let isUniform = true;

      products.forEach((p) => {
        if (!p.dimensions) return;
        const { length = 0, width = 0 } = p.dimensions;
        totalLength += length;
        maxWidth = Math.max(maxWidth, width);
        minWidth = Math.min(minWidth, width);

        // 检查宽度是否一致
        if (width !== 0 && Math.abs(width - maxWidth) > 0.1) {
          isUniform = false;
        }
      });

      // 如果所有产品宽度一致，使用更优化的边界盒
      boundingArea = isUniform
        ? totalLength * maxWidth
        : totalLength * maxWidth * 1.1;
    }

    if (boundingArea === 0)
      return { totalArea: 0, boundingArea: 0, density: "0.000", score: 0 };

    // 计算密度
    const density = totalArea / boundingArea;

    // 计算分数
    let score: number;
    if (density > 1) {
      // 密度大于1表示有重叠，使用二次惩罚
      const overlapFactor = Math.pow(density - 1, 2);
      score = Math.max(0, 100 - overlapFactor * 150);
    } else {
      // 基于密度的三次方计算基础分数
      let baseScore = Math.pow(density, 3) * 100;

      // 根据密度范围应用不同的评分策略
      if (density >= 0.9) {
        // 非常高的密度，给予奖励
        baseScore = Math.min(100, baseScore * 1.2);
      } else if (density >= 0.7) {
        // 较好的密度，轻微惩罚
        baseScore *= 0.95;
      } else if (density >= 0.5) {
        // 一般的密度，中等惩罚
        baseScore *= 0.8;
      } else {
        // 较低的密度，严重惩罚
        baseScore *= Math.pow(density, 0.6);
      }

      // 如果没有坐标信息但产品尺寸一致，给予额外奖励
      if (!hasCoordinates && density >= 0.9) {
        baseScore = Math.min(100, baseScore * 1.1);
      }

      score = Math.min(95, baseScore);
    }

    return {
      totalArea,
      boundingArea,
      density: density.toFixed(3),
      score: Math.round(score),
    };
  }

  /**
   * 计算体积利用率评分
   */
  calculateVolumeUtilizationScore(products: NormalizedProduct[]): number {
    if (products.length === 0) return 0;
    if (products.length === 1) return 1;

    // 计算总体积和边界框体积
    let totalVolume = 0;
    let boundingBoxVolume = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    for (const product of products) {
      if (!product.dimensions) continue;
      const { length = 0, width = 0, height = 0 } = product.dimensions;
      const volume = product.volume ?? 0;

      if (length <= 0 || width <= 0 || height <= 0 || volume <= 0) continue;

      totalVolume += volume;
      maxLength = Math.max(maxLength, length);
      maxWidth = Math.max(maxWidth, width);
      maxHeight = Math.max(maxHeight, height);
    }

    // 如果没有有效的产品尺寸，返回0分
    if (maxLength === 0 || maxWidth === 0 || maxHeight === 0) {
      return 0;
    }

    boundingBoxVolume = maxLength * maxWidth * maxHeight;
    const utilization = totalVolume / boundingBoxVolume;

    // 如果利用率太低，直接返回低分
    if (utilization < 0.2) {
      return 0.1;
    }

    // 对于一般情况，使用非线性映射
    return applyNonlinearMapping(
      utilization,
      this.config.curves.volumePenaltyExponent ??
        this.config.curves.basePenaltyExponent,
      this.config,
    );
  }

  /**
   * 计算高度分布评分
   */
  calculateHeightDistributionScore(products: NormalizedProduct[]): number {
    if (products.length === 0) return 0;
    if (products.length === 1) return 1;

    // 提取有效的高度值
    const heights = products
      .map((p) => p.dimensions?.height ?? 0)
      .filter((h) => h > 0);

    // 如果没有有效的高度值，返回0分
    if (heights.length === 0) {
      return 0;
    }

    // 计算高度的变异系数
    const cv = calculateCV(heights);

    // 如果变异系数太大，直接返回低分
    if (cv > 0.5) {
      return 0.2;
    }

    // 对于一般情况，使用非线性映射
    // 注意：这里我们需要将cv转换为分数（cv越小分数越高）
    const score = 1 - cv;
    return applyNonlinearMapping(
      score,
      this.config.curves.heightPenaltyExponent ??
        this.config.curves.basePenaltyExponent,
      this.config,
    );
  }

  calculateBoundingArea(products: NormalizedProduct[]): number {
    let maxLength = 0;
    let maxWidth = 0;

    for (const product of products) {
      if (!product.dimensions) continue;
      const { length = 0, width = 0 } = product.dimensions;
      if (length <= 0 || width <= 0) continue;

      maxLength = Math.max(maxLength, length);
      maxWidth = Math.max(maxWidth, width);
    }

    // 如果没有有效的产品尺寸，返回0分
    if (maxLength === 0 || maxWidth === 0) {
      return 0;
    }

    return maxLength * maxWidth;
  }
}

function calculateCV(values: number[]): number {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avg === 0) return 0;

  const variance =
    values.reduce((sum, val) => {
      const diff = val - avg;
      return sum + diff * diff;
    }, 0) / values.length;

  const stdDev = Math.sqrt(variance);
  return stdDev / avg;
}
