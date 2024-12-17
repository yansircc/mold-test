export interface GeometryScoreConfig {
  similarity: {
    aspectRatioWeight: number;
    shapeWeight: number;
    dimensionWeight: number;
  };
  efficiency: {
    planarDensityWeight: number;     // 平面密度权重
    volumeUtilizationWeight: number; // 体积利用率权重
    heightDistributionWeight: number; // 高度分布权重
  };
  curves: {
    perfectScoreThreshold: number;
    nearPerfectThreshold: number;
    midPointRatio: number;
    slopeFactor: number;
    basePenaltyExponent: number;     // 基础惩罚指数
    densityPenaltyExponent: number;  // 密度惩罚指数
    volumePenaltyExponent: number;   // 体积惩罚指数
    heightPenaltyExponent: number;   // 高度惩罚指数
  };
  tolerance: {
    ratio: number;
    minimum: number;
  };
}

// 默认配置
export const defaultConfig: GeometryScoreConfig = {
  similarity: {
    aspectRatioWeight: 0.5,    // 降低长宽比权重
    shapeWeight: 0.3,
    dimensionWeight: 0.2,      // 增加尺寸权重
  },
  efficiency: {
    planarDensityWeight: 0.35,      // 降低平面密度权重
    volumeUtilizationWeight: 0.35,   // 降低体积利用率权重
    heightDistributionWeight: 0.3,   // 增加高度分布权重
  },
  curves: {
    perfectScoreThreshold: 0.6,     // 降低完美分数阈值
    nearPerfectThreshold: 0.65,     // 降低接近完美阈值
    midPointRatio: 0.5,             // 降低中点比例
    slopeFactor: 10.0,              // 增加斜率因子
    basePenaltyExponent: 4.0,       // 基础惩罚指数
    densityPenaltyExponent: 3.0,    // 密度惩罚指数（较宽松）
    volumePenaltyExponent: 3.5,     // 体积惩罚指数（中等）
    heightPenaltyExponent: 4.0      // 高度惩罚指数（较严格）
  },
  tolerance: {
    ratio: 0.02,                    // 降低比例容忍度
    minimum: 0.05,                  // 降低最小容忍度
  }
};
