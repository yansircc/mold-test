import type { Rectangle, Point2D } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";
import type { DetailedFlowScore } from "@/types/algorithm/balance/types";
import { calculateDistance, calculateRectCenter } from "../../utils/geometry";
import { safeDivide, clamp } from "../../utils/numeric";
import { calculateLayoutComplexity } from "../../utils/complexity";
import { FlowBalanceConfig as Config } from "../../config";

/**
 * Calculate basic flow score
 * 计算基础流动分数
 */
export function calculateBasicFlowScore(
  layout: Rectangle[],
  products: Product[],
  injectionPoint: Point2D,
): number {
  const detailedScore = calculateDetailedFlowScore(
    layout,
    products,
    injectionPoint,
  );
  return detailedScore.overall;
}

/**
 * Calculate detailed flow balance score
 * 计算详细的流动平衡分数
 */
export function calculateDetailedFlowScore(
  layout: Rectangle[],
  products: Product[],
  injectionPoint: Point2D,
): DetailedFlowScore {
  if (!layout.length || !products.length || layout.length !== products.length) {
    return {
      flowPathBalance: 0,
      surfaceAreaBalance: 0,
      overall: 0,
    };
  }

  // Calculate flow paths with safe distance calculation
  const flowPaths = products.map((product, i) => {
    if (product.flowData?.calculatedFlowPath != null) {
      return product.flowData.calculatedFlowPath.length;
    }
    const center = calculateRectCenter(layout[i]!);
    return calculateDistance(injectionPoint, center);
  });

  // Calculate layout complexity
  const complexity = calculateLayoutComplexity(
    layout,
    flowPaths,
    injectionPoint,
  );

  // Calculate flow statistics with safe operations
  const maxFlow = Math.max(...flowPaths);
  const minFlow = Math.min(...flowPaths);
  const avgFlow = safeDivide(
    flowPaths.reduce((a, b) => a + b, 0),
    flowPaths.length,
  );

  // Calculate normalized variance with protection
  const flowVariance = safeDivide(
    flowPaths.reduce((sum, flow) => sum + Math.pow(flow - avgFlow, 2), 0),
    flowPaths.length,
  );
  const normalizedVariance = safeDivide(flowVariance, avgFlow * avgFlow);

  // Detect layout patterns with dynamic thresholds
  const sortedFlows = [...flowPaths].sort((a, b) => a - b);

  // Check for symmetric pattern
  const flowDeviations = flowPaths.map((flow) =>
    safeDivide(Math.abs(flow - avgFlow), Math.max(avgFlow, 0.001)),
  );
  const maxFlowDiff = Math.max(...flowDeviations);
  const symmetricThreshold = clamp(
    Config.SYMMETRIC.DEFAULT * (1 + complexity.overallComplexity),
    Config.SYMMETRIC.MIN,
    Config.SYMMETRIC.MAX,
  );
  const isSymmetric = maxFlowDiff < symmetricThreshold;

  // Check for progressive pattern
  const normalizedDiffs = sortedFlows
    .slice(1)
    .map((flow, i) =>
      safeDivide(flow - sortedFlows[i]!, Math.max(maxFlow, 0.001)),
    );

  const avgNormalizedDiff = safeDivide(
    normalizedDiffs.reduce((sum, diff) => sum + diff, 0),
    Math.max(normalizedDiffs.length, 1),
  );

  const diffVariation =
    normalizedDiffs.length > 0
      ? Math.max(
          0,
          ...normalizedDiffs.map((diff) =>
            safeDivide(
              Math.abs(diff - avgNormalizedDiff),
              Math.max(avgNormalizedDiff, 0.001),
            ),
          ),
        )
      : 0;

  const progressiveThreshold = clamp(
    Config.PROGRESSIVE.DEFAULT * (1 + complexity.overallComplexity),
    Config.PROGRESSIVE.MIN,
    Config.PROGRESSIVE.MAX,
  );

  const isProgressive =
    flowPaths.length <= 2 ||
    (avgNormalizedDiff > 0 &&
      avgNormalizedDiff < progressiveThreshold &&
      diffVariation < 0.5);

  // Calculate penalties
  let rangePenalty = 0;
  let variancePenalty = 0;

  if (maxFlow > 0) {
    const relativeRange = safeDivide(maxFlow - minFlow, maxFlow);
    const complexityFactor = 1 + complexity.overallComplexity * 0.3;

    if (isSymmetric) {
      // Very low penalties for symmetric layouts
      rangePenalty = 20 * Math.pow(relativeRange, 1.2) * complexityFactor;
      variancePenalty =
        25 * Math.pow(normalizedVariance, 1.2) * complexityFactor;
    } else if (isProgressive) {
      // Low penalties for progressive layouts
      const progressiveQuality = clamp(1 - diffVariation, 0, 1);
      rangePenalty =
        35 *
        Math.pow(relativeRange, 1.2) *
        complexityFactor *
        (1 - progressiveQuality * 0.6);
      variancePenalty =
        45 *
        Math.pow(normalizedVariance, 1.2) *
        complexityFactor *
        (1 - progressiveQuality * 0.6);
    } else {
      // Standard penalties for other layouts
      rangePenalty = 90 * Math.pow(relativeRange, 1.5) * complexityFactor;
      variancePenalty =
        110 * Math.pow(normalizedVariance, 1.5) * complexityFactor;
    }

    // Apply pattern-based reductions
    if (isSymmetric) {
      const reductionFactor = clamp(
        0.15 * (1 + complexity.overallComplexity),
        0.1,
        0.25,
      );
      rangePenalty *= reductionFactor;
      variancePenalty *= reductionFactor;
    } else if (isProgressive) {
      const progressiveQuality = clamp(1 - diffVariation, 0, 1);
      const reductionFactor = clamp(
        0.25 + 0.5 * progressiveQuality * (1 - complexity.overallComplexity),
        0.2,
        0.5,
      );
      rangePenalty *= reductionFactor;
      variancePenalty *= reductionFactor;
    }
  }

  // Calculate component scores
  const flowPathBalance = clamp(100 - rangePenalty - variancePenalty, 0, 100);

  // Calculate surface area balance
  const surfaceAreas = products.map((p) => p.cadData?.surfaceArea ?? 0);
  const avgArea = safeDivide(
    surfaceAreas.reduce((a, b) => a + b, 0),
    surfaceAreas.length,
  );
  const areaDeviations = surfaceAreas.map((area) =>
    safeDivide(Math.abs(area - avgArea), Math.max(avgArea, 0.001)),
  );
  const maxAreaDev = Math.max(...areaDeviations);
  const surfaceAreaBalance = clamp(100 * (1 - maxAreaDev / 2), 0, 100);

  // Calculate volume balance
  const volumes = products.map((p) => p.cadData?.volume ?? 0);
  const avgVolume = safeDivide(
    volumes.reduce((a, b) => a + b, 0),
    volumes.length,
  );
  const volumeDeviations = volumes.map((vol) =>
    safeDivide(Math.abs(vol - avgVolume), Math.max(avgVolume, 0.001)),
  );
  const maxVolDev = Math.max(...volumeDeviations);
  const volumeBalance = clamp(100 * (1 - maxVolDev / 2), 0, 100);

  // Calculate weights with complexity adjustment
  const weights = {
    flowPathBalance: clamp(
      Config.WEIGHTS.FLOW_PATH.DEFAULT + complexity.overallComplexity * 0.1,
      Config.WEIGHTS.FLOW_PATH.MIN,
      Config.WEIGHTS.FLOW_PATH.MAX,
    ),
    surfaceAreaBalance: clamp(
      Config.WEIGHTS.SURFACE_AREA.DEFAULT - complexity.overallComplexity * 0.05,
      Config.WEIGHTS.SURFACE_AREA.MIN,
      Config.WEIGHTS.SURFACE_AREA.MAX,
    ),
    volumeBalance: clamp(
      Config.WEIGHTS.VOLUME.DEFAULT - complexity.overallComplexity * 0.05,
      Config.WEIGHTS.VOLUME.MIN,
      Config.WEIGHTS.VOLUME.MAX,
    ),
  };

  // Normalize weights
  const totalWeight =
    weights.flowPathBalance +
    weights.surfaceAreaBalance +
    weights.volumeBalance;
  weights.flowPathBalance = safeDivide(weights.flowPathBalance, totalWeight);
  weights.surfaceAreaBalance = safeDivide(
    weights.surfaceAreaBalance,
    totalWeight,
  );
  weights.volumeBalance = safeDivide(weights.volumeBalance, totalWeight);

  // Calculate weighted score
  const weightedScore =
    weights.flowPathBalance * flowPathBalance +
    weights.surfaceAreaBalance * surfaceAreaBalance +
    weights.volumeBalance * volumeBalance;

  let finalScore = clamp(weightedScore, 0, 100);

  // Apply pattern-based boost
  if (isSymmetric && finalScore > 70) {
    const boostFactor = clamp(
      1.15 - complexity.overallComplexity * 0.1,
      1.05,
      1.15,
    );
    finalScore = clamp(finalScore * boostFactor, 0, 100);
  } else if (isProgressive && finalScore > 60) {
    const progressiveQuality = clamp(1 - diffVariation, 0, 1);
    const boostFactor = clamp(
      1.1 + 0.1 * progressiveQuality * (1 - complexity.overallComplexity),
      1.05,
      1.2,
    );
    finalScore = clamp(finalScore * boostFactor, 0, 100);
  }

  return {
    flowPathBalance,
    surfaceAreaBalance,
    overall: finalScore,
  };
}
