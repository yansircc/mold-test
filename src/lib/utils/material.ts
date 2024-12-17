/**
 * 材料类型
 */
export interface Material {
  name: string;          // 材料名称
  type: string;          // 材料类型
  density: number;       // 密度 (g/cm³)
  meltTemp: number;      // 熔点 (°C)
  moldTemp: number;      // 模具温度 (°C)
  shrinkage: number;     // 收缩率 (%)
  color?: string;        // 颜色
}

/**
 * 常见注塑材料数据
 */
export const COMMON_MATERIALS: Material[] = [
  {
    name: "ABS",
    type: "工程塑料",
    density: 1.05,
    meltTemp: 230,
    moldTemp: 60,
    shrinkage: 0.5,
  },
  {
    name: "PC",
    type: "工程塑料",
    density: 1.2,
    meltTemp: 280,
    moldTemp: 80,
    shrinkage: 0.6,
  },
  {
    name: "PA66",
    type: "工程塑料",
    density: 1.14,
    meltTemp: 260,
    moldTemp: 80,
    shrinkage: 1.2,
  },
  {
    name: "POM",
    type: "工程塑料",
    density: 1.41,
    meltTemp: 210,
    moldTemp: 90,
    shrinkage: 2.0,
  },
  {
    name: "PP",
    type: "通用塑料",
    density: 0.91,
    meltTemp: 220,
    moldTemp: 50,
    shrinkage: 1.5,
  },
  {
    name: "PE",
    type: "通用塑料",
    density: 0.95,
    meltTemp: 190,
    moldTemp: 40,
    shrinkage: 2.0,
  },
  {
    name: "PS",
    type: "通用塑料",
    density: 1.05,
    meltTemp: 210,
    moldTemp: 50,
    shrinkage: 0.4,
  },
  {
    name: "PMMA",
    type: "工程塑料",
    density: 1.19,
    meltTemp: 240,
    moldTemp: 70,
    shrinkage: 0.4,
  },
] as const;  // 使用 const 断言确保数组不会被修改

/**
 * 随机获取一个材料
 * @returns 一个随机的材料对象
 * @throws 如果随机索引无效（这种情况实际上不会发生）
 */
export function getRandomMaterial(): Material {
  const randomIndex = Math.floor(Math.random() * COMMON_MATERIALS.length);
  if (randomIndex < 0 || randomIndex >= COMMON_MATERIALS.length) {
    throw new Error("Invalid random index");
  }
  // 使用类型断言，因为我们已经检查了索引范围
  return COMMON_MATERIALS[randomIndex]!;
}
