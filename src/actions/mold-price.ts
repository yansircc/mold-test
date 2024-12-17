'use server';

import { createProductPriceCalculator } from "@/lib/algorithm/mold-calculator-price";
import { db } from "@/lib/prisma";
import { type ApiResponse } from "@/lib/validations/common";
import { type MoldBorderSettingItem } from "@/lib/validations/mold-border-rules";
import { type groupedProducts, type ProductPriceGroup, type MoldDimensions, type ProductPrice, type ProductPriceDimensions } from "@/lib/validations/mold-calculator";
import { type MoldHeightSettingItem } from "@/lib/validations/mold-height-rules";
import { type MoldMarginSettingItem } from "@/lib/validations/mold-spacing-rules";

export async function getMoldPrice(moldMaterialName: string, moldWeight: number): Promise<ApiResponse<number>> {
  try {
    const productPriceCalculator = await createProductPriceCalculator();
    return {
      success: true,
    code: 200,
      data: productPriceCalculator.calculateMoldPriceByWeight(moldMaterialName, moldWeight)
    };
  } catch (error) {
    console.error('Calculation mold price error:', error);
    return {
      success: false,
      code: 500,
      message: "Internal Server Error"
    };
  }
}

// 获取产品价格 
// export async function getProductPrice(moldDimensions: MoldDimensions, paramsProducts: ProductPriceDimensions[]): Promise<ApiResponse<ProductPrice[]>> {
//   try {
//     const productPriceCalculator = await createProductPriceCalculator();
//     return {
//       success: true,
//       code: 200,
//       data: productPriceCalculator.calculateProductPriceByParams(moldDimensions, paramsProducts)
//     };
//   } catch (error) {
//     console.error('Calculation product price error:', error);
//     return {
//       success: false,
//       code: 500,
//       message: "Internal Server Error"
//     };
//   }
// }

// 获取产品价格 分组
export async function getProductPriceByGroup(moldDimensions: MoldDimensions, groupedProducts: groupedProducts): Promise<ApiResponse<ProductPriceGroup[]>> {
  try {
    const productPriceCalculator = await createProductPriceCalculator();

    // 计算每个分组的加工费，并找出最大值
    const machiningCosts = groupedProducts.map(group => 
      productPriceCalculator.calculateMachiningCostByParams(moldDimensions, group.map(product => ({
        length: product.length,
        width: product.width,
        height: product.height,
        volume: product.volume,
        productMaterial: product.material,
        productQuantity: product.quantity,
        color: product.color,
        density: product.density,
      })))
    );

    // 获取最大加工费
    const maxMachiningCost = Math.max(...machiningCosts);

    console.log("maxMachiningCost:", maxMachiningCost);
    //循环计算groupedProducts里面的每个数组
    const productPriceGroup = groupedProducts.map(group => productPriceCalculator.calculateProductPriceByParams(moldDimensions, group.map(product => ({
      length: product.length,
      width: product.width,
      height: product.height,
      volume: product.volume,
      productMaterial: product.material,
      productQuantity: product.quantity,
      color: product.color,
      density: product.density,
    })), maxMachiningCost));

    return {
      success: true,
      code: 200,
      data: productPriceGroup
    };
  } catch (error) {
    console.error('Calculation product price error:', error);
    
    return {
      success: false,
      code: 500,
      message: "Internal Server Error"
    };
  }
}

// 获取模具间距规则
export async function getMoldMarginSettingList(): Promise<MoldMarginSettingItem[]> {
  try {
    const moldMarginAllRules = await db.moldMarginSpaceRules.findMany({
      where: {
        isDeleted: 0,
      },
      select:{
        maxLength: true,
        spacing: true
      },
      orderBy: {
        maxLength: 'asc',
      },
    });
    // 转换为所需格式
    const convertedMarginRules = moldMarginAllRules.map(rule => ({
      maxLength: rule.maxLength,
      spacing: rule.spacing
    }));
    return convertedMarginRules;

  } catch (error) {
    console.error(error);
    return [];
  }
};

// 获取模具高度规则
export async function getMoldHeightSettingList(): Promise<MoldHeightSettingItem[]> {
  try {
    const moldHeightAllRules = await db.moldHeightSetting.findMany({
      where: {
        isDeleted: 0,
      },
      select:{
        maxHeight: true,
        height: true
      },
      orderBy: {
        maxHeight: 'asc',
      },
    });
    // 转换为所需格式
    const convertedHeightRules = moldHeightAllRules.map(rule => ({
      maxHeight: rule.maxHeight,
      height: rule.height
    }));
    return convertedHeightRules;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// 获取模具边距规则
export async function getMoldBorderSettingList(): Promise<MoldBorderSettingItem[]> {
  try {
    const moldBorderAllRules = await db.moldBorderSpaceRules.findMany({
      where: {
        isDeleted: 0,
      },
      select:{
        maxLength: true,
        spacing: true
      },
      orderBy: {
        maxLength: 'asc',
      },
    });   
    // 转换为所需格式
    const convertedBorderRules = moldBorderAllRules.map(rule => ({
      maxLength: rule.maxLength,
      spacing: rule.spacing
    }));
    return convertedBorderRules;
  } catch (error) {
    console.error(error);
    return [];
  }
} 