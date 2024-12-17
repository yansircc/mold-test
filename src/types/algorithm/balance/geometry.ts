import type { Product } from "@/types/domain/product";

// 基础特征
export interface DimensionFeatures {
  length: number;
  width: number;
  height: number;
  ratios: {
    lengthWidth: number;
    lengthHeight: number;
    widthHeight: number;
  };
}

export interface ShapeFeatures {
  volume: number;
  surfaceArea: number;
  aspectRatio: number;
}

// 形状评分
export interface ShapeScore {
  aspectRatio: number;
  symmetry: number;
  complexity: number;
  uniformity: number;
}

// 尺寸评分
export interface DimensionScore {
  sizeVariation: number;
  scaleRatio: number;
  consistency: number;
}

// 效率评分
export interface EfficiencyScore {
  planarDensity: number;
  volumeUtilization: number;
  heightDistribution: number;
}

// 几何评分
export interface GeometryScore {
  overall: number;
  details: {
    shapeScore: ShapeScore;
    dimensionScore: DimensionScore;
    efficiencyScore: EfficiencyScore;
  };
}

// 评分配置
export interface GeometryScoreConfig {
  // 相似度评分参数
  similarity: {
    aspectRatioWeight: number; // 长宽比权重
    shapeWeight: number; // 形状权重
    dimensionWeight: number; // 尺寸权重
  };

  // 评分曲线参数
  curves: {
    perfectScoreThreshold: number; // 完美分数阈值
    nearPerfectThreshold: number; // 接近完美阈值
    midPointRatio: number; // S型曲线中点
    slopeFactor: number; // 曲线斜率因子
    basePenaltyExponent: number; // 基础惩罚指数
  };

  // 容差设置
  tolerance: {
    ratio: number; // 相对容差
    minimum: number; // 最小容差
  };
}

// 验证结果
export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// 规范化后的产品数据
export interface NormalizedProduct {
  dimensions: {
    length: number;
    width: number;
    height: number;
    x?: number;
    y?: number;
  };
  volume: number;
  surfaceArea: number;
}

// 分析结果
export interface GeometryAnalysis {
  products: Product[];
  features: {
    shape: ShapeFeatures[];
    dimension: DimensionFeatures[];
  };
  scores: GeometryScore[];
}
