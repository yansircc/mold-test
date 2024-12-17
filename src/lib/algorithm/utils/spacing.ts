/**
 * 根据最大尺寸计算间距
 * @param maxDimension 最大尺寸
 * @returns 计算得出的间距
 * @throws {Error} 当最大尺寸超过1000时抛出错误
 */
export function calculateSpacing(maxDimension: number): number {
  if (maxDimension <= 200) return 30;
  if (maxDimension <= 300) return 35;
  if (maxDimension <= 400) return 40;
  if (maxDimension <= 500) return 45;
  if (maxDimension <= 600) return 50;
  if (maxDimension <= 700) return 55;
  if (maxDimension <= 800) return 60;
  if (maxDimension <= 900) return 65;
  if (maxDimension <= 1000) return 70;
  throw new Error("Max dimension exceeded");
  // const baseSpacing = 30;
  // const scaleFactor = 0.1;
  // return Math.min(
  //   baseSpacing + Math.floor(maxDimension * scaleFactor),
  //   70, // 最大间距限制
  // );
}
