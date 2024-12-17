import type { Point2D } from "@/types/core/geometry";

/**
 * Symmetry axis representation
 */
interface SymmetryAxis {
  angle: number; // Angle in radians
  quality: number; // Quality score (0-1)
  origin: Point2D; // Point the axis passes through
}

/**
 * Configuration for symmetry analysis
 */
export interface SymmetryConfig {
  /** Minimum quality threshold for accepting a symmetry axis (0-1) */
  minQualityThreshold: number;
  /** Distance decay factor for quality calculation */
  distanceDecayFactor: number;
}

const DEFAULT_CONFIG: SymmetryConfig = {
  minQualityThreshold: 0.35,
  distanceDecayFactor: 100,
};

/**
 * Utility class for symmetry analysis
 */
export class SymmetryAnalyzer {
  private config: SymmetryConfig;

  constructor(config: Partial<SymmetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Find potential symmetry axes for a set of points
   * @param points Array of 2D points to analyze
   * @param weights Optional weights for each point
   * @returns Array of detected symmetry axes
   */
  findSymmetryAxes(points: Point2D[], weights?: number[]): SymmetryAxis[] {
    if (points.length < 2) {
      return [];
    }

    // Calculate weighted centroid
    const centroid = this.calculateWeightedCentroid(points, weights);

    // Only check vertical and horizontal axes
    const axes = [
      {
        angle: 0, // Vertical axis
        origin: centroid,
        quality: this.evaluateSymmetryQuality(points, weights, 0, centroid),
      },
      {
        angle: Math.PI / 2, // Horizontal axis
        origin: centroid,
        quality: this.evaluateSymmetryQuality(
          points,
          weights,
          Math.PI / 2,
          centroid,
        ),
      },
    ];

    // Filter by quality threshold
    return axes.filter(
      (axis) => axis.quality > this.config.minQualityThreshold,
    );
  }

  /**
   * Calculate weighted centroid of points
   * @private
   */
  private calculateWeightedCentroid(
    points: Point2D[],
    weights?: number[],
  ): Point2D {
    const defaultWeight = 1 / points.length;
    let totalWeight = 0;
    let sumX = 0;
    let sumY = 0;

    points.forEach((point, i) => {
      const weight = weights?.[i] ?? defaultWeight;
      sumX += point.x * weight;
      sumY += point.y * weight;
      totalWeight += weight;
    });

    return {
      x: sumX / totalWeight,
      y: sumY / totalWeight,
    };
  }

  /**
   * Evaluate symmetry quality for a given axis
   * @private
   */
  private evaluateSymmetryQuality(
    points: Point2D[],
    weights: number[] | undefined,
    angle: number,
    origin: Point2D,
  ): number {
    if (points.length === 0) return 0;

    const defaultWeight = 1 / points.length;
    let totalQuality = 0;
    let totalWeight = 0;

    // For each point, find closest reflected point
    points.forEach((point, i) => {
      const weight = weights?.[i] ?? defaultWeight;
      const reflected = this.reflectPoint(point, angle, origin);

      // Find closest point to reflection
      let minDistance = Infinity;
      points.forEach((other, j) => {
        if (i !== j) {
          // Don't compare with self
          const dist = this.pointDistance(reflected, other);
          minDistance = Math.min(minDistance, dist);
        }
      });

      // Convert distance to quality score (0-1)
      const quality = Math.exp(-minDistance / this.config.distanceDecayFactor);
      totalQuality += quality * weight;
      totalWeight += weight;
    });

    return totalQuality / totalWeight;
  }

  /**
   * Reflect a point across an axis
   * @private
   */
  private reflectPoint(
    point: Point2D,
    angle: number,
    origin: Point2D,
  ): Point2D {
    // Translate to origin
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;

    // Rotate to align axis with x-axis
    const cos = Math.cos(-angle);
    const sin = Math.sin(-angle);
    const rx = dx * cos - dy * sin;
    const ry = dx * sin + dy * cos;

    // Reflect across x-axis
    const reflectedRy = -ry;

    // Rotate back and translate
    return {
      x: rx * cos - reflectedRy * sin + origin.x,
      y: rx * sin + reflectedRy * cos + origin.y,
    };
  }

  /**
   * Calculate distance between two points
   * @private
   */
  private pointDistance(p1: Point2D, p2: Point2D): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
