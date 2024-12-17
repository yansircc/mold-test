import type { Point2D, Rectangle } from "@/types/core/geometry";

/**
 * Calculate distance between two 2D points
 * 计算两点间距离，单位为毫米
 */
export function calculateDistance(p1: Point2D, p2: Point2D): number {
  // Convert to millimeters and use absolute values
  // 转换为毫米并使用绝对值
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  const distanceInMm = Math.sqrt(dx * dx + dy * dy);
  return distanceInMm;
}

/**
 * Calculate center point of a rectangle
 * 计算矩形中心点
 */
export function calculateRectCenter(rect: Rectangle): Point2D {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.length / 2,
  };
}

/**
 * Calculate optimal injection point for a layout
 * 计算最优注胶点
 */
export function calculateInjectionPoint(layout: Rectangle[]): Point2D {
  // Currently using simple center of mass
  // 目前使用简单的质心计算
  const totalArea = layout.reduce(
    (sum, rect) => sum + rect.width * rect.length,
    0,
  );

  const centerX =
    layout.reduce(
      (sum, rect) =>
        sum + (rect.x + rect.width / 2) * (rect.width * rect.length),
      0,
    ) / totalArea;

  const centerY =
    layout.reduce(
      (sum, rect) =>
        sum + (rect.y + rect.length / 2) * (rect.width * rect.length),
      0,
    ) / totalArea;

  return { x: centerX, y: centerY };
}
