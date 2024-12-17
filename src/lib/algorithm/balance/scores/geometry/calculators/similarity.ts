import type { GeometryScoreConfig } from '../config';
import type { 
  ShapeFeatures, 
  DimensionFeatures, 
  ShapeScore, 
  DimensionScore, 
  NormalizedProduct 
} from '@/types/algorithm/balance/geometry';
import { areNumbersEqual, applyNonlinearMapping } from '../utils/math';

export class SimilarityCalculator {
  constructor(private config: GeometryScoreConfig) {}

  /**
   * 计算形状相似度分数
   * @param products 归一化产品列表
   * @returns 形状评分对象
   */
  calculateShapeScore(products: NormalizedProduct[]): ShapeScore {
    // 计算形状相似度矩阵
    const similarities = this.calculateShapeSimilarityMatrix(products);
    const avgSimilarity = this.calculateMatrixAverage(similarities);
    const baseScore = applyNonlinearMapping(avgSimilarity, this.config.curves.basePenaltyExponent, this.config);
    
    // 将分数归一化到0-100范围
    const normalizedScore = Math.round(baseScore * 100);
    
    return {
      aspectRatio: normalizedScore,
      symmetry: normalizedScore,
      complexity: normalizedScore,
      uniformity: normalizedScore
    };
  }

  /**
   * 计算尺寸相似度分数
   * @param products 归一化产品列表
   * @returns 尺寸评分对象
   */
  calculateDimensionScore(products: NormalizedProduct[]): DimensionScore {
    const features = products.map(p => this.extractDimensionFeatures(p));
    
    // 计算尺寸变化
    const sizeVariation = this.calculateSizeVariation(features);
    
    // 计算比例一致性
    const scaleRatio = this.calculateScaleRatio(features);
    
    // 计算整体一致性
    const consistency = this.calculateConsistency(features);

    // 对于高度相似的情况（所有分数都很高），给予额外奖励
    let finalConsistency = consistency;
    if (sizeVariation > 90 && scaleRatio > 90) {
      // 如果基础一致性已经很高，进一步提升
      if (consistency > 90) {
        finalConsistency = Math.min(100, consistency + (100 - consistency) * 0.8);
      }
    }

    return {
      sizeVariation,
      scaleRatio,
      consistency: finalConsistency
    };
  }

  /**
   * 计算形状相似度矩阵
   */
  private calculateShapeSimilarityMatrix(products: NormalizedProduct[]): number[][] {
    const n = products.length;
    // 使用类型安全的方式初始化矩阵
    const matrix: number[][] = Array.from({ length: n }, 
      () => Array.from({ length: n }, () => 0)
    );
    
    for (let i = 0; i < n; i++) {
      const row = matrix[i];
      if (!row) continue;  // 类型保护
      
      for (let j = 0; j < n; j++) {
        if (i === j) {
          row[j] = 1;  // 自身相似度为1
        } else if (i < j) {
          const p1 = products[i];
          const p2 = products[j];
          
          const similarity = this.compareShapeFeatures(
            this.extractShapeFeatures(p1),
            this.extractShapeFeatures(p2)
          );
          row[j] = similarity;
          
          // 对称性
          const otherRow = matrix[j];
          if (otherRow) {
            otherRow[i] = similarity;
          }
        }
      }
    }
    
    return matrix;
  }

  /**
   * 计算尺寸相似度矩阵
   */
  private calculateDimensionSimilarityMatrix(products: NormalizedProduct[]): number[][] {
    const n = products.length;
    // 使用类型安全的方式初始化矩阵
    const matrix: number[][] = Array.from({ length: n }, 
      () => Array.from({ length: n }, () => 0)
    );
    
    for (let i = 0; i < n; i++) {
      const row = matrix[i];
      if (!row) continue;  // 类型保护
      
      for (let j = 0; j < n; j++) {
        if (i === j) {
          row[j] = 1;  // 自身相似度为1
        } else if (i < j) {
          const p1 = products[i];
          const p2 = products[j];
          
          const similarity = this.compareDimensionFeatures(
            this.extractDimensionFeatures(p1),
            this.extractDimensionFeatures(p2)
          );
          row[j] = similarity;
          
          // 对称性
          const otherRow = matrix[j];
          if (otherRow) {
            otherRow[i] = similarity;
          }
        }
      }
    }
    
    return matrix;
  }

  private extractShapeFeatures(product: NormalizedProduct | undefined): ShapeFeatures {
    const { dimensions, volume } = product ?? {};
    if (!dimensions || !volume) {
      return {
        aspectRatio: 1,
        volume: 0,
        surfaceArea: 0
      };
    }

    const { length, width, height } = dimensions;
    return {
      aspectRatio: Math.max(length, width) / Math.min(length, width),
      volume,
      surfaceArea: 2 * (length * width + length * height + width * height)
    };
  }

  private extractDimensionFeatures(product: NormalizedProduct | undefined): DimensionFeatures {
    const { dimensions } = product ?? {};
    if (!dimensions) {
      return {
        length: 0,
        width: 0,
        height: 0,
        ratios: {
          lengthWidth: 1,
          lengthHeight: 1,
          widthHeight: 1
        }
      };
    }

    const { length, width, height } = dimensions;
    return {
      length,
      width,
      height,
      ratios: {
        lengthWidth: length / width,
        lengthHeight: length / height,
        widthHeight: width / height
      }
    };
  }

  /**
   * 计算两个特征之间的形状相似度
   * @param a 第一个形状特征
   * @param b 第二个形状特征
   * @returns 0-1之间的相似度值
   */
  compareShapeFeatures(a: ShapeFeatures, b: ShapeFeatures): number {
    // 计算长宽比相似度
    const aspectRatioA = a.aspectRatio;
    const aspectRatioB = b.aspectRatio;
    
    // 使用最小值除以最大值计算基础相似度
    const aspectRatioScore = Math.min(aspectRatioA, aspectRatioB) / Math.max(aspectRatioA, aspectRatioB);

    // 计算长宽比的差异和极端程度
    const aspectRatioDiff = Math.abs(aspectRatioA - aspectRatioB);
    const maxAspectRatio = Math.max(aspectRatioA, aspectRatioB);

    // 极端长宽比的严格惩罚
    if (maxAspectRatio > 3) {  // 任一产品长宽比超过3
      const extremeRatioPenalty = Math.pow(maxAspectRatio / 3, 2);
      const diffPenalty = Math.pow(aspectRatioDiff + 1, 1.5);
      return Math.min(0.25, 1 / (extremeRatioPenalty * diffPenalty));
    }

    // 长宽比差异的渐进惩罚
    if (aspectRatioDiff > 1.5) {  // 差异超过1.5倍
      const diffPenalty = Math.pow(aspectRatioDiff / 1.5, 2);
      return Math.min(0.35, 1 / (diffPenalty * 2));
    }

    // 计算体积相似度
    const volumeScore = this.calculateRatioSimilarity(a.volume, b.volume);
    
    // 计算表面积相似度
    const areaScore = this.calculateRatioSimilarity(a.surfaceArea, b.surfaceArea);

    // 使用配置的权重计算加权平均
    const { aspectRatioWeight, shapeWeight } = this.config.similarity;
    const remainingWeight = 1 - aspectRatioWeight - shapeWeight;

    // 对正常情况使用加权平均
    const weightedScore = (
      aspectRatioScore * (aspectRatioWeight * 2.5) +   // 显著增加长宽比权重
      volumeScore * (shapeWeight * 0.5) +              // 降低体积权重
      areaScore * (remainingWeight * 0.3)              // 最小化面积权重
    ) / (aspectRatioWeight * 2.5 + shapeWeight * 0.5 + remainingWeight * 0.3);

    // 应用非线性映射，使用更严格的惩罚指数
    const mappedScore = applyNonlinearMapping(
      weightedScore,
      this.config.curves.basePenaltyExponent * 1.8,  // 增加基础惩罚强度
      this.config
    );

    // 根据长宽比差异应用额外的惩罚
    const finalPenalty = 1 + (aspectRatioDiff / 4);  // 每0.25的差异增加25%惩罚
    return mappedScore / finalPenalty;
  }

  /**
   * 计算两个特征之间的尺寸相似度
   * @param a 第一个尺寸特征
   * @param b 第二个尺寸特征
   * @returns 0-1之间的相似度值
   */
  compareDimensionFeatures(a: DimensionFeatures, b: DimensionFeatures): number {
    // 计算各个尺寸的相似度
    const lengthScore = this.calculateRatioSimilarity(a.length, b.length);
    const widthScore = this.calculateRatioSimilarity(a.width, b.width);
    const heightScore = this.calculateRatioSimilarity(a.height, b.height);

    // 计算比例的相似度
    const ratioLWScore = this.calculateRatioSimilarity(a.ratios.lengthWidth, b.ratios.lengthWidth);
    const ratioLHScore = this.calculateRatioSimilarity(a.ratios.lengthHeight, b.ratios.lengthHeight);
    const ratioWHScore = this.calculateRatioSimilarity(a.ratios.widthHeight, b.ratios.widthHeight);

    // 如果任何一个比例相似度太低，直接返回低分
    const minRatioScore = Math.min(ratioLWScore, ratioLHScore, ratioWHScore);
    if (minRatioScore < 0.4) {
      return 0.1;
    }

    // 如果所有比例都非常相似，给出高分
    if (minRatioScore > 0.8) {
      return 0.98;
    }

    // 对于一般情况，使用加权平均
    const dimensionScore = (
      lengthScore * 1.2 +
      widthScore * 1.0 +
      heightScore * 0.8
    ) / 3;

    const ratioScore = (
      ratioLWScore * 1.2 +
      ratioLHScore * 0.9 +
      ratioWHScore * 0.9
    ) / 3;

    // 使用配置的权重
    const { dimensionWeight } = this.config.similarity;
    const ratioWeight = 1 - dimensionWeight;

    // 计算最终分数，比例相似度权重更高
    const score = dimensionScore * dimensionWeight + ratioScore * ratioWeight;

    // 应用非线性映射，使用更严格的惩罚指数
    return applyNonlinearMapping(
      score,
      this.config.curves.basePenaltyExponent * 1.2,
      this.config
    );
  }

  private calculateConsistency(features: DimensionFeatures[]): number {
    if (features.length < 2) return 100;

    // 计算每个维度的变异系数
    const dimensions = ['length', 'width', 'height'];
    const cvs = dimensions.map(dim => {
      const values = features.map(f => f[dim as keyof DimensionFeatures] as number);
      return calculateCV(values);
    });

    // 计算平均变异系数
    const avgCV = cvs.reduce((sum, cv) => sum + cv, 0) / cvs.length;

    // 使用更宽松的评分函数
    let score = 100 * Math.exp(-avgCV * 2);  // 降低惩罚系数

    // 对于非常小的变异（CV < 0.1）给予额外奖励
    if (avgCV < 0.1) {
      score = Math.min(100, score + (100 - score) * 0.9);
    }

    return Math.round(score);
  }

  private calculateSizeVariation(features: DimensionFeatures[]): number {
    if (features.length < 2) return 100;

    // 计算每个维度的变异系数
    const dimensions = ['length', 'width', 'height'];
    const cvs = dimensions.map(dim => {
      const values = features.map(f => f[dim as keyof DimensionFeatures] as number);
      return calculateCV(values);
    });

    // 使用最大变异系数作为基准
    const maxCV = Math.max(...cvs);
    
    // 使用指数函数计算分数
    let score = 100 * Math.exp(-maxCV * 2);

    // 对于非常小的变异给予奖励
    if (maxCV < 0.1) {
      score = Math.min(100, score + (100 - score) * 0.8);
    }

    return Math.round(score);
  }

  private calculateScaleRatio(features: DimensionFeatures[]): number {
    if (features.length < 2) return 100;

    // 计算每个产品的尺寸比例
    const ratios = features.map(f => ({
      lengthWidth: f.length / f.width,
      lengthHeight: f.length / f.height,
      widthHeight: f.width / f.height
    }));

    // 计算比例的变异系数
    const ratioVariations = [
      calculateCV(ratios.map(r => r.lengthWidth)),
      calculateCV(ratios.map(r => r.lengthHeight)),
      calculateCV(ratios.map(r => r.widthHeight))
    ];

    // 使用最大变异系数作为基准
    const maxCV = Math.max(...ratioVariations);

    // 使用指数函数计算基础分数
    let score = 100 * Math.exp(-maxCV * 1.5);  // 降低惩罚系数

    // 对于等比例缩放（变异系数很小）给予额外奖励
    if (maxCV < 0.1) {
      score = Math.min(100, score + (100 - score) * 0.95);
    } else if (maxCV < 0.2) {
      score = Math.min(100, score + (100 - score) * 0.7);
    }

    return Math.round(score);
  }

  /**
   * 计算相似度矩阵的平均值
   * @param similarities 相似度矩阵
   * @returns 0-1之间的平均相似度值
   */
  private calculateMatrixAverage(similarities: number[][]): number {
    // 1. 基本验证
    if (!Array.isArray(similarities) || similarities.length === 0) {
      return 1;
    }

    // 2. 计算有效的相似度值
    let sum = 0;
    let count = 0;

    // 只计算上三角矩阵的平均值（不包括对角线）
    for (let i = 0; i < similarities.length; i++) {
      // 确保 similarities[i] 存在且是数组
      const row = similarities[i];
      if (!Array.isArray(row)) continue;

      for (let j = i + 1; j < row.length; j++) {
        // 确保 similarities[i][j] 是有效的数字
        const similarity = row[j];
        if (typeof similarity !== 'number' || isNaN(similarity)) continue;

        sum += similarity;
        count++;
      }
    }

    // 3. 返回平均值，如果没有有效值则返回1
    return count === 0 ? 1 : sum / count;
  }

  /**
   * 计算两个数值的比率相似度
   * @param a 第一个数值
   * @param b 第二个数值
   * @returns 0-1之间的相似度值
   */
  private calculateRatioSimilarity(a: number, b: number): number {
    // 处理边界情况
    if (areNumbersEqual(a, b, this.config.tolerance)) return 1;
    if (a <= 0 || b <= 0) return 0;

    // 计算比率
    const ratio = Math.min(a, b) / Math.max(a, b);
    
    // 使用配置的阈值处理接近完美的情况
    if (ratio > this.config.curves.nearPerfectThreshold) {
      const threshold = this.config.curves.nearPerfectThreshold;
      return threshold + (ratio - threshold) * 10;
    }
    
    // 使用配置的参数进行S型曲线映射
    const { midPointRatio, slopeFactor, basePenaltyExponent } = this.config.curves;
    const x = (ratio - midPointRatio) * slopeFactor;
    const base = 1 / (1 + Math.exp(-x));
    
    // 使用配置的惩罚指数
    return Math.pow(base, basePenaltyExponent);
  }
}

function calculateCV(values: number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
}
