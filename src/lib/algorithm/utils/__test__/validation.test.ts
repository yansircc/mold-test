import { describe, it, expect } from "vitest";
import { isValidGrouping, normalizeGrouping } from "../validation";
import type { Product } from "@/types/domain/product";

describe("validation utils", () => {
  describe("isValidGrouping", () => {
    const createMockProduct = (weight: number) => ({
      id: Math.random(),
      name: `Product-${weight}`,
      weight,
    });

    it("should return false for single group", () => {
      const groups = [[createMockProduct(100)]];
      expect(isValidGrouping(groups).valid).toBe(false);
    });

    it("should return false for empty groups", () => {
      const groups: Product[][] = [];
      expect(isValidGrouping(groups).valid).toBe(false);
    });

    it("should validate weight differences", () => {
      // 合理的重量差异
      const validGroups = [
        [createMockProduct(100), createMockProduct(105)],
        [createMockProduct(102), createMockProduct(103)],
      ];
      expect(isValidGrouping(validGroups).valid).toBe(true);

      // 过大的重量差异
      const invalidGroups = [
        [createMockProduct(100)],
        [createMockProduct(200)],
      ];
      expect(isValidGrouping(invalidGroups).valid).toBe(false);
    });

    it("should validate weight ratio", () => {
      // 测试小于100克的产品，比例限制为5
      const validRatio = [
        [createMockProduct(20), createMockProduct(30)],
        [createMockProduct(80)],
      ];
      expect(isValidGrouping(validRatio).valid).toBe(true);

      const invalidRatio = [[createMockProduct(10)], [createMockProduct(60)]];
      const result = isValidGrouping(invalidRatio);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("重量比例");
    });

    it("should validate 1000克以上的产品", () => {
      const groups = [[createMockProduct(1000)], [createMockProduct(500)]];
      const result = isValidGrouping(groups);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("存在重量超过1000克的产品，需要分开做模具");
    });
  });

  describe("normalizeGrouping", () => {
    it("should correctly normalize grouping", () => {
      const createMockProduct = (weight: number) => ({
        id: Math.random(),
        name: `Product-${weight}`,
        weight,
      });
      const groups = [
        [createMockProduct(300), createMockProduct(100)],
        [createMockProduct(200), createMockProduct(400)],
      ];

      const normalized = normalizeGrouping(groups);
      const parsed = JSON.parse(normalized) as Product[][];

      // 确保解析后的数据存在
      if (
        !parsed?.[0]?.[0] ||
        !parsed?.[0]?.[1] ||
        !parsed?.[1]?.[0] ||
        !parsed?.[1]?.[1]
      ) {
        throw new Error("解析后的数据格式不正确");
      }

      // 验证组内排序
      if (
        parsed[0][0].weight &&
        parsed[0][1].weight &&
        parsed[1][0].weight &&
        parsed[1][1].weight
      ) {
        expect(parsed[0][0].weight).toBeLessThan(parsed[0][1].weight);
        expect(parsed[1][0].weight).toBeLessThan(parsed[1][1].weight);

        // 验证组间排序（按总重量）
        const group1Total = parsed[0].reduce((sum, p) => sum + p.weight!, 0);
        const group2Total = parsed[1].reduce((sum, p) => sum + p.weight!, 0);
        expect(group1Total).toBeLessThanOrEqual(group2Total);
      }
    });

    it("should produce the same normalized string for the same grouping", () => {
      const createMockProduct = (weight: number) => ({
        id: Math.random(),
        name: `Product-${weight}`,
        weight,
      });
      const groups = [
        [createMockProduct(300), createMockProduct(100)],
        [createMockProduct(200)],
      ];
      const groups2 = [
        [createMockProduct(100), createMockProduct(300)],
        [createMockProduct(200)],
      ];

      expect(normalizeGrouping(groups)).toBe(normalizeGrouping(groups2));
    });
  });
});
