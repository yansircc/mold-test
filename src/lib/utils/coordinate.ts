import type { Rectangle } from "@/types/core/geometry";

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface LayoutItemWithHeight extends Rectangle {
  height: number;
}

export interface LayoutItem {
  center: Point2D;
  weight: number;
  dimensions: Rectangle;
}

/**
 * 计算2D布局项的中心点
 */
export function calculate2DCenter(rect: Rectangle): Point2D {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.length / 2,
  };
}

/**
 * 计算3D布局项的中心点
 * @param rect 带高度的布局项
 * @returns 3D坐标点（y轴为高度）
 */
export function calculate3DCenter(rect: LayoutItemWithHeight): Point3D {
  return {
    x: rect.x + rect.width / 2,
    y: rect.height / 2,
    z: rect.y + rect.length / 2,
  };
}

/**
 * 计算布局项的尺寸
 */
export function calculateDimensions(rect: LayoutItemWithHeight) {
  return {
    width: rect.width,
    height: rect.height,
    length: rect.length,
  };
}

/**
 * 转换为Three.js坐标系（可选的缩放）
 * @param point 3D坐标点
 * @param scale 缩放比例，默认为1/100
 */
export function toThreeJSCoordinates(point: Point3D, scale = 0.01) {
  return {
    x: point.x * scale,
    y: point.y * scale,
    z: point.z * scale,
  };
}

/**
 * 创建一个带有高度的布局项
 * @param rect 2D矩形
 * @param height 高度
 */
export function createLayoutItemWithHeight(
  rect: Rectangle,
  height: number
): LayoutItemWithHeight {
  return {
    ...rect,
    height,
  };
}

/**
 * 计算多个产品的加权中心点
 * @param items 带有中心点和权重的项目列表
 * @param defaultCenter 如果无法计算中心点时的默认值
 * @returns 加权中心点
 */
export function calculateWeightedCenter<T extends { center: Point2D; weight: number }>(
  items: T[],
  defaultCenter: Point2D
): Point2D {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  if (totalWeight === 0 || items.length === 0) {
    return defaultCenter;
  }

  return items.reduce(
    (sum, item) => ({
      x: sum.x + (item.center.x * item.weight) / totalWeight,
      y: sum.y + (item.center.y * item.weight) / totalWeight,
    }),
    { x: 0, y: 0 }
  );
}

/**
 * 计算多个3D点的加权中心点
 * @param items 带有中心点和权重的3D项目列表
 * @param defaultCenter 如果无法计算中心点时的默认值
 * @returns 加权中心点
 */
export function calculateWeighted3DCenter<T extends { center: Point3D; weight: number }>(
  items: T[],
  defaultCenter: Point3D
): Point3D {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  if (totalWeight === 0 || items.length === 0) {
    return defaultCenter;
  }

  return items.reduce(
    (sum, item) => ({
      x: sum.x + (item.center.x * item.weight) / totalWeight,
      y: sum.y + (item.center.y * item.weight) / totalWeight,
      z: sum.z + (item.center.z * item.weight) / totalWeight,
    }),
    { x: 0, y: 0, z: 0 }
  );
}
