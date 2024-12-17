/**
 * Safe division with fallback value
 */
export const safeDivide = (a: number, b: number, fallback = 0): number => {
  if (!b || !Number.isFinite(b)) return fallback;
  const result = a / b;
  return Number.isFinite(result) ? result : fallback;
};

/**
 * Clamp value between min and max
 */
export const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
};

/**
 * Calculate standard deviation
 */
export const calculateStdDev = (values: number[]): number => {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    values.length;
  return Math.sqrt(variance);
};

/**
 * Calculate coefficient of variation (CV)
 */
export const calculateCV = (values: number[]): number => {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const stdDev = calculateStdDev(values);
  return safeDivide(stdDev, Math.abs(mean));
};

/**
 * Normalize array of values to [0, 1] range
 */
export const normalize = (values: number[]): number[] => {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return values.map(() => 0.5);
  return values.map((v) => safeDivide(v - min, range));
};
