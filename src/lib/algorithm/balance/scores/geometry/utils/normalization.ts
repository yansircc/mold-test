import type { Product } from "@/types/domain/product";
import type { NormalizedProduct } from "@/types/algorithm/balance/geometry";
import type { GeometryScoreConfig } from "../config";
import { defaultConfig } from "../config";

/**
 * 数据归一化处理类
 */
class DataNormalizer {
  constructor(private config: GeometryScoreConfig) {}

  private normalizeDimension(value: number): number {
    // 对极端值使用对数归一化
    if (value <= this.config.tolerance.minimum) {
      return this.config.tolerance.minimum;
    }

    if (value > 1000000) {
      // 使用对数尺度处理大值
      return Math.log10(value) / Math.log10(1000000);
    }

    // 正常范围内的值线性归一化
    return value;
  }

  normalizeProduct(product: Product): NormalizedProduct {
    const { dimensions, cadData } = product;
    if (!dimensions || !cadData) {
      throw new Error("Missing required product data");
    }

    // 对维度进行归一化
    const normalizedDimensions = {
      length: this.normalizeDimension(dimensions.length),
      width: this.normalizeDimension(dimensions.width),
      height: this.normalizeDimension(dimensions.height),
    };

    // 对体积和表面积使用对数归一化
    const normalizedVolume = this.normalizeDimension(cadData.volume);
    const normalizedSurfaceArea = this.normalizeDimension(cadData.surfaceArea);

    return {
      dimensions: normalizedDimensions,
      volume: normalizedVolume,
      surfaceArea: normalizedSurfaceArea,
    };
  }
}

/**
 * 归一化单个产品数据
 * @param product 产品数据
 * @param config 几何评分配置（可选）
 * @returns 归一化后的产品数据
 */
export function normalizeProduct(
  product: Product,
  config: GeometryScoreConfig = defaultConfig,
): NormalizedProduct {
  const normalizer = new DataNormalizer(config);
  return normalizer.normalizeProduct(product);
}

/**
 * 批量归一化产品数据
 * @param products 产品数据数组
 * @param config 几何评分配置（可选）
 * @returns 归一化后的产品数据数组
 */
export function normalizeProducts(
  products: Product[],
  config: GeometryScoreConfig = defaultConfig,
): NormalizedProduct[] {
  const normalizer = new DataNormalizer(config);
  return products.map((p) => normalizer.normalizeProduct(p));
}
