import type { Point3D, Rectangle } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";
import type {
  InertiaTensor3D,
  PrincipalComponents3D,
} from "@/types/core/physics";
import { SpatialIndex } from "./spatial-index";
import { convertTo3D } from "@/lib/utils/convert-to-3d";

/**
 * 计算点到质心的加权和
 * @param points 质点位置数组
 * @param validMasses 已验证的质量数组（必须为正数）
 * @throws 如果数组长度不匹配
 */
function calculateWeightedSum(
  points: Point3D[],
  validMasses: readonly number[],
): { x: number; y: number; z: number } {
  if (!Array.isArray(points) || !validMasses) {
    throw new Error(
      "Invalid input: points must be an array and validMasses must be defined",
    );
  }

  if (points.length !== validMasses.length) {
    throw new Error("Points and masses arrays must have the same length");
  }

  return points.reduce<{ x: number; y: number; z: number }>(
    (sum, point, i) => {
      const mass = validMasses[i];
      if (typeof mass !== "number" || mass <= 0) {
        throw new Error(
          `Invalid mass at index ${i}: mass must be a positive number`,
        );
      }

      // 使用空值合并运算符确保坐标值有效
      const x = (point?.x ?? 0) * mass;
      const y = (point?.y ?? 0) * mass;
      const z = (point?.z ?? 0) * mass;

      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        throw new Error(`Invalid weighted coordinates at index ${i}`);
      }

      return {
        x: sum.x + x,
        y: sum.y + y,
        z: sum.z + z,
      };
    },
    { x: 0, y: 0, z: 0 },
  );
}

/**
 * 计算点到质心的加权距离
 * @param points 质点位置数组
 * @param validMasses 已验证的质量数组（必须为正数）
 * @param centerOfMass 质心坐标
 * @throws 如果数组长度不匹配或质量无效
 */
function calculateWeightedDistances(
  points: Point3D[],
  validMasses: readonly number[],
  centerOfMass: Point3D,
): number[] {
  if (!Array.isArray(points) || !validMasses || !centerOfMass) {
    throw new Error(
      "Invalid input: points must be an array, validMasses and centerOfMass must be defined",
    );
  }

  if (points.length !== validMasses.length) {
    throw new Error("Points and masses arrays must have the same length");
  }

  // 预先分配数组大小，避免动态扩容
  const result = new Array<number>(points.length).fill(0);

  // 缓存质心坐标，避免重复访问
  const cx = centerOfMass?.x ?? 0;
  const cy = centerOfMass?.y ?? 0;
  const cz = centerOfMass?.z ?? 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const mass = validMasses[i];

    if (typeof mass !== "number" || mass <= 0) {
      throw new Error(
        `Invalid mass at index ${i}: mass must be a positive number`,
      );
    }

    // 使用空值合并运算符确保坐标值有效
    const dx = (point?.x ?? 0) - cx;
    const dy = (point?.y ?? 0) - cy;
    const dz = (point?.z ?? 0) - cz;

    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (!Number.isFinite(distance)) {
      throw new Error(`Invalid distance calculation at index ${i}`);
    }

    const weightedDistance = distance * mass;
    if (!Number.isFinite(weightedDistance)) {
      throw new Error(`Invalid weighted distance at index ${i}`);
    }

    result[i] = weightedDistance;
  }

  return result;
}

/**
 * 计算点到反射点的最小距离
 * 使用空间索引优化搜索性能
 */
function calculateMinReflectionDistance(
  point: Point3D,
  reflectedPoints: Point3D[],
): number {
  if (
    !point ||
    !Array.isArray(reflectedPoints) ||
    reflectedPoints.length === 0
  ) {
    return 0;
  }

  // 创建空间索引
  const spatialIndex = new SpatialIndex(reflectedPoints);

  // 使用空间索引查找最近邻
  const nearest = spatialIndex.findNearestNeighbor(point);

  return nearest ? Math.sqrt(nearest.distance) : 0;
}

/**
 * 计算不对称度得分
 * @param points 质点位置数组
 * @param validMasses 已验证的质量数组（必须为正数）
 * @param reflectedPoints 反射点数组
 * @returns 不对称度得分 [0,1]
 */
function calculateAsymmetryScore(
  points: Point3D[],
  validMasses: readonly number[],
  reflectedPoints: Point3D[],
): number {
  if (
    !Array.isArray(points) ||
    !validMasses ||
    !Array.isArray(reflectedPoints)
  ) {
    throw new Error(
      "Invalid input: points and reflectedPoints must be arrays, validMasses must be defined",
    );
  }

  if (points.length !== validMasses.length) {
    throw new Error("Points and masses arrays must have the same length");
  }

  let totalMass = 0;
  let weightedSum = 0;

  // 合并循环，同时计算总质量和加权和
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    if (!point) continue;

    const mass = validMasses[i];
    if (typeof mass !== "number" || mass <= 0) {
      throw new Error(
        `Invalid mass at index ${i}: mass must be a positive number`,
      );
    }

    totalMass += mass;

    const minDistance = calculateMinReflectionDistance(point, reflectedPoints);
    if (!Number.isFinite(minDistance)) {
      throw new Error(`Invalid minimum distance calculation at index ${i}`);
    }

    const weightedDistance = minDistance * mass;
    if (!Number.isFinite(weightedDistance)) {
      throw new Error(`Invalid weighted distance at index ${i}`);
    }

    weightedSum += weightedDistance;
  }

  if (totalMass <= 0) {
    throw new Error("Total mass must be positive");
  }

  // 计算归一化的不对称度得分
  const normalizedScore = weightedSum / (points.length * totalMass);
  if (!Number.isFinite(normalizedScore)) {
    throw new Error("Invalid normalized asymmetry score calculation");
  }

  return normalizedScore;
}

/**
 * 计算平面对称性得分
 */
export function calculatePlaneSymmetry(
  points: Point3D[],
  masses: number[],
  centerOfMass: Point3D,
  axis: "x" | "y" | "z",
): number {
  if (!Array.isArray(points) || !Array.isArray(masses)) {
    throw new Error("Points and masses must be arrays");
  }

  if (points.length === 0 || masses.length === 0) {
    throw new Error("Points and masses arrays cannot be empty");
  }

  if (points.length !== masses.length) {
    throw new Error("Points and masses arrays must have the same length");
  }

  // 首先验证所有的质量都是有效的数字
  const validMasses = masses.map((mass) => {
    const numMass = Number(mass);
    if (isNaN(numMass) || numMass <= 0) {
      throw new Error("All masses must be positive numbers");
    }
    return numMass;
  });

  // 计算反射点
  const reflectedPoints = points
    .map((point) => {
      if (!point) return null;
      const reflected = { ...point };
      switch (axis) {
        case "x":
          reflected.x = 2 * (centerOfMass?.x ?? 0) - (point?.x ?? 0);
          break;
        case "y":
          reflected.y = 2 * (centerOfMass?.y ?? 0) - (point?.y ?? 0);
          break;
        case "z":
          reflected.z = 2 * (centerOfMass?.z ?? 0) - (point?.z ?? 0);
          break;
      }
      return reflected;
    })
    .filter((p): p is Point3D => p !== null);

  // 计算不对称度得分
  const asymmetryScore = calculateAsymmetryScore(
    points,
    validMasses,
    reflectedPoints,
  );

  // 返回对称度得分 (0-1)，0表示完全不对称，1表示完全对称
  return Math.max(0, Math.min(1, 1 - asymmetryScore));
}

/**
 * 计算3D转动惯量张量
 * @param points 质点位置数组
 * @param masses 对应的质量数组
 * @param centerOfMass 质心位置
 */
export function calculate3DInertiaTensor(
  points: Point3D[],
  masses: number[],
  centerOfMass: Point3D,
): InertiaTensor3D {
  let xx = 0,
    yy = 0,
    zz = 0;
  let xy = 0,
    xz = 0,
    yz = 0;

  points.forEach((point, i) => {
    const mass = masses[i] ?? 0;
    const dx = point.x - centerOfMass.x;
    const dy = point.y - centerOfMass.y;
    const dz = point.z - centerOfMass.z;

    // 计算对角元素
    xx += mass * (dy * dy + dz * dz);
    yy += mass * (dx * dx + dz * dz);
    zz += mass * (dx * dx + dy * dy);

    // 计算非对角元素
    xy -= mass * dx * dy;
    xz -= mass * dx * dz;
    yz -= mass * dy * dz;
  });

  return { xx, yy, zz, xy, xz, yz };
}

/**
 * 计算3D主轴和主力矩
 */
export function calculate3DPrincipalComponents(
  tensor: InertiaTensor3D,
): PrincipalComponents3D {
  // 构建惯量矩阵
  const matrix: [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ] = [
    [tensor.xx, tensor.xy, tensor.xz],
    [tensor.xy, tensor.yy, tensor.yz],
    [tensor.xz, tensor.yz, tensor.zz],
  ];

  // Jacobi迭代求解特征值和特征向量
  const { eigenvalues, eigenvectors } = jacobiEigenvalues(matrix);

  // 转换为所需格式
  const moments: [number, number, number] = eigenvalues;

  const axes: [Point3D, Point3D, Point3D] = [
    { x: eigenvectors[0][0], y: eigenvectors[1][0], z: eigenvectors[2][0] },
    { x: eigenvectors[0][1], y: eigenvectors[1][1], z: eigenvectors[2][1] },
    { x: eigenvectors[0][2], y: eigenvectors[1][2], z: eigenvectors[2][2] },
  ];

  return { moments, axes };
}

/**
 * Jacobi迭代法求解特征值和特征向量
 * 由于我们处理的是3x3矩阵，所以可以使用固定大小的类型
 */
type Matrix3D = [
  [number, number, number],
  [number, number, number],
  [number, number, number],
];
type Vector3D = [number, number, number];

function jacobiEigenvalues(
  matrix: readonly [
    readonly [number, number, number],
    readonly [number, number, number],
    readonly [number, number, number],
  ],
): {
  eigenvalues: Vector3D;
  eigenvectors: Matrix3D;
} {
  const n = 3;
  const eps = 1e-10; // 精度
  const maxIter = 100; // 最大迭代次数

  // 复制矩阵以避免修改输入
  const a: Matrix3D = [
    [matrix[0][0], matrix[0][1], matrix[0][2]],
    [matrix[1][0], matrix[1][1], matrix[1][2]],
    [matrix[2][0], matrix[2][1], matrix[2][2]],
  ];

  // 初始化特征向量矩阵为单位矩阵
  const v: Matrix3D = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  // 安全的矩阵元素访问函数
  function getElement(mat: Matrix3D, i: number, j: number): number {
    if (i >= 0 && i < n && j >= 0 && j < n) {
      const row = mat[i];
      if (row) {
        const element = row[j];
        return typeof element === "number" ? element : 0;
      }
    }
    return 0;
  }

  // 安全的矩阵元素设置函数
  function setElement(
    mat: Matrix3D,
    i: number,
    j: number,
    value: number,
  ): void {
    if (i >= 0 && i < n && j >= 0 && j < n) {
      const row = mat[i];
      if (row && Array.isArray(row)) {
        row[j] = value;
      }
    }
  }

  // 计算非对角元素的平方和
  function offDiagonalSum(): number {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          const val = getElement(a, i, j);
          sum += val * val;
        }
      }
    }
    return sum;
  }

  // 主迭代循环
  let iter = 0;
  while (offDiagonalSum() > eps && iter < maxIter) {
    // 找到最大的非对角元素
    let p = 0;
    let q = 1;
    let max = Math.abs(getElement(a, 0, 1));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const absValue = Math.abs(getElement(a, i, j));
        if (absValue > max) {
          max = absValue;
          p = i;
          q = j;
        }
      }
    }

    // 计算旋转角度
    const app = getElement(a, p, p);
    const aqq = getElement(a, q, q);
    const apq = getElement(a, p, q);
    const theta = (aqq - app) / (2 * apq);
    const t =
      Math.sign(theta) / (Math.abs(theta) + Math.sqrt(1 + theta * theta));
    const c = 1 / Math.sqrt(1 + t * t);
    const s = c * t;

    // 应用旋转
    const newA: Matrix3D = [
      [getElement(a, 0, 0), getElement(a, 0, 1), getElement(a, 0, 2)],
      [getElement(a, 1, 0), getElement(a, 1, 1), getElement(a, 1, 2)],
      [getElement(a, 2, 0), getElement(a, 2, 1), getElement(a, 2, 2)],
    ];
    const newV: Matrix3D = [
      [getElement(v, 0, 0), getElement(v, 0, 1), getElement(v, 0, 2)],
      [getElement(v, 1, 0), getElement(v, 1, 1), getElement(v, 1, 2)],
      [getElement(v, 2, 0), getElement(v, 2, 1), getElement(v, 2, 2)],
    ];

    // 更新矩阵元素
    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const aip = getElement(a, i, p);
        const aiq = getElement(a, i, q);
        setElement(newA, i, p, c * aip - s * aiq);
        setElement(newA, p, i, c * aip - s * aiq);
        setElement(newA, i, q, s * aip + c * aiq);
        setElement(newA, q, i, s * aip + c * aiq);
      }
    }

    setElement(newA, p, p, c * c * app + s * s * aqq - 2 * s * c * apq);
    setElement(newA, q, q, s * s * app + c * c * aqq + 2 * s * c * apq);
    const newApq = (c * c - s * s) * apq + s * c * (app - aqq);
    setElement(newA, p, q, newApq);
    setElement(newA, q, p, newApq);

    // 更新特征向量
    for (let i = 0; i < n; i++) {
      const vip = getElement(v, i, p);
      const viq = getElement(v, i, q);
      setElement(newV, i, p, c * vip - s * viq);
      setElement(newV, i, q, s * vip + c * viq);
    }

    // 更新矩阵
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        setElement(a, i, j, getElement(newA, i, j));
        setElement(v, i, j, getElement(newV, i, j));
      }
    }

    iter++;
  }

  return {
    eigenvalues: [
      getElement(a, 0, 0),
      getElement(a, 1, 1),
      getElement(a, 2, 2),
    ],
    eigenvectors: [
      [getElement(v, 0, 0), getElement(v, 1, 0), getElement(v, 2, 0)],
      [getElement(v, 0, 1), getElement(v, 1, 1), getElement(v, 2, 1)],
      [getElement(v, 0, 2), getElement(v, 1, 2), getElement(v, 2, 2)],
    ],
  };
}

/**
 * 计算3D质心
 * @param points 质点位置数组
 * @param masses 对应的质量数组
 * @returns 质心位置
 * @throws 如果输入数组为空或长度不匹配
 */
export function calculate3DCenterOfMass(
  points: Point3D[],
  masses: number[],
): Point3D {
  if (!Array.isArray(points) || !Array.isArray(masses)) {
    throw new Error("Points and masses must be arrays");
  }

  if (points.length === 0 || masses.length === 0) {
    throw new Error("Points and masses arrays cannot be empty");
  }

  if (points.length !== masses.length) {
    throw new Error("Points and masses arrays must have the same length");
  }

  // 首先验证所有的质量都是有效的数字
  const validMasses = masses.map((mass) => {
    const numMass = Number(mass);
    if (isNaN(numMass) || numMass <= 0) {
      throw new Error("All masses must be positive numbers");
    }
    return numMass;
  });

  const totalMass = validMasses.reduce((sum, mass) => sum + mass, 0);

  // 使用 zip 模式来安全地配对 points 和 masses
  const weightedSum = calculateWeightedSum(points, validMasses);

  if (totalMass === 0) {
    throw new Error("Total mass cannot be zero");
  }

  return {
    x: weightedSum.x / totalMass,
    y: weightedSum.y / totalMass,
    z: weightedSum.z / totalMass,
  };
}

/**
 * 计算3D分布均匀度
 * @param points 质点位置数组
 * @param masses 对应的质量数组
 * @param centerOfMass 质心位置
 * @returns 分布均匀度得分 (0-1)
 * @throws 如果输入数组为空或长度不匹配
 */
export function calculate3DDistribution(
  points: Point3D[],
  masses: number[],
  centerOfMass: Point3D,
): number {
  if (!Array.isArray(points) || !Array.isArray(masses)) {
    throw new Error("Points and masses must be arrays");
  }

  if (points.length === 0 || masses.length === 0) {
    throw new Error("Points and masses arrays cannot be empty");
  }

  if (points.length !== masses.length) {
    throw new Error("Points and masses arrays must have the same length");
  }

  // 首先验证所有的质量都是有效的数字
  const validMasses = masses.map((mass) => {
    const numMass = Number(mass);
    if (isNaN(numMass) || numMass <= 0) {
      throw new Error("All masses must be positive numbers");
    }
    return numMass;
  });

  // 计算每个点到质心的加权距离
  const weightedDistances = calculateWeightedDistances(
    points,
    validMasses,
    centerOfMass,
  );

  // 找出最大加权距离
  const maxDistance = Math.max(...weightedDistances);
  if (maxDistance === 0) {
    return 1; // 如果所有点都在质心上，则认为是完全均匀分布
  }

  // 归一化加权距离
  const normalizedDistances = weightedDistances.map(
    (distance) => distance / maxDistance,
  );

  // 计算均值
  const mean =
    normalizedDistances.reduce((sum, d) => sum + d, 0) /
    normalizedDistances.length;

  // 计算方差
  const variance =
    normalizedDistances.reduce((sum, d) => sum + (d - mean) * (d - mean), 0) /
    normalizedDistances.length;

  // 返回均匀度得分 (0-1)，0表示完全不均匀，1表示完全均匀
  return Math.max(0, Math.min(1, 1 - Math.sqrt(variance)));
}

/**
 * 计算3D对称性
 */
export function calculate3DSymmetry(
  points: Point3D[],
  masses: number[],
  centerOfMass: Point3D,
): { xy: number; xz: number; yz: number; overall: number } {
  // 计算每个平面的对称性
  const xySymmetry = calculatePlaneSymmetry(points, masses, centerOfMass, "z");
  const xzSymmetry = calculatePlaneSymmetry(points, masses, centerOfMass, "y");
  const yzSymmetry = calculatePlaneSymmetry(points, masses, centerOfMass, "x");

  // 计算总体对称性（加权平均）
  const overall = xySymmetry * 0.4 + xzSymmetry * 0.4 + yzSymmetry * 0.2;

  return {
    xy: xySymmetry,
    xz: xzSymmetry,
    yz: yzSymmetry,
    overall,
  };
}

/**
 * 计算3D各向同性
 */
export function calculate3DIsotropy(moments: [number, number, number]): number {
  const [I1, I2, I3] = moments.sort((a, b) => b - a);
  const meanMoment = (I1 + I2 + I3) / 3;

  // 计算偏差
  const deviation =
    Math.sqrt(
      ((I1 - meanMoment) ** 2 +
        (I2 - meanMoment) ** 2 +
        (I3 - meanMoment) ** 2) /
        3,
    ) / meanMoment;

  // 转换为0-1分数
  return Math.max(0, 1 - deviation);
}

/**
 * 转换2D布局到3D点集
 */
export function convert2DLayoutTo3D(
  layout: Record<number, Rectangle>,
  products: Product[],
): {
  points: Point3D[];
  masses: number[];
} {
  const points: Point3D[] = [];
  const masses: number[] = [];

  for (const [id, rect] of Object.entries(layout)) {
    const product = products.find((p) => p.id === Number(id));
    if (!product?.dimensions) continue;

    // 获取3D尺寸
    const height = product.dimensions.height;

    // 转换中心点到3D
    const center3D = convertTo3D(rect, height / 2);
    points.push(center3D);

    // 计算质量（使用体积作为质量的近似）
    const volume =
      product.dimensions.length *
      product.dimensions.width *
      product.dimensions.height;
    masses.push(volume);
  }

  return { points, masses };
}
