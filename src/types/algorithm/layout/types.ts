import type { Rectangle } from "@/types/core/geometry";

/**
 * 天际线算法的节点
 */
export interface SkylineNode {
  x: number; // 节点的X坐标
  y: number; // 节点的Y坐标（高度）
  width: number; // 节点的宽度
}

/**
 * 已放置的矩形，包含位置和旋转信息
 */
export interface PlacedRectangle extends Rectangle {
  rotated: boolean; // 是否旋转
  originalIndex: number; // 原始序号
  margin?: number; // 自动计算的边距
}

/**
 * 面积计算结果
 */
export interface AreaResult {
  length: number; // 总长度
  width: number; // 总宽度
  area: number; // 总面积
  rotation: boolean; // 是否旋转
  spacing: number; // 间距
  layout: PlacedRectangle[]; // 布局结果，使用PlacedRectangle
}
