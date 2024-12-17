export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  min: Vector3;
  max: Vector3;
  center: Vector3;
  dimensions: Vector3;
  diagonal: number;
}

export interface MeshStatistics {
  vertexCount: number;
  triangleCount: number;
  surfaceArea: number;
  volume: number;
  density: number;
  averageTriangleArea: number;
  minTriangleArea: number;
  maxTriangleArea: number;
  meshQuality: {
    minAngle: number;
    maxAngle: number;
    averageAngle: number;
    aspectRatio: number;
  };
}

export interface GeometricProperties {
  boundingBox: BoundingBox;
  centerOfMass: Vector3;
  boundingSphereRadius: number;
  meshStats: MeshStatistics;
  inertia: {
    principalMoments: Vector3;
    principalAxes: Vector3[];
    gyrationRadius: number;
  };
  topologyInfo: {
    shellCount: number;
    faceCount: number;
    edgeCount: number;
    vertexCount: number;
    isClosed: boolean;
    isManifold: boolean;
    genus: number;
    eulerCharacteristic: number;
  };
  symmetry: {
    hasXYSymmetry: boolean;
    hasYZSymmetry: boolean;
    hasXZSymmetry: boolean;
    symmetryScore: number;
  };
  curvatureAnalysis: {
    gaussianCurvature: {
      min: number;
      max: number;
      average: number;
    };
    meanCurvature: {
      min: number;
      max: number;
      average: number;
    };
  };
}

function calculateDistance(p1: Vector3, p2: Vector3): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2) +
      Math.pow(p2.z - p1.z, 2),
  );
}

function calculateAngle(p1: Vector3, p2: Vector3, p3: Vector3): number {
  const v1 = {
    x: p2.x - p1.x,
    y: p2.y - p1.y,
    z: p2.z - p1.z,
  };
  const v2 = {
    x: p3.x - p1.x,
    y: p3.y - p1.y,
    z: p3.z - p1.z,
  };

  const dotProduct = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const v1Mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const v2Mag = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  return Math.acos(dotProduct / (v1Mag * v2Mag)) * (180 / Math.PI);
}

function calculateTriangleArea(p1: Vector3, p2: Vector3, p3: Vector3): number {
  const a = calculateDistance(p1, p2);
  const b = calculateDistance(p2, p3);
  const c = calculateDistance(p3, p1);
  const s = (a + b + c) / 2;
  return Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
}

// function calculateTriangleNormal(
//   p1: Vector3,
//   p2: Vector3,
//   p3: Vector3,
// ): Vector3 {
//   const v1 = {
//     x: p2.x - p1.x,
//     y: p2.y - p1.y,
//     z: p2.z - p1.z,
//   };
//   const v2 = {
//     x: p3.x - p1.x,
//     y: p3.y - p1.y,
//     z: p3.z - p1.z,
//   };

//   const normal = {
//     x: v1.y * v2.z - v1.z * v2.y,
//     y: v1.z * v2.x - v1.x * v2.z,
//     z: v1.x * v2.y - v1.y * v2.x,
//   };

//   const length = Math.sqrt(
//     normal.x * normal.x + normal.y * normal.y + normal.z * normal.z,
//   );

//   return {
//     x: normal.x / length,
//     y: normal.y / length,
//     z: normal.z / length,
//   };
// }

function calculateGaussianCurvature(
  vertex: Vector3,
  neighbors: Vector3[],
): number {
  const n = neighbors.length;
  if (n < 3) return 0;

  let angleSum = 0;
  for (let i = 0; i < n; i++) {
    const p1 = neighbors[i];
    const p2 = neighbors[(i + 1) % n];
    if (p1 && p2) {
      angleSum += calculateAngle(vertex, p1, p2);
    }
  }

  return (2 * Math.PI - angleSum * (Math.PI / 180)) / n;
}

function calculateMeanCurvature(vertex: Vector3, neighbors: Vector3[]): number {
  const n = neighbors.length;
  if (n < 3) return 0;

  let curvatureSum = 0;
  for (let i = 0; i < n; i++) {
    const p1 = neighbors[i];
    if (p1) {
      const dist = calculateDistance(vertex, p1);
      curvatureSum += 1 / dist;
    }
  }

  return curvatureSum / n;
}

function getVertexNeighbors(
  vertexIndex: number,
  indices: number[],
  positions: number[],
): Vector3[] {
  const neighbors: Vector3[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < indices.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const currentIndex = indices[i + j];
      if (currentIndex === vertexIndex) {
        for (let k = 0; k < 3; k++) {
          if (k !== j) {
            const neighborIndex = indices[i + k];
            if (neighborIndex !== undefined && !seen.has(neighborIndex)) {
              const x = positions[neighborIndex * 3] ?? 0;
              const y = positions[neighborIndex * 3 + 1] ?? 0;
              const z = positions[neighborIndex * 3 + 2] ?? 0;

              seen.add(neighborIndex);
              neighbors.push({ x, y, z });
            }
          }
        }
        break;
      }
    }
  }

  return neighbors;
}

function calculateSymmetryScore(
  positions: number[],
  plane: "xy" | "yz" | "xz",
): number {
  let symmetryScore = 0;
  const vertexCount = positions.length / 3;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] ?? 0;
    const y = positions[i + 1] ?? 0;
    const z = positions[i + 2] ?? 0;

    const point: Vector3 = { x, y, z };
    const reflectedPoint: Vector3 = { ...point };

    switch (plane) {
      case "xy":
        reflectedPoint.z = -point.z;
        break;
      case "yz":
        reflectedPoint.x = -point.x;
        break;
      case "xz":
        reflectedPoint.y = -point.y;
        break;
    }

    // 寻找最近的实际顶点
    let minDist = Infinity;
    for (let j = 0; j < positions.length; j += 3) {
      const testPoint: Vector3 = {
        x: positions[j] ?? 0,
        y: positions[j + 1] ?? 0,
        z: positions[j + 2] ?? 0,
      };
      const dist = calculateDistance(reflectedPoint, testPoint);
      minDist = Math.min(minDist, dist);
    }

    // 如果找到很近的对应点，增加对称分数
    if (minDist < 0.1) {
      symmetryScore++;
    }
  }

  return symmetryScore / vertexCount;
}

export function analyzeMeshGeometry(
  positions: number[],
  indices: number[],
): GeometricProperties {
  // 安全检查
  if (!positions?.length || !indices?.length) {
    throw new Error("Invalid mesh data");
  }

  // 确保索引数组长度是3的倍数
  if (indices.length % 3 !== 0) {
    throw new Error("Invalid triangle indices");
  }

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  let sumX = 0,
    sumY = 0,
    sumZ = 0;

  // 计算边界盒和质心
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] ?? 0;
    const y = positions[i + 1] ?? 0;
    const z = positions[i + 2] ?? 0;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    minZ = Math.min(minZ, z);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    maxZ = Math.max(maxZ, z);

    sumX += x;
    sumY += y;
    sumZ += z;
  }

  const vertexCount = positions.length / 3;
  const centerOfMass = {
    x: sumX / vertexCount,
    y: sumY / vertexCount,
    z: sumZ / vertexCount,
  };

  // 计算包围球半径
  let maxDistSq = 0;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i] ?? 0;
    const y = positions[i + 1] ?? 0;
    const z = positions[i + 2] ?? 0;

    const distSq =
      Math.pow(x - centerOfMass.x, 2) +
      Math.pow(y - centerOfMass.y, 2) +
      Math.pow(z - centerOfMass.z, 2);
    maxDistSq = Math.max(maxDistSq, distSq);
  }

  // 计算网格统计信息
  let surfaceArea = 0;
  let volume = 0;
  let minTriArea = Infinity;
  let maxTriArea = -Infinity;
  let totalTriArea = 0;
  let minAngle = Infinity;
  let maxAngle = -Infinity;
  let totalAngle = 0;
  let angleCount = 0;

  const triangles: Array<[Vector3, Vector3, Vector3]> = [];

  for (let i = 0; i < indices.length; i += 3) {
    const idx1 = indices[i] ?? 0;
    const idx2 = indices[i + 1] ?? 0;
    const idx3 = indices[i + 2] ?? 0;

    const i1 = idx1 * 3;
    const i2 = idx2 * 3;
    const i3 = idx3 * 3;

    const p1: Vector3 = {
      x: positions[i1] ?? 0,
      y: positions[i1 + 1] ?? 0,
      z: positions[i1 + 2] ?? 0,
    };
    const p2: Vector3 = {
      x: positions[i2] ?? 0,
      y: positions[i2 + 1] ?? 0,
      z: positions[i2 + 2] ?? 0,
    };
    const p3: Vector3 = {
      x: positions[i3] ?? 0,
      y: positions[i3 + 1] ?? 0,
      z: positions[i3 + 2] ?? 0,
    };

    triangles.push([p1, p2, p3]);

    const triArea = calculateTriangleArea(p1, p2, p3);
    surfaceArea += triArea;
    totalTriArea += triArea;
    minTriArea = Math.min(minTriArea, triArea);
    maxTriArea = Math.max(maxTriArea, triArea);

    // 计算三角形的三个角度
    const angles = [
      calculateAngle(p1, p2, p3),
      calculateAngle(p2, p3, p1),
      calculateAngle(p3, p1, p2),
    ];

    angles.forEach((angle) => {
      minAngle = Math.min(minAngle, angle);
      maxAngle = Math.max(maxAngle, angle);
      totalAngle += angle;
      angleCount += 1;
    });

    // 计算有符号体积
    volume +=
      (p1.x * (p2.y * p3.z - p3.y * p2.z) +
        p2.x * (p3.y * p1.z - p1.y * p3.z) +
        p3.x * (p1.y * p2.z - p2.y * p1.z)) /
      6.0;
  }

  let totalGaussianCurvature = 0;
  let totalMeanCurvature = 0;
  let curvaturePoints = 0;

  for (let i = 0; i < positions.length; i += 3) {
    const vertex: Vector3 = {
      x: positions[i] ?? 0,
      y: positions[i + 1] ?? 0,
      z: positions[i + 2] ?? 0,
    };

    const neighbors = getVertexNeighbors(i / 3, indices, positions);
    if (neighbors.length >= 3) {
      totalGaussianCurvature += calculateGaussianCurvature(vertex, neighbors);
      totalMeanCurvature += calculateMeanCurvature(vertex, neighbors);
      curvaturePoints++;
    }
  }

  const xySymmetryScore = calculateSymmetryScore(positions, "xy");
  const yzSymmetryScore = calculateSymmetryScore(positions, "yz");
  const xzSymmetryScore = calculateSymmetryScore(positions, "xz");

  const principalMoments = {
    x: 0,
    y: 0,
    z: 0,
  };

  for (let i = 0; i < positions.length; i += 3) {
    const x = (positions[i] ?? 0) - centerOfMass.x;
    const y = (positions[i + 1] ?? 0) - centerOfMass.y;
    const z = (positions[i + 2] ?? 0) - centerOfMass.z;

    principalMoments.x += y * y + z * z;
    principalMoments.y += x * x + z * z;
    principalMoments.z += x * x + y * y;
  }

  const gyrationRadius = Math.sqrt(
    (principalMoments.x + principalMoments.y + principalMoments.z) /
      (3 * vertexCount),
  );

  const edgeCount = indices.length / 2;
  const faceCount = indices.length / 3;
  const eulerCharacteristic = vertexCount - edgeCount + faceCount;
  const genus = (2 - eulerCharacteristic) / 2;

  return {
    boundingBox: {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
      center: {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
        z: (minZ + maxZ) / 2,
      },
      dimensions: {
        x: maxX - minX,
        y: maxY - minY,
        z: maxZ - minZ,
      },
      diagonal: Math.sqrt(
        Math.pow(maxX - minX, 2) +
          Math.pow(maxY - minY, 2) +
          Math.pow(maxZ - minZ, 2),
      ),
    },
    centerOfMass,
    boundingSphereRadius: Math.sqrt(maxDistSq),
    meshStats: {
      vertexCount,
      triangleCount: indices.length / 3,
      surfaceArea,
      volume: Math.abs(volume),
      density: indices.length / 3 / Math.abs(volume),
      averageTriangleArea: totalTriArea / (indices.length / 3),
      minTriangleArea: minTriArea,
      maxTriangleArea: maxTriArea,
      meshQuality: {
        minAngle,
        maxAngle,
        averageAngle: totalAngle / angleCount,
        aspectRatio: maxTriArea / minTriArea,
      },
    },
    inertia: {
      principalMoments,
      principalAxes: [
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 1 },
      ],
      gyrationRadius,
    },
    topologyInfo: {
      shellCount: 1,
      faceCount,
      edgeCount,
      vertexCount,
      isClosed: true,
      isManifold: true,
      genus,
      eulerCharacteristic,
    },
    symmetry: {
      hasXYSymmetry: xySymmetryScore > 0.9,
      hasYZSymmetry: yzSymmetryScore > 0.9,
      hasXZSymmetry: xzSymmetryScore > 0.9,
      symmetryScore: Math.max(
        xySymmetryScore,
        yzSymmetryScore,
        xzSymmetryScore,
      ),
    },
    curvatureAnalysis: {
      gaussianCurvature: {
        min: -Math.PI,
        max: Math.PI,
        average: totalGaussianCurvature / curvaturePoints,
      },
      meanCurvature: {
        min: 0,
        max: 2 * Math.PI,
        average: totalMeanCurvature / curvaturePoints,
      },
    },
  };
}
