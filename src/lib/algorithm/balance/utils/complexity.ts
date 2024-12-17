import type { Rectangle, Point2D } from "@/types/core/geometry";
import { calculateDistance, calculateRectCenter } from "./geometry";
import { calculateCV } from "./numeric";
import { FlowBalanceConfig as Config } from "../config";

export interface LayoutComplexity {
  size: number; // 布局大小
  spatialVariation: number; // 空间分布变异度
  shapeVariation: number; // 形状变异度
  flowVariation: number; // 流动变异度
  overallComplexity: number; // 总体复杂度
}

/**
 * Calculate spatial distribution variation
 */
const calculateSpatialVariation = (
  layout: Rectangle[],
  center: Point2D,
): number => {
  if (!layout.length) return 0;

  // Calculate distances from center
  const distances = layout.map((rect) => {
    const rectCenter = calculateRectCenter(rect);
    return calculateDistance(center, rectCenter);
  });

  // Calculate coefficient of variation
  return calculateCV(distances);
};

/**
 * Calculate shape variation
 */
const calculateShapeVariation = (layout: Rectangle[]): number => {
  if (!layout.length) return 0;

  // Calculate aspect ratios
  const aspectRatios = layout.map((rect) => rect.width / rect.length);

  // Calculate coefficient of variation
  return calculateCV(aspectRatios);
};

/**
 * Calculate flow variation
 */
const calculateFlowVariation = (flowPaths: number[]): number => {
  if (!flowPaths.length) return 0;
  return calculateCV(flowPaths);
};

/**
 * Get complexity level based on size
 */
const getSizeComplexity = (size: number): number => {
  const { SMALL, MEDIUM, LARGE } = Config.COMPLEXITY.SIZE;
  if (size <= SMALL) return 0;
  if (size <= MEDIUM) return 0.5;
  if (size <= LARGE) return 0.75;
  return 1;
};

/**
 * Calculate layout complexity
 */
export const calculateLayoutComplexity = (
  layout: Rectangle[],
  flowPaths: number[],
  center: Point2D,
): LayoutComplexity => {
  const size = layout.length;
  if (!size) {
    return {
      size: 0,
      spatialVariation: 0,
      shapeVariation: 0,
      flowVariation: 0,
      overallComplexity: 0,
    };
  }

  // Calculate individual complexity factors
  const spatialVariation = calculateSpatialVariation(layout, center);
  const shapeVariation = calculateShapeVariation(layout);
  const flowVariation = calculateFlowVariation(flowPaths);

  // Calculate overall complexity
  const sizeComplexity = getSizeComplexity(size);
  const variationComplexity =
    (spatialVariation + shapeVariation + flowVariation) / 3;

  // Weighted combination of size and variation complexity
  const overallComplexity = 0.4 * sizeComplexity + 0.6 * variationComplexity;

  return {
    size,
    spatialVariation,
    shapeVariation,
    flowVariation,
    overallComplexity,
  };
};
