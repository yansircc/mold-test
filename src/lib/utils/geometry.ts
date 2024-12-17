import type { Rectangle, Point2D, Point3D } from "@/types/core/geometry";
import type { Product, FlowPathInfo } from "@/types/domain/product";
/**
 * 计算矩形的中心点
 */
export function calculateRectCenter(rect: Rectangle): Point2D {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.length / 2,
  };
}

/**
 * 计算两点之间的距离
 */
export function calculateDistance(point1: Point2D, point2: Point2D): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算多个点的加权中心点
 */
export function calculateWeightedCenter(
  points: Point2D[],
  weights: number[],
): Point2D {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  return {
    x: points.reduce((sum, p, i) => sum + p.x * weights[i]!, 0) / totalWeight,
    y: points.reduce((sum, p, i) => sum + p.y * weights[i]!, 0) / totalWeight,
  };
}

/**
 * 将2D点转换为3D点（z坐标为0）
 */
export function convertPoint2Dto3D(point: Point2D, z = 0): Point3D {
  return {
    x: point.x,
    y: point.y,
    z,
  };
}

/**
 * 判断点是否在矩形内
 */
export function isPointInRect(point: Point2D, rect: Rectangle): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.length
  );
}

/**
 * 获取默认注胶点位置
 * 根据所有产品的布局计算一个合理的默认注胶点
 */
export function getDefaultInjectionPoint(
  products: Product[],
  layout: Rectangle[],
): Point2D {
  // 默认使用所有产品中心点的加权平均位置
  const centers = layout.map((rect) => calculateRectCenter(rect));
  const weights = products.map((p) => p.cadData?.volume ?? 1);

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  return {
    x: centers.reduce((sum, c, i) => sum + c.x * weights[i]!, 0) / totalWeight,
    y: centers.reduce((sum, c, i) => sum + c.y * weights[i]!, 0) / totalWeight,
  };
}

/**
 * 计算流动路径信息
 */
export function calculateFlowPathInfo(
  product: Product,
  layout: Rectangle,
  injectionPoint: Point2D,
): FlowPathInfo {
  const center = calculateRectCenter(layout);

  return {
    length: calculateDistance(injectionPoint, center),
    path: [injectionPoint, center],
  };
}
