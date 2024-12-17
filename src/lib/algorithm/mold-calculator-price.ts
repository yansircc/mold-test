// import {
//   fixedLossRate,
//   defaultMoldMaterialDensity,
// } from "../constants/calculator-constants";

import { getMachinePriceSettingList, getMaterialPriceSettingList, getMoldConstantSettingList, getMoldOperatingExpenseSettingList, getMoldPriceDifferSettingList } from "./get-calulator-price-data";
import { type MoldPriceDifferSettingItem } from "../validations/mold-price-differ";
import { type MachinePriceSettingItem } from "../validations/machine-price";
import { type MoldOperatingExpenseSettingItem } from "../validations/mold-operating-expense";
import { type MoldConstantSettingItem } from "../validations/mold-constant";
import { type MaterialPriceSettingItem } from "../validations/material";
import { type ProductPrice, type MoldDimensions, type ProductPriceDimensions, } from "../validations/mold-calculator";

class ProductPriceCalculator {
  private readonly weightDiffer = 1000;
  private readonly exchangeRate: number;
  private readonly moldPriceDifferSettingList: MoldPriceDifferSettingItem[];
  private readonly moldOperatingExpenseSettingList: MoldOperatingExpenseSettingItem[];
  private readonly moldConstantSettingList: MoldConstantSettingItem[];
  private readonly materialPriceSettingList: MaterialPriceSettingItem[];
  private readonly machinePriceSettingList: MachinePriceSettingItem[];

  constructor(
    moldPriceDifferSettingList: MoldPriceDifferSettingItem[], 
    moldOperatingExpenseSettingList: MoldOperatingExpenseSettingItem[], 
    moldConstantSettingList: MoldConstantSettingItem[],
    materialPriceSettingList: MaterialPriceSettingItem[],
    machinePriceSettingList: MachinePriceSettingItem[]
  ) {
    
    this.exchangeRate = moldConstantSettingList.find(item => item.constantName === "exchangeRate")?.constantValue ?? 7.1; //exchangeRate
    this.moldPriceDifferSettingList = moldPriceDifferSettingList;
    this.moldOperatingExpenseSettingList = moldOperatingExpenseSettingList;
    this.moldConstantSettingList = moldConstantSettingList;
    this.materialPriceSettingList = materialPriceSettingList;
    this.machinePriceSettingList = machinePriceSettingList;
  }
  
  //计算加工费
  public calculateMachiningCostByParams(moldDimensions: MoldDimensions, paramsProducts: ProductPriceDimensions[]): number {
    if (!moldDimensions) return 0;

    const productsWithMaterialPrice = paramsProducts.map(product => ({
      ...product,
      materialPrice: this.calculateMaterialPrice(product.volume ?? 0, product.productMaterial ?? ""),
      weight: this.calculateMaterialWeight(product.volume ?? 0, product.productMaterial ?? "")
    }));

    const totalWeight = productsWithMaterialPrice.reduce((acc, product) => 
      acc + (product.weight ?? 0), 0);
    
    // 2. 计算机器加工费
    // const maxHeight = Math.max(...productsWithMaterialPrice.map(p => p.height));
    const machiningCost = this.calculateMachiningCost(moldDimensions, totalWeight);

    return machiningCost;
  }

  // 根据传入的产品计算价格
  public calculateProductPriceByParams(moldDimensions: MoldDimensions, paramsProducts: ProductPriceDimensions[], maxMachiningCost: number): ProductPrice[] {
    if (!paramsProducts) return [];

    // 1. 计算原材料价格
    const productsWithMaterialPrice = paramsProducts.map(product => ({
      ...product,
      materialPrice: this.calculateMaterialPrice(product.volume ?? 0, product.productMaterial ?? ""),
      weight: this.calculateMaterialWeight(product.volume ?? 0, product.productMaterial ?? "")
    }));

    // const totalWeight = productsWithMaterialPrice.reduce((acc, product) => 
    //   acc + (product.weight ?? 0), 0);
    
    // // 2. 计算机器加工费
    // const maxHeight = Math.max(...productsWithMaterialPrice.map(p => p.height));
    // const machiningCost = this.calculateMachiningCost(moldDimensions,maxHeight, totalWeight);

    // 3. 计算每个产品的加工费
    const profitCoefficient = this.moldConstantSettingList.find(rule => rule.constantName === "profitCoefficient")?.constantValue ?? 1.5;

    let remainingProducts = productsWithMaterialPrice.map(p => ({
      ...p,
      remainingQuantity: p.productQuantity ?? 0,
      processingCost: [] as Array<{ productMakingQuantity: number; productMakingPrice: number; 
        productSinglePrice: number; productTotalPrice: number }>
    }));
  
    while (remainingProducts.some(p => p.remainingQuantity > 0)) {
      // 找出当前剩余数量中的最小值
      const minQuantity = Math.min(
        ...remainingProducts
          .filter(p => p.remainingQuantity > 0)
          .map(p => p.remainingQuantity)
      );
  
      // 计算当前还有多少种产品需要处理
      const activeProductCount = remainingProducts.filter(p => p.remainingQuantity > 0).length;
      
      // 计算当前组的单个产品加工费
      const currentGroupMakingPrice = maxMachiningCost / activeProductCount;
  
      // 为所有还有剩余数量的产品添加加工费记录
      remainingProducts = remainingProducts.map(p => {
        if (p.remainingQuantity > 0) {
          return {
            ...p,
            remainingQuantity: p.remainingQuantity - minQuantity,
            processingCost: [
              ...p.processingCost,
              {
                productMakingQuantity: minQuantity,
                productMakingPrice: currentGroupMakingPrice,
                productSinglePrice: (p.materialPrice + currentGroupMakingPrice) * profitCoefficient / this.exchangeRate,
                productTotalPrice: (p.materialPrice + currentGroupMakingPrice) * profitCoefficient / this.exchangeRate * minQuantity
              }
            ]
          };
        }
        return p;
      });
    }

    
    // console.log("remainingProducts:", JSON.stringify(remainingProducts));
    // 4. 计算最终价格
    
    const finalProducts = remainingProducts.map(product => {
      const finalPrice = product.processingCost.reduce((total, cost) => {
        // const price = ((product.materialPrice + cost.productMakingPrice) * profitCoefficient / this.exchangeRate) * cost.productMakingQuantity;
        return total + (cost.productTotalPrice ?? 0);
      }, 0);

      return {
        ...product,
        finalPrice
      };
    });
    // console.log("finalProducts:",finalProducts);
    return finalProducts;
  }

  private calculateMaterialWeight(volume: number, material: string): number {
    const materialData = this.materialPriceSettingList.find(item => item.name === material);
    if (!materialData) return 0;

    return volume * materialData.density;
  }

  private calculateMaterialPrice(volume: number, material: string): number {
    const materialData = this.materialPriceSettingList.find(item => item.name === material);
    if (!materialData) return 0;

    const weight = volume * materialData.density;
    const fixedLossRate = this.moldConstantSettingList.find(rule => rule.constantName === 'fixedLossRate')?.constantValue ?? 1.1;
    return weight * fixedLossRate * materialData.price;
  }

  private calculateMachiningCost(moldDimensions: MoldDimensions,  totalWeight: number): number {
    if (!moldDimensions) return 0;

    const { length, width, height } = moldDimensions;
    const moldWidth = Math.min(length, width);
    const moldHeight = height;

    const eligibleMachines = this.machinePriceSettingList
      .filter(machine => 
        moldWidth <= machine.moldWidth &&
        moldHeight <= machine.moldHeight &&
        (totalWeight / 0.8) <= machine.injectionVolume
      )
      .sort((a, b) => {
        const aValue = parseInt(a.name.replace('T', ''));
        const bValue = parseInt(b.name.replace('T', ''));
        return aValue - bValue;
      });

    return eligibleMachines[0]?.machiningFee ?? 0;
  }

  public async calculateMoldPrice(moldDimensions: MoldDimensions): Promise<MoldDimensions> {
    if (!moldDimensions){
      return {
          length: 0,
          width: 0,
          height: 0,
          moldMaterial: "",
          moldWeight: 0,
          moldPrice: 0,
          maxInnerLength: 0,
          maxInnerWidth: 0,
          verticalMargin: 0,
          horizontalMargin: 0,
      };
    } 

    const moldVolume = 
      moldDimensions.length *
      moldDimensions.width *
      moldDimensions.height;
  
    const moldConstantSettingList = await getMoldConstantSettingList();
    const defaultMoldMaterialDensity = moldConstantSettingList.find(rule => rule.constantName === 'defaultMoldMaterialDensity')?.constantValue ?? 0.00000785;
    const moldWeight = moldVolume * defaultMoldMaterialDensity;
    
   
    // console.log("convertedOperatingExpenseRules:",convertedOperatingExpenseRules);
    const runningFee = this.moldOperatingExpenseSettingList.find(rule => moldWeight <= rule.maxWeight)?.price ?? 0;

    // console.log("runningFee:",runningFee);
    // console.log("moldMaterial:",this.bestMold.moldMaterial);
    const moldMaterialName = moldDimensions.moldMaterial ?? "";
    let differPrice = 0;
    
      // console.log("convertedPriceDifferRules:",convertedPriceDifferRules);
    const differPriceCoefficient = this.moldPriceDifferSettingList.find(rule => moldMaterialName == rule.name.trim())?.coefficient ?? 0;
    if(differPriceCoefficient != 0){
      differPrice = (moldWeight  * differPriceCoefficient) / this.exchangeRate;
    }
    // console.log("moldWeight:",moldWeight);
    // console.log("differPrice:",differPrice);

    // console.log("differPrice:",differPrice);

    // 如果重量小于100，则按照100计算
    const moldPrice = moldWeight > this.weightDiffer ? ((moldWeight * 40 + runningFee) / this.exchangeRate + differPrice)
    : ((Math.max(moldWeight, 100) * 50 + runningFee) / this.exchangeRate + differPrice );
    // return  Math.ceil(finalPrice / 100) * 100
    return {
        ...moldDimensions, 
        moldWeight,
        moldPrice
    };
  }

  public calculateMoldPriceByWeight(moldMaterialName: string, moldWeight: number): number {
    
   
    // console.log("convertedOperatingExpenseRules:",convertedOperatingExpenseRules);
    const runningFee = this.moldOperatingExpenseSettingList.find(rule => moldWeight <= rule.maxWeight)?.price ?? 0;

    // console.log("runningFee:",runningFee);
    // console.log("moldMaterial:",this.bestMold.moldMaterial);
  
    let differPrice = 0;
    
      // console.log("convertedPriceDifferRules:",convertedPriceDifferRules);
    const differPriceCoefficient = this.moldPriceDifferSettingList.find(rule => moldMaterialName == rule.name.trim())?.coefficient ?? 0;
    if(differPriceCoefficient != 0){
      differPrice = (moldWeight  * differPriceCoefficient) / this.exchangeRate;
    }
    // console.log("moldWeight:",moldWeight);
    // console.log("differPrice:",differPrice);

    // console.log("differPrice:",differPrice);

    const moldPrice = moldWeight > this.weightDiffer ? ((moldWeight * 40 + runningFee) / this.exchangeRate + differPrice)
    : ((Math.max(moldWeight, 100) * 50 + runningFee) / this.exchangeRate + differPrice );
    // return  Math.ceil(finalPrice / 100) * 100
    return moldPrice;
  }
}

export async function createProductPriceCalculator(
  
): Promise<ProductPriceCalculator> {

  const moldPriceDifferSettingList = await getMoldPriceDifferSettingList();
  const moldOperatingExpenseSettingList = await getMoldOperatingExpenseSettingList();
  const moldConstantSettingList = await getMoldConstantSettingList();
  const materialPriceSettingList = await getMaterialPriceSettingList();
  const machinePriceSettingList = await getMachinePriceSettingList();
  return new ProductPriceCalculator(
    moldPriceDifferSettingList, 
    moldOperatingExpenseSettingList, 
    moldConstantSettingList, 
    materialPriceSettingList, 
    machinePriceSettingList
  );
}

