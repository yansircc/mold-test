import type { Point2D, Point3D, Rectangle2D } from "../core/geometry";
/**
 * 3D尺寸
 */
export interface Dimensions3D {
  width: number; // 宽度
  length: number; // 长度
  height: number; // 高度
}

/**
 * 产品基本信息
 */
export interface ProductBase {
  id: number; // 产品ID
  name: string; // 产品名称
  dimensions?: Dimensions3D; // 产品尺寸
  weight?: number; // 产品重量
}

/**
 * 获取产品的2D尺寸
 */
export function getProductDimensions(product: Product): Rectangle2D {
  const length =
    product.dimensions?.length ??
    product.cadData?.boundingBox.dimensions.x ??
    0;
  const width =
    product.dimensions?.width ?? product.cadData?.boundingBox.dimensions.y ?? 0;
  return { length, width };
}

/**
 * 获取产品的最大尺寸
 */
export function getProductMaxDimension(product: Product): number {
  const { length, width } = getProductDimensions(product);
  return Math.max(length, width);
}

/**
 * CAD 边界盒
 */
export interface CADBoundingBox {
  center: Point3D;
  dimensions: Point3D;
  rotation?: Point3D;
}

/**
 * CAD 拓扑信息
 */
interface CADTopology {
  vertices: number;
  edges: number;
  faces: number;
  shells: number;
}

/**
 * CAD 特征信息
 */
interface CADFeatures {
  holes?: number;
  ribs?: number;
  bosses?: number;
  fillets?: number;
  chamfers?: number;
}

/**
 * CAD 数据
 */
export interface CADData {
  boundingBox: CADBoundingBox;
  topology?: CADTopology;
  features?: CADFeatures;
  volume: number;
  surfaceArea: number;
  centerOfMass: Point3D;
  momentOfInertia?: Point3D;
  format?: string; // 例如: "STEP", "STL"
  version?: string; // CAD文件版本
  lastModified?: Date; // 最后修改时间
}

/**
 * 注胶点位置配置
 */
export interface InjectionPointConfig {
  // 手动指定的注胶点位置
  manual?: Point2D;
  // 自动计算注胶点的策略
  strategy?: "center" | "edge" | "corner" | "weighted-center";
}

/**
 * 流动路径信息
 */
export interface FlowPathInfo {
  // 注胶点到产品中心的距离
  length: number;
  // 注胶点到产品中心的路径
  path: Point2D[];
}

/**
 * 产品完整信息
 */
export interface Product extends ProductBase {
  material?: string; // 材料
  quantity?: number; // 数量
  position?: Point3D; // 3D位置
  rotation?: number; // 旋转角度
  priority?: number; // 优先级
  volume?: number;
  density?: number;
  materialName?: string;
  color?:string;
  constraints?: {
    // 约束条件
    minSpacing?: number; // 最小间距
    maxSpacing?: number; // 最大间距
    orientation?: string; // 方向限制
    placement?: string; // 放置限制
  };
  metadata?: {
    // 元数据
    category?: string; // 产品类别
    complexity?: number; // 复杂度
    tolerance?: number; // 公差
    [key: string]: unknown; // 其他元数据
  };
  cadData?: CADData; // 添加 CAD 数据字段
  flowData?: {
    // 手动指定的流动长度（优先级最高）
    manualFlowLength?: number;
    // 计算得到的流动路径信息
    calculatedFlowPath?: FlowPathInfo;
  };
}
