import { getRandomMaterial } from "./material";
import type { Product } from "@/types/domain/product";

/**
 * 生成随机产品数据
 */
export function generateRandomProduct(id: number): Product {
  // 随机尺寸 (50-500mm)
  const width = Math.floor(Math.random() * 450) + 50;
  const length = Math.floor(Math.random() * 450) + 50;
  const height = Math.floor(Math.random() * 450) + 50;

  // 获取随机材料
  const material = getRandomMaterial();

  // 根据体积和材料密度计算重量
  const volume = (width * length * height) / 1000; // cm³
  const weight = volume * material.density; // g

  // 随机流动数据
  const flowLength = Math.floor(Math.random() * 1000) + 200;

  return {
    id,
    name: `产品 ${id}`,
    dimensions: {
      width,
      length,
      height,
    },
    weight,
    material: JSON.stringify(material),
    flowData: {
      manualFlowLength: flowLength,
    },
  };
}

/**
 * 生成多个随机产品
 */
export function generateRandomProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, i) => generateRandomProduct(i + 1));
}
