import type { Point3D } from "@/types/core/geometry";
import type { Product, CADBoundingBox } from "@/types/domain/product";
import { colorList, materialList } from "../constants/calculator-constants";

interface ProductGeneratorConfig {
  // 尺寸范围配置 (mm)
  dimensions: {
    minLength: number;
    maxLength: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    minVolume: number;
    maxVolume: number;
    minQuantity: number;
    maxQuantity: number;
  };
  // 重量范围配置 (g)
  weight: {
    min: number;
    max: number;
  };
  // 体积密度范围 (g/cm³)
  density: {
    min: number;
    max: number;
  };
}

// 默认产品生成配置
// Default configuration for reasonable product dimensions and properties
const DEFAULT_CONFIG: ProductGeneratorConfig = {
  dimensions: {
    minLength: 20, // 最小长度 20mm
    maxLength: 50, // 最大长度 200mm
    minWidth: 20, // 最小宽度 20mm
    maxWidth: 50, // 最大宽度 200mm
    minHeight: 20, // 最小高度 10mm
    maxHeight: 50, // 最大高度 100mm
    minVolume: 1000, // 最小体积 100mm³
    maxVolume: 100000, // 最大体积 100000mm³
    minQuantity: 1000, // 最小数量 1000
    maxQuantity: 5000, // 最大数量 5000
  },
  weight: {
    min: 50, // 最小重量 50g
    max: 1000, // 最大重量 1000g
  },
  density: {
    min: 0.9, // 最小密度 0.9 g/cm³ (接近 PP)
    max: 1.4, // 最大密度 1.4 g/cm³ (接近 PET)
  },
};

// 生成随机数的辅助函数
function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成合理的体积和表面积
function generateVolumeAndSurface(
  length: number,
  width: number,
  height: number,
) {
  const volume = length * width * height;
  // 简化的表面积计算 (长方体)
  const surfaceArea = 2 * (length * width + length * height + width * height);
  return { volume, surfaceArea };
}

// 生成边界盒和质心
function generateBoundingBoxAndCenterOfMass(
  length: number,
  width: number,
  height: number,
): {
  boundingBox: CADBoundingBox;
  centerOfMass: Point3D;
} {
  return {
    boundingBox: {
      center: { x: length / 2, y: width / 2, z: height / 2 },
      dimensions: { x: length, y: width, z: height },
    },
    centerOfMass: {
      x: length / 2,
      y: width / 2,
      z: height / 2,
    },
  };
}

function getRandomMaterial() {
  const randomIndex = Math.floor(Math.random() * materialList.length);
  return materialList[randomIndex];
}

function getRandomColor() {
  const randomIndex = Math.floor(Math.random() * colorList.length);
  return colorList[randomIndex];
}

// 生成1000倍数的随机数量
function generateRandomQuantity(min: number, max: number): number {
  // 将最小值向上取整到最近的1000的倍数
  const normalizedMin = Math.ceil(min / 1000) * 1000;
  // 将最大值向下取整到最近的1000的倍数
  const normalizedMax = Math.floor(max / 1000) * 1000;
  
  // 计算有多少个可能的1000的倍数
  const possibleValues = (normalizedMax - normalizedMin) / 1000 + 1;
  
  // 生成随机的1000倍数
  return normalizedMin + (Math.floor(Math.random() * possibleValues) * 1000);
}
/**
 * Generate a random product with reasonable properties
 * 生成具有合理属性的随机产品
 */
export function generateRandomProduct(
  id: number,
  config: Partial<ProductGeneratorConfig> = {},
): Product {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Generate dimensions
  const length = randomInRange(
    finalConfig.dimensions.minLength,
    finalConfig.dimensions.maxLength,
  );
  const width = randomInRange(
    finalConfig.dimensions.minWidth,
    finalConfig.dimensions.maxWidth,
  );
  const height = randomInRange(
    finalConfig.dimensions.minHeight,
    finalConfig.dimensions.maxHeight,
  );

  const productVolume = randomInRange(
    finalConfig.dimensions.minVolume,
    finalConfig.dimensions.maxVolume,
  );

  const quantity = generateRandomQuantity(
    finalConfig.dimensions.minQuantity,
    finalConfig.dimensions.maxQuantity,
  );

  // TODO: 随机生成材料，level: 紧急且重要
  const material = getRandomMaterial();
  // // 获取对应密度并计算重量，替换掉后面的随机重量
  const density = material?.density ?? 0;
  const weight = productVolume * density;

  // Calculate volume and surface area
  const { volume, surfaceArea } = generateVolumeAndSurface(
    length,
    width,
    height,
  );

  // Generate weight based on volume and density range
  // const volumeInCm3 = volume / 1000; // convert mm³ to cm³
  // const density =
  //   randomInRange(
  //     finalConfig.density.min * 100,
  //     finalConfig.density.max * 100,
  //   ) / 100;
  // const weight = Math.round(volumeInCm3 * density);

  // Generate bounding box and center of mass
  const { boundingBox, centerOfMass } = generateBoundingBoxAndCenterOfMass(
    length,
    width,
    height,
  );

  return {
    id,
    name: `Product ${id}`,
    weight,
    density,
    color: getRandomColor(),
    dimensions: {
      length,
      width,
      height,
    },
    volume: productVolume,
    materialName: material?.name ?? 'NA',
    quantity,
    cadData: {
      volume,
      surfaceArea,
      boundingBox,
      centerOfMass,
    },
  };
}

/**
 * Generate multiple random products
 * 生成多个随机产品
 */
export function generateRandomProducts(
  count: number,
  config?: Partial<ProductGeneratorConfig>,
  identical = false,
): Product[] {
  if (identical) {
    // 如果需要相同的产品，只生成一个然后复制
    const baseProduct = generateRandomProduct(1, config);

    console.log("baseProduct:", baseProduct);
    return Array(count)
      .fill(null)
      .map((_, index) => ({
        ...baseProduct,
        id: index + 1,
      }));
  }

  return Array(count)
    .fill(null)
    .map((_, index) => generateRandomProduct(index + 1, config));
}
