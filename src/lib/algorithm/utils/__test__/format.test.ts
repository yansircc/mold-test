import { describe, it, expect } from 'vitest';
import { generateSolutionDescription, formatGroupsAsJson } from '../format';

describe('format utils', () => {
  describe('generateSolutionDescription', () => {
    it('应该生成正确的方案描述', () => {
      const grouping = [
        [{ weight: 100, id: 1, name: 'Product 1' }, { weight: 200, id: 2, name: 'Product 2' }],
        [{ weight: 150, id: 3, name: 'Product 3' }, { weight: 150, id: 4, name: 'Product 4' }],
      ];

      const description = generateSolutionDescription(grouping, 0);

      expect(description).toContain('方案1');
      expect(description).toContain('分成2组');
      expect(description).toContain('[100g, 200g]');
      expect(description).toContain('[150g, 150g]');
      expect(description).toContain('最大差值为0g');
      expect(description).toContain('最大重量比例为1.00');
    });

    it('应该处理不同索引的方案', () => {
      const grouping = [
        [{ weight: 100, id: 1, name: 'Product 1' }],
        [{ weight: 200, id: 2, name: 'Product 2' }],
      ];

      const description1 = generateSolutionDescription(grouping, 0);
      const description2 = generateSolutionDescription(grouping, 1);

      expect(description1).toContain('方案1');
      expect(description2).toContain('方案2');
    });
  });

  describe('formatGroupsAsJson', () => {
    it('应该正确格式化分组为JSON格式', () => {
      const groups = [
        [
          [{ weight: 100, id: 1, name: 'Product 1' }, { weight: 200, id: 2, name: 'Product 2' }],
          [{ weight: 300, id: 3, name: 'Product 3' }],
        ],
        [
          [{ weight: 150, id: 4, name: 'Product 4' }],
          [{ weight: 250, id: 5, name: 'Product 5' }],
        ],
      ];

      const result = formatGroupsAsJson(groups);

      expect(result).toHaveLength(2);

      const firstSolution = result[0];
      expect(firstSolution).toBeDefined();
      if (!firstSolution) throw new Error('第一个解决方案未定义');

      expect(firstSolution.solutionId).toBe(1);
      expect(firstSolution.groups).toHaveLength(2);

      const firstGroup0 = firstSolution.groups[0];
      const firstGroup1 = firstSolution.groups[1];
      expect(firstGroup0).toBeDefined();
      expect(firstGroup1).toBeDefined();
      if (!firstGroup0 || !firstGroup1) throw new Error('第一个解决方案的分组未定义');

      expect(firstGroup0.weights).toEqual([100, 200]);
      expect(firstGroup0.totalWeight).toBe(300);
      expect(firstGroup1.weights).toEqual([300]);
      expect(firstGroup1.totalWeight).toBe(300);

      const secondSolution = result[1];
      expect(secondSolution).toBeDefined();
      if (!secondSolution) throw new Error('第二个解决方案未定义');

      expect(secondSolution.solutionId).toBe(2);
      expect(secondSolution.groups).toHaveLength(2);
      
      const secondGroup0 = secondSolution.groups[0];
      const secondGroup1 = secondSolution.groups[1];
      expect(secondGroup0).toBeDefined();
      expect(secondGroup1).toBeDefined();
      if (!secondGroup0 || !secondGroup1) throw new Error('第二个解决方案的分组未定义');
      
      expect(secondGroup0.weights).toEqual([150]);
      expect(secondGroup1.weights).toEqual([250]);
    });

    it('应该正确处理空分组', () => {
      const result = formatGroupsAsJson([]);
      expect(result).toEqual([]);
    });
  });
});
