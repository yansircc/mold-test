import type { Rectangle } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";
import type { DetailedDistributionScore } from "@/types/algorithm/balance/distribution";

type LayoutMap = Record<number, Rectangle>;

/**
 * 计算主惯性矩和主轴
 */
function calculatePrincipalMoments(
  layout: LayoutMap,
  products: Product[],
): {
  moments: [number, number];
  axes: [[number, number], [number, number]];
} {
  // 计算质心
  let totalMass = 0;
  let centerX = 0;
  let centerY = 0;

  Object.entries(layout).forEach(([index, rect]) => {
    const idx = parseInt(index);
    const product = products[idx];
    if (!product) return;

    const mass = product.cadData?.volume ?? 1;
    totalMass += mass;
    centerX += mass * (rect.x + rect.width / 2);
    centerY += mass * (rect.y + rect.length / 2);
  });

  centerX /= totalMass || 1; // 防止除以0
  centerY /= totalMass || 1;

  // 计算惯性矩阵
  let Ixx = 0;
  let Iyy = 0;
  let Ixy = 0;

  Object.entries(layout).forEach(([index, rect]) => {
    const idx = parseInt(index);
    const product = products[idx];
    if (!product) return;

    const mass = product.cadData?.volume ?? 1;
    const x = rect.x + rect.width / 2 - centerX;
    const y = rect.y + rect.length / 2 - centerY;

    Ixx += mass * y * y;
    Iyy += mass * x * x;
    Ixy -= mass * x * y;
  });

  // 计算特征值和特征向量
  const trace = Ixx + Iyy;
  const det = Ixx * Iyy - Ixy * Ixy;
  const discriminant = Math.sqrt(trace * trace - 4 * det);

  const lambda1 = (trace + discriminant) / 2;
  const lambda2 = (trace - discriminant) / 2;

  const theta = Math.atan2(2 * Ixy, Ixx - Iyy) / 2;

  return {
    moments: [lambda1, lambda2],
    axes: [
      [Math.cos(theta), Math.sin(theta)],
      [-Math.sin(theta), Math.cos(theta)],
    ],
  };
}

/**
 * 计算分布平衡分数
 */
export function calculateDistributionScore(
  layout: LayoutMap,
  products: Product[],
): DetailedDistributionScore {
  // 1. 计算主惯性矩和主轴
  const { moments, axes } = calculatePrincipalMoments(layout, products);

  // 2. 计算陀螺半径
  const gyrationRadius = Math.sqrt((moments[0] + moments[1]) / 2);

  // 3. 计算各向同性比
  const isotropy = moments[1] / moments[0];

  // 4. 计算质心偏移
  let centerDeviation = 0;
  let totalVolume = 0;
  let centerX = 0;
  let centerY = 0;

  Object.entries(layout).forEach(([index, rect]) => {
    const idx = parseInt(index);
    const product = products[idx];
    if (!product) return;

    const volume = product.cadData?.volume ?? 0;
    totalVolume += volume;
    centerX += volume * (rect.x + rect.width / 2);
    centerY += volume * (rect.y + rect.length / 2);
  });

  centerX /= totalVolume || 1; // 防止除以0
  centerY /= totalVolume || 1;

  const maxDimension = Math.max(
    ...Object.values(layout).map((rect) =>
      Math.max(rect.width, rect.length),
    ),
  );

  centerDeviation = Math.sqrt(centerX * centerX + centerY * centerY) / maxDimension;

  // console.log("centerX + centerY:", centerX, centerY);
  // console.log("maxDimension:", maxDimension);
  // console.log("centerDeviation:", centerDeviation);

  // 5. 计算体积平衡相关指标
  const volumeBalance = calculateVolumeBalance(layout, products);

  // 6. 计算总分
  const weights = {
    isotropy: 0.3,
    centerDeviation: 0.3,
    volumeBalance: {
      densityVariance: 0.1,
      heightBalance: 0.1,
      massDistribution: 0.1,
      symmetry: 0.1,
    },
  };


  // console.log("isotropy:", isotropy);
  // console.log("centerDeviation:", centerDeviation);
  // console.log("volumeBalance:", volumeBalance);

  // 添加详细的分数日志
  // console.log("=== Distribution Score Details ===");
  // console.log("1. Isotropy Score:");
  // console.log(`   - Raw value: ${isotropy}`);
  // console.log(`   - Weight: ${weights.isotropy}`);
  // console.log(`   - Weighted score: ${weights.isotropy * isotropy}`);

  // console.log("\n2. Center Deviation Score:");
  // console.log(`   - Raw value: ${centerDeviation}`);
  // console.log(`   - Weight: ${weights.centerDeviation}`);
  // console.log(`   - Weighted score: ${weights.centerDeviation * (1 - centerDeviation)}`);

  // console.log("\n3. Volume Balance Scores:");
  // console.log("   3.1 Density Variance:");
  // console.log(`       - Raw value: ${volumeBalance.densityVariance}`);
  // console.log(`       - Weight: ${weights.volumeBalance.densityVariance}`);
  // console.log(`       - Weighted score: ${weights.volumeBalance.densityVariance * (volumeBalance.densityVariance / 100)}`);

  // console.log("   3.2 Height Balance:");
  // console.log(`       - Raw value: ${volumeBalance.heightBalance}`);
  // console.log(`       - Weight: ${weights.volumeBalance.heightBalance}`);
  // console.log(`       - Weighted score: ${weights.volumeBalance.heightBalance * (volumeBalance.heightBalance / 100)}`);

  // console.log("   3.3 Mass Distribution:");
  // console.log(`       - Raw value: ${volumeBalance.massDistribution}`);
  // console.log(`       - Weight: ${weights.volumeBalance.massDistribution}`);
  // console.log(`       - Weighted score: ${weights.volumeBalance.massDistribution * (volumeBalance.massDistribution / 100)}`);

  // console.log("   3.4 Symmetry:");
  // console.log(`       - Raw value: ${volumeBalance.symmetry}`);
  // console.log(`       - Weight: ${weights.volumeBalance.symmetry}`);
  // console.log(`       - Weighted score: ${weights.volumeBalance.symmetry * (volumeBalance.symmetry / 100)}`);


  const score = Math.min(
    100,
    100 * (
      weights.isotropy * isotropy +
      weights.centerDeviation * (1 - centerDeviation) +
      weights.volumeBalance.densityVariance * (volumeBalance.densityVariance / 100) +
      weights.volumeBalance.heightBalance * (volumeBalance.heightBalance / 100) +
      weights.volumeBalance.massDistribution * (volumeBalance.massDistribution / 100) +
      weights.volumeBalance.symmetry * (volumeBalance.symmetry / 100)
    ),
  );

  // console.log("\n=== Final Score ===");
  // console.log(`Total Score: ${score}`);


  return {
    overall: score,
    details: {
      principalMoments: moments,
      principalAxes: axes,
      gyrationRadius,
      isotropy,
      centerDeviation,
      volumeBalance,
    },
  };
}

/**
 * 计算体积平衡相关指标
 */
function calculateVolumeBalance(
  layout: LayoutMap,
  products: Product[],
): {
  densityVariance: number;
  heightBalance: number;
  massDistribution: number;
  symmetry: number;
} {
  // 1. 计算密度方差
  const areas = Object.values(layout).map((rect) => rect.width * rect.length);
  const meanArea = areas.reduce((a, b) => a + b, 0) / areas.length;
  const densityVariance =
    1 -
    Math.sqrt(
      areas.reduce((acc, area) => acc + Math.pow(area - meanArea, 2), 0) /
        areas.length,
    ) /
      meanArea;

  // 2. 计算高度分布的平衡性
  const heights = products.map((p) => p.dimensions?.height ?? 0);
  const meanHeight = heights.reduce((a, b) => a + b, 0) / heights.length;
  const heightBalance =
    1 -
    Math.sqrt(
      heights.reduce((acc, h) => acc + Math.pow(h - meanHeight, 2), 0) /
        heights.length,
    ) /
      meanHeight;

  // 3. 计算质量分布
  const volumes = products.map((p) => p.cadData?.volume ?? 0);
  const totalVolume = volumes.reduce((a, b) => a + b, 0);
  const massDistribution = volumes.reduce(
    (acc, v) => acc + Math.abs(v / totalVolume - 1 / volumes.length),
    0,
  );

  // 4. 计算对称性
  const symmetry = calculateSymmetry(layout);

  return {
    densityVariance: 100 * densityVariance,
    heightBalance: 100 * heightBalance,
    massDistribution: 100 * (1 - massDistribution),
    symmetry: 100 * symmetry,
  };
}

/**
 * 计算布局的对称性
 */
function calculateSymmetry(layout: LayoutMap): number {
  const rects = Object.values(layout);
  
  // 找到边界盒
  const minX = Math.min(...rects.map((r) => r.x));
  const maxX = Math.max(...rects.map((r) => r.x + r.width));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxY = Math.max(...rects.map((r) => r.y + r.length));
  
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // 计算对称性得分
  let symmetryScore = 0;
  rects.forEach((rect1) => {
    // 找到关于中心对称的位置是否有矩形
    const mirrorX = 2 * centerX - (rect1.x + rect1.width);
    const mirrorY = 2 * centerY - (rect1.y + rect1.length);

    const hasSymmetricRect = rects.some(
      (rect2) =>
        Math.abs(rect2.x - mirrorX) < 1e-6 &&
        Math.abs(rect2.y - mirrorY) < 1e-6 &&
        Math.abs(rect2.width - rect1.width) < 1e-6 &&
        Math.abs(rect2.length - rect1.length) < 1e-6,
    );

    if (hasSymmetricRect) {
      symmetryScore += 1;
    }
  });

  return symmetryScore / rects.length;
}
