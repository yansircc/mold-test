import type { Product } from "@/types/domain/product";

/**
 * 获取允许的重量差异
 */
export function getWeightDiff(products: Product[]): number {
  const maxWeight = Math.max(...products.map((p) => p.weight ?? 0));
  if (maxWeight < 100) return 50;
  if (maxWeight < 200) return 100;
  if (maxWeight < 300) return 100;
  if (maxWeight < 400) return 100;
  if (maxWeight < 500) return 150;
  if (maxWeight < 600) return 150;
  if (maxWeight < 700) return 150;
  if (maxWeight < 800) return 200;
  if (maxWeight < 900) return 200;
  if (maxWeight < 1000) return 200;
  return 0; // >=1000克时需要分开做模具
}

/**
 * 获取最大允许的重量比例
 */
export function getMaxWeightRatio(products: Product[]): number {
  // 如果没有产品或只有一个产品，返回1
  if (products.length <= 1) return 1;

  // 过滤出有weight属性的产品
  const validProducts = products.filter(
    (p): p is Product & { weight: number } => typeof p.weight === "number",
  );

  if (validProducts.length === 0) return 1;

  // 计算平均重量
  const avgWeight =
    validProducts.reduce((sum, p) => sum + p.weight, 0) / validProducts.length;

  // 根据平均重量返回允许的最大比例
  return avgWeight < 100 ? 1.2 : 1.1; // 小重量允许20%，大重量允许10%
}

/**
 * 计算一组产品的总重量
 */
export function getGroupWeight(group: Product[]): number {
  return group.reduce((sum, p) => sum + (p.weight ?? 0), 0);
}
