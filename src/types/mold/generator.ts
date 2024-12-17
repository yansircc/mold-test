import { type Mesh, type LineSegments, DoubleSide } from "three";
import { type Brush } from "three-bvh-csg";

/**
 * 模具尺寸
 */
export interface MoldDimensions {
  width: number; // 宽度（毫米）
  length: number; // 长度（毫米）
  height: number; // 高度（毫米）
}

/**
 * 模具材质选项
 */
export interface MoldMaterialOptions {
  color?: number; // 颜色（十六进制）
  opacity?: number; // 不透明度 (0-1)
  metalness?: number; // 金属度 (0-1)
  roughness?: number; // 粗糙度 (0-1)
  clearcoat?: number; // 清漆强度 (0-1)
  clearcoatRoughness?: number; // 清漆粗糙度 (0-1)
}

/**
 * 模具边距选项
 */
export interface MoldMarginOptions {
  xy?: number; // 水平边距（毫米）
  z?: number; // 垂直边距（毫米）
}

/**
 * 凹槽选项
 */
export interface CavityOptions {
  margin?: number; // 凹槽边距（毫米）
}

/**
 * 模具生成器选项
 */
export interface MoldGeneratorOptions {
  material?: MoldMaterialOptions; // 材质选项
  margin?: MoldMarginOptions; // 边距选项
  cavity?: CavityOptions; // 凹槽选项
}

/**
 * 模具生成器结果
 */
export interface MoldGeneratorResult {
  mold: Brush;
  wireframes: LineSegments[]; // 使用导入的 LineSegments 类型
  centerMarkers: Mesh[];
  dimensions: MoldDimensions;
}

/**
 * 模具生成器常量
 */
export const MOLD_CONSTANTS = {
  DEFAULT_MARGIN: {
    XY: 50, // 默认水平边距（毫米）
    Z: 10, // 默认垂直边距（毫米）
  },
  DEFAULT_CAVITY_MARGIN: 0.2, // 默认凹槽边距（毫米）
  WIREFRAME_SCALE: 1.001, // 线框缩放比例
  WIREFRAME_LINEWIDTH: 0.5, // 线框线宽
  WIREFRAME_HEIGHT_SCALE: 0.01, // 线框高度缩放比例
  DEFAULT_MOLD_OPTIONS: {
    color: 0x88ccee, // 淡蓝色
    opacity: 0.85, // 略微透明
    metalness: 0.1, // 低金属度，更像塑料
    roughness: 0.2, // 较光滑
    clearcoat: 1.0, // 强清漆效果
    clearcoatRoughness: 0.1, // 光滑的清漆
    side: DoubleSide,
  },
  DEFAULT_WIREFRAME_OPTIONS: {
    color: 0x333333,
    opacity: 0.1,
    linewidth: 0.5,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    depthTest: true,
    depthWrite: true,
  },
} as const;
