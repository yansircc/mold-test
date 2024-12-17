import type { Point3D } from "@/types/core/geometry";
import type { SpatialStatistics3D } from "@/types/core/physics";

/**
 * 计算两点之间的3D欧氏距离
 */
function calculate3DDistance(
  p1: Point3D | undefined,
  p2: Point3D | undefined,
): number {
  if (!p1 || !p2) return 0;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 计算Ripley's K函数
 * 用于检测空间点模式是随机、聚集还是规则分布
 */
export function calculateRipleyK(
  points: Point3D[],
  radius: number,
  volume: number,
): Pick<SpatialStatistics3D, "ripleyK"> {
  let count = 0;
  const n = points.length;

  // 计算在给定半径内的点对数量
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (calculate3DDistance(points[i], points[j]) <= radius) {
        count += 2; // 每对计数两次（双向）
      }
    }
  }

  // 计算观察值K(r)
  const observed = (volume * count) / (n * (n - 1));
  // 计算期望值K(r)（完全空间随机分布）
  const expected = (4 * Math.PI * radius * radius * radius) / 3;

  return {
    ripleyK: {
      observed,
      expected,
      isCluster: observed > expected,
    },
  };
}

/**
 * 计算最近邻分析
 * 用于评估点的分布模式
 */
export function calculateNearestNeighbor(
  points: Point3D[],
  volume: number,
): Pick<SpatialStatistics3D, "nearestNeighbor"> {
  const n = points.length;
  if (n < 2) {
    return {
      nearestNeighbor: {
        averageDistance: 0,
        expectedDistance: 0,
        ratio: 1,
      },
    };
  }

  // 计算每个点到其最近邻的距离
  const distances = points.map((p1) => {
    const nearestDistance = Math.min(
      ...points
        .filter((p2) => p2 !== p1)
        .map((p2) => calculate3DDistance(p1, p2)),
    );
    return nearestDistance;
  });

  // 计算平均最近邻距离
  const averageDistance = distances.reduce<number>((sum, d) => sum + d, 0) / n;

  // 计算点密度
  const density = n / volume;

  // 计算期望最近邻距离（完全随机分布）
  const expectedDistance = 0.554 / Math.pow(density, 1 / 3);

  // 计算最近邻指数
  const ratio = averageDistance / expectedDistance;

  return {
    nearestNeighbor: {
      averageDistance,
      expectedDistance,
      ratio,
    },
  };
}

/**
 * 计算空间分布的熵
 * 用于评估分布的均匀性
 */
export function calculateSpatialEntropy(
  points: Point3D[],
  gridSize: number,
): Pick<SpatialStatistics3D, "entropy"> {
  // 创建3D网格
  const grid = new Map<string, number>();

  // 找到空间范围
  const bounds = points.reduce<{ min: Point3D; max: Point3D }>(
    (acc, p) => ({
      min: {
        x: Math.min(acc.min.x, p.x),
        y: Math.min(acc.min.y, p.y),
        z: Math.min(acc.min.z, p.z),
      },
      max: {
        x: Math.max(acc.max.x, p.x),
        y: Math.max(acc.max.y, p.y),
        z: Math.max(acc.max.z, p.z),
      },
    }),
    {
      min: { x: Infinity, y: Infinity, z: Infinity },
      max: { x: -Infinity, y: -Infinity, z: -Infinity },
    },
  );

  // 将点分配到网格中
  points.forEach((p) => {
    const gridX = Math.floor((p.x - bounds.min.x) / gridSize);
    const gridY = Math.floor((p.y - bounds.min.y) / gridSize);
    const gridZ = Math.floor((p.z - bounds.min.z) / gridSize);
    const key = `${gridX},${gridY},${gridZ}`;
    grid.set(key, (grid.get(key) ?? 0) + 1);
  });

  // 计算熵
  let entropy = 0;
  const totalPoints = points.length;
  grid.forEach((count) => {
    const p = count / totalPoints;
    entropy -= p * Math.log2(p);
  });

  // 计算最大可能熵（均匀分布）
  const maxEntropy = Math.log2(grid.size || 1);

  // 归一化熵值
  const normalized = maxEntropy === 0 ? 1 : entropy / maxEntropy;

  return {
    entropy: {
      value: entropy,
      normalized,
    },
  };
}

/**
 * 计算空间分布的四分位数
 * 用于评估分布的离散程度
 */
export function calculateQuartiles(
  points: Point3D[],
  centerOfMass: Point3D,
): Pick<SpatialStatistics3D, "quartiles"> {
  // 计算到质心的距离
  const distances = points
    .map((p) => calculate3DDistance(p, centerOfMass))
    .sort((a, b) => a - b);

  const n = distances.length;
  if (n === 0) {
    return {
      quartiles: {
        q1: 0,
        q2: 0,
        q3: 0,
        iqr: 0,
      },
    };
  }

  // 计算四分位数索引
  const q1Index = Math.floor(n * 0.25);
  const q2Index = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);

  // 安全获取四分位数值
  const q1 = distances[q1Index] ?? 0;
  const q2 = distances[q2Index] ?? 0;
  const q3 = distances[q3Index] ?? 0;
  const iqr = q3 - q1;

  return {
    quartiles: {
      q1,
      q2,
      q3,
      iqr,
    },
  };
}

/**
 * 综合空间统计分析
 */
export function analyzeSpatialDistribution(
  points: Point3D[],
  centerOfMass: Point3D,
  volume: number,
  gridSize = 1,
  radius = 1,
): SpatialStatistics3D {
  return {
    ...calculateRipleyK(points, radius, volume),
    ...calculateNearestNeighbor(points, volume),
    ...calculateSpatialEntropy(points, gridSize),
    ...calculateQuartiles(points, centerOfMass),
  };
}
