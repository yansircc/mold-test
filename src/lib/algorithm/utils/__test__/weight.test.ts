import { describe, it, expect } from 'vitest';
import { getWeightDiff, getMaxWeightRatio, getGroupWeight } from '../weight';

describe('weight utils', () => {
  describe('getWeightDiff', () => {
    it('应该根据最大重量返回正确的重量差异', () => {
      const cases = [
        { products: [{ weight: 50 }], expected: 50 },
        { products: [{ weight: 150 }], expected: 100 },
        { products: [{ weight: 250 }], expected: 100 },
        { products: [{ weight: 350 }], expected: 100 },
        { products: [{ weight: 450 }], expected: 150 },
        { products: [{ weight: 550 }], expected: 150 },
        { products: [{ weight: 650 }], expected: 150 },
        { products: [{ weight: 750 }], expected: 200 },
        { products: [{ weight: 850 }], expected: 200 },
        { products: [{ weight: 950 }], expected: 200 },
        { products: [{ weight: 1000 }], expected: 0 },
      ];

      cases.forEach(({ products, expected }) => {
        expect(getWeightDiff(products)).toBe(expected);
      });
    });
  });

  describe('getMaxWeightRatio', () => {
    it('应该为小于100克的产品返回5的比例', () => {
      const products = [{ weight: 50 }, { weight: 80 }, { weight: 90 }];
      expect(getMaxWeightRatio(products)).toBe(5);
    });

    it('应该根据最大重量返回正确的比例', () => {
      const cases = [
        { products: [{ weight: 350 }], expected: 2.5 }, // 100-400克
        { products: [{ weight: 650 }], expected: 2 }, // 400-700克
        { products: [{ weight: 950 }], expected: 1.5 }, // 700-1000克
        { products: [{ weight: 1000 }], expected: 1 }, // >=1000克
      ];

      cases.forEach(({ products, expected }) => {
        expect(getMaxWeightRatio(products)).toBe(expected);
      });
    });
  });

  describe('getGroupWeight', () => {
    it('应该正确计算组的总重量', () => {
      const cases = [
        {
          group: [{ weight: 100 }, { weight: 200 }, { weight: 300 }],
          expected: 600,
        },
        {
          group: [{ weight: 50 }, { weight: 50 }],
          expected: 100,
        },
        {
          group: [],
          expected: 0,
        },
      ];

      cases.forEach(({ group, expected }) => {
        expect(getGroupWeight(group)).toBe(expected);
      });
    });
  });
});
