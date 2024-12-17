"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils/format";
import { type ProductPriceGroup } from "@/lib/validations/mold-calculator";

interface GroupedProductDetailsProps {
  groupedProducts: ProductPriceGroup[];
}

export function GroupedProductDetails({ groupedProducts }: GroupedProductDetailsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>分组产品价格详情</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {groupedProducts.map((group, groupIndex) => (
            <div key={groupIndex} className="rounded-lg border p-4">
              <h3 className="mb-4 text-lg font-semibold">
                分组 {groupIndex + 1}
              </h3>
              {group.map((product, productIndex) => (
                <div key={productIndex} className="mb-4 last:mb-0">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">尺寸 (mm)</div>
                      <div className="font-medium">
                        {formatNumber(product.length)} × {formatNumber(product.width)} × {formatNumber(product.height)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">体积 (mm³)</div>
                      <div className="font-medium">{formatNumber(product.volume)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">密度</div>
                      <div className="font-medium">{formatNumber(product.density, 6)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">重量 (g)</div>
                      <div className="font-medium">{formatNumber(product.weight)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">数量</div>
                      <div className="font-medium">{formatNumber(product.productQuantity)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">颜色</div>
                      <div className="font-medium">{product.color}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">材料</div>
                      <div className="font-medium">{product.productMaterial}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">材料成本</div>
                      <div className="font-medium">¥{formatNumber(product.materialPrice)}</div>
                    </div>
                  </div>

                  {/* 加工成本详情 */}
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium">加工成本明细</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {product.processingCost.map((cost, costIndex) => (
                        <div key={costIndex} className="grid grid-cols-4 gap-4 bg-gray-50 p-2 rounded text-sm">
                          <div>
                            <div className="text-gray-500">生产数量</div>
                            <div>{formatNumber(cost.productMakingQuantity)} 件</div>
                          </div>
                          <div>
                            <div className="text-gray-500">生产成本</div>
                            <div>¥{formatNumber(cost.productMakingPrice)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">单件价格</div>
                            <div>${formatNumber(cost.productSinglePrice)}</div>
                          </div>
                          <div>
                            <div className="text-gray-500">总价格</div>
                            <div>${formatNumber(cost.productTotalPrice)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 最终价格 */}
                  <div className="mt-4 text-right">
                    <span className="text-gray-500 mr-2">最终价格:</span>
                    <span className="text-lg font-semibold text-blue-600">
                      ${formatNumber(product.finalPrice)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}