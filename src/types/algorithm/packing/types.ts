/**
 * Potpack 算法的输入盒子格式
 */
export interface PotpackBox {
  w: number; // 宽度
  h: number; // 高度
  index: number; // 原始索引
  isRotated?: boolean; // 是否旋转
}

/**
 * 打包后的盒子格式，包含位置信息
 */
export interface PackedBox extends PotpackBox {
  x: number; // X 坐标
  y: number; // Y 坐标
}

/**
 * Potpack 算法的返回结果
 */
export interface PotpackResult {
  w: number; // 总宽度
  h: number; // 总高度
  fill: number; // 填充率
}

/**
 * 打包算法的最终结果
 */
export interface PackResult {
  result: PotpackResult; // potpack 的原始结果
  boxes: PackedBox[]; // 打包后的盒子列表
}
