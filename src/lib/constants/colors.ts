// 定义统一的颜色方案
export const COLORS = {
  // 主要颜色
  primary: {
    light: '#E0F2FE',  // blue-100
    main: '#0EA5E9',   // blue-500
    dark: '#0369A1',   // blue-700
  },
  // 次要颜色
  secondary: {
    light: '#FEF3C7',  // amber-100
    main: '#F59E0B',   // amber-500
    dark: '#B45309',   // amber-700
  },
  // 成功状态
  success: {
    light: '#DCFCE7',  // green-100
    main: '#22C55E',   // green-500
    dark: '#15803D',   // green-700
  },
  // 警告状态
  warning: {
    light: '#FFEDD5',  // orange-100
    main: '#F97316',   // orange-500
    dark: '#C2410C',   // orange-700
  },
  // 错误状态
  error: {
    light: '#FEE2E2',  // red-100
    main: '#EF4444',   // red-500
    dark: '#B91C1C',   // red-700
  },
  // 中性色
  neutral: {
    background: '#F8FAFC',  // slate-50
    border: '#E2E8F0',      // slate-200
    text: {
      primary: '#1E293B',   // slate-800
      secondary: '#64748B',  // slate-500
    }
  },
  // 可视化专用颜色
  visualization: {
    primary: '#0EA5E9',    // blue-500
    secondary: '#F59E0B',  // amber-500
    gray: '#94A3B8',       // slate-400
    accent: '#22C55E',     // green-500
    highlight: '#EF4444',  // red-500
  }
} as const;
