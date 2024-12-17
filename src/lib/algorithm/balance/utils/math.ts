/**
 * Calculate weighted variance for a set of values and their weights
 * 计算加权方差
 */
export function calculateWeightedVariance(
  values: number[],
  weights: number[],
): number {
  if (!values.length || !weights.length) return 0;

  if (values.length !== weights.length) {
    throw new Error("Values and weights arrays must be of the same length.");
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  const weightedMean =
    values.reduce((sum, v, i) => sum + v * weights[i]!, 0) / totalWeight;

  return (
    values.reduce(
      (sum, v, i) => sum + weights[i]! * Math.pow(v - weightedMean, 2),
      0,
    ) / totalWeight
  );
}

/**
 * Calculate weighted mean for a set of values and their weights
 * 计算加权平均值
 */
export function calculateWeightedMean(
  values: number[],
  weights: number[],
): number {
  if (!values.length || !weights.length) return 0;

  if (values.length !== weights.length) {
    throw new Error("Values and weights arrays must be of the same length.");
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight === 0) return 0;

  return values.reduce((sum, v, i) => sum + v * weights[i]!, 0) / totalWeight;
}

/**
 * Normalize a value to a given range
 * 将值归一化到指定范围
 * @param value 要归一化的值
 * @param min 最小值
 * @param max 最大值
 * @param invert 是否反转（较小值对应较高分数）
 * @returns 归一化后的值（0-100）
 */
export function normalizeToRange(
  value: number,
  min: number,
  max: number,
  invert = false,
): number {
  if (min === max) return 50; // 当最大值等于最小值时返回中间值

  const normalized = (value - min) / (max - min);
  const score = invert ? 1 - normalized : normalized;
  return Math.max(0, Math.min(100, score * 100));
}

/**
 * Normalize any score to 0-100 range
 * 将任意分数归一化到0-100范围
 * @param score 原始分数
 * @param currentMax 当前最大值（默认为1）
 * @returns 归一化后的分数（0-100）
 */
export function normalizeToHundred(score: number, currentMax = 1): number {
  if (currentMax === 0) return 0;
  return Math.max(0, Math.min(100, (score / currentMax) * 100));
}

/**
 * Convert a 0-100 score back to 0-1 range
 * 将0-100范围的分数转换回0-1范围
 * @param score 0-100范围的分数
 * @returns 0-1范围的分数
 */
export function normalizeToOne(score: number): number {
  return Math.max(0, Math.min(1, score / 100));
}

/**
 * Normalize a score to 0-100 range based on maximum variance
 * 基于最大方差将分数归一化到0-100范围
 * @param value The value to normalize
 * @param maxVariance The maximum acceptable variance (will result in score 0)
 * @returns Normalized score between 0 and 100
 */
export function normalizeScore(value: number, maxVariance = 1000): number {
  const normalized = normalizeToRange(value, 0, maxVariance, true);
  return Math.max(0, Math.min(100, normalized));
}

/**
 * Calculate weighted average of scores
 * 计算加权平均分
 * @param scoreWeightPairs 分数和权重对数组 [[score, weight], ...]
 * @returns 加权平均分（0-100）
 */
export function weightedAverage(scoreWeightPairs: [number, number][]): number {
  if (!scoreWeightPairs.length) return 0;

  const totalWeight = scoreWeightPairs.reduce((sum, [_, w]) => sum + w, 0);
  if (totalWeight === 0) return 0;

  const weightedSum = scoreWeightPairs.reduce(
    (sum, [score, weight]) => sum + normalizeToHundred(score) * weight,
    0,
  );

  return Math.max(0, Math.min(100, weightedSum / totalWeight));
}
