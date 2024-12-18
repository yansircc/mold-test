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

interface DataItemProps {
  label: string;
  value: string | number;
  unit?: string;
}

function DataItem({ label, value, unit }: DataItemProps) {
  return (
    <div className="space-y-1.5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium">
        {typeof value === 'number' ? formatNumber(value) : value}
        {unit && <span className="ml-1 text-gray-500 text-sm">{unit}</span>}
      </div>
    </div>
  );
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const material = product.material ? (JSON.parse(product.material) as Material) : undefined;

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <span>{product.name || `产品 ${product.id}`}</span>
            <Badge variant="outline" className="h-5">ID: {product.id}</Badge>
          </div>
          <Badge variant="secondary" className="capitalize">
            {product.materialName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 基本信息 */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2">
            基本信息
            <Badge variant="outline" className="capitalize">
              {product.color}
            </Badge>
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <DataItem 
              label="尺寸" 
              value={`${formatNumber(product.dimensions?.width ?? 0)} × ${formatNumber(product.dimensions?.length ?? 0)} × ${formatNumber(product.dimensions?.height ?? 0)}`}
              unit="mm"
            />
            <DataItem 
              label="重量" 
              value={product.weight ?? 0}
              unit="g"
            />
            <DataItem 
              label="体积" 
              value={product.volume ?? 0}
              unit="mm³"
            />
            <DataItem 
              label="密度" 
              value={product.density ?? 0}
              unit="g/cm³"
            />
            <DataItem 
              label="生产数量" 
              value={product.quantity ?? 0}
              unit="件"
            />
          </div>
        </div>

        <Separator />

        {/* 材料信息 */}
        {material && (
          <>
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-900">材料参数</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <DataItem 
                  label="材料类型" 
                  value={material.type}
                />
                <DataItem 
                  label="密度" 
                  value={material.density}
                  unit="g/cm³"
                />
                <DataItem 
                  label="熔点" 
                  value={material.meltTemp}
                  unit="°C"
                />
                <DataItem 
                  label="模具温度" 
                  value={material.moldTemp}
                  unit="°C"
                />
                <DataItem 
                  label="收缩率" 
                  value={material.shrinkage}
                  unit="%"
                />
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* 流动数据 */}
        {product.flowData && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-900">流动参数</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DataItem 
                label="流动长度" 
                value={product.flowData?.manualFlowLength ?? 0}
                unit="mm"
              />
              <DataItem 
                label="流动路径" 
                value={product.flowData?.calculatedFlowPath?.length ?? 0}
                unit="mm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
