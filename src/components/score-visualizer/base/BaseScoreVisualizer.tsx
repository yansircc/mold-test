import React, { useMemo } from "react";
import type { Rectangle } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";
import type { Point2D, LayoutItem } from "@/lib/utils/coordinate";

export interface BaseVisualizerProps {
  layout: Rectangle[];
  products: Product[];
  width?: number;
  height?: number;
}

export interface ViewBoxData {
  scale: number;
  viewBox: {
    width: number;
    height: number;
    x: number;
    y: number;
  };
  layoutBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  originPoint: Point2D;
  visualCenter: Point2D;
}

export interface QuadrantData {
  centerOfMass: Point2D;
  quadrantWeights: [number, number, number, number];
}

// 新增：Legend配置接口
export interface LegendConfig {
  items: Array<{
    color: string;
    label: string;
  }>;
}

// 新增：QuadrantConfig配置接口
export interface QuadrantConfig {
  showLines?: boolean;
  showWeights?: boolean;
  centerPoint?: Point2D;
}

// 新增：Annotation配置接口
export interface AnnotationConfig {
  title: string;
  descriptions: string[];
}

export const useViewBoxCalculation = (
  layout: Rectangle[],
  width: number,
  height: number,
): ViewBoxData => {
  return useMemo(() => {
    // Find layout bounds
    const bounds = {
      minX: Math.min(...layout.map((r) => r.x)),
      minY: Math.min(...layout.map((r) => r.y)),
      maxX: Math.max(...layout.map((r) => r.x + r.width)),
      maxY: Math.max(...layout.map((r) => r.y + r.length)),
    };

    // Calculate layout dimensions
    const layoutWidth = bounds.maxX - bounds.minX;
    const layoutHeight = bounds.maxY - bounds.minY;

    // Add padding (20% of the larger dimension)
    const padding = Math.max(layoutWidth, layoutHeight) * 0.2;

    // Calculate viewBox dimensions with padding
    const viewBoxWidth = layoutWidth + padding * 2;
    const viewBoxHeight = layoutHeight + padding * 2;

    // Calculate scale to fit in container
    const scaleX = width / viewBoxWidth;
    const scaleY = height / viewBoxHeight;
    const scale = Math.min(scaleX, scaleY);

    // Calculate visual origin point (center of layout)
    const originPoint = {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };

    // Calculate visual center in SVG coordinates
    const visualCenter = {
      x: width / 2,
      y: height / 2,
    };

    return {
      scale,
      viewBox: {
        width: viewBoxWidth,
        height: viewBoxHeight,
        x: originPoint.x - viewBoxWidth / 2,
        y: originPoint.y - viewBoxHeight / 2,
      },
      layoutBounds: bounds,
      originPoint,
      visualCenter,
    };
  }, [layout, width, height]);
};

export const useQuadrantCalculation = (
  centers: LayoutItem[],
  originPoint: Point2D,
): QuadrantData => {
  return useMemo(() => {
    // Calculate weighted center of mass
    const totalWeight = centers.reduce((sum, c) => sum + c.weight, 0);
    const centerOfMass =
      totalWeight === 0
        ? originPoint
        : centers.reduce(
            (sum, c) => ({
              x: sum.x + (c.center.x * c.weight) / totalWeight,
              y: sum.y + (c.center.y * c.weight) / totalWeight,
            }),
            { x: 0, y: 0 },
          );

    // Calculate quadrant weights
    const quads: [number, number, number, number] = [0, 0, 0, 0]; // Q1, Q2, Q3, Q4

    if (totalWeight > 0) {
      centers.forEach((c) => {
        // 第一象限：x > 0, y > 0
        if (c.center.x >= centerOfMass.x && c.center.y >= centerOfMass.y)
          quads[0] += (c.weight / totalWeight) * 100;
        // 第二象限：x < 0, y > 0
        else if (c.center.x < centerOfMass.x && c.center.y >= centerOfMass.y)
          quads[1] += (c.weight / totalWeight) * 100;
        // 第三象限：x < 0, y < 0
        else if (c.center.x < centerOfMass.x && c.center.y < centerOfMass.y)
          quads[2] += (c.weight / totalWeight) * 100;
        // 第四象限：x > 0, y < 0
        else quads[3] += (c.weight / totalWeight) * 100;
      });
    }

    return {
      centerOfMass,
      quadrantWeights: quads,
    };
  }, [centers, originPoint]);
};

interface QuadrantLinesProps {
  centerPoint: Point2D;
  viewBox: ViewBoxData["viewBox"];
  scale: number;
}

export const QuadrantLines: React.FC<QuadrantLinesProps> = ({
  centerPoint,
  viewBox,
  scale,
}) => (
  <>
    <defs>
      <pattern
        id="dashPattern"
        patternUnits="userSpaceOnUse"
        width={4 / scale}
        height={4 / scale}
      >
        <path
          d="M 0,2 l 4,0"
          stroke="#CBD5E1"
          strokeWidth={1 / scale}
          fill="none"
        />
      </pattern>
    </defs>
    <line
      x1={centerPoint.x}
      y1={viewBox.y}
      x2={centerPoint.x}
      y2={viewBox.y + viewBox.height}
      stroke="url(#dashPattern)"
      strokeWidth={1 / scale}
    />
    <line
      x1={viewBox.x}
      y1={centerPoint.y}
      x2={viewBox.x + viewBox.width}
      y2={centerPoint.y}
      stroke="url(#dashPattern)"
      strokeWidth={1 / scale}
    />
  </>
);

interface QuadrantWeightLabelsProps {
  centerPoint: Point2D;
  quadrantWeights: number[];
  viewBox: ViewBoxData["viewBox"];
  scale: number;
  format?: (weight: number) => string;
  showLabels?: boolean;
}

export const QuadrantWeightLabels: React.FC<QuadrantWeightLabelsProps> = ({
  centerPoint,
  quadrantWeights,
  viewBox,
  scale,
  format = (weight) => `${weight.toFixed(1)}%`,
  showLabels = true,
}) => {
  if (!showLabels) return null;

  return (
    <>
      {quadrantWeights.map((weight, i) => {
        const angleOffset = Math.PI / 4; // 45 degrees
        const radius = Math.min(viewBox.width, viewBox.height) * 0.15;
        const angle = (i * Math.PI) / 2 + angleOffset;
        const x = centerPoint.x + Math.cos(angle) * radius;
        const y = centerPoint.y + Math.sin(angle) * radius;

        return (
          <text
            key={i}
            x={x}
            y={y}
            className="fill-slate-600"
            style={{
              fontSize: `${12 / scale}px`,
              textAnchor: "middle",
              dominantBaseline: "middle",
            }}
          >
            {format(weight)}
          </text>
        );
      })}
    </>
  );
};

export const Legend: React.FC<{ config: LegendConfig }> = ({ config }) => (
  <div className="absolute left-2 top-2 rounded bg-white/80 p-2 text-sm text-slate-600 shadow-sm backdrop-blur">
    {config.items.map((item, index) => (
      <div key={index} className="mt-1 flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: item.color }}
        ></div>
        <span>{item.label}</span>
      </div>
    ))}
  </div>
);

interface AnnotationProps {
  config: AnnotationConfig;
  position?: "bottom-right" | "bottom";
}

export const Annotation: React.FC<AnnotationProps> = ({
  config,
  position = "bottom-right",
}) => {
  const positionClass =
    position === "bottom-right"
      ? "bottom-4 right-4"
      : "bottom-4 left-1/2 -translate-x-1/2";

  return (
    <div
      className={`absolute ${positionClass} rounded-lg bg-white/80 p-3 shadow-sm backdrop-blur-sm`}
    >
      <div className="mb-1 text-sm font-medium text-slate-800">
        {config.title}
      </div>
      {config.descriptions.map((desc, index) => (
        <div key={index} className="text-xs text-slate-600">
          • {desc}
        </div>
      ))}
    </div>
  );
};
