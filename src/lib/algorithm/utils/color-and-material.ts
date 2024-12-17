
import type { Product } from "@/types/domain/product";

export function checkColorAndMaterial(products: Product[]): {
  canGroup: boolean;
  message?: string;
} {
  if (!products || products.length === 0) {
    return {
      canGroup: false,
      message: "没有产品可供分组",
    };
  }

  // console.log("products checkColorAndMaterial Test: ", products)

  // Get the color and material of the first product as reference
  const referenceColor = products[0]?.color;
  const referenceMaterial = products[0]?.materialName;

  // Check if any product has different color or material
  const hasDifferentProperties = products.some(
    product => 
      product.color !== referenceColor || 
      product.materialName !== referenceMaterial
  );

  // console.log("hasDifferentProperties Test: ",hasDifferentProperties)
  if (hasDifferentProperties) {

    // console.log("checkColorAndMaterial Test: ","产品的颜色或材料不一致，无法分组")
    return {
      canGroup: false,
      message: "产品的颜色或材料不一致，无法分组",
    };
  }

  // console.log("checkColorAndMaterial Test: ","产品颜色和材料一致，可以分组")
  return {
    canGroup: true,
    message: "产品颜色和材料一致，可以分组",
  };
}