import React, { useMemo } from "react";
import { calculate2DCenter, type Point2D } from "@/lib/utils/coordinate";
import { COLORS } from "@/lib/constants/colors";
import type { Rectangle } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";
import {
  useViewBoxCalculation,
  Legend,
  type LegendConfig,
} from "./base/BaseScoreVisualizer";
import { useBalanceStore } from "@/stores/useBalanceStore";
import { calculateFlowPathInfo } from "@/lib/utils/geometry";

interface FlowScoreVisualizerProps {
  layout: Rectangle[];
  products: Product[];
  injectionPoint: Point2D;
  width?: number;
  height?: number;
}

export interface FlowLayoutItem {
  center: Point2D;
  weight: number;
  dimensions: Rectangle;
  flowLength: number;
  flowPath: Point2D[];
}

export const FlowScoreVisualizer: React.FC<FlowScoreVisualizerProps> = ({
  layout,
  products,
  injectionPoint,
  width = 800,
  height = 600,
}) => {
  // 获取评分数据
  const { score } = useBalanceStore();

  // 计算视图参数
  const viewBoxData = useViewBoxCalculation(layout, width, height);

  // 计算布局项目
  const layoutItems: FlowLayoutItem[] = useMemo(() => {
    if (layout.length !== products.length) return [];

    return layout.map((rect, i) => {
      const product = products[i];
      const center = calculate2DCenter(rect);
      if (!product)
        return {
          center,
          weight: 1,
          dimensions: rect,
          flowLength: 0,
          flowPath: [],
        };

      // 计算流动路径信息
      const flowInfo = calculateFlowPathInfo(product, rect, injectionPoint);

      // 如果有手动设置的流动长度，使用手动值
      const flowLength = product?.flowData?.manualFlowLength ?? flowInfo.length;

      return {
        center,
        weight: product?.weight ?? 1,
        dimensions: rect,
        flowLength,
        flowPath: flowInfo.path,
      };
    });
  }, [layout, products, injectionPoint]);

  // 图例配置
  const legendConfig: LegendConfig = {
    items: [
      {
        color: COLORS.visualization.accent,
        label: "产品重心",
      },
      {
        color: COLORS.visualization.highlight,
        label: "注塑点",
      },
      {
        color: COLORS.visualization.gray,
        label: "流道长度",
      },
    ],
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* 详细信息面板 */}
      <div className="mb-4 space-y-4 rounded bg-white/90 p-4 text-sm shadow-sm">
        {/* 总分 */}
        <div className="border-b pb-2">
          <div className="font-medium">流动总分</div>
          <div className="text-2xl font-semibold text-slate-800">
            {score?.details.flow.overall.toFixed(1)}
          </div>
        </div>

        {/* 流动评分 */}
        <div className="space-y-2">
          <div className="font-medium">流动评分详情</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-gray-600">流动路径</div>
              <div>{score?.details.flow.flowPathBalance.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-gray-600">表面积</div>
              <div>{score?.details.flow.surfaceAreaBalance.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-2 text-xs text-gray-500">
          颜色深浅表示流动评分的高低
        </div>
      </div>

      {/* 主视图 */}
      <div className="relative flex-1">
        <svg
          width={width}
          height={height}
          viewBox={`${viewBoxData.viewBox.x} ${viewBoxData.viewBox.y} ${viewBoxData.viewBox.width} ${viewBoxData.viewBox.height}`}
          className="border border-slate-300"
        >
          {/* 布局矩形 */}
          {layout.map((rect, index) => (
            <g key={`rect-${index}`}>
              <rect
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.length}
                className="stroke-green-500"
                fill={COLORS.success.light}
                strokeWidth={1 / viewBoxData.scale}
                fillOpacity={0.2}
              />
            </g>
          ))}

          {/* 注塑点 */}
          <circle
            cx={injectionPoint.x}
            cy={injectionPoint.y}
            r={5 / viewBoxData.scale}
            fill={COLORS.visualization.highlight}
          />

          {/* 流道路径和产品重心 */}
          {layoutItems.map((item, index) => (
            <g key={`flow-${index}`}>
              {/* 流道路径线 */}
              <line
                x1={injectionPoint.x}
                y1={injectionPoint.y}
                x2={item.center.x}
                y2={item.center.y}
                stroke={COLORS.visualization.gray}
                strokeWidth={1 / viewBoxData.scale}
                strokeDasharray={`${4 / viewBoxData.scale},${4 / viewBoxData.scale}`}
              />
              {/* 产品重心点 */}
              <circle
                cx={item.center.x}
                cy={item.center.y}
                r={3 / viewBoxData.scale}
                fill={COLORS.visualization.accent}
              />
            </g>
          ))}
        </svg>
        <Legend config={legendConfig} />
      </div>
    </div>
  );
};
