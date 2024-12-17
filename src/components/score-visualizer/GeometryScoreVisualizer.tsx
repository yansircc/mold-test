import React, { useMemo } from "react";
import { calculate2DCenter, type LayoutItem } from "@/lib/utils/coordinate";
import { COLORS } from "@/lib/constants/colors";
import type { Rectangle } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";
import {
  useViewBoxCalculation,
  useQuadrantCalculation,
  QuadrantLines,
  QuadrantWeightLabels,
  Legend,
  type LegendConfig,
} from "./base/BaseScoreVisualizer";
import { useBalanceStore } from "@/stores/useBalanceStore";

interface GeometryScoreVisualizerProps {
  layout: Rectangle[];
  products: Product[];
  width?: number;
  height?: number;
}

export const GeometryScoreVisualizer: React.FC<
  GeometryScoreVisualizerProps
> = ({ layout, products, width = 800, height = 600 }) => {
  // Get score from store
  const { score } = useBalanceStore();

  // Calculate visualization parameters
  const viewBoxData = useViewBoxCalculation(layout, width, height);

  // Calculate centers and weights
  const centers: LayoutItem[] = useMemo(() => {
    if (layout.length !== products.length) {
      return [];
    }

    return layout.map((rect, i) => {
      const product = products[i];
      const center = calculate2DCenter(rect);

      return {
        center,
        weight: product?.weight ?? 0,
        dimensions: rect,
      };
    });
  }, [layout, products]);

  // Calculate quadrant data
  const { centerOfMass, quadrantWeights } = useQuadrantCalculation(
    centers,
    viewBoxData.originPoint,
  );

  // Legend configuration
  const legendConfig: LegendConfig = {
    items: [
      {
        color: COLORS.visualization.accent,
        label: "产品重心",
      },
      {
        color: COLORS.visualization.highlight,
        label: "整体重心",
      },
      {
        color: COLORS.visualization.gray,
        label: "象限分界线",
      },
    ],
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* 详细信息面板 */}
      <div className="mb-4 space-y-4 rounded bg-white/90 p-4 text-sm shadow-sm">
        {/* 总分 */}
        <div className="border-b pb-2">
          <div className="font-medium">几何总分</div>
          <div className="text-2xl font-semibold text-slate-800">
            {score?.details.geometry.overall.toFixed(1)}
          </div>
        </div>

        {/* 形状评分 */}
        <div className="space-y-2">
          <div className="font-medium">形状评分</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-gray-600">长宽比</div>
              <div>
                {score?.details.geometry.details.shapeScore.aspectRatio.toFixed(
                  1,
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-600">对称性</div>
              <div>
                {score?.details.geometry.details.shapeScore.symmetry.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-gray-600">复杂度</div>
              <div>
                {score?.details.geometry.details.shapeScore.complexity.toFixed(
                  1,
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-600">一致性</div>
              <div>
                {score?.details.geometry.details.shapeScore.uniformity.toFixed(
                  1,
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 尺寸评分 */}
        <div className="space-y-2">
          <div className="font-medium">尺寸评分</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="text-gray-600">尺寸变化</div>
              <div>
                {score?.details.geometry.details.dimensionScore.sizeVariation.toFixed(
                  1,
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-600">比例</div>
              <div>
                {score?.details.geometry.details.dimensionScore.scaleRatio.toFixed(
                  1,
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-600">一致性</div>
              <div>
                {score?.details.geometry.details.dimensionScore.consistency.toFixed(
                  1,
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 说明 */}
        <div className="mt-2 text-xs text-gray-500">
          颜色深浅表示几何评分的高低
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

          {/* 象限分界线 */}
          <QuadrantLines
            centerPoint={centerOfMass}
            viewBox={viewBoxData.viewBox}
            scale={viewBoxData.scale}
          />

          {/* 象限权重标签 */}
          <QuadrantWeightLabels
            centerPoint={centerOfMass}
            quadrantWeights={quadrantWeights}
            viewBox={viewBoxData.viewBox}
            scale={viewBoxData.scale}
            format={(weight) => `${weight.toFixed(1)}%`}
            showLabels={true}
          />

          {/* 产品重心 */}
          {centers.map((item, index) => (
            <circle
              key={`center-${index}`}
              cx={item.center.x}
              cy={item.center.y}
              r={3 / viewBoxData.scale}
              fill={COLORS.visualization.accent}
              fillOpacity={0.8}
            />
          ))}

          {/* 整体重心 */}
          <circle
            cx={centerOfMass.x}
            cy={centerOfMass.y}
            r={5 / viewBoxData.scale}
            fill={COLORS.visualization.highlight}
            stroke="white"
            strokeWidth={2 / viewBoxData.scale}
          />
        </svg>

        {/* 图例 */}
        <Legend config={legendConfig} />
      </div>
    </div>
  );
};
