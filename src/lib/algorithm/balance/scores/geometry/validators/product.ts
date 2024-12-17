import type { Product } from '@/types/domain/product';
import type { ValidationResult } from '@/types/algorithm/balance/geometry';
import type { GeometryScoreConfig } from '../config';

export class ProductValidator {
  constructor(private config: GeometryScoreConfig) {}

  validate(product: Product): ValidationResult {
    // 基本属性检查
    if (!product) {
      return { valid: false, reason: 'Product is null or undefined' };
    }

    // 检查dimensions
    if (!product.dimensions) {
      return { valid: false, reason: 'Missing dimensions' };
    }

    const { length, width, height } = product.dimensions;
    if (!this.isValidDimension(length)) {
      return { valid: false, reason: 'Invalid length' };
    }
    if (!this.isValidDimension(width)) {
      return { valid: false, reason: 'Invalid width' };
    }
    if (!this.isValidDimension(height)) {
      return { valid: false, reason: 'Invalid height' };
    }

    // 检查CAD数据
    if (!product.cadData) {
      return { valid: false, reason: 'Missing CAD data' };
    }

    const result = this.validateVolume(product);
    if (!result.valid) {
      return result;
    }

    // 检查数据一致性
    const calculatedVolume = length * width * height;
    if (!this.areNumbersConsistent(product.cadData.volume, calculatedVolume)) {
      return { valid: false, reason: 'Inconsistent volume data' };
    }

    return { valid: true };
  }

  private validateVolume(product: Product): ValidationResult {
    const volume = product.cadData?.volume;
    
    // 检查体积是否存在且为正数
    if (volume === undefined || volume === null) {
      return { valid: false, reason: 'Missing volume' };
    }
    
    if (volume <= 0) {
      return { valid: false, reason: 'Invalid volume' };
    }
    
    // 检查体积是否在合理范围内
    // 使用维度的乘积作为参考值
    if (product.dimensions) {
      const { length, width, height } = product.dimensions;
      const computedVolume = length * width * height;
      const ratio = volume / computedVolume;
      
      // 允许一定的误差范围
      if (ratio < 0.5 || ratio > 2.0) {
        return { valid: false, reason: 'Volume inconsistent with dimensions' };
      }
    }
    
    return { valid: true };
  }

  private isValidDimension(value: number): boolean {
    return typeof value === 'number' && 
           isFinite(value) && 
           value > 0 &&
           value < Number.MAX_SAFE_INTEGER;
  }

  private isValidNumber(value: number): boolean {
    return typeof value === 'number' && 
           isFinite(value) && 
           value >= 0 &&
           value < Number.MAX_SAFE_INTEGER;
  }

  private areNumbersConsistent(a: number, b: number): boolean {
    const tolerance = Math.max(
      Math.abs(a) * this.config.tolerance.ratio,
      this.config.tolerance.minimum
    );
    return Math.abs(a - b) <= tolerance;
  }
}
