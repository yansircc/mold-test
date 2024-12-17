import potpack from "potpack";
import type { Rectangle2D } from "@/types/core/geometry";
import type {
  AreaResult,
  PlacedRectangle,
} from "@/types/algorithm/layout/types";
import type {
  PotpackBox,
  PackedBox,
  PackResult,
} from "@/types/algorithm/packing/types";
import { calculateSpacing } from "./utils/spacing";
import { moldMaterialList, defaultMoldMaterialDensity, moldStructureHeightRules, borderSpaceRules, marginSpaceRules } from "../constants/calculator-constants";
import { getMoldBorderSettingList, getMoldHeightSettingList } from "@/actions/mold-price";
import { getMoldConstantSettingList } from "./get-calulator-price-data";
// import { getMoldConstantSettingList } from "@/lib/algorithm/get-calulator-price-data";

function createRotationArray(length: number, value: boolean): boolean[] {
  return Array.from({ length }, () => value);
}

function sortRectangles(rectangles: Rectangle2D[]): Rectangle2D[] {
  // 首先按面积排序
  return [...rectangles].sort((a, b) => {
    const areaA = a.width * a.length;
    const areaB = b.width * b.length;
    if (Math.abs(areaA - areaB) > 100) {
      return areaB - areaA; // 大的在前
    }
    // 面积相近时，优先考虑更方的矩形
    const ratioA = Math.max(a.width / a.length, a.length / a.width);
    const ratioB = Math.max(b.width / b.length, b.length / b.width);
    return ratioA - ratioB;
  });
}

function getOptimalRotations(rectangles: Rectangle2D[]): boolean[] {
  // 预计算每个矩形的最优旋转方向
  return rectangles.map((rect) => {
    // 1. 长边优先水平放置
    const preferHorizontal = rect.width > rect.length;
    // 2. 接近正方形的，考虑整体布局
    const isNearlySquare =
      Math.abs(rect.width - rect.length) <
      Math.min(rect.width, rect.length) * 0.1;

    if (isNearlySquare) {
      // 对于接近正方形的，返回false表示不旋转
      return false;
    }
    // 对于非正方形，返回是否需要旋转以使长边水平
    return !preferHorizontal;
  });
}

function smartPacking(
  rectangles: Rectangle2D[],
  spacing: number,
  maxIterations = 8, // 限制迭代次数
): PackResult {
  let bestArea = Number.MAX_VALUE;
  let bestResult: PackResult | null = null;
  let bestFill = 0;

  // 对矩形进行排序
  const sortedRectangles = sortRectangles(rectangles);

  // 创建原始索引映射
  const indexMap = new Map(
    sortedRectangles.map((rect, _i) => [
      rect,
      rectangles.findIndex(
        (r) => r.width === rect.width && r.length === rect.length,
      ),
    ]),
  );

  // 获取最优的初始旋转状态
  const optimalRotations = getOptimalRotations(sortedRectangles);

  // 生成有限的变体组合
  const variations: boolean[][] = [
    [...optimalRotations], // 最优旋转
    optimalRotations.map((r) => !r), // 最优旋转的反面
    createRotationArray(rectangles.length, false), // 全不旋转
    createRotationArray(rectangles.length, true), // 全旋转
  ];

  // 为大矩形添加额外的变体
  const significantAreas = new Set<number>();
  sortedRectangles.forEach((rect, index) => {
    const area = rect.width * rect.length;
    if (!significantAreas.has(area) && significantAreas.size < 2) {
      significantAreas.add(area);
      // 为大矩形添加特殊变体
      variations.push(optimalRotations.map((r, i) => (i === index ? !r : r)));
    }
  });

  // 尝试每种变体
  for (const rotations of variations) {
    // 为每种基本变体尝试少量随机变化
    for (let iter = 0; iter < maxIterations; iter++) {
      const currentRotations = [...rotations];

      // 随机改变一些矩形的旋转状态
      if (iter > 0) {
        const numChanges = Math.min(2, Math.floor(rectangles.length / 3));
        for (let i = 0; i < numChanges; i++) {
          const idx = Math.floor(Math.random() * rectangles.length);
          currentRotations[idx] = !currentRotations[idx];
        }
      }

      const boxes: PotpackBox[] = sortedRectangles.map((rect, index) => ({
        w: (currentRotations[index] ? rect.length : rect.width) + spacing,
        h: (currentRotations[index] ? rect.width : rect.length) + spacing,
        index: indexMap.get(rect) ?? index,
        isRotated: currentRotations[index],
      }));

      const packResult = potpack(boxes);
      const area = packResult.w * packResult.h;
      const usedArea = boxes.reduce((sum, box) => sum + box.w * box.h, 0);
      const fill = usedArea / area;

      // 评估布局质量
      const quality =
        area * (1 + Math.abs(packResult.w / packResult.h - 1) * 0.1);

      if (
        quality < bestArea ||
        (Math.abs(quality - bestArea) < 100 && fill > bestFill)
      ) {
        bestArea = quality;
        bestFill = fill;
        bestResult = {
          result: packResult,
          boxes: boxes as PackedBox[],
        };
      }
    }
  }

  if (!bestResult) {
    throw new Error("Failed to find any valid packing");
  }

  return bestResult;
}

/**
 * 计算最小面积布局
 * @param rectangles 输入的矩形列表
 * @returns 计算结果，包含布局信息
 */
export function calculateMinArea(rectangles: Rectangle2D[]): AreaResult {
  if (!rectangles.length) {
    return {
      width: 0,
      length: 0,
      area: 0,
      rotation: false,
      spacing: 0,
      layout: [],
    };
  }

  // 计算最大尺寸来确定间距
  const maxDimension = Math.max(
    ...rectangles.map((rect) => Math.max(rect.width, rect.length)),
  );
  const spacing = calculateSpacing(maxDimension);

  // 使用智能打包算法
  const { result: finalPack, boxes: finalBoxes } = smartPacking(
    rectangles,
    spacing,
  );

  // 转换回业务格式
  const layout: PlacedRectangle[] = finalBoxes.map((box) => {
    const originalRect = rectangles[box.index];
    if (!originalRect) {
      throw new Error(`Invalid index ${box.index}`);
    }

    return {
      x: box.x,
      y: box.y,
      width: box.isRotated ? originalRect.length : originalRect.width,
      length: box.isRotated ? originalRect.width : originalRect.length,
      rotated: !!box.isRotated,
      originalIndex: box.index,
    };
  });

  //根据间距规则计算两个元素之间应有的间距
  function calculateSpacingBetweenElements(totalLength: number): number {
    return marginSpaceRules.find(rule => totalLength <= rule.maxLength)?.spacing ?? 0;
  }
  //计算横向总间距，遍历每一行，根据两个元素的长度来计算这两个元素之间的间距，得出间距之和，为这一行的总间距，最后取各行总间距的最大值 
  function calculateHorizontalSpacing(layout: PlacedRectangle[]): number {
    // 如果没有元素或只有一个元素，返回0
    if (layout.length <= 1) return 0;
  
    // 按y坐标分组，找出同一行的元素
    const rowGroups = new Map<number, PlacedRectangle[]>();
    
    layout.forEach(rect => {
      const y = Math.round(rect.y * 100) / 100; // 处理浮点数精度问题
      if (!rowGroups.has(y)) {
        rowGroups.set(y, []);
      }
      rowGroups.get(y)?.push(rect);
    });
  
    let maxRowSpacing = 0;
  
    // 遍历每一行
    rowGroups.forEach(rowRects => {
      // 如果这一行只有一个元素，跳过
      if (rowRects.length <= 1) return;
  
      // 按x坐标排序
      const sortedRects = rowRects.sort((a, b) => a.x - b.x);
      let rowSpacing = 0;
  
      // 计算相邻元素之间的间距
      for (let i = 0; i < sortedRects.length - 1; i++) {
        const currentRect = sortedRects[i];
        const nextRect = sortedRects[i + 1];
        
        // 计算两个元素的总长度
        const combinedLength = (currentRect?.length ?? 0) + (nextRect?.length ?? 0);
        
        // 使用 calculateSpacingBetweenElements 计算间距
        const spacing = calculateSpacingBetweenElements(combinedLength);
        rowSpacing += spacing;
      }
  
      // 更新最大行间距
      maxRowSpacing = Math.max(maxRowSpacing, rowSpacing);
    });
  
    return maxRowSpacing;
  }
  
  //计算纵向总间距，遍历每一列，根据两个元素的宽度来计算这两个元素之间的间距，得出间距之和，为这一列的总间距，最后取各列总间距的最大值
  function calculateVerticalSpacing(layout: PlacedRectangle[]): number {  
    // 如果没有元素或只有一个元素，返回0
    if (layout.length <= 1) return 0;

    //   按x坐标分组，找出同一列的元素
    const columnGroups = new Map<number, PlacedRectangle[]>();

    layout.forEach(rect => {
      const x = Math.round(rect.x * 100) / 100; // 处理浮点数精度问题
      if (!columnGroups.has(x)) {
        columnGroups.set(x, []);
      }
      columnGroups.get(x)?.push(rect);
    });

    let maxColumnSpacing = 0;

    // 遍历每一列
    columnGroups.forEach(columnRects => { 
      // 如果这一列只有一个元素，跳过
      if (columnRects.length <= 1) return;

      // 按y坐标排序
      const sortedRects = columnRects.sort((a, b) => a.y - b.y);
      let columnSpacing = 0;

      // 计算相邻元素之间的间距
      for (let i = 0; i < sortedRects.length - 1; i++) {
        const currentRect = sortedRects[i];
        const nextRect = sortedRects[i + 1];
        
        // 计算两个元素的总宽度
        const combinedWidth = (currentRect?.width ?? 0) + (nextRect?.width ?? 0);
        
        // 使用 calculateSpacingBetweenElements 计算间距
        const spacing = calculateSpacingBetweenElements(combinedWidth);
        columnSpacing += spacing;
      }

      // 更新最大列间距
      maxColumnSpacing = Math.max(maxColumnSpacing, columnSpacing);
    });   

    return maxColumnSpacing;
  }


  return {
    width: finalPack.w - spacing,
    length: finalPack.h - spacing,
    area: (finalPack.w - spacing) * (finalPack.h - spacing),
    rotation: layout.some((rect) => rect.rotated),
    spacing,
    layout,
  };
}

async function calculateMargin(totalLength: number): Promise<number> {
  const moldBorderSettingList = await getMoldBorderSettingList();
  if(!moldBorderSettingList.length){
    return 0;
  }
  return (moldBorderSettingList.find(rule => totalLength <= rule.maxLength)?.spacing ?? 0) * 2;
}

export async function calculateEdgeMargin(length: number, width: number): Promise<number> {
  const verticalMargin =  await calculateMargin(width) / 2
  const horizontalMargin = await calculateMargin(length) / 2
  
  if(verticalMargin > horizontalMargin){
    return verticalMargin
  } else {
    return horizontalMargin;
  }
}

export function getRandomMold() {
  const randomIndex = Math.floor(Math.random() * moldMaterialList.length);
  return moldMaterialList[randomIndex];
}

export function calculateMoldWeight(length: number, width: number, height: number, edgeMargin: number): number {
  // const moldConstantSettingList = await getMoldConstantSettingList();
  // const defaultMoldMaterialDensity = moldConstantSettingList.find(rule => rule.constantName === 'defaultMoldMaterialDensity')?.constantValue ?? 0.00000785;

  const moldVolume = 
      (length + edgeMargin * 2) *
      (width + edgeMargin * 2) *
      height;
  
  return moldVolume * defaultMoldMaterialDensity;

}

export async function calculateBottomMargin(maxProductHeight: number): Promise<number> {
  const moldHeightSettingList = await getMoldHeightSettingList();
  if(!moldHeightSettingList.length){
    return 0;
  }
  return maxProductHeight + (
    moldHeightSettingList.find(rule => maxProductHeight <= rule.maxHeight)?.height ?? 0
  );
}