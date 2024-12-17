"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils/format";
import { type MoldDimensions, type ProductPriceGroup, } from "@/lib/validations/mold-calculator";

interface SchemaStatsProps {
  totalMoldPrice: number;
  totalProductPrice: number;
  totalPrice: number;
  totalGroups: number;
}

export function SchemaStats({ 
  totalMoldPrice, 
  totalProductPrice, 
  totalPrice, 
  totalGroups 
}: SchemaStatsProps) {
  return (
    <div className="grid grid-cols-4 gap-4">

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">总价格</h3>
        <p className="mt-2 text-2xl font-semibold text-purple-600">
          ${totalPrice.toFixed(2)}
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">总模具价格</h3>
        <p className="mt-2 text-2xl font-semibold text-blue-600">
          ${totalMoldPrice.toFixed(2)}
        </p>
      </div>
      
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">总产品价格</h3>
        <p className="mt-2 text-2xl font-semibold text-green-600">
          ${totalProductPrice.toFixed(2)}
        </p>
      </div>
      
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-gray-500">分组数量</h3>
        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {totalGroups}
        </p>
      </div>
    </div>
  );
}
