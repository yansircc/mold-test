import type { Rectangle, Point2D } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";
import type { DetailedFlowScore, FlowPath } from "@/types/algorithm/balance/types";

/**
 * 计算流动路径信息
 */
function calculateFlowPath(
  rect: Rectangle,
  injectionPoint: Point2D,
): FlowPath {
  const center: Point2D = {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.length / 2,
  };

  // 计算流动距离（从注胶点到产品中心的距离）
  const distance = Math.sqrt(
    Math.pow(center.x - injectionPoint.x, 2) +
    Math.pow(center.y - injectionPoint.y, 2),
  );

  // 计算流动阻力（基于距离和面积）
  const resistance = distance * (rect.width * rect.length);

  // 归一化值（后续会用于计算平衡性）
  const normalized = distance / resistance;

  return {
    distance,
    resistance,
    center,
    normalized,
  };
}

/**
 * 计算流动平衡分数
 */
export function calculateDetailedFlowScore(
  layout: Rectangle[],
  products: Product[],
  injectionPoint: Point2D,
): DetailedFlowScore {
  // 1. 计算每个产品的流动路径
  const flowPaths = layout.map((rect) => calculateFlowPath(rect, injectionPoint));

  // 2. 计算流动路径平衡性
  const distances = flowPaths.map((path) => path.distance);
  const maxDistance = Math.max(...distances);
  const minDistance = Math.min(...distances);
  const flowPathBalance = Math.max(
    0,
    100 * (1 - (maxDistance - minDistance) / maxDistance),
  );

  // 3. 计算表面积平衡性
  const surfaceAreas = products.map((p) => p.cadData?.surfaceArea ?? 0);
  const maxArea = Math.max(...surfaceAreas);
  const minArea = Math.min(...surfaceAreas);
  const surfaceAreaBalance = Math.max(
    0,
    100 * (1 - (maxArea - minArea) / maxArea),
  );

  // 4. 计算体积平衡性
  const volumes = products.map((p) => p.cadData?.volume ?? 0);
  const maxVolume = Math.max(...volumes);
  const minVolume = Math.min(...volumes);
  const volumeBalance = Math.max(
    0,
    100 * (1 - (maxVolume - minVolume) / maxVolume),
  );

  // 5. 计算总体评分（加权平均）
  const weights = {
    flowPath: 0.4,
    surfaceArea: 0.3,
    volume: 0.3,
  };

  const overall = Math.min(
    100,
    weights.flowPath * flowPathBalance +
    weights.surfaceArea * surfaceAreaBalance +
    weights.volume * volumeBalance,
  );

  return {
    flowPathBalance,
    surfaceAreaBalance,
    overall,
  };
}
