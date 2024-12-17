import { describe, expect, test } from "vitest";
import { calculateDistributionScore } from "../index";
import type { Rectangle } from "@/types/core/geometry";
import type { Product, Dimensions3D } from "@/types/domain/product";

describe("分布平衡评分测试", () => {
  // 生产相关常量
  const PRODUCTION = {
    MIN_GAP: 20,
    SAFE_GAP: 30,
    COOLING_GAP: 50,
  } as const;

  // 产品尺寸常量
  const SIZES = {
    SMALL: { length: 50, width: 50, height: 25 } as Dimensions3D,
    MEDIUM: { length: 100, width: 100, height: 50 } as Dimensions3D,
    LARGE: { length: 200, width: 200, height: 100 } as Dimensions3D,
  } as const;

  // 辅助函数：创建带尺寸的产品
  function createSizedProduct(
    id: number,
    weight: number,
    dimensions: Dimensions3D,
  ): Product {
    return {
      id,
      name: `产品${id}`,
      weight,
      dimensions,
    };
  }

  // 辅助函数：创建考虑实际产品尺寸和间距的布局
  function createLayout(
    positions: [number, number][],
    products: Product[],
    minGap: number = PRODUCTION.MIN_GAP,
  ): Record<number, Rectangle> {
    return positions.reduce(
      (layout, [x, y], index) => {
        const product = products[index];
        if (!product) return layout;

        // 添加间距到位置坐标
        const gappedX = x + (x > 0 ? minGap : -minGap);
        const gappedY = y + (y > 0 ? minGap : -minGap);

        layout[product.id] = {
          x: gappedX,
          y: gappedY,
          width: product.dimensions?.width ?? 0,
          length: product.dimensions?.length ?? 0,
        };
        return layout;
      },
      {} as Record<number, Rectangle>,
    );
  }

  // 辅助函数：检测布局是否满足最小间距要求
  function checkMinimumGap(
    layout: Record<number, Rectangle>,
    minGap: number = PRODUCTION.MIN_GAP,
  ): boolean {
    const rectangles = Object.values(layout);
    if (rectangles.length < 2) return true;

    for (let i = 0; i < rectangles.length; i++) {
      for (let j = i + 1; j < rectangles.length; j++) {
        const r1 = rectangles[i]!;
        const r2 = rectangles[j]!;

        const horizontalGap = Math.min(
          Math.abs(r1.x - (r2.x + r2.width)),
          Math.abs(r2.x - (r1.x + r1.width)),
        );
        const verticalGap = Math.min(
          Math.abs(r1.y - (r2.y + r2.length)),
          Math.abs(r2.y - (r1.y + r1.length)),
        );

        if (r1.x < r2.x + r2.width && r2.x < r1.x + r1.width) {
          if (verticalGap < minGap) return false;
        }
        if (r1.y < r2.y + r2.length && r2.y < r1.y + r1.length) {
          if (horizontalGap < minGap) return false;
        }
        if (horizontalGap < minGap && verticalGap < minGap) {
          return false;
        }
      }
    }
    return true;
  }

  // 添加分数分析辅助函数
  // function analyzeScores(
  //   result: ReturnType<typeof calculateDistributionScore>,
  // ) {
  //   console.log("\n分数分析：");
  //   console.log("----------------------------------------");
  //   console.log("1. 物理特性分数：");
  //   console.log(
  //     `   - 各向同性(Isotropy): ${normalizeToHundred(result.details.isotropy, 100)}`,
  //   );
  //   console.log(
  //     `   - 陀螺半径(Gyration): ${normalizeToHundred(result.details.gyrationRadius, 200)}`,
  //   );
  //   console.log(
  //     `   - 中心偏差(Center Deviation): ${normalizeScore(result.details.centerDeviation, 100)}`,
  //   );

  //   console.log("\n2. 体积平衡分数：");
  //   console.log(
  //     `   - 密度方差(Density Variance): ${result.details.volumeBalance.densityVariance}`,
  //   );
  //   console.log(
  //     `   - 高度平衡(Height Balance): ${result.details.volumeBalance.heightBalance}`,
  //   );
  //   console.log(
  //     `   - 质量分布(Mass Distribution): ${result.details.volumeBalance.massDistribution}`,
  //   );
  //   console.log(
  //     `   - 对称性(Symmetry): ${result.details.volumeBalance.symmetry}`,
  //   );

  //   console.log("\n3. 总体评分：");
  //   console.log(`   - 最终得分: ${result.score}`);
  //   console.log("----------------------------------------\n");
  // }

  describe("多场景综合测试", () => {
    test("场景1：完美圆形布局", () => {
      // 测试完美对称性的基准场景
      const products = [
        createSizedProduct(1, 200, SIZES.MEDIUM), // 中心
        ...Array.from({ length: 8 }, (_, i) =>
          createSizedProduct(i + 2, 150, SIZES.SMALL),
        ),
      ];

      // 根据产品尺寸和冷却间距计算合适的半径
      const centerSize = SIZES.MEDIUM.width;
      const outerSize = SIZES.SMALL.width;
      // 确保半径大于中心产品尺寸的一半加上外围产品尺寸的一半再加上冷却间距
      const radius = (centerSize + outerSize) / 2 + PRODUCTION.COOLING_GAP + 50;

      const positions: [number, number][] = [
        [0, 0], // 中心
        ...Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 8;
          // 完美圆形，无扰动
          return [radius * Math.cos(angle), radius * Math.sin(angle)] as [
            number,
            number,
          ];
        }),
      ];

      const layout = createLayout(positions, products, PRODUCTION.COOLING_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.COOLING_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);
      // analyzeScores(result);

      // 完美圆形布局应该有最高的分数
      expect(result.score).toBeGreaterThan(95);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(95);
      expect(result.details.centerDeviation).toBeGreaterThan(95);
      expect(result.details.isotropy).toBeGreaterThan(95);
    });

    test("场景2：简单对称布局", () => {
      // 测试算法对不均匀间距的容忍度
      const products = Array.from({ length: 8 }, (_, i) =>
        createSizedProduct(i + 1, 200, SIZES.MEDIUM),
      );

      // 显著增加基础半径以确保最小间距
      const baseRadius = 250;
      const positions: [number, number][] = products.map((_, i) => {
        const angle = (i * Math.PI * 2) / 8;
        // 减小扰动幅度，避免影响最小间距
        const radius = baseRadius + Math.sin(angle * 2) * 15;
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
      });

      const layout = createLayout(positions, products, PRODUCTION.MIN_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.MIN_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(90);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(90);
      expect(result.details.centerDeviation).toBeGreaterThan(85);
      expect(result.details.isotropy).toBeGreaterThan(85);
    });

    test("场景3：密集分布测试", () => {
      // 测试算法在高密度分布下的表
      const products = [
        createSizedProduct(1, 250, SIZES.LARGE),
        ...Array.from({ length: 12 }, (_, i) =>
          createSizedProduct(i + 2, 150, SIZES.SMALL),
        ),
      ];

      // 显著增加半径以确保最小间距
      const innerRadius = 250;
      const outerRadius = 400;
      const positions: [number, number][] = [
        [0, 0],
        ...Array.from({ length: 6 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 6;
          return [
            innerRadius * Math.cos(angle),
            innerRadius * Math.sin(angle),
          ] as [number, number];
        }),
        ...Array.from({ length: 6 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 6 + Math.PI / 6;
          return [
            outerRadius * Math.cos(angle),
            outerRadius * Math.sin(angle),
          ] as [number, number];
        }),
      ];

      const layout = createLayout(positions, products, PRODUCTION.MIN_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.MIN_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(80);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(75);
      expect(result.details.centerDeviation).toBeGreaterThan(80);
      expect(result.details.isotropy).toBeGreaterThan(80);
    });

    test("场景4：极端尺寸差异", () => {
      // 测试算法处理极端尺寸差异的能力
      const products = [
        createSizedProduct(1, 400, {
          length: 300,
          width: 300,
          height: 150,
        }),
        ...Array.from({ length: 8 }, (_, i) =>
          createSizedProduct(i + 2, 50, {
            length: 30,
            width: 30,
            height: 15,
          }),
        ),
      ];

      // 根据最大产品尺寸调整半径
      const maxSize = 300;
      const baseRadius = maxSize * 1.5; // 确保中心大产品有足够空间
      const positions: [number, number][] = [
        [0, 0],
        ...Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 8;
          // 小产品使用更大的半径以保持平衡
          const radius = baseRadius + maxSize;
          return [radius * Math.cos(angle), radius * Math.sin(angle)] as [
            number,
            number,
          ];
        }),
      ];

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      // 由于尺寸差异极大，适当降低期望值
      expect(result.score).toBeGreaterThan(70);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(65);
      expect(result.details.centerDeviation).toBeGreaterThan(65);
      expect(result.details.isotropy).toBeGreaterThan(65);
    });

    test("场景5：分区域布局", () => {
      // 测试算法分区域布局的评估能力
      const products = [
        // 左区域
        createSizedProduct(1, 200, SIZES.MEDIUM),
        createSizedProduct(2, 150, SIZES.SMALL),
        createSizedProduct(3, 150, SIZES.SMALL),
        // 右区域
        createSizedProduct(4, 200, SIZES.MEDIUM),
        createSizedProduct(5, 150, SIZES.SMALL),
        createSizedProduct(6, 150, SIZES.SMALL),
      ];

      // 增加间距以确保安全距离
      const spacing = 300; // 增加主间距
      const subRadius = 120; // 增加子区域半径
      const positions: [number, number][] = [
        // 左区域
        [-spacing, 0],
        [
          -spacing - subRadius * Math.cos(Math.PI / 4),
          subRadius * Math.sin(Math.PI / 4),
        ],
        [
          -spacing - subRadius * Math.cos(Math.PI / 4),
          -subRadius * Math.sin(Math.PI / 4),
        ],
        // 右区域
        [spacing, 0],
        [
          spacing + subRadius * Math.cos(Math.PI / 4),
          subRadius * Math.sin(Math.PI / 4),
        ],
        [
          spacing + subRadius * Math.cos(Math.PI / 4),
          -subRadius * Math.sin(Math.PI / 4),
        ],
      ];

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(75);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(80);
      expect(result.details.centerDeviation).toBeGreaterThan(70);
      expect(result.details.isotropy).toBeGreaterThan(70);
    });

    test("场景6：极端分散布局", () => {
      // 测试算法对高度分散布局的处理能力
      const products = Array.from({ length: 5 }, (_, i) =>
        createSizedProduct(i + 1, 200, SIZES.MEDIUM),
      );

      // 使用更大的间距
      const spacing = 400;
      const positions: [number, number][] = [
        [0, 0],
        [spacing, spacing],
        [-spacing, -spacing],
        [spacing, -spacing],
        [-spacing, spacing],
      ];

      const layout = createLayout(positions, products, PRODUCTION.COOLING_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.COOLING_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(70);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(75);
      expect(result.details.centerDeviation).toBeGreaterThan(60);
      expect(result.details.isotropy).toBeGreaterThan(70);
    });

    test("场景7：混合尺寸环形", () => {
      // 测试算法对混合尺寸环形布局的评估
      const products = [
        createSizedProduct(1, 300, SIZES.LARGE),
        createSizedProduct(2, 200, SIZES.MEDIUM),
        createSizedProduct(3, 150, SIZES.SMALL),
        createSizedProduct(4, 200, SIZES.MEDIUM),
        createSizedProduct(5, 150, SIZES.SMALL),
        createSizedProduct(6, 200, SIZES.MEDIUM),
        createSizedProduct(7, 150, SIZES.SMALL),
      ];

      // 调整半径以适应不同尺寸
      const baseRadius = 200;
      const positions: [number, number][] = products.map((p, i) => {
        if (i === 0) return [0, 0];
        const angle = ((i - 1) * Math.PI * 2) / (products.length - 1);
        // 根据产品尺寸调整半径
        const sizeAdjustment =
          p.dimensions?.width === SIZES.LARGE.width
            ? -50
            : p.dimensions?.width === SIZES.MEDIUM.width
              ? 0
              : 50;
        const radius = baseRadius + sizeAdjustment;
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
      });

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(75);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(70);
      expect(result.details.centerDeviation).toBeGreaterThan(70);
      expect(result.details.isotropy).toBeGreaterThan(70);
    });

    test("场景8：不规则多边形", () => {
      // 测试算法对不规则多边形布局的评估
      const products = Array.from({ length: 7 }, (_, i) =>
        createSizedProduct(i + 1, 200 - i * 10, SIZES.MEDIUM),
      );

      // 增加基础半径并减小扰动
      const baseRadius = 200;
      const positions: [number, number][] = products.map((_, i) => {
        if (i === 0) return [0, 0];
        const angle = ((i - 1) * Math.PI * 2) / (products.length - 1);
        // 减小随机扰动的幅度
        const radiusNoise = Math.sin(angle * 3) * 20;
        const angleNoise = Math.cos(angle * 2) * 0.05;
        return [
          baseRadius * Math.cos(angle + angleNoise) + radiusNoise,
          baseRadius * Math.sin(angle + angleNoise) + radiusNoise,
        ];
      });

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(70);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(65);
      expect(result.details.centerDeviation).toBeGreaterThan(70);
      expect(result.details.isotropy).toBeGreaterThan(70);
    });

    test("场景9：极端质量差异", () => {
      // 测试算法处理极端质量差异的能力
      const products = [
        createSizedProduct(1, 800, SIZES.MEDIUM), // 超重产品
        createSizedProduct(2, 400, SIZES.MEDIUM),
        createSizedProduct(3, 200, SIZES.MEDIUM),
        createSizedProduct(4, 100, SIZES.MEDIUM),
        createSizedProduct(5, 50, SIZES.MEDIUM), // 超轻产品
      ];

      // 根据质量调整位置，确保平衡
      const baseRadius = 200;
      const positions: [number, number][] = products.map((p, i) => {
        if (i === 0) return [0, 0]; // 最重的在中心
        const angle = ((i - 1) * Math.PI * 2) / (products.length - 1);
        // 轻的产品放得更远以平衡重的产品
        const weight = p?.weight ?? 200; // 提供默认值
        const radius = baseRadius * Math.sqrt(800 / weight);
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
      });

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(70);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(65);
      expect(result.details.centerDeviation).toBeGreaterThan(65);
      expect(result.details.isotropy).toBeGreaterThan(65);
    });

    test("场景10：双环嵌套动态间距", () => {
      // 测试算法对复杂的多层嵌套布局的评估能力
      const products = [
        createSizedProduct(1, 300, SIZES.LARGE), // 中心
        ...Array.from(
          { length: 5 },
          (
            _,
            i, // 内环
          ) => createSizedProduct(i + 2, 200, SIZES.MEDIUM),
        ),
        ...Array.from(
          { length: 8 },
          (
            _,
            i, // 外环
          ) => createSizedProduct(i + 7, 150, SIZES.SMALL),
        ),
      ];

      // 增加半径确保足够的间距
      const innerRadius = 300; // 从200增加到300
      const outerRadius = 500; // 从350增加到500
      const positions: [number, number][] = [
        [0, 0],
        // 内环 - 动态调整间距
        ...Array.from({ length: 5 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 5;
          // 减小扰动幅度以避免间距问题
          const r = innerRadius * (1 + Math.sin(angle * 2) * 0.05);
          return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number];
        }),
        // 外环 - 动态调整间距
        ...Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 8 + Math.PI / 8; // 错开内环
          // 减小扰动幅度以避免间距问题
          const r = outerRadius * (1 + Math.cos(angle * 3) * 0.05);
          return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number];
        }),
      ];

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(75);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(70);
      expect(result.details.centerDeviation).toBeGreaterThan(70);
      expect(result.details.isotropy).toBeGreaterThan(70);
    });

    test("场景11：螺旋渐变布局", () => {
      // 测试算法对螺旋形渐变布局的评估能力
      const products = Array.from({ length: 12 }, (_, i) =>
        createSizedProduct(i + 1, 300 - i * 20, {
          length: 100 - i * 5,
          width: 100 - i * 5,
          height: 50 - i * 2,
        }),
      );

      const positions: [number, number][] = products.map((_, i) => {
        const angle = (i * Math.PI * 2) / 6; // 每圈6个点
        const radius = 150 + i * 30; // 螺旋半径逐渐增加
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
      });

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(70);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(65);
      expect(result.details.centerDeviation).toBeGreaterThan(65);
      expect(result.details.isotropy).toBeGreaterThan(65);
    });

    test("场景12：混沌对称局", () => {
      // 测试算法对带有随机扰动但保持对称的布局的评估能力
      const products = [
        createSizedProduct(1, 300, SIZES.LARGE), // 中心
        ...Array.from(
          { length: 8 },
          (
            _,
            i, // 外围点
          ) => createSizedProduct(i + 2, 150, SIZES.MEDIUM),
        ),
      ];

      const baseRadius = 400; // 增加基础半径
      const maxNoiseAngle = Math.PI / 12; // 减小度扰动范围（15度）
      const positions: [number, number][] = [
        [0, 0], // 中心点
        // 外围点 - 对称扰动
        ...Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 8;
          // 为每对对称点使用相同的随机扰动
          const pairIndex = Math.floor(i / 2);
          const angleNoise =
            (pairIndex % 2 === 0 ? 1 : -1) *
            (Math.sin(pairIndex * Math.PI) * maxNoiseAngle);
          const r = baseRadius * (1 + Math.cos(angle * 2) * 0.05); // 减小径向扰动
          return [
            r * Math.cos(angle + angleNoise),
            r * Math.sin(angle + angleNoise),
          ] as [number, number];
        }),
      ];

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(70);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(65);
      expect(result.details.centerDeviation).toBeGreaterThan(70);
      expect(result.details.isotropy).toBeGreaterThan(70);
    });

    test("场景13：多中心分布", () => {
      // 测试算法对多中心分布布局的评估能力
      const products = [
        // 左中心及其周围
        createSizedProduct(1, 250, SIZES.LARGE), // 左中心
        ...Array.from(
          { length: 4 },
          (
            _,
            i, // 左中心周围
          ) => createSizedProduct(i + 2, 150, SIZES.MEDIUM),
        ),
        // 右中心及其周围
        createSizedProduct(6, 250, SIZES.LARGE), // 右中心
        ...Array.from(
          { length: 4 },
          (
            _,
            i, // 右中心周围
          ) => createSizedProduct(i + 7, 150, SIZES.MEDIUM),
        ),
      ];

      const leftCenterX = -400;
      const rightCenterX = 400;
      const radius = 250; // 增加半径以确保足够间距

      const positions: [number, number][] = [
        // 左中心
        [leftCenterX, 0],
        // 左中心周围
        ...Array.from({ length: 4 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 4;
          return [
            leftCenterX + radius * Math.cos(angle),
            radius * Math.sin(angle),
          ] as [number, number];
        }),
        // 右中心
        [rightCenterX, 0],
        // 右中心周围
        ...Array.from({ length: 4 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 4 + Math.PI / 4; // 错开左侧
          return [
            rightCenterX + radius * Math.cos(angle),
            radius * Math.sin(angle),
          ] as [number, number];
        }),
      ];

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(65);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(60);
      expect(result.details.centerDeviation).toBeGreaterThan(65);
      expect(result.details.isotropy).toBeGreaterThan(65);
    });

    test("场景14：动态密度分布", () => {
      // 测试算法对动态密度分布的评估能力
      const products = [
        createSizedProduct(1, 300, SIZES.LARGE), // 中心
        ...Array.from(
          { length: 12 },
          (
            _,
            i, // 周围点
          ) => createSizedProduct(i + 2, 150, SIZES.MEDIUM),
        ),
      ];

      const baseRadius = 400; // 增加基础半径
      const positions: [number, number][] = [
        [0, 0], // 中心点
        // 周围点 - 动态调整密度
        ...Array.from({ length: 12 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 12;
          // 减小扰动幅度，确保间距
          const r = baseRadius * (1 + Math.sin(angle * 2) * 0.05);
          return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number];
        }),
      ];

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(60);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(55);
      expect(result.details.centerDeviation).toBeGreaterThan(60);
      expect(result.details.isotropy).toBeGreaterThan(60);
    });

    test("场景15：十字加八边形", () => {
      // 测试算法对复合几何结构的评估能力
      const products = [
        createSizedProduct(1, 300, SIZES.LARGE), // 中心
        ...Array.from(
          { length: 4 },
          (
            _,
            i, // 十字
          ) => createSizedProduct(i + 2, 200, SIZES.MEDIUM),
        ),
        ...Array.from(
          { length: 8 },
          (
            _,
            i, // 八边形
          ) => createSizedProduct(i + 6, 150, SIZES.SMALL),
        ),
      ];

      const crossRadius = 300; // 十字臂长度
      const octagonRadius = 450; // 八边形半径

      const positions: [number, number][] = [
        [0, 0], // 中心
        [0, crossRadius], // 上
        [crossRadius, 0], // 右
        [0, -crossRadius], // 下
        [-crossRadius, 0], // 左
        // 外层八边形
        ...Array.from({ length: 8 }, (_, i) => {
          const angle = (i * Math.PI * 2) / 8 + Math.PI / 8; // 45度错开
          // 添加微小的径向扰动，但保持对称
          const r = octagonRadius * (1 + Math.cos(angle * 4) * 0.1);
          return [r * Math.cos(angle), r * Math.sin(angle)] as [number, number];
        }),
      ];

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      expect(result.score).toBeGreaterThan(70);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(65);
      expect(result.details.centerDeviation).toBeGreaterThan(70);
      expect(result.details.isotropy).toBeGreaterThan(70);
    });

    test("场景11：权重平衡布局", () => {
      // 测试算法对不同重量产品的平衡布局能力
      const products = [
        createSizedProduct(1, 800, SIZES.LARGE), // 重物品
        createSizedProduct(2, 400, SIZES.MEDIUM), // 中等物品
        createSizedProduct(3, 200, SIZES.SMALL), // 轻物品
      ];

      const baseRadius = 300;
      const positions = products.map((p, i): [number, number] => {
        if (i === 0) return [0, 0];
        const angle = ((i - 1) * Math.PI * 2) / (products.length - 1);
        // 轻的产品放得更远以平衡重的产品
        const radius = baseRadius * Math.sqrt(800 / p.weight!);
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
      });

      const layout = createLayout(positions, products, PRODUCTION.SAFE_GAP);
      expect(checkMinimumGap(layout, PRODUCTION.SAFE_GAP)).toBe(true);

      const result = calculateDistributionScore(layout, products);

      // 由于重量差异大，完全对称是不可能的，60-70分的对称性是合理的
      expect(result.score).toBeGreaterThan(70);
      expect(result.details.volumeBalance.symmetry).toBeGreaterThan(60);
      expect(result.details.centerDeviation).toBeGreaterThan(70);
      expect(result.details.isotropy).toBeGreaterThan(70);
    });
  });
});

// bun test src/lib/algorithm/balance/scores/distribution/__tests__/distribution.test.ts