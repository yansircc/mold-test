import { describe, it, expect } from "vitest";
import { GeometryScorer } from "../index";
import { defaultConfig } from "../config";
import type { NormalizedProduct } from "@/types/algorithm/balance/geometry";

describe("GeometryScorer", () => {
  const scorer = new GeometryScorer(defaultConfig);

  // 基础功能测试
  describe("基础功能", () => {
    it("空产品列表应返回默认分数", () => {
      const score = scorer.calculateScore([]);
      expect(score.overall).toBe(0);
    });

    it("单个产品应返回完美分数", () => {
      const product = createTestProduct({
        length: 100,
        width: 100,
        height: 100,
        volume: 1000000,
      });
      const score = scorer.calculateScore([product]);
      expect(score.overall).toBeGreaterThan(95);
    });

    it("处理缺失尺寸的产品", () => {
      const product = createTestProduct({
        length: 0,
        width: 100,
        height: 100,
        volume: 0,
      });
      const score = scorer.calculateScore([product]);
      expect(score.overall).toBeLessThan(50);
    });

    it("处理零体积的产品", () => {
      const product = createTestProduct({
        length: 100,
        width: 100,
        height: 0,
        volume: 0,
      });
      const score = scorer.calculateScore([product]);
      expect(score.overall).toBeLessThan(50);
    });
  });

  // 形状分数测试
  describe("形状分数", () => {
    it("相似形状应得高分", () => {
      const products = [
        createTestProduct({
          length: 100,
          width: 50,
          height: 25,
          volume: 125000,
        }),
        createTestProduct({
          length: 110,
          width: 55,
          height: 27,
          volume: 163350,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.shapeScore.uniformity).toBeGreaterThan(80);
    });

    it("差异较大的形状应得低分", () => {
      const products = [
        createTestProduct({
          length: 100,
          width: 100,
          height: 100,
          volume: 1000000,
        }),
        createTestProduct({
          length: 200,
          width: 50,
          height: 25,
          volume: 250000,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.shapeScore.uniformity).toBeLessThan(60);
    });

    it("处理极端长宽比", () => {
      const products = [
        createTestProduct({
          length: 1000,
          width: 10,
          height: 10,
          volume: 100000,
        }),
        createTestProduct({
          length: 10,
          width: 1000,
          height: 10,
          volume: 100000,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.shapeScore.aspectRatio).toBeLessThan(40);
    });
  });

  // 尺寸分数测试
  describe("尺寸分数", () => {
    it("相似尺寸应得高分", () => {
      const products = [
        createTestProduct({
          length: 100,
          width: 100,
          height: 50,
          volume: 500000,
        }),
        createTestProduct({
          length: 105,
          width: 95,
          height: 52,
          volume: 518700,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.dimensionScore.consistency).toBeGreaterThan(85);
    });

    it("差异较大的尺寸应得低分", () => {
      const products = [
        createTestProduct({
          length: 100,
          width: 100,
          height: 50,
          volume: 500000,
        }),
        createTestProduct({
          length: 200,
          width: 50,
          height: 25,
          volume: 250000,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.dimensionScore.consistency).toBeLessThan(60);
    });

    it("处理等比例缩放", () => {
      const products = [
        createTestProduct({
          length: 100,
          width: 50,
          height: 25,
          volume: 125000,
        }),
        createTestProduct({
          length: 200,
          width: 100,
          height: 50,
          volume: 1000000,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.dimensionScore.scaleRatio).toBeGreaterThan(70);
    });
  });

  // 效率分数测试
  describe("效率分数", () => {
    it("高效排列应得高分", () => {
      const products = [
        createTestProduct({
          length: 100,
          width: 100,
          height: 50,
          volume: 500000,
        }),
        createTestProduct({
          length: 100,
          width: 100,
          height: 50,
          volume: 500000,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.efficiencyScore.planarDensity).toBeGreaterThan(90);
      expect(score.details.efficiencyScore.volumeUtilization).toBeGreaterThan(
        90,
      );
    });

    it("低效排列应得低分", () => {
      const products = [
        createTestProduct({
          length: 100,
          width: 100,
          height: 50,
          volume: 500000,
        }),
        createTestProduct({
          length: 200,
          width: 50,
          height: 25,
          volume: 250000,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.efficiencyScore.planarDensity).toBeLessThan(70);
      expect(score.details.efficiencyScore.volumeUtilization).toBeLessThan(70);
    });

    it("处理混合尺寸组合", () => {
      const products = [
        createTestProduct({
          length: 100,
          width: 50,
          height: 25,
          volume: 125000,
        }),
        createTestProduct({
          length: 75,
          width: 75,
          height: 75,
          volume: 421875,
        }),
        createTestProduct({
          length: 150,
          width: 25,
          height: 25,
          volume: 93750,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.efficiencyScore.planarDensity).toBeLessThan(65);
      expect(score.details.efficiencyScore.volumeUtilization).toBeLessThan(65);
      expect(score.details.efficiencyScore.heightDistribution).toBeLessThan(70);
    });
  });

  // 相似度分数测试
  describe("相似度分数", () => {
    it("计算正确的相似度指标", () => {
      const products = [
        createTestProduct({
          length: 100,
          width: 50,
          height: 25,
          volume: 125000,
        }),
        createTestProduct({
          length: 110,
          width: 55,
          height: 27,
          volume: 163350,
        }),
      ];
      const score = scorer.calculateScore(products);

      expect(score.details.shapeScore.uniformity).toBeGreaterThan(80);
      expect(score.details.dimensionScore.consistency).toBeGreaterThan(80);

      // 验证长宽比计算
      if (products[0]) {
        const p1 = products[0];
        const actualAspectRatio = p1.dimensions.length / p1.dimensions.width;
        expect(actualAspectRatio).toBeCloseTo(2, 1);
      }
    });

    it("处理极端相似情况", () => {
      const products = [
        createTestProduct({
          length: 100,
          width: 100,
          height: 100,
          volume: 1000000,
        }),
        createTestProduct({
          length: 100,
          width: 100,
          height: 100,
          volume: 1000000,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.shapeScore.uniformity).toBeGreaterThan(95);
      expect(score.details.dimensionScore.consistency).toBeGreaterThan(95);
    });

    it("处理极端差异情况", () => {
      const products = [
        createTestProduct({
          length: 10,
          width: 1000,
          height: 10,
          volume: 100000,
        }),
        createTestProduct({
          length: 1000,
          width: 10,
          height: 1000,
          volume: 10000000,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.details.shapeScore.uniformity).toBeLessThan(30);
      expect(score.details.dimensionScore.consistency).toBeLessThan(30);
    });
  });

  // 边缘情况测试
  describe("边缘情况", () => {
    it("处理非常大的数字", () => {
      const products = [
        createTestProduct({
          length: 10000,
          width: 10000,
          height: 10000,
          volume: 1000000000000,
        }),
        createTestProduct({
          length: 11000,
          width: 11000,
          height: 11000,
          volume: 1331000000000,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.overall).toBeDefined();
      expect(score.overall).not.toBeNaN();
    });

    it("处理非常小的数字", () => {
      const products = [
        createTestProduct({
          length: 0.1,
          width: 0.1,
          height: 0.1,
          volume: 0.001,
        }),
        createTestProduct({
          length: 0.11,
          width: 0.11,
          height: 0.11,
          volume: 0.001331,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.overall).toBeDefined();
      expect(score.overall).not.toBeNaN();
    });

    it("处理混合尺度", () => {
      const products = [
        createTestProduct({
          length: 0.1,
          width: 100,
          height: 10000,
          volume: 100000,
        }),
        createTestProduct({
          length: 10000,
          width: 0.1,
          height: 100,
          volume: 100000,
        }),
      ];
      const score = scorer.calculateScore(products);
      expect(score.overall).toBeDefined();
      expect(score.overall).not.toBeNaN();
    });
  });
});

// 辅助函数
function createTestProduct(dimensions: {
  length: number;
  width: number;
  height: number;
  volume: number;
}): NormalizedProduct {
  return {
    dimensions: {
      length: dimensions.length,
      width: dimensions.width,
      height: dimensions.height,
    },
    volume: dimensions.volume,
    surfaceArea:
      2 *
      (dimensions.length * dimensions.width +
        dimensions.length * dimensions.height +
        dimensions.width * dimensions.height),
  };
}
// bun test src/lib/algorithm/balance/scores/geometry/__tests__/geometry.test.ts
