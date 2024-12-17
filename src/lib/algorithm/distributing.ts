import type { 
  ResponseData, 
  MoldDistribution, 
  DistributionSolution, 
  DistributionResult 
} from '@/types/algorithm/grouping/types';
import type { Product } from '@/types/domain/product';
import { findOptimalGroups } from './grouping';
import { generateAllPossibleCombinations } from './utils/combinations';
import { checkVolumeUtilization } from './utils/volume';
import { checkColorAndMaterial } from './utils/color-and-material';

/**
 * Validate if a distribution of products across molds is feasible
 */
function validateDistribution(groups: Product[][]): { 
  valid: boolean; 
  result: ResponseData[] | undefined;
} {
  // Check volume utilization and grouping feasibility for each mold
  const results: ResponseData[] = [];
  console.log("validateDistribution 调用: ", 1)
  for (const products of groups) {
    // console.log("products 调用: ", products)
    //check color and material
    // const colorAndMaterialCheck = checkColorAndMaterial(products);
    // if (!colorAndMaterialCheck.canGroup) {
    //   return { valid: false, result: undefined };
    // }
    
    // Check volume utilization first
    // const volumeCheck = checkVolumeUtilization(products);
    // if (!volumeCheck.canGroup) {
    //   return { valid: false, result: undefined };
    // }

    // Try to find optimal groups within this mold
    const groupingResult = findOptimalGroups(products);
    if (groupingResult.totalSolutions === 0) {
      return { valid: false, result: undefined };
    }

    results.push(groupingResult);
  }

  // console.log("results length Test: ",results.length)
  return { valid: true, result: results };
}

/**
 * Find all possible ways to distribute products across different molds
 */
export function findOptimalDistribution(products: Product[], skipValidation = false): DistributionResult {
  // Generate all possible distributions
  const distributions = generateAllPossibleCombinations({
    items: products,
    validate: skipValidation ? undefined : validateDistribution,
    maxGroups: products.length, // Maximum one product per mold
    minItemsPerGroup: 1        // At least one product per mold
  });

  if (distributions.length === 0) {
    return {
      solutions: [],
      totalSolutions: 0,
      message: {
        general: '未找到可行的模具分配方案'
      }
    };
  }

  // console.log("undefined distributions.length", distributions.length)

  
  // Convert the results into our desired format
  const validDistributions = skipValidation 
    ? distributions.map(dist => ({
        groups: dist.groups,
        validationResult: dist.groups.map(() => ({ totalSolutions: 1 })) as ResponseData[]
      }))
    : distributions
        .filter((dist): dist is { groups: Product[][]; validationResult: ResponseData[] } => 
          dist.validationResult !== undefined && 
          dist.validationResult.length === dist.groups.length
        );

  //  console.log("最后的方案：validDistributions length Test: ",validDistributions)

  const solutions: DistributionSolution[] = validDistributions
    .map((dist, index) => ({
      solutionId: index + 1,
      distributions: dist.groups.map((products, moldIndex): MoldDistribution => {
        const result = dist.validationResult[moldIndex];
        if (!result) {
          throw new Error(`Missing validation result for mold ${moldIndex + 1}`);
        }
        return {
          moldId: moldIndex + 1,
          products,
          groupingResult: result
        };
      }),
      solutionScore:  Math.floor(Math.random() * 41) + 60
    }));

    // console.log("solutions length Test: ",solutions.length)

  // Sort solutions by number of molds (prefer fewer molds)
  solutions.sort((a, b) => a.distributions.length - b.distributions.length);

  // console.log("最后的方案：distributions length Test: ",distributions)

  return {
    solutions,
    totalSolutions: solutions.length,
    message: {
      general: `找到${solutions.length}种可行的模具分配方案`,
      details: solutions.map(s => 
        `方案${s.solutionId}：使用${s.distributions.length}个模具`)
    }
  };
}
