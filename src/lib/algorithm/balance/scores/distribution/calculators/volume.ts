import type { Rectangle } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";

interface VolumeResult {
  score: number;
  details: {
    densityVariance: number;
    heightBalance: number;
    massDistribution: number;
    symmetry: number;
  };
}

export class VolumeCalculator {
  constructor() {
    this.calculate = this.calculate.bind(this);
  }

  calculate(
    layout: Record<number, Rectangle>,
    products: Product[],
  ): VolumeResult {
    // Handle empty or single product case
    if (products.length <= 1) {
      return {
        score: 100,
        details: {
          densityVariance: 100,
          heightBalance: 100,
          massDistribution: 100,
          symmetry: 100,
        },
      };
    }

    // Calculate volume metrics
    const volumes = products.map((p) =>
      p.dimensions
        ? p.dimensions.width * p.dimensions.length * p.dimensions.height
        : 0,
    );
    const totalVolume = volumes.reduce((sum, v) => sum + v, 0);
    const avgVolume = totalVolume / products.length;

    // Calculate volume variance with moderate scoring
    const volumeVariance =
      volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) /
      products.length;
    const normalizedVariance = Math.max(
      0,
      Math.min(100, 100 - (volumeVariance / (avgVolume * avgVolume)) * 120),
    );

    // Calculate height balance with moderate scoring
    const heights = products.map((p) => p.dimensions?.height ?? 0);
    const maxHeight = Math.max(...heights);
    const heightVariance =
      heights.reduce((sum, h) => sum + Math.pow(h - maxHeight, 2), 0) /
      products.length;
    const heightBalance = Math.max(
      0,
      Math.min(100, 100 - (heightVariance / (maxHeight * maxHeight)) * 120),
    );

    // Calculate mass distribution with moderate scoring
    const masses = products.map((p) => p.weight ?? 1);
    const totalMass = masses.reduce((sum, m) => sum + m, 0);
    const avgMass = totalMass / products.length;
    const massVariance =
      masses.reduce((sum, m) => sum + Math.pow(m - avgMass, 2), 0) /
      products.length;
    const massDistribution = Math.max(
      0,
      Math.min(100, 100 - (massVariance / (avgMass * avgMass)) * 120),
    );

    // Calculate symmetry with moderate scoring
    const symmetryScore = this.calculateSymmetry(layout);

    // Adjust weights to be more balanced
    const weights = {
      densityVariance: 0.35,
      heightBalance: 0.15,
      massDistribution: 0.35,
      symmetry: 0.15,
    };

    const details = {
      densityVariance: normalizedVariance,
      heightBalance,
      massDistribution,
      symmetry: symmetryScore,
    };

    const score = Object.entries(weights).reduce(
      (sum, [key, weight]) =>
        sum + details[key as keyof typeof details] * weight,
      0,
    );

    // Apply moderate penalty
    return {
      score: Math.min(100, score * 0.95),
      details,
    };
  }

  private calculateSymmetry(layout: Record<number, Rectangle>): number {
    const rectangles = Object.values(layout);
    if (rectangles.length <= 1) return 100;

    // Find center and bounds
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    rectangles.forEach((rect) => {
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.length);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const layoutWidth = maxX - minX;
    const layoutLength = maxY - minY;
    const maxRadius =
      Math.sqrt(layoutWidth * layoutWidth + layoutLength * layoutLength) / 2;

    // Calculate axial symmetry with improved base calculation
    let axialAsymmetry = 0;
    rectangles.forEach((rect1) => {
      const axes = [
        { flip: (x: number, y: number) => [2 * centerX - x, y] },
        { flip: (x: number, y: number) => [x, 2 * centerY - y] },
      ];

      const rect1Center = {
        x: rect1.x + rect1.width / 2,
        y: rect1.y + rect1.length / 2,
      };

      const rect1Area = rect1.width * rect1.length;

      axes.forEach((axis) => {
        const [mirrorX, mirrorY] = axis.flip(rect1Center.x, rect1Center.y);
        let minAsymmetry = Infinity;

        rectangles.forEach((rect2) => {
          if (rect2 === rect1) return;

          const rect2Center = {
            x: rect2.x + rect2.width / 2,
            y: rect2.y + rect2.length / 2,
          };

          const rect2Area = rect2.width * rect2.length;

          // Calculate normalized distance
          const dist = Math.sqrt(
            Math.pow(rect2Center.x - (mirrorX ?? 0), 2) +
              Math.pow(rect2Center.y - (mirrorY ?? 0), 2),
          );
          const normalizedDist = dist / maxRadius;

          // Calculate relative size difference
          const avgArea = (rect1Area + rect2Area) / 2;
          const sizeDiff = Math.abs(rect1Area - rect2Area) / avgArea;

          // Calculate relative position in layout
          const rect1Radius =
            Math.sqrt(
              Math.pow(rect1Center.x - centerX, 2) +
                Math.pow(rect1Center.y - centerY, 2),
            ) / maxRadius;
          const rect2Radius =
            Math.sqrt(
              Math.pow(rect2Center.x - centerX, 2) +
                Math.pow(rect2Center.y - centerY, 2),
            ) / maxRadius;

          // Dynamic weight based on position and size
          const positionWeight = Math.min(
            0.9,
            Math.max(0.7, 1 - Math.abs(rect1Radius - rect2Radius)),
          );

          // Adjust size difference based on radial position
          const adjustedSizeDiff =
            sizeDiff * Math.min(1, Math.abs(rect1Radius - rect2Radius) * 1.2);

          // Combined asymmetry calculation with adjusted size difference
          const asymmetry =
            Math.min(
              normalizedDist * positionWeight +
                adjustedSizeDiff * (1 - positionWeight),
              Math.sqrt(normalizedDist * adjustedSizeDiff), // Geometric mean of differences
            ) * 0.95; // Slight overall reduction in asymmetry

          minAsymmetry = Math.min(minAsymmetry, asymmetry);
        });

        axialAsymmetry += minAsymmetry;
      });
    });

    // Normalize axial asymmetry with improved scaling
    const axialScore =
      100 * Math.pow(1 - axialAsymmetry / (2 * rectangles.length), 0.8);

    // Calculate radial distribution with improved normalization
    const angles = rectangles.map((rect) => {
      const x = rect.x + rect.width / 2 - centerX;
      const y = rect.y + rect.length / 2 - centerY;
      return Math.atan2(y, x);
    });

    // Calculate angular spacing score with improved normalization
    angles.sort((a, b) => a - b);
    const idealGap = (2 * Math.PI) / rectangles.length;
    let angleVariance = 0;

    for (let i = 0; i < angles.length; i++) {
      const j = (i + 1) % angles.length;
      const currentAngle = angles[i] ?? 0;
      const nextAngle = angles[j] ?? 0;
      let gap = nextAngle - currentAngle;
      if (gap < 0) gap += 2 * Math.PI;

      // Normalize gap difference with improved scaling
      const normalizedGapDiff = Math.abs(gap - idealGap) / Math.PI;
      angleVariance += Math.pow(normalizedGapDiff, 1.5); // Reduced penalty for small deviations
    }

    const radialScore =
      100 * Math.pow(1 - Math.sqrt(angleVariance / rectangles.length), 1.2);

    // Calculate distance distribution with improved normalization
    let distanceVariance = 0;
    const distances = rectangles.map((rect) => {
      const x = rect.x + rect.width / 2 - centerX;
      const y = rect.y + rect.length / 2 - centerY;
      return Math.sqrt(x * x + y * y);
    });

    const avgDistance =
      distances.reduce((sum, d) => sum + d, 0) / distances.length;
    distances.forEach((distance) => {
      const normalizedDeviation = Math.abs(distance - avgDistance) / maxRadius;
      distanceVariance += Math.pow(normalizedDeviation, 1.5); // Reduced penalty for small deviations
    });

    const distanceScore =
      100 * Math.pow(1 - Math.sqrt(distanceVariance / rectangles.length), 1.2);

    // Combine scores with balanced weights and improved scaling
    const finalScore =
      Math.pow(axialScore, 1.2) * 0.4 + // Increased weight for axial symmetry
      Math.pow(radialScore, 1.1) * 0.35 + // Slightly increased radial importance
      Math.pow(distanceScore, 1.0) * 0.25; // Maintained distance weight

    return Math.max(0, Math.min(100, finalScore));
  }

  private checkVerticalAlignment(rectangles: Rectangle[]): {
    isVerticallyAligned: boolean;
    verticalQuality: number;
  } {
    const xPositions = rectangles.map((r) => r.x + r.width / 2);
    const uniquePositions = new Set(xPositions);
    const isVerticallyAligned = uniquePositions.size <= rectangles.length / 2;

    if (!isVerticallyAligned) {
      return { isVerticallyAligned: false, verticalQuality: 0 };
    }

    // Calculate alignment quality based on position variance
    const positions = Array.from(uniquePositions);
    const avgSpacing =
      positions.reduce(
        (sum, pos, i, arr) =>
          i > 0 ? sum + Math.abs(pos - (arr[i - 1] ?? pos)) : sum,
        0,
      ) /
      (positions.length - 1);

    const spacingVariance =
      positions.reduce(
        (sum, pos, i, arr) =>
          i > 0
            ? sum +
              Math.pow(Math.abs(pos - (arr[i - 1] ?? pos)) - avgSpacing, 2)
            : sum,
        0,
      ) /
      (positions.length - 1);

    const verticalQuality =
      1 - Math.min(1, spacingVariance / (avgSpacing * avgSpacing));

    return { isVerticallyAligned, verticalQuality };
  }

  private checkHorizontalAlignment(rectangles: Rectangle[]): {
    isHorizontallyAligned: boolean;
    horizontalQuality: number;
  } {
    const yPositions = rectangles.map((r) => r.y + r.length / 2);
    const uniquePositions = new Set(yPositions);
    const isHorizontallyAligned = uniquePositions.size <= rectangles.length / 2;

    if (!isHorizontallyAligned) {
      return { isHorizontallyAligned: false, horizontalQuality: 0 };
    }

    // Calculate alignment quality based on position variance
    const positions = Array.from(uniquePositions);
    const avgSpacing =
      positions.reduce(
        (sum, pos, i, arr) =>
          i > 0 ? sum + Math.abs(pos - (arr[i - 1] ?? pos)) : sum,
        0,
      ) /
      (positions.length - 1);

    const spacingVariance =
      positions.reduce(
        (sum, pos, i, arr) =>
          i > 0
            ? sum +
              Math.pow(Math.abs(pos - (arr[i - 1] ?? pos)) - avgSpacing, 2)
            : sum,
        0,
      ) /
      (positions.length - 1);

    const horizontalQuality =
      1 - Math.min(1, spacingVariance / (avgSpacing * avgSpacing));

    return { isHorizontallyAligned, horizontalQuality };
  }

  private checkSizeGradient(rectangles: Rectangle[]): {
    isGradient: boolean;
    gradientQuality: number;
  } {
    const areas = rectangles
      .map((r) => r.width * r.length)
      .sort((a, b) => b - a);
    let totalRatio = 0;
    let validSteps = 0;

    for (let i = 1; i < areas.length; i++) {
      const currentArea = areas[i] ?? 0;
      const previousArea = areas[i - 1] ?? 0;
      const ratio = currentArea / previousArea;
      if (ratio >= 0.3 && ratio <= 0.9) {
        totalRatio += ratio;
        validSteps++;
      }
    }

    const isGradient = validSteps === areas.length - 1;

    // Improved gradient quality calculation
    let gradientQuality = 0;
    if (isGradient) {
      const avgRatio = totalRatio / validSteps;
      // Prefer ratios closer to 0.6 (ideal gradient)
      gradientQuality = 1 - Math.abs(avgRatio - 0.6) / 0.3;
    }

    return { isGradient, gradientQuality };
  }

  private checkHierarchicalLevels(rectangles: Rectangle[]): {
    isHierarchical: boolean;
    hierarchyQuality: number;
  } {
    const yPositions = Array.from(new Set(rectangles.map((r) => r.y)));
    const levelCount = yPositions.length;
    const isHierarchical =
      levelCount >= 2 && levelCount <= rectangles.length / 2;

    if (!isHierarchical) {
      return { isHierarchical: false, hierarchyQuality: 0 };
    }

    // Calculate level balance with improved metrics
    yPositions.sort((a, b) => a - b);
    const levelSizes = yPositions.map(
      (y) => rectangles.filter((r) => r.y === y).length,
    );

    // Calculate level spacing quality
    const levelSpacings = yPositions
      .slice(1)
      .map((y, i) => y - (yPositions[i] ?? y));
    const avgSpacing =
      levelSpacings.reduce((sum, s) => sum + s, 0) / levelSpacings.length;
    const spacingVariance =
      levelSpacings.reduce((sum, s) => sum + Math.pow(s - avgSpacing, 2), 0) /
      levelSpacings.length;
    const spacingQuality =
      1 - Math.min(1, spacingVariance / (avgSpacing * avgSpacing));

    // Calculate size distribution quality
    let sizeQuality = 0;
    for (let i = 1; i < levelSizes.length; i++) {
      const currentSize = levelSizes[i] ?? 0;
      const previousSize = levelSizes[i - 1] ?? 0;
      const ratio = currentSize / previousSize;
      // Prefer ratios between 0.4 and 0.6 (ideal hierarchy)
      if (ratio >= 0.4 && ratio <= 0.6) {
        sizeQuality++;
      }
    }
    sizeQuality /= levelSizes.length - 1;

    // Combine spacing and size quality
    const hierarchyQuality = spacingQuality * 0.4 + sizeQuality * 0.6;

    return { isHierarchical, hierarchyQuality };
  }
}
