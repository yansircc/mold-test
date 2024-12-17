import type { DistributionConfig } from "@/types/algorithm/balance/distribution";

/**
 * Default configuration for distribution balance calculation
 */
export const DistributionBalanceConfig: DistributionConfig = {
  // Symmetry configuration
  symmetric: {
    default: 0.8,
    min: 0.4,
    max: 1.0,
  },

  // Progressive configuration
  progressive: {
    default: 0.7,
    min: 0.5,
    max: 0.9,
  },

  // Physics-based configuration
  physics: {
    inertia: {
      weightFactor: 1.0,
      momentThreshold: 0.1,
    },
    mass: {
      centerTolerance: 0.1,
      balanceWeight: 1.0,
    },
  },

  // Component weights
  weights: {
    symmetry: 0.4,
    balance: 0.3,
    uniformity: 0.3,
  },

  // Penalties for various imbalances
  penalties: {
    asymmetry: 0.3, // Reduced from 0.5
    imbalance: 0.3, // Reduced from 0.5
    nonUniformity: 0.3, // Reduced from 0.5
  },

  // Physical balance parameters
  maxInertiaRadius: 150, // 进一步减小最大惯性半径
  maxCenterDeviation: 0.15, // 进一步减小允许的中心偏差
  gridSize: 8,
  maxDensityVariance: 2.0,
  maxHeightDeviation: 100, // Lowered from 300 to make height balance more sensitive
  minSymmetryScore: 0.7,
  minUniformityScore: 0.6,
};

/**
 * Strict configuration for high-precision requirements
 */
export const StrictDistributionConfig: DistributionConfig = {
  ...DistributionBalanceConfig,
  symmetric: {
    default: 0.9,
    min: 0.7,
    max: 0.25,
  },
  physics: {
    inertia: {
      weightFactor: 0.45,
      momentThreshold: 0.15,
    },
    mass: {
      centerTolerance: 0.08,
      balanceWeight: 0.4,
    },
  },
  penalties: {
    asymmetry: 2.0, // Higher penalty for asymmetry in strict mode
    imbalance: 1.5, // Higher penalty for imbalance in strict mode
    nonUniformity: 1.2, // Higher penalty for non-uniformity in strict mode
  },
};

/**
 * Relaxed configuration for less demanding scenarios
 */
export const RelaxedDistributionConfig: DistributionConfig = {
  ...DistributionBalanceConfig,
  symmetric: {
    default: 0.7,
    min: 0.3,
    max: 0.35,
  },
  physics: {
    inertia: {
      weightFactor: 0.35,
      momentThreshold: 0.25,
    },
    mass: {
      centerTolerance: 0.15,
      balanceWeight: 0.3,
    },
  },
  penalties: {
    asymmetry: 1.2, // Lower penalty for asymmetry in relaxed mode
    imbalance: 0.8, // Lower penalty for imbalance in relaxed mode
    nonUniformity: 0.6, // Lower penalty for non-uniformity in relaxed mode
  },
};

/**
 * Distribution balance configuration
 */
export const VolumeBalanceConfig = {
  // Grid size for density calculation
  gridSize: 10,

  // Maximum allowed density variance (coefficient of variation)
  maxDensityVariance: 0.5,

  // Maximum allowed height deviation from center
  maxHeightDeviation: 0.3,

  // Maximum radius for inertia calculation (relative to layout size)
  maxInertiaRadius: 0.5,

  // Presets for different scenarios
  presets: {
    // Default configuration
    default: {
      densityWeight: 0.4,
      heightWeight: 0.3,
      massWeight: 0.3,
      maxDensityVariance: 0.5,
      maxHeightDeviation: 0.3,
      maxInertiaRadius: 0.5,
    },

    // Strict configuration - higher requirements for balance
    strict: {
      densityWeight: 0.4,
      heightWeight: 0.3,
      massWeight: 0.3,
      maxDensityVariance: 0.3,
      maxHeightDeviation: 0.2,
      maxInertiaRadius: 0.3,
    },

    // Relaxed configuration - lower requirements for balance
    relaxed: {
      densityWeight: 0.4,
      heightWeight: 0.3,
      massWeight: 0.3,
      maxDensityVariance: 0.7,
      maxHeightDeviation: 0.4,
      maxInertiaRadius: 0.7,
    },
  },
} as const;
