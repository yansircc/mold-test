import type { Point3D } from './geometry';

/**
 * 惯性张量基础接口
 */
export interface InertiaTensor {
  xx: number;
  yy: number;
  xy: number;
}

/**
 * 3D惯性张量
 */
export interface InertiaTensor3D extends InertiaTensor {
  zz: number;
  xz: number;
  yz: number;
}

/**
 * 主成分分析基础接口
 */
export interface PrincipalComponents {
  moments: number[];  // 主力矩
}

/**
 * 2D主成分分析结果
 */
export interface PrincipalComponents2D extends PrincipalComponents {
  moments: [number, number];
  axes: [[number, number], [number, number]];
}

/**
 * 3D主成分分析结果
 */
export interface PrincipalComponents3D extends PrincipalComponents {
  moments: [number, number, number];
  axes: [Point3D, Point3D, Point3D];
}

/**
 * 物理分析基础接口
 */
export interface PhysicalAnalysis {
  mass: {
    total: number;
    distribution: number | number[];  // 可以是单个值或数组
  };
  inertia: {
    gyrationRadius: number;
    isotropy: number;
  };
}

/**
 * 2D物理分析结果
 */
export interface PhysicalAnalysis2D extends PhysicalAnalysis {
  mass: {
    total: number;
    center: { x: number; y: number };
    distribution: number[];  // 2D分布使用数组
  };
  inertia: {
    tensor: InertiaTensor;
    principal: PrincipalComponents2D;
    gyrationRadius: number;
    isotropy: number;
  };
}

/**
 * 3D物理分析结果
 */
export interface PhysicalAnalysis3D extends PhysicalAnalysis {
  mass: {
    total: number;
    center: Point3D;
    distribution: number;  // 3D分布使用单个值
  };
  inertia: {
    tensor: InertiaTensor3D;
    principal: PrincipalComponents3D;
    gyrationRadius: number;
    isotropy: number;
  };
  symmetry: SymmetryAnalysis3D;
  spatialStats: SpatialStatistics3D;
}

/**
 * 对称性分析结果
 */
export interface SymmetryAnalysis3D {
  axial: {
    x: number;  // x轴对称性 (0-1)
    y: number;  // y轴对称性 (0-1)
    z: number;  // z轴对称性 (0-1)
  };
  planar: {
    xy: number;  // xy平面对称性 (0-1)
    xz: number;  // xz平面对称性 (0-1)
    yz: number;  // yz平面对称性 (0-1)
  };
  central: number;  // 中心对称性 (0-1)
  overall: number;  // 综合对称性得分 (0-1)
}

/**
 * 空间统计分析结果
 */
export interface SpatialStatistics3D {
  ripleyK: {
    observed: number;    // 观察值
    expected: number;    // 期望值
    isCluster: boolean;  // 是否为聚集分布
  };
  nearestNeighbor: {
    averageDistance: number;   // 平均最近邻距离
    expectedDistance: number;  // 期望最近邻距离
    ratio: number;            // 实际/期望比率
  };
  entropy: {
    value: number;      // 空间熵值
    normalized: number; // 归一化空间熵
  };
  quartiles: {
    q1: number;  // 第一四分位数
    q2: number;  // 中位数
    q3: number;  // 第三四分位数
    iqr: number; // 四分位距
  };
}
