import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { GeometricProperties } from "@/lib/occt-types";

interface DataCardsProps {
  geometryData: GeometricProperties;
}

export default function DataCards({ geometryData }: DataCardsProps) {
  if (!geometryData) return null;
  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>基本尺寸</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                宽度
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.boundingBox.dimensions.x.toFixed(2)} mm
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                高度
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.boundingBox.dimensions.y.toFixed(2)} mm
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                深度
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.boundingBox.dimensions.z.toFixed(2)} mm
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                对角线长度
              </dt>
              <dd className="text-sm font-semibold">
                {Math.sqrt(
                  Math.pow(geometryData.boundingBox.dimensions.x, 2) +
                    Math.pow(geometryData.boundingBox.dimensions.y, 2) +
                    Math.pow(geometryData.boundingBox.dimensions.z, 2),
                ).toFixed(2)}{" "}
                mm
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                体积
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.volume.toFixed(2)} mm³
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>网格统计</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                表面积
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.surfaceArea.toFixed(2)} mm²
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                顶点数量
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.vertexCount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                三角形数量
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.triangleCount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                网格密度
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.density.toFixed(4)} 三角形/mm³
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>网格质量</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                最小三角形面积
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.minTriangleArea.toFixed(2)} mm²
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                最大三角形面积
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.maxTriangleArea.toFixed(2)} mm²
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                平均三角形面积
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.averageTriangleArea.toFixed(2)} mm²
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                纵横比
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.meshQuality.aspectRatio.toFixed(2)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>角度分析</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                最小角度
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.meshQuality.minAngle.toFixed(1)}°
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                最大角度
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.meshQuality.maxAngle.toFixed(1)}°
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                平均角度
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.meshStats.meshQuality.averageAngle.toFixed(1)}°
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>拓扑特</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                面数量
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.topologyInfo.faceCount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                边数量
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.topologyInfo.edgeCount}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                亏格数
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.topologyInfo.genus}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                欧拉特征数
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.topologyInfo.eulerCharacteristic}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>曲率分析</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">
                高斯曲率
              </dt>
              <dd className="rounded bg-muted p-2 font-mono text-sm">
                最小值:{" "}
                {geometryData.curvatureAnalysis.gaussianCurvature.min.toFixed(
                  3,
                )}
                <br />
                最大值:{" "}
                {geometryData.curvatureAnalysis.gaussianCurvature.max.toFixed(
                  3,
                )}
                <br />
                平均值:{" "}
                {geometryData.curvatureAnalysis.gaussianCurvature.average.toFixed(
                  3,
                )}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">
                平均曲率
              </dt>
              <dd className="rounded bg-muted p-2 font-mono text-sm">
                最小值:{" "}
                {geometryData.curvatureAnalysis.meanCurvature.min.toFixed(3)}
                <br />
                最大值:{" "}
                {geometryData.curvatureAnalysis.meanCurvature.max.toFixed(3)}
                <br />
                平均值:{" "}
                {geometryData.curvatureAnalysis.meanCurvature.average.toFixed(
                  3,
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>对称性分析</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                XY平面对称
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.symmetry.hasXYSymmetry ? "是" : "否"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                YZ平面对称
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.symmetry.hasYZSymmetry ? "是" : "否"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                XZ平面对称
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.symmetry.hasXZSymmetry ? "是" : "否"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                对称性得分
              </dt>
              <dd className="text-sm font-semibold">
                {(geometryData.symmetry.symmetryScore * 100).toFixed(1)}%
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>惯性特性</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <div className="space-y-1">
              <dt className="text-sm font-medium text-muted-foreground">
                主惯性矩
              </dt>
              <dd className="rounded bg-muted p-2 font-mono text-sm">
                Ixx: {geometryData.inertia.principalMoments.x.toFixed(2)}
                <br />
                Iyy: {geometryData.inertia.principalMoments.y.toFixed(2)}
                <br />
                Izz: {geometryData.inertia.principalMoments.z.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">
                回转半径
              </dt>
              <dd className="text-sm font-semibold">
                {geometryData.inertia.gyrationRadius.toFixed(2)} mm
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
