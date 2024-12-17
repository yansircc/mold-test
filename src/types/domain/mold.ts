import type { Product } from "./product";
import type { Bounds3D } from "../core/geometry";

/**
 * 模具基本信息
 */
export interface MoldBase {
  id: number; // 模具ID
  name: string; // 模具名称
  type: string; // 模具类型
  capacity: number; // 容量
  bounds?: Bounds3D; // 边界尺寸
}

/**
 * 模具完整信息
 */
export interface Mold extends MoldBase {
  products: Product[]; // 关联产品
  material?: string; // 材料
  process?: string; // 工艺
  constraints?: {
    // 约束条件
    minProducts?: number; // 最小产品数
    maxProducts?: number; // 最大产品数
    spacing?: number; // 产品间距
    orientation?: string; // 方向限制
  };
  metadata?: {
    // 元数据
    manufacturer?: string; // 制造商
    lifetime?: number; // 使用寿命
    cost?: number; // 成本
    [key: string]: unknown; // 其他元数据
  };
}
