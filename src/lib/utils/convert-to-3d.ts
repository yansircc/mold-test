import type { Rectangle, Point3D } from "@/types/core/geometry";

/**
 * 将2D矩形的中心点转换为3D点
 * @param rectangle 2D矩形
 * @param height 高度值（z坐标）
 * @returns 3D点
 */
export function convertTo3D(rectangle: Rectangle, height: number): Point3D {
  return {
    x: rectangle.x + rectangle.width / 2, // 中心点x坐标
    y: rectangle.y + rectangle.length / 2, // 中心点y坐标
    z: height, // 高度作为z坐标
  };
}
