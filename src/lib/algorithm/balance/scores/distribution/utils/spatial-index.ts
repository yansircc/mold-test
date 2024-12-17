import type { Point3D } from '@/types/core/geometry';

/**
 * 八叉树节点接口
 */
interface OctreeNode {
  center: Point3D;
  size: number;
  points: Array<{ point: Point3D; index: number }>;
  children: Array<OctreeNode | null>;
}

/**
 * 空间索引类
 * 使用八叉树进行空间分区，优化近邻点查询
 */
export class SpatialIndex {
  private root: OctreeNode | null = null;
  private maxPointsPerNode = 8;
  private minNodeSize = 0.1;

  /**
   * 构建空间索引
   * @param points 点集
   * @param bounds 空间边界
   */
  constructor(points: Point3D[], bounds?: { min: Point3D; max: Point3D }) {
    if (!Array.isArray(points) || points.length === 0) return;

    // 如果没有提供边界，计算点集的边界
    const { min, max } = bounds ?? this.calculateBounds(points);

    // 计算八叉树的中心点和大小
    const center: Point3D = {
      x: (min.x + max.x) / 2,
      y: (min.y + max.y) / 2,
      z: (min.z + max.z) / 2
    };

    const size = Math.max(
      max.x - min.x,
      max.y - min.y,
      max.z - min.z
    );

    // 创建根节点
    this.root = {
      center,
      size,
      points: points.map((point, index) => ({ point, index })),
      children: new Array<OctreeNode | null>(8).fill(null)
    };

    // 递归构建八叉树
    this.subdivide(this.root);
  }

  /**
   * 计算点集的边界
   * @private
   */
  private calculateBounds(points: Point3D[]): { min: Point3D; max: Point3D } {
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };

    for (const point of points) {
      min.x = Math.min(min.x, point.x ?? 0);
      min.y = Math.min(min.y, point.y ?? 0);
      min.z = Math.min(min.z, point.z ?? 0);
      max.x = Math.max(max.x, point.x ?? 0);
      max.y = Math.max(max.y, point.y ?? 0);
      max.z = Math.max(max.z, point.z ?? 0);
    }

    return { min, max };
  }

  /**
   * 递归细分八叉树节点
   * @private
   */
  private subdivide(node: OctreeNode): void {
    if (node.points.length <= this.maxPointsPerNode || node.size <= this.minNodeSize) {
      return;
    }

    const halfSize = node.size / 2;
    const center = node.center;

    // 创建8个子节点
    for (let i = 0; i < 8; i++) {
      const childCenter = {
        x: center.x + (i & 1 ? halfSize : -halfSize) / 2,
        y: center.y + (i & 2 ? halfSize : -halfSize) / 2,
        z: center.z + (i & 4 ? halfSize : -halfSize) / 2
      };

      node.children[i] = {
        center: childCenter,
        size: halfSize,
        points: [],
        children: new Array<OctreeNode | null>(8).fill(null)
      };
    }

    // 将点分配到子节点
    for (const item of node.points) {
      const { point } = item;
      const index = this.getOctant(point, node.center);
      node.children[index]!.points.push(item);
    }

    // 清空当前节点的点
    node.points = [];

    // 递归处理子节点
    for (const child of node.children) {
      if (child && child.points.length > 0) {
        this.subdivide(child);
      }
    }
  }

  /**
   * 确定点属于哪个八分区
   * @private
   */
  private getOctant(point: Point3D, center: Point3D): number {
    const x = (point.x ?? 0) >= (center.x ?? 0) ? 1 : 0;
    const y = (point.y ?? 0) >= (center.y ?? 0) ? 2 : 0;
    const z = (point.z ?? 0) >= (center.z ?? 0) ? 4 : 0;
    return x | y | z;
  }

  /**
   * 查找给定点的最近邻
   * @param point 查询点
   * @param maxDistance 最大搜索距离（可选）
   * @returns 最近邻的索引和距离
   */
  findNearestNeighbor(
    point: Point3D,
    maxDistance = Infinity
  ): { index: number; distance: number } | null {
    if (!this.root) return null;

    const nearest = {
      index: -1,
      distance: maxDistance
    };

    this.findNearestInNode(point, this.root, nearest);

    return nearest.index === -1 ? null : nearest;
  }

  /**
   * 在节点中递归查找最近邻
   * @private
   */
  private findNearestInNode(
    point: Point3D,
    node: OctreeNode,
    nearest: { index: number; distance: number }
  ): void {
    // 检查当前节点中的点
    for (const item of node.points) {
      const distance = this.calculateDistance(point, item.point);
      if (distance < nearest.distance) {
        nearest.distance = distance;
        nearest.index = item.index;
      }
    }

    // 如果有子节点，递归检查相关的子节点
    if (node.children[0]) {
      const octant = this.getOctant(point, node.center);
      
      // 先检查点所在的八分区
      this.findNearestInNode(point, node.children[octant]!, nearest);

      // 如果最近距离大于到其他八分区的距离，也需要检查其他八分区
      const centerDist = this.calculateDistance(point, node.center);
      if (centerDist - node.size / 2 < nearest.distance) {
        for (let i = 0; i < 8; i++) {
          if (i !== octant && node.children[i]) {
            this.findNearestInNode(point, node.children[i]!, nearest);
          }
        }
      }
    }
  }

  /**
   * 计算两点间的距离
   * @private
   */
  private calculateDistance(p1: Point3D, p2: Point3D): number {
    const dx = (p1.x ?? 0) - (p2.x ?? 0);
    const dy = (p1.y ?? 0) - (p2.y ?? 0);
    const dz = (p1.z ?? 0) - (p2.z ?? 0);
    return dx * dx + dy * dy + dz * dz; // 返回平方距离，避免开平方
  }
}
