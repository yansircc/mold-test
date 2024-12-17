import { getGroupWeight } from "./utils/weight";
import { isValidGrouping } from "./utils/validation";
import { generateSolutionDescription } from "./utils/format";
import { checkVolumeUtilization } from "./utils/volume";
import { generateAllPossibleCombinations } from "./utils/combinations";
import type { ResponseData, Solution } from "@/types/algorithm/grouping/types";
import type { Product } from "@/types/domain/product";

/**
 * Find optimal grouping solutions for products within a single mold
 */
export function findOptimalGroups(products: Product[]): ResponseData {
  // 确保所有产品都有重量
  const validProducts = products.filter(
    (p): p is Product & { weight: number } => typeof p.weight === "number",
  );

  // if (validProducts.length !== products.length) {
  //   return {
  //     weightDiff: 0,
  //     weights: products.map((p) => p.weight ?? 0),
  //     message: {
  //       general: "存在产品缺少重量信息",
  //       solutions: [],
  //     },
  //     totalSolutions: 0,
  //     solutions: [],
  //   };
  // }

  // Check volume utilization first
  // const volumeCheck = checkVolumeUtilization(validProducts);
  // if (!volumeCheck.canGroup) {
  //   return {
  //     weightDiff: 0,
  //     weights: validProducts.map((p) => p.weight),
  //     message: {
  //       general: volumeCheck.message ?? "产品不适合分组",
  //       solutions: [],
  //     },
  //     totalSolutions: 0,
  //     solutions: [],
  //   };
  // }

  // Generate all possible groupings
  const combinations = generateAllPossibleCombinations({
    items: validProducts,
    validate: (groups) => ({
      valid: isValidGrouping(groups).valid,
    }),
    maxGroups: 2, // We only want to split into 2 groups for weight balance
    minItemsPerGroup: 1,
  });

  // console.log("combinations length Test: ",combinations.length)
  // console.log("combinations length Test: ",combinations)
  // Extract just the groups from combinations
  const possibleGroups = combinations.map((c) => c.groups);

  if (possibleGroups.length === 0) {
    return {
      weightDiff: 0,
      weights: validProducts.map((p) => p.weight),
      message: {
        general: "未找到符合条件的分组方案",
        solutions: [],
      },
      totalSolutions: 0,
      solutions: [],
    };
  }

  // console.log("possibleGroups length Test: ",possibleGroups.length)
  // console.log("possibleGroups length data: ",possibleGroups)
  // Convert to our solution format
  const solutions: Solution[] = possibleGroups.map((groups, index) => ({
    solutionId: index + 1,
    groups: groups.map((group, groupIndex) => ({
      groupId: groupIndex + 1,
      weights: group.map((p) => p.weight),
      totalWeight: getGroupWeight(group),
    })),
  }));

  // Generate descriptions for each solution
  const descriptions = solutions.map((_, index) => {
    const groups = possibleGroups[index];
    if (!groups) {
      throw new Error(`Missing groups for solution ${index + 1}`);
    }
    return generateSolutionDescription(groups, index + 1);
  });

  // Ensure we have at least one solution before accessing it
  if (solutions.length === 0) {
    throw new Error("No solutions available");
  }

  const firstSolution = solutions[0];
  if (!firstSolution || firstSolution.groups.length < 2) {
    throw new Error("Invalid solution structure");
  }

  return {
    weightDiff: Math.abs(
      firstSolution.groups[0]!.totalWeight -
        firstSolution.groups[1]!.totalWeight,
    ),
    weights: validProducts.map((p) => p.weight),
    message: {
      general: `找到${possibleGroups.length}种分组方案`,
      // volumeUtilization: volumeCheck.message,
      volumeUtilization: "volumeUtilization",
      solutions: descriptions,
    },
    totalSolutions: possibleGroups.length,
    solutions,
    
  };
}
