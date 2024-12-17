/**
 * 格式化数字，保留指定位数的小数
 * @param num 要格式化的数字
 * @param digits 小数位数，默认为2
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number | undefined | null, digits = 2): string {
  if (num === undefined || num === null || isNaN(num)) return "-";
  return Number(num).toFixed(digits);
}
