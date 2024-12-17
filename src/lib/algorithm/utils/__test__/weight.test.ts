import { describe, it, expect } from 'vitest';
import { getWeightDiff, getMaxWeightRatio, getGroupWeight } from '../weight';

describe('weight utils', () => {
  describe('getWeightDiff', () => {
    it('应该根据最大重量返回正确的重量差异', () => {
      const cases = [
        { products: [{ weight: 50, id: 1, name: 'Product 1' }], expected: 50 },
        { products: [{ weight: 150, id: 2, name: 'Product 2' }], expected: 100 },
        { products: [{ weight: 250, id: 3, name: 'Product 3' }], expected: 100 },
        { products: [{ weight: 350, id: 4, name: 'Product 4' }], expected: 100 },
        { products: [{ weight: 450, id: 5, name: 'Product 5' }], expected: 150 },
        { products: [{ weight: 550, id: 6, name: 'Product 6' }], expected: 150 },
        { products: [{ weight: 650, id: 7, name: 'Product 7' }], expected: 150 },
        { products: [{ weight: 750, id: 8, name: 'Product 8' }], expected: 200 },
        { products: [{ weight: 850, id: 9, name: 'Product 9' }], expected: 200 },
        { products: [{ weight: 950, id: 10, name: 'Product 10' }], expected: 200 },
        { products: [{ weight: 1000, id: 11, name: 'Product 11' }], expected: 0 },
      ];

      cases.forEach(({ products, expected }) => {
        expect(getWeightDiff(products)).toBe(expected);
      });
    });
  });

  describe('getMaxWeightRatio', () => {
    it('应该为小于100克的产品返回5的比例', () => {
      const products = [{ weight: 50, id: 1, name: 'Product 1' }, { weight: 80, id: 2, name: 'Product 2' }, { weight: 90, id: 3, name: 'Product 3' }];
      expect(getMaxWeightRatio(products)).toBe(5);
    });

    it('应该根据最大重量返回正确的比例', () => {
      const cases = [
        { products: [{ weight: 350, id: 1, name: 'Product 1' }], expected: 2.5 }, // 100-400克
        { products: [{ weight: 650, id: 2, name: 'Product 2' }], expected: 2 }, // 400-700克
        { products: [{ weight: 950, id: 3, name: 'Product 3' }], expected: 1.5 }, // 700-1000克
        { products: [{ weight: 1000, id: 4, name: 'Product 4' }], expected: 1 }, // >=1000克
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
          group: [{ weight: 100, id: 1, name: 'Product 1' }, { weight: 200, id: 2, name: 'Product 2' }, { weight: 300, id: 3, name: 'Product 3' }],
          expected: 600,
        },
        {
          group: [{ weight: 50, id: 4, name: 'Product 4' }, { weight: 50, id: 5, name: 'Product 5' }],
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
