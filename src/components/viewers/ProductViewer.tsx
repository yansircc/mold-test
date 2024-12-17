"use client";

import { ProductDetails } from "../ProductDetails";
import type { Rectangle } from "@/types/core/geometry";
import type { Product } from "@/types/domain/product";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import dynamic from "next/dynamic";

// 动态导入 Scene 组件
const DynamicScene = dynamic(
  () => import("./Scene").then((mod) => ({ default: mod.Scene })),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
  },
);

interface ProductViewerProps {
  product?: Product;
  products?: Product[];
  layout?: Rectangle[];
}

export function ProductViewer({
  product,
  products,
  layout,
}: ProductViewerProps) {
  // 如果提供了产品列表和布局，显示布局视图
  if (products && layout) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <Tabs defaultValue="layout" className="flex h-[400px]">
          <TabsList className="flex h-full w-48 flex-col justify-start space-y-2 bg-muted p-2">
            <TabsTrigger value="layout" className="w-full justify-start">
              布局视图
            </TabsTrigger>
            {products.map((p) => (
              <TabsTrigger
                key={p.id}
                value={p.id.toString()}
                className="w-full justify-start"
              >
                {p.name || `产品 ${p.id}`}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-1">
            <TabsContent
              value="layout"
              className="m-0 h-full data-[state=active]:block"
            >
              <DynamicScene products={products} layout={layout} />
            </TabsContent>
            {products.map((p) => (
              <TabsContent
                key={p.id}
                value={p.id.toString()}
                className="m-0 h-full data-[state=active]:block"
              >
                <div className="grid h-full grid-cols-[2fr,1fr] gap-6 overflow-hidden">
                  <DynamicScene product={p} />
                  <div className="overflow-y-auto pr-2">
                    <ProductDetails product={p} />
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    );
  }

  // 如果只提供了单个产品，显示单个产品视图
  if (product) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="grid h-[400px] grid-cols-[2fr,1fr] gap-6 overflow-hidden">
          <DynamicScene product={product} />
          <div className="overflow-y-auto pr-2">
            <ProductDetails product={product} />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
