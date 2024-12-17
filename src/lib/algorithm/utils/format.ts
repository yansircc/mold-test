import { getGroupWeight } from "./weight";

interface Product {
  id: number;
  name: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

interface GroupInfo {
  groupId: number;
  weights: number[];
  totalWeight: number;
}

interface Solution {
  solutionId: number;
  groups: GroupInfo[];
}

/**
 * 生成方案描述
 */
export function generateSolutionDescription(
  grouping: Product[][],
  solutionIndex: number,
): string {

  const groups = grouping.map((group) => {
    const weights = group.map((p) => p.weight);
    return `[${weights.join("g, ")}g]`;
  });

  const groupWeights = grouping.map((group) => getGroupWeight(group));
  const maxWeight = Math.max(...groupWeights);
  const minWeight = Math.min(...groupWeights);
  const weightDiff = maxWeight - minWeight;

  return `方案${solutionIndex + 1}：分成${groups.length}组，${groups.join(" / ")}，最大差值为${weightDiff}g，最大重量比例为${(
    maxWeight / minWeight
  ).toFixed(2)}`;
}

/**
 * 将分组转换为JSON格式
 */
export function formatGroupsAsJson(groups: Product[][][]): Solution[] {
  return groups.map((grouping, solutionIndex) => {
    const groups = grouping.map((group, groupIndex) => {
      const weights = group.map((p) => p.weight);
      return {
        groupId: groupIndex + 1,
        weights,
        totalWeight: getGroupWeight(group),
      };
    });

    return {
      solutionId: solutionIndex + 1,
      groups,
    };
  });
}
