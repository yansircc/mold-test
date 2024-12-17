import type { Point3D } from "@/types/core/geometry";

/**
 * 对称性分析结果
 */
interface SymmetryAnalysis {
  // 轴对称性
  axial: {
    x: number; // x轴对称性 (0-1)
    y: number; // y轴对称性 (0-1)
    z: number; // z轴对称性 (0-1)
  };
  // 面对称性
  planar: {
    xy: number; // xy平面对称性 (0-1)
    xz: number; // xz平面对称性 (0-1)
    yz: number; // yz平面对称性 (0-1)
  };
  // 点对称性（中心对称）
  central: number; // 中心对称性 (0-1)
  // 整体对称性
  overall: number; // 综合对称性得分 (0-1)
}

/**
 * 计算点关于平面的镜像点
 */
function mirrorPoint(
  point: Point3D,
  plane: "xy" | "xz" | "yz",
  center: Point3D,
): Point3D {
  const mirrored = { ...point };
  switch (plane) {
    case "xy":
      mirrored.z = 2 * center.z - point.z;
      break;
    case "xz":
      mirrored.y = 2 * center.y - point.y;
      break;
    case "yz":
      mirrored.x = 2 * center.x - point.x;
      break;
  }
  return mirrored;
}

/**
 * 计算点关于轴的旋转点集
 * 对于模具，只需要考虑Z轴（垂直轴）的90度旋转
 * 因为模具只在水平面内旋转，高度不参与旋转
 */
function rotatePoints(
  point: Point3D,
  axis: "x" | "y" | "z",
  center: Point3D,
): Point3D[] {
  const rotated: Point3D[] = [];

  // 只有在Z轴旋转时才生成旋转点
  if (axis === "z") {
    // 90度旋转
    const angle = Math.PI / 2;
    const rotatedPoint: Point3D = {
      x:
        center.x +
        (point.x - center.x) * Math.cos(angle) -
        (point.y - center.y) * Math.sin(angle),
      y:
        center.y +
        (point.x - center.x) * Math.sin(angle) +
        (point.y - center.y) * Math.cos(angle),
      z: point.z, // 保持Z坐标不变
    };
    rotated.push(rotatedPoint);

    // 180度旋转
    const rotatedPoint180: Point3D = {
      x:
        center.x +
        (point.x - center.x) * Math.cos(Math.PI) -
        (point.y - center.y) * Math.sin(Math.PI),
      y:
        center.y +
        (point.x - center.x) * Math.sin(Math.PI) +
        (point.y - center.y) * Math.cos(Math.PI),
      z: point.z, // 保持Z坐标不变
    };
    rotated.push(rotatedPoint180);
  }

  // 添加原始点作为0度旋转的情况
  rotated.unshift({ ...point });

  return rotated;
}

/**
 * 计算点关于中心的对称点
 */
function centralSymmetryPoint(point: Point3D, center: Point3D): Point3D {
  return {
    x: 2 * center.x - point.x,
    y: 2 * center.y - point.y,
    z: 2 * center.z - point.z,
  };
}

/**
 * 计算两点之间的距离
 */
function distance3D(p1: Point3D | undefined, p2: Point3D | undefined): number {
  if (!p1 || !p2) return Infinity;
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 计算点到最近点的距离
 */
function findMinDistance(point: Point3D, points: Point3D[]): number {
  if (!points.length) return Infinity;
  return Math.min(...points.map((p) => distance3D(point, p)));
}

/**
 * 计算轴对称性
 * 对于模具，我们只关注Z轴的旋转对称性
 */
function calculateAxialSymmetry(
  points: Point3D[],
  masses: number[],
  center: Point3D,
): Pick<SymmetryAnalysis, "axial"> {
  let zAxisSymmetry = 0;
  let totalMass = 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const mass = masses[i] ?? 0;
    if (!point || mass <= 0) continue;

    totalMass += mass;
    const rotated = rotatePoints(point, "z", center);
    const minDistance = findMinDistance(point, rotated);
    zAxisSymmetry += (1 - minDistance) * mass;
  }

  return {
    axial: {
      x: 0, // 不考虑X轴旋转
      y: 0, // 不考虑Y轴旋转
      z: totalMass > 0 ? zAxisSymmetry / totalMass : 1, // 只考虑Z轴旋转
    },
  };
}

/**
 * 计算面对称性
 */
function calculatePlanarSymmetry(
  points: Point3D[],
  masses: number[],
  center: Point3D,
): Pick<SymmetryAnalysis, "planar"> {
  const planes: Array<"xy" | "xz" | "yz"> = ["xy", "xz", "yz"];
  const symmetryScores = planes.map((plane) => {
    let totalScore = 0;
    let totalMass = 0;

    points.forEach((point, i) => {
      const mirrored = mirrorPoint(point, plane, center);
      const minDistance = findMinDistance(mirrored, points);
      const maxDimension = Math.max(
        Math.abs(point.x - center.x),
        Math.abs(point.y - center.y),
        Math.abs(point.z - center.z),
      );
      const score = Math.max(0, 1 - minDistance / (2 * maxDimension || 1));
      totalScore += score * (masses[i] ?? 0);
      totalMass += masses[i] ?? 0;
    });

    return totalMass > 0 ? totalScore / totalMass : 1;
  });

  return {
    planar: {
      xy: symmetryScores[0] ?? 1,
      xz: symmetryScores[1] ?? 1,
      yz: symmetryScores[2] ?? 1,
    },
  };
}

/**
 * 计算中心对称性
 */
function calculateCentralSymmetry(
  points: Point3D[],
  masses: number[],
  center: Point3D,
): Pick<SymmetryAnalysis, "central"> {
  let totalScore = 0;
  let totalMass = 0;

  points.forEach((point, i) => {
    const symmetricPoint = centralSymmetryPoint(point, center);
    const minDistance = findMinDistance(symmetricPoint, points);
    const maxDimension = Math.max(
      Math.abs(point.x - center.x),
      Math.abs(point.y - center.y),
      Math.abs(point.z - center.z),
    );
    const score = Math.max(0, 1 - minDistance / (2 * maxDimension || 1));
    totalScore += score * (masses[i] ?? 0);
    totalMass += masses[i] ?? 0;
  });

  return {
    central: totalMass > 0 ? totalScore / totalMass : 1,
  };
}

/**
 * 综合对称性分析
 */
export function analyzeSymmetry(
  points: Point3D[],
  masses: number[],
  center: Point3D,
): SymmetryAnalysis {
  const axial = calculateAxialSymmetry(points, masses, center);
  const planar = calculatePlanarSymmetry(points, masses, center);
  const central = calculateCentralSymmetry(points, masses, center);

  // 计算综合对称性得分
  // 权重分配：
  // - 面对称性：60%（xy和xz各25%，yz 10%）
  // - 轴对称性：30%（z轴旋转）
  // - 中心对称性：10%
  const overall =
    planar.planar.xy * 0.25 +
    planar.planar.xz * 0.25 +
    planar.planar.yz * 0.1 +
    axial.axial.z * 0.3 +
    central.central * 0.1;

  return {
    ...axial,
    ...planar,
    ...central,
    overall,
  };
}
