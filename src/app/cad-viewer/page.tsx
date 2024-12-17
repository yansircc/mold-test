"use client";

import { useState } from "react";
import { OCCTService } from "@/lib/occt-service";
import type { FileProcessingState } from "@/lib/occt-types";
import { convertOCCTToThreeGeometry } from "@/lib/mesh-converter";
import dynamic from "next/dynamic";
import DataCards from "@/components/viewers/DataCards";
import { Progress } from "@/components/ui/progress";

// 动态导入 ModelViewer 组件
const DynamicModelViewer = dynamic(
  () =>
    import("@/components/viewers/ModelViewer").then((mod) => ({
      default: mod.ModelViewer,
    })),
  {
    ssr: false,
    loading: () => <div className="h-[500px] w-full animate-pulse bg-muted" />,
  },
);

export default function OCCTPage() {
  const [processingState, setProcessingState] = useState<FileProcessingState>({
    status: "idle",
    error: null,
    modelData: null,
    geometryData: null,
    progress: 0,
  });

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessingState((prev) => ({
      ...prev,
      status: "loading",
      error: null,
      modelData: null,
      geometryData: null,
      progress: 0,
    }));

    try {
      // 文件读取开始
      setProcessingState((prev) => ({ ...prev, progress: 5 }));
      const arrayBuffer = await file.arrayBuffer();
      const fileBuffer = new Uint8Array(arrayBuffer);

      // 文件读取完成
      setProcessingState((prev) => ({ ...prev, progress: 20 }));
      await new Promise((resolve) => setTimeout(resolve, 200));

      const occtService = OCCTService.getInstance();

      // OCCT 处理开始
      setProcessingState((prev) => ({ ...prev, progress: 40 }));
      const result = await occtService.processSTEPFile(fileBuffer);

      // OCCT 处理完成
      setProcessingState((prev) => ({ ...prev, progress: 60 }));
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 开始转换为 Three.js 几何体
      setProcessingState((prev) => ({ ...prev, progress: 80 }));
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 完成所有处理
      setProcessingState((prev) => ({
        ...prev,
        status: "success",
        modelData: result.modelData,
        geometryData: result.geometryData,
        progress: 100,
      }));
    } catch (err) {
      console.error("Error processing file:", err);
      setProcessingState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : "Failed to process file",
        progress: 0,
      }));
    }
  };

  const { status, error, geometryData, modelData, progress } = processingState;

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">3D模型分析</h1>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {modelData && (
        <div className="mb-6 rounded-lg border bg-background">
          {(() => {
            const geometry = convertOCCTToThreeGeometry(modelData);
            if (!geometry) return null;
            return <DynamicModelViewer geometry={geometry} />;
          })()}
        </div>
      )}

      {geometryData && <DataCards geometryData={geometryData} />}

      <div className="space-y-4">
        <input
          type="file"
          accept=".step,.stp"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-violet-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-violet-700 hover:file:bg-violet-100"
          disabled={status === "loading"}
        />
        {status === "loading" && (
          <div className="space-y-2">
            <Progress value={progress} />
            <div className="text-center text-sm text-muted-foreground">
              处理中... {progress}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
