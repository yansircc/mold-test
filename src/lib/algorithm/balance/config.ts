/**
 * 流动平衡算法配置
 */
export const FlowBalanceConfig = {
  // 对称布局检测
  SYMMETRIC: {
    DEFAULT: 0.15, // 对称检测的默认阈值
    MIN: 0.1, // 最小阈值
    MAX: 0.3, // 最大阈值
  },

  // 渐进布局检测
  PROGRESSIVE: {
    DEFAULT: 0.6, // 从0.35增加到0.6以处理均匀间距布局
    MIN: 0.4, // 增加最小阈值
    MAX: 0.8, // 增加最大阈值
  },

  // 尺寸相关惩罚
  SIZE_PENALTY: {
    FACTOR: 0.05, // 尺寸惩罚的基础因子
    MIN: 0.7, // 最小惩罚值
    MAX: 1.0, // 最大惩罚值
  },

  // 分数限制
  SCORE: {
    MIN: 0, // 最低可能分数
    MAX: 100, // 最高可能分数
    BOOST_MAX: 100, // 提升后的最高分数
  },

  // 组件权重
  WEIGHTS: {
    FLOW_PATH: {
      DEFAULT: 0.7, // 流动路径默认权重
      MIN: 0.6, // 最小权重
      MAX: 0.8, // 最大权重
    },
    SURFACE_AREA: {
      DEFAULT: 0.15, // 表面积默认权重
      MIN: 0.1, // 最小权重
      MAX: 0.2, // 最大权重
    },
    VOLUME: {
      DEFAULT: 0.15, // 体积默认权重
      MIN: 0.1, // 最小权重
      MAX: 0.2, // 最大权重
    },
  },

  // 复杂度阈值
  COMPLEXITY: {
    SIZE: {
      SMALL: 2, // 小型布局阈值
      MEDIUM: 4, // 中型布局阈值
      LARGE: 6, // 大型布局阈值
    },
    VARIATION: {
      LOW: 0.1, // 低变异阈值
      MEDIUM: 0.2, // 中变异阈值
      HIGH: 0.3, // 高变异阈值
    },
  },
} as const;

/**
 * 几何平衡算法配置
 */
export const DistributionBalanceConfig = {
  // 最终分数的组件权重
  WEIGHTS: {
    ISOTROPY: 40, // 各向同性分数权重
    GYRATION: 30, // 回转半径分数权重
    CENTER: 30, // 中心偏差分数权重
  },

  // 各向同性评分参数
  ISOTROPY: {
    BASE_SCORE: 0.4, // 基础分数比例
    POWER: 0.05, // 各向同性计算的幂次
  },

  // 回转半径评分参数
  GYRATION: {
    BASE_SCORE: 0.2, // 基础分数比例
    DECAY: 0.8, // 指数衰减率
  },

  // 中心偏差评分参数
  CENTER: {
    BASE_SCORE: 0.2, // 基础分数比例
    DECAY: 2.0, // 指数衰减率
  },

  // 模式检测阈值
  PATTERNS: {
    PERFECT: {
      ISOTROPY: 0.95, // 完美模式的最小各向同性值
      CENTER_DEV: 0.1, // 完美模式的最大中心偏差
      GYRATION: 0.8, // 完美模式的最大回转半径
      BONUS: 5, // 完美模式的奖励分数
    },
    SYMMETRIC: {
      ISOTROPY: 0.8, // 对称模式的最小各向同性值
      CENTER_DEV: 0.2, // 对称模式的最大中心偏差
      BONUS: 3, // 对称模式的奖励分数
    },
  },

  // 特殊情况分数
  SPECIAL: {
    SINGLE_PRODUCT: 95, // 单一产品布局的分数
  },
} as const;
