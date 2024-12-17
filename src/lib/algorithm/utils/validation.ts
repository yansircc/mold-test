import { getWeightDiff, getMaxWeightRatio } from "./weight";
import type { Product } from "@/types/domain/product";

interface GroupResult {
  valid: boolean;
  reason?: string;
  weightDiff?: number;
  allowedWeightDiff?: number;
}

// 安全地获取产品重量，如果未定义则返回0
function getSafeWeight(product: Product | null | undefined): number {
  return product?.weight ?? 0;
}

// 安全地获取组的总重量
function getSafeGroupWeight(group: (Product | null | undefined)[]): number {
  return group.reduce((sum, p) => sum + getSafeWeight(p), 0);
}

/**
 * 判断一个分组方案是否合格
 */
export function isValidGrouping(
  groups: (Product | null | undefined)[][],
): GroupResult {
  // 1. 检查组数是否至少为2
  if (groups.length < 2) {
    return {
      valid: false,
      reason: "分组数量必须至少为2组",
    };
  }

  // 2. 计算重量差异
  const groupWeights = groups.map(getSafeGroupWeight);
  const maxWeight = Math.max(...groupWeights);
  const minWeight = Math.min(...groupWeights);
  const actualWeightDiff = maxWeight - minWeight;

  // 过滤出有效的产品进行计算
  const flatProducts = groups
    .flat()
    .filter((p): p is Product => p !== null && p !== undefined);

  const allowedWeightDiff = getWeightDiff(flatProducts);
  const maxAllowedRatio = getMaxWeightRatio(flatProducts);

  // 3. 检查重量比例
  // const weightRatio = maxWeight / minWeight;
  // if (weightRatio > maxAllowedRatio) {
  //   return {
  //     valid: false,
  //     reason: `重量比例${weightRatio.toFixed(2)}超过允许的${maxAllowedRatio}`,
  //     weightDiff: actualWeightDiff,
  //     allowedWeightDiff,
  //   };
  // }

  // 4. 检查重量差异是否在允许范围内
  // if (actualWeightDiff > allowedWeightDiff) {
  //   return {
  //     valid: false,
  //     reason: `重量差异${actualWeightDiff}超过允许的${allowedWeightDiff}`,
  //     weightDiff: actualWeightDiff,
  //     allowedWeightDiff,
  //   };
  // }

  return {
    valid: true,
    weightDiff: actualWeightDiff,
    allowedWeightDiff,
  };
}

/**
 * 标准化分组，用于去重
 */
export function normalizeGrouping(
  grouping: (Product | null | undefined)[][],
): string {
  // 对每个分组进行排序，确保相同的分组产生相同的字符串
  return grouping
    .map((group) =>
      group
        .map((p) => p?.id) // 使用产品ID进行排序
        .filter((id) => id !== undefined)
        .sort((a, b) => a - b)
        .join(","),
    )
    .sort()
    .join(";");
}
