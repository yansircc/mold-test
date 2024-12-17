import type { Product } from "@/types/domain/product";
import { calculateMinArea } from "@/lib/algorithm/min-area";

const MIN_VOLUME_UTILIZATION_RATIO = 0.6; // 60% minimum volume utilization ratio

/**
 * Check if a group of products is suitable for grouping based on volume utilization
 * @param products Product list
 * @returns Grouping feasibility check result
 */
export function checkVolumeUtilization(products: Product[]): {
  canGroup: boolean;
  utilizationRatio: number;
  message?: string;
} {
  if (!products || products.length === 0) {
    return {
      canGroup: false,
      utilizationRatio: 0,
      message: "没有产品可供分组",
    };
  }

  // Check if all products have complete dimension information
  if (
    !products.every(
      (p) =>
        p.dimensions?.length && p.dimensions?.width && p.dimensions?.height,
    )
  ) {
    return {
      canGroup: false,
      utilizationRatio: 0,
      message: "产品尺寸信息不完整",
    };
  }

  // Calculate minimum area using MinArea algorithm
  const minArea = calculateMinArea(
    products.map((p) => ({
      width: p.dimensions?.width ?? 0,
      length: p.dimensions?.length ?? 0,
    })),
  );

  // Find maximum height
  const maxHeight = Math.max(...products.map((p) => p.dimensions!.height));

  // Calculate total product volume (sum of individual product volumes)
  const totalProductVolume = products.reduce((sum, product) => {
    const { length, width, height } = product.dimensions!;
    const volume = length * width * height;
    return sum + volume;
  }, 0);

  // Calculate minimum bounding box volume using the optimized area from MinArea
  const boundingVolume = minArea.area * maxHeight;

  // Calculate volume utilization ratio
  const utilizationRatio = totalProductVolume / boundingVolume;

  // Format the ratio as a percentage with 1 decimal place
  const utilizationPercentage = (utilizationRatio * 100).toFixed(1);

  return {
    canGroup: utilizationRatio >= MIN_VOLUME_UTILIZATION_RATIO,
    utilizationRatio,
    message:
      utilizationRatio < MIN_VOLUME_UTILIZATION_RATIO
        ? `体积利用率(${utilizationPercentage}%)过低，不建议分组`
        : `体积利用率(${utilizationPercentage}%)符合要求`,
  };
}
