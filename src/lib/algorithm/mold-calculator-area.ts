import {
  borderSpaceRules,
  marginSpaceRules,
  moldStructureHeightRules,
} from "../constants/calculator-constants";
import type { MoldDimensions, ProductDimensions, } from "../validations/mold-calculator";

class MoldAreaCalculator {
  private readonly maxDimension = 1000;
  private readonly maxRatio = 2.5;
  private readonly products: ProductDimensions[];
  private readonly dimensionsCache = new Map<string, { maxLength: number; maxWidth: number }>();
  private minArea = Infinity;
  constructor(products: ProductDimensions[]
  ) {
    this.products = products;
  }

  private calculateSpacing(totalLength: number): number {
    return marginSpaceRules.find(rule => totalLength <= rule.maxLength)?.spacing ?? 0;
  }

  private calculateMargin(totalLength: number): number {
    return (borderSpaceRules.find(rule => totalLength <= rule.maxLength)?.spacing ?? 0) * 2;
  }

  private calculateRowLengthNew(row: ProductDimensions[]): number {
    if (!Array.isArray(row) || row.length === 0) {
      console.warn('Invalid row input:', row);
      return 0;
    }
    let intervalSum = 0;
    let lengthSum = 0;

    // 计算所有项的 length 之和
    for(const item of row) {
      if (!item) continue;
      lengthSum += item.length;
    }

    // 计算所有间隔之和
    // 注意：这里需要考虑所有相邻产品的总长度来确定间距
    for (let i = 0; i < row.length - 1; i++) {
      if (!row[i] || !row[i + 1]) continue;
      const totalLength = (row[i]?.length ?? 0) + (row[i + 1]?.length ?? 0);
      const interval = this.calculateSpacing(totalLength);
      // console.log(`Row spacing between products: ${row[i].length} and ${row[i + 1].length}, total: ${totalLength}, interval: ${interval}`);
      intervalSum += interval;
    }

    const totalLength = lengthSum + intervalSum;
    // console.log(`Row total length: ${lengthSum} + ${intervalSum} = ${totalLength}`);
    return totalLength;
  }

  private calculateColumnLengthNew(column: ProductDimensions[]): number {
    if (!Array.isArray(column) || column.length === 0) {
      console.warn('Invalid column input:', column);
      return 0;
    }
    let intervalSum = 0;
    let widthSum = 0;

    // 计算所有宽度之和
    for(const item of column) {
      if (!item) continue;
      widthSum += item.width;
    }

    // 计算所有垂直间隔之和
    for (let i = 0; i < column.length - 1; i++) {
      if (!column[i] || !column[i + 1]) continue;
      const interval = this.calculateSpacing((column[i]?.width ?? 0) + (column[i + 1]?.width ?? 0));
      intervalSum += interval;
    }

    return intervalSum + widthSum;
  }

  private calculateRowLengthByLayout(layout: ProductDimensions[][]): number {
    if (!layout || layout.length === 0) return 0;

    let maxRowLength = 0;

    // 遍历每一行
    for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
      const currentRow = layout[rowIndex];
      const previousRow = layout[rowIndex - 1];
      let rowLength = 0;

      // 遍历当前行的每个位置
      for (let colIndex = 0; colIndex < Math.max(currentRow?.length ?? 0, previousRow?.length ?? 0); colIndex++) {
        let currentElement = currentRow?.[colIndex];
        const previousElement = previousRow?.[colIndex];
        
        // 如果当前位置没有元素，检查是否可以使用上一行的元素
        if (!currentElement && previousElement && rowIndex > 0) {
          // 检查上一行当前位置的元素宽度是否大于其前一个元素的宽度
          const previousColElement = previousRow[colIndex - 1];
          if (previousColElement && previousElement.width > previousColElement.width) {
            currentElement = previousElement;
          } else {
            continue; // 不满足条件，跳过当前位置
          }
        }

        if (currentElement) {
          // 如果不是第一个元素，需要加上间距
          if (rowLength > 0) {
            const previousElementInRow = currentRow?.[colIndex - 1] ?? previousRow?.[colIndex - 1];
            if (previousElementInRow) {
              const spacing = this.calculateSpacing(previousElementInRow.length + currentElement.length);
              rowLength += spacing;
            }
          }
          rowLength += currentElement.length;
        }
      }

      // console.log("rowLength result: ", rowLength)
      maxRowLength = Math.max(maxRowLength, rowLength);

      // console.log("maxRowLength result: ", maxRowLength)
    }

    return maxRowLength;
  }

  private calculateColumnLengthByLayout(layout: ProductDimensions[][]): number {
    if (!layout || layout.length === 0) return 0;

    let totalWidth = 0;

    // 1. 遍历
    for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
      const currentRow = layout[rowIndex];
      const nextRow = layout[rowIndex + 1];
      const isLastRow = rowIndex === layout.length - 1;

      if (isLastRow) {
        // 如果是最后一行，直接取最大宽度
        const maxWidth = Math.max(...currentRow?.map(item => item.width) ?? []);

        // console.log(" last row maxWidth: ", maxWidth)
        totalWidth += maxWidth;
      } else {
        // 计算每一列的宽度和间距，找出最大值
        let maxColumnWidth = 0;
        let maxColumnWidtIndex = 0;
        // 遍历当前行的每一列
        for (let colIndex = 0; colIndex < (currentRow?.length ?? 0); colIndex++) {
          const currentElement = currentRow?.[colIndex];
          const nextElement = nextRow?.[colIndex];

          if (nextElement && currentElement) {
            // 计算当前元素和下一行元素的间距
            const spacing = this.calculateSpacing(currentElement?.width + nextElement?.width);
            // 计算总宽度（当前元素宽度 + 间距 + 下一行元素宽度），然后减去下一行元素宽度

            //增加一个判断，如果这个元素的宽度加上间距还小于这行的某个元素，那么直接取某个元素的宽度

            const totalColumnWidth = currentElement?.width + spacing + nextElement?.width;

            if(totalColumnWidth > maxColumnWidth){
              maxColumnWidtIndex = colIndex;
            }
            maxColumnWidth = Math.max(maxColumnWidth, totalColumnWidth);
            
          } else if (currentElement) {
            // 如果下一行没有对应元素，只考虑当前元素宽度
            maxColumnWidth = Math.max(maxColumnWidth, currentElement?.width);
          }
        }
        if(nextRow?.[maxColumnWidtIndex]){
          totalWidth += maxColumnWidth - (nextRow[maxColumnWidtIndex]?.width ?? 0);
        }
        else{
          totalWidth += maxColumnWidth
        }
        // console.log("nextRow[maxColumnWidtIndex].width: ", nextRow[maxColumnWidtIndex].width)
        
        // console.log("totalWidth: ", totalWidth)
      }
    }
    
    return totalWidth;
  }

  private calculateHeight(): number {
    const maxProductHeight = Math.max(...this.products.map(item => item.height));
    return maxProductHeight + (
      moldStructureHeightRules.find(rule => maxProductHeight <= rule.maxHeight)?.height ?? 0
    );
  }

  private calculateDimensions(layout: ProductDimensions[][]): { maxLength: number; maxWidth: number } {
    const key = JSON.stringify(layout);
    const cache = this.dimensionsCache;
    if (cache.has(key)) return cache.get(key)!;

    let maxLength = 0;
    let maxWidth = 0;
    
    const rowLength = this.calculateRowLengthByLayout(layout);
    if (rowLength > this.maxDimension) {
      return { maxLength: Infinity, maxWidth: Infinity };
    }

    const rowMargin = this.calculateMargin(rowLength);
    maxLength = Math.max(maxLength, rowLength + rowMargin);


    // 计算宽度
    const columnCount = Math.max(...layout.map(row => row?.length ?? 0));
    for (let j = 0; j < columnCount; j++) {
      
      const columnWidth = this.calculateColumnLengthByLayout(layout); // 更新取列宽度的函数

      const columnMargin = this.calculateMargin(columnWidth);
      maxWidth = Math.max(maxWidth, columnWidth + columnMargin);
    }

    // 优化：如果计算的面积已经超过当前最小面积，提前返回
    if (maxLength * maxWidth >= this.minArea) {
      return { maxLength: Infinity, maxWidth: Infinity };
    }

    const result = { maxLength, maxWidth };
    cache.set(key, result);
    return result;
  };

  private shouldRotateProduct(product: ProductDimensions): boolean {
    const ratio = Math.max(product.length, product.width) / Math.min(product.length , product.width);
    // console.log(`Checking rotation for ${product.length}x${product.width}, ratio: ${ratio}`);
    return ratio >= 1.2 && ratio <= 3;
  }

  private backtrack(
    currentLayout: ProductDimensions[][],
    remainingProducts: Array<ProductDimensions & { area: number; isRotated?: boolean }>,
    bestLayout: ProductDimensions[][],
    bestMold: MoldDimensions | null,
    currentDepth = 0
  ): { bestLayout: ProductDimensions[][], bestMold: MoldDimensions | null } {
    // 验证布局有效性
    if (!currentLayout.every(row => row && Array.isArray(row) && row.every(Boolean))) {
      console.warn('Invalid layout detected:', currentLayout);
      return { bestLayout, bestMold };
    }

    // 放宽搜索深度
    if (currentDepth > 50) {
      return { bestLayout, bestMold };
    }
    
    const { maxLength, maxWidth } = this.calculateDimensions(currentLayout);
    const currentArea = maxLength * maxWidth;
    
    if (currentArea >= this.minArea) {
      return { bestLayout, bestMold };
    }

    if (remainingProducts.length === 0) {
      const lengthAndWidthRatio = maxLength > maxWidth ? 
        (maxLength / maxWidth) : (maxWidth / maxLength);
      
      if (maxLength <= this.maxDimension && 
          maxWidth <= this.maxDimension && 
          lengthAndWidthRatio <= this.maxRatio) {
        if (currentArea < this.minArea) {
          this.minArea = currentArea;
          
          bestMold = {
            length: maxLength,
            width: maxWidth,
            height: this.calculateHeight(),
            moldWeight: 0,
            moldPrice: 0,
            moldMaterial: "",
            maxInnerLength: 0,
            maxInnerWidth: 0,
            verticalMargin: 0,
            horizontalMargin: 0,
          };
          bestLayout = currentLayout;
          console.log("New best layout found:", {
            area: currentArea,
            dimensions: `${maxLength}x${maxWidth}`,
            ratio: lengthAndWidthRatio.toFixed(2),
            layout: currentLayout.map(row => 
              row.map(p => `${p.length}x${p.width}${p.isRotated ? '(R)' : ''}`)
            )
          });
        }
      }
      return { bestLayout, bestMold };
    }

    const currentProduct = remainingProducts[0];
    if (!currentProduct) {
      return { bestLayout, bestMold };
    }

    const newRemaining = remainingProducts.slice(1);

    // 尝试原始方向和旋转方向
    const orientations = this.shouldRotateProduct(currentProduct) 
      ? [
          currentProduct,
          {
            ...currentProduct,
            length: currentProduct.width,
            width: currentProduct.length,
            isRotated: true
          }
        ]
      : [currentProduct];

    for (const orientation of orientations) {
      // 尝试添加到现有行
      for (let i = 0; i < currentLayout.length; i++) {
        const currentRow = currentLayout[i];
        if (!currentRow) continue;
        
        const newRow = [...currentRow, orientation] as ProductDimensions[];
        const rowLength = this.calculateRowLengthNew(newRow);
        
        if (rowLength + this.calculateMargin(rowLength) <= this.maxDimension) {
          const newLayout = [
            ...currentLayout.slice(0, i),
            newRow,
            ...currentLayout.slice(i + 1),
          ] as ProductDimensions[][];
          const result = this.backtrack(newLayout, newRemaining, bestLayout, bestMold, currentDepth + 1);
          bestLayout = result.bestLayout;
          bestMold = result.bestMold;
        }
      }
      
      // 建新行
      const result = this.backtrack(
        [...currentLayout, [orientation]] as ProductDimensions[][],
        newRemaining, 
        bestLayout, 
        bestMold, 
        currentDepth + 1
      );
      bestLayout = result.bestLayout;
      bestMold = result.bestMold;
    }

    return { bestLayout, bestMold };
  }

  
  public calculateMoldArea(): MoldDimensions {
    this.minArea = Infinity;
    let bestMold: MoldDimensions = {
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
    
    // 按面积排序，简化排序
    const productsWithMetrics = this.products
      .sort((a, b) => (b.length * b.width) - (a.length * a.width))
      .map(p => ({
        ...p,
        area: p.length * p.width,
        bottom: 0,
        right: 0,
        originalLength: p.length,
        originalWidth: p.width,
        isRotated: false
      }));

    let bestLayout: ProductDimensions[][] = [];
    const result = this.backtrack([], productsWithMetrics, bestLayout, bestMold);
    bestLayout = result.bestLayout;
    bestMold = result.bestMold ?? {
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
    
    const {maxInnerLength, maxInnerWidth} = this.showLayout(bestLayout);
    console.log(`maxInnerLength is ${maxInnerLength} mm, maxInnerWidth is ${maxInnerWidth} mm`);
    if(bestMold){

      bestMold.verticalMargin = this.calculateMargin(maxInnerWidth) / 2
      bestMold.horizontalMargin = this.calculateMargin(maxInnerLength) / 2
      
      if(bestMold.verticalMargin > bestMold.horizontalMargin){
        bestMold.length = maxInnerLength + bestMold.verticalMargin * 2;
        bestMold.horizontalMargin = bestMold.verticalMargin;
      }else{
        bestMold.width = maxInnerWidth + bestMold.horizontalMargin * 2;
        bestMold.verticalMargin = bestMold.horizontalMargin;
      }

      return {
        ...bestMold,
        maxInnerLength,
        maxInnerWidth
      };
    }
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

  private showLayout(currentLayout: ProductDimensions[][]): {maxInnerLength:number,maxInnerWidth:number} {
    let maxInnerLengthTemp = 0;
    let maxInnerWidthTemp = 0;
   
    
    maxInnerLengthTemp = this.calculateRowLengthByLayout(currentLayout);

    // 输出列信息
    const columnCount = Math.max(...currentLayout.map(row => row?.length ?? 0));
    for (let j = 0; j < columnCount; j++) {
      const column = currentLayout.map(row => row?.[j]).filter((item): item is ProductDimensions => !!item);
      const columnWidth = this.calculateColumnLengthNew(column);
      maxInnerWidthTemp = Math.max(columnWidth, maxInnerWidthTemp);
      
      
    }
 
    return {maxInnerLength: maxInnerLengthTemp, maxInnerWidth: maxInnerWidthTemp};
  }

}

export async function createMoldAreaCalculator(
  products: ProductDimensions[],
): Promise<MoldAreaCalculator> {
  
  return new MoldAreaCalculator(products
  );
}
