import type { GeometryScoreConfig } from "./config";
import type {
  NormalizedProduct,
  GeometryScore,
} from "@/types/algorithm/balance/geometry";
import { defaultConfig } from "./config";
import { SimilarityCalculator } from "./calculators/similarity";
import { EfficiencyCalculator } from "./calculators/efficiency";

export class GeometryScorer {
  private similarityCalculator: SimilarityCalculator;
  private efficiencyCalculator: EfficiencyCalculator;

  constructor(private config: GeometryScoreConfig = defaultConfig) {
    this.similarityCalculator = new SimilarityCalculator(config);
    this.efficiencyCalculator = new EfficiencyCalculator(config);
  }

  /**
   * 计算几何评分
   */
  calculateScore(products: NormalizedProduct[]): GeometryScore {
    // 处理空产品列表
    if (!products || products.length === 0) {
      return this.createZeroScore();
    }

    // 检查是否有有效产品
    const validProducts = products.filter(
      (p) =>
        p?.dimensions &&
        p.volume > 0 &&
        p.dimensions.length > 0 &&
        p.dimensions.width > 0 &&
        p.dimensions.height > 0,
    );

    if (validProducts.length === 0) {
      return this.createZeroScore();
    }

    // 处理单个产品
    if (validProducts.length === 1) {
      return this.createPerfectScore();
    }

    // 计算形状评分
    const shapeScore =
      this.similarityCalculator.calculateShapeScore(validProducts);

    // 计算尺寸评分
    const dimensionScore =
      this.similarityCalculator.calculateDimensionScore(validProducts);

    // 计算效率评分
    const efficiencyScore =
      this.efficiencyCalculator.calculateEfficiencyScores(validProducts);

    // 计算总分
    const totalScore =
      // 形状得分（20%）
      shapeScore.aspectRatio * 0.2 +
      // 尺寸得分（20%）
      dimensionScore.consistency * 0.2 +
      // 效率得分（60%）
      (efficiencyScore.planarDensity *
        this.config.efficiency.planarDensityWeight +
        efficiencyScore.volumeUtilization *
          this.config.efficiency.volumeUtilizationWeight +
        efficiencyScore.heightDistribution *
          this.config.efficiency.heightDistributionWeight) *
        0.6;

    return {
      overall: Math.round(totalScore), // 四舍五入到整数
      details: {
        shapeScore,
        dimensionScore,
        efficiencyScore,
      },
    };
  }

  private createZeroScore(): GeometryScore {
    return {
      overall: 0,
      details: {
        shapeScore: {
          aspectRatio: 0,
          symmetry: 0,
          complexity: 0,
          uniformity: 0,
        },
        dimensionScore: {
          sizeVariation: 0,
          scaleRatio: 0,
          consistency: 0,
        },
        efficiencyScore: {
          planarDensity: 0,
          volumeUtilization: 0,
          heightDistribution: 0,
        },
      },
    };
  }

  private createPerfectScore(): GeometryScore {
    return {
      overall: 100,
      details: {
        shapeScore: {
          aspectRatio: 100,
          symmetry: 100,
          complexity: 100,
          uniformity: 100,
        },
        dimensionScore: {
          sizeVariation: 100,
          scaleRatio: 100,
          consistency: 100,
        },
        efficiencyScore: {
          planarDensity: 100,
          volumeUtilization: 100,
          heightDistribution: 100,
        },
      },
    };
  }

  private areAllProductsIdentical(products: NormalizedProduct[]): boolean {
    if (products.length <= 1) return true;

    const first = products[0];
    if (!first) return false;

    // 确保所有必要的属性都存在
    if (!first.dimensions || !first.volume) return false;

    const { dimensions: firstDims, volume: firstVolume } = first;

    return products.every((p) => {
      if (!p?.dimensions || !p.volume) return false;

      return (
        Math.abs(p.dimensions.length - firstDims.length) <
          this.config.tolerance.minimum &&
        Math.abs(p.dimensions.width - firstDims.width) <
          this.config.tolerance.minimum &&
        Math.abs(p.dimensions.height - firstDims.height) <
          this.config.tolerance.minimum &&
        Math.abs(p.volume - firstVolume) < this.config.tolerance.minimum
      );
    });
  }
}

// 导出默认的评分器实例
export const geometryScorer = new GeometryScorer(defaultConfig);
