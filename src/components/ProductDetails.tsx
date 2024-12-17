import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/domain/product";
import { formatNumber } from "@/lib/utils/format";
import type { Material } from "@/lib/utils/material";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  // 获取材料信息
  const material = product.material ? (JSON.parse(product.material) as Material) : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{product.name || `产品 ${product.id}`}</span>
          <Badge variant="outline">{product.id}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 基本信息 */}
        <div className="space-y-2">
          <h4 className="font-medium">基本信息</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">尺寸 (mm)</div>
              <div className="font-medium">
                {formatNumber(product.dimensions?.width ?? 0)} x{" "}
                {formatNumber(product.dimensions?.length ?? 0)} x{" "}
                {formatNumber(product.dimensions?.height ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">重量 (g)</div>
              <div className="font-medium">
                {formatNumber(product.weight ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">体积 (mm³)</div>
              <div className="font-medium">
                {/* {formatNumber(
                  ((product.dimensions?.width ?? 0) *
                    (product.dimensions?.length ?? 0) *
                    (product.dimensions?.height ?? 0)) /
                    1000
                )} */}
                {formatNumber(product.volume ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">密度</div>
              <div className="font-medium">
                {/* {formatNumber(
                  (product.weight ?? 0) /
                    ((product.dimensions?.width ?? 0) *
                      (product.dimensions?.length ?? 0) *
                      (product.dimensions?.height ?? 0)) *
                    1000
                )}  */}
                {formatNumber(product.density ?? 0, 6)}
              </div>
            </div>
            <div>
              <div className="text-gray-500">颜色</div>
              <div className="font-medium">
                {product.color ?? "未指定"}
              </div>
            </div>
            <div>
              <div className="text-gray-500">材料</div>
              <div className="font-medium">
                {product.materialName ?? "未指定"}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* 材料信息 */}
        {material && (
          <>
            <div className="space-y-2">
              <h4 className="font-medium">材料信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">材料</div>
                  <div className="font-medium">{material.name}</div>
                </div>
                <div>
                  <div className="text-gray-500">类型</div>
                  <div className="font-medium">{material.type}</div>
                </div>
                <div>
                  <div className="text-gray-500">密度 (g/cm³)</div>
                  <div className="font-medium">{formatNumber(material.density)}</div>
                </div>
                <div>
                  <div className="text-gray-500">熔点 (°C)</div>
                  <div className="font-medium">{formatNumber(material.meltTemp)}</div>
                </div>
                <div>
                  <div className="text-gray-500">模具温度 (°C)</div>
                  <div className="font-medium">{formatNumber(material.moldTemp)}</div>
                </div>
                <div>
                  <div className="text-gray-500">收缩率 (%)</div>
                  <div className="font-medium">{formatNumber(material.shrinkage)}</div>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* 流动数据 */}
        {product.flowData && (
          <div className="space-y-2">
            <h4 className="font-medium">流动数据</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">流动长度 (mm)</div>
                <div className="font-medium">
                  {formatNumber(product.flowData?.manualFlowLength ?? 0)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">流动路径</div>
                <div className="font-medium">
                  {formatNumber(product.flowData?.calculatedFlowPath?.length ?? 0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
