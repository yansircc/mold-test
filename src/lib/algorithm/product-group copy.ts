import { type productGroup, type groupedProducts, type groupedProductsSchemas } from "../validations/mold-calculator";


export function calculateProductGroup(products: productGroup): groupedProducts {
  // 用 Map 存储分组，key 为 "color-material" 格式
  const groups = new Map<string, productGroup>();

  products.forEach(product => {
    const color = product.color ?? 'unknown';
    const material = product.material ?? 'unknown';
    const groupKey = `${color}-${material}`;

    const existingGroup = groups.get(groupKey);
    if (existingGroup) {
      // 如果已存在相同颜色和材料的组，将产品添加到该组
      existingGroup.push(product);
    } else {
      // 创建新组
      groups.set(groupKey, [product]);
    }
  });

  // 将 Map 转换为数组返回
  return Array.from(groups.values());
}



export function generateAllGroupings(products: productGroup): groupedProductsSchemas {
  const result: groupedProductsSchemas = [];

  function backtrack(start: number, currentGroups: groupedProducts) {
    if (start === products.length) {
      const solutionsScore = Math.floor(Math.random() * 41) + 60;
      const solutionsName = `方案得分-（${solutionsScore}）`;

      result.push({
        solutions: currentGroups.map(group => [...group]),
        solutionsScore,
        solutionsName
      });
      return;
    }

    if (products[start]) {
      for (const group of currentGroups) {
        group.push(products[start]);
        backtrack(start + 1, [...currentGroups]);
        group.pop();
      }

      currentGroups.push([products[start]]);
      backtrack(start + 1, currentGroups);
      currentGroups.pop();
    }
  }

  backtrack(0, []);
  
  // Sort results by solutionsScore in descending order
  return result.sort((a, b) => b.solutionsScore - a.solutionsScore);
}

export function calculateProductGroupSchemas(products: productGroup): groupedProductsSchemas {
  return generateAllGroupings(products);
}