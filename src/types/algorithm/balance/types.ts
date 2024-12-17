// import { type DetailedDistributionScore } from "@/lib/algorithm/balance/scores/distribution/index";
import type { Point2D } from "../../core/geometry";
import type { GeometryScore } from "./geometry";
import type { DetailedDistributionScore } from "./distribution";

/**
 * 平衡分析总分
 */
export interface BalanceScore {
  total: number; // 总分 0-100
  details: {
    geometry: GeometryScore;
    flow: DetailedFlowScore; // 流动平衡
    distribution: DetailedDistributionScore; // 分布平衡
  };
  confidence: number; // 置信度 0-1
}

/**
 * 详细的分布平衡分数，用于可视化展示
 */


/**
 * 几何特征评分
 */
// export interface GeometryScore {
//   score: number; // 总体几何分数 (0-100)
//   details: {
//     // 形状评分
//     shapeScore: {
//       aspectRatio: number; // 长宽比评分 (0-100)
//       symmetry: number; // 对称性评分 (0-100)
//       complexity: number; // 复杂度评分 (0-100)
//       uniformity: number; // 一致性评分 (0-100)
//     };
//     // 尺寸评分
//     dimensionScore: {
//       surfaceArea: number; // 表面积评分 (0-100)
//       efficiency: number; // 空间利用率评分 (0-100)
//     };
//   };
// }

/**
 * 几何特征分析
 */
export interface GeometryAnalysis {
  shape: {
    aspectRatios: number[]; // 每个产品的长宽比
    symmetryAxes: number[]; // 每个产品的对称轴数量
    complexityMetrics: number[]; // 每个产品的复杂度指标
  };
  dimensions: {
    surfaceAreas: number[]; // 表面积
    boundingBoxVolumes: number[]; // 包围盒体积
    wallThicknesses?: number[]; // 壁厚（如果可用）
  };
  similarity: {
    shapeMatrix: number[][]; // 形状相似度矩阵
    dimensionMatrix: number[][]; // 尺寸相似度矩阵
  };
  efficiency: {
    boundingBoxVolume: number; // 包围盒体积
    packingRatio: number; // 填充率
  };
}

/**
 * 详细的流动平衡分数，用于可视化展示
 */
export interface DetailedFlowScore {
  flowPathBalance: number; // 流动路径平衡性
  surfaceAreaBalance: number; // 表面积平衡性
  overall: number; // 总体评分
}

/**
 * 流动路径信息
 */
export interface FlowPath {
  distance: number; // 流动距离
  resistance: number; // 流动阻力
  center: Point2D; // 流动中心
  normalized: number; // 归一化值
}

/**
 * 带权重的数值
 */
export interface WeightedValue {
  value: number; // 数值
  weight: number; // 权重
}
