import type { Product } from '@/types/domain/product';
import type { ShapeFeatures, DimensionFeatures, ValidationResult } from '@/types/algorithm/balance/geometry';
import type { GeometryScoreConfig } from '../config';

export interface FeatureExtractor {
  validateProduct(product: Product): ValidationResult;
  extractShapeFeatures(product: Product): ShapeFeatures;
  extractDimensionFeatures(product: Product): DimensionFeatures;
}

export abstract class BaseFeatureExtractor implements FeatureExtractor {
  constructor(protected config: GeometryScoreConfig) {}

  abstract validateProduct(product: Product): ValidationResult;
  abstract extractShapeFeatures(product: Product): ShapeFeatures;
  abstract extractDimensionFeatures(product: Product): DimensionFeatures;

  protected calculateAspectRatio(length: number, width: number): number {
    if (width === 0) return 0;
    return Math.max(length / width, width / length);
  }

  protected isValidDimension(value: number): boolean {
    return typeof value === 'number' && 
           isFinite(value) && 
           value > 0 &&
           value < Number.MAX_SAFE_INTEGER;
  }
}
