import type { Product } from '../../domain/product';

/**
 * 分组信息
 */
export interface GroupInfo {
  groupId: number;
  weights: number[];
  totalWeight: number;
}

/**
 * 分组方案
 */
export interface Solution {
  solutionId: number;
  groups: GroupInfo[];
}

/**
 * 分组结果消息
 */
export interface Message {
  general: string;
  volumeUtilization?: string;
  solutions: string[];
}

/**
 * 分组结果数据
 */
export interface ResponseData {
  weightDiff: number;
  weights: number[];
  message: Message;
  totalSolutions: number;
  solutions: Solution[];
}

/**
 * 模具分布
 */
export interface MoldDistribution {
  moldId: number;
  products: Product[];
  groupingResult: ResponseData;
}

/**
 * 分布结果
 */
export interface DistributionResult {
  solutions: DistributionSolution[];
  totalSolutions: number;
  message: {
    general: string;
    details?: string[];
  };
}

/**
 * 分布方案
 */
export interface DistributionSolution {
  solutionId: number;
  distributions: MoldDistribution[];
}
