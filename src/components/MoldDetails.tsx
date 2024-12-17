"use client";

// import { useMoldStore } from "@/stores/useMoldStore";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils/format";
import { type MoldDimensions, type ProductPriceGroup } from "@/lib/validations/mold-calculator";

interface MoldDetailsProps {
  productPriceGroups: ProductPriceGroup[];
  moldDimensions: MoldDimensions;
}

export function MoldDetails({ productPriceGroups, moldDimensions }: MoldDetailsProps) {
  // const { moldDimensions, moldMaterial, moldWeight, moldPrice } = useMoldStore();

  // 计算所有分组的总价
  const totalProductPrice = productPriceGroups.reduce((groupSum, group) => {
    // 计算每个分组中所有产品的finalPrice总和
    const groupTotal = group.reduce((productSum, product) => 
      productSum + (product.finalPrice ?? 0), 0
    );
    return groupSum + groupTotal;
  }, 0);

  const finalTotalPrice = (moldDimensions.moldPrice ?? 0) + totalProductPrice;

  if (!moldDimensions) return null;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-6">
          {/* 模具尺寸 */}
          <div>
            <h3 className="mb-2 text-sm font-medium">模具尺寸</h3>
            <p className="text-sm text-gray-500">
              {formatNumber(moldDimensions.length)} × {formatNumber(moldDimensions.width)} × {formatNumber(moldDimensions.height)} mm
            </p>
          </div>

          {/* 模具材料 */}
          <div>
            <h3 className="mb-2 text-sm font-medium">模具材料</h3>
            <p className="text-sm text-gray-500">{moldDimensions.moldMaterial ?? "未知"}</p>
          </div>

          {/* 模具重量 */}
          <div>
            <h3 className="mb-2 text-sm font-medium">模具重量</h3>
            <p className="text-sm text-gray-500">{formatNumber(moldDimensions.moldWeight ?? 0)} kg</p>
          </div>

          {/* 模具价格 */}
          <div>
            <h3 className="mb-2 text-sm font-medium">模具价格</h3>
            <p className="text-lg font-semibold text-blue-600">${formatNumber(moldDimensions.moldPrice ?? 0)}</p>
          </div>

          {/* 产品总价 */}
          <div>
            <h3 className="mb-2 text-sm font-medium">产品总价</h3>
            <p className="text-lg font-semibold text-blue-600">${formatNumber(totalProductPrice)}</p>
          </div>

          {/* 最终总价 */}
          <div>
            <h3 className="mb-2 text-sm font-medium">最终总价</h3>
            <p className="text-lg font-semibold text-blue-600">${formatNumber(finalTotalPrice)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}