import type {
  OCCTResult,
  OCCTOptions,
  OCCTMesh,
  OCCTNode,
  OCCTBrepFace,
  OCCTMeshAttributes,
} from "occt-import-js";

import type { GeometricProperties, Vector3 } from "./occt-utils";

// Re-export imported types
export type {
  OCCTResult,
  OCCTOptions,
  OCCTMesh,
  OCCTNode,
  OCCTBrepFace,
  OCCTMeshAttributes,
  GeometricProperties,
  Vector3,
};

// Define additional types for the application
export interface ProcessingResult {
  modelData: OCCTResult;
  geometryData: GeometricProperties;
}

export type FileProcessingStatus = "idle" | "loading" | "success" | "error";

export interface FileProcessingState {
  status: FileProcessingStatus;
  error: string | null;
  modelData: OCCTResult | null;
  geometryData: GeometricProperties | null;
  progress: number;
}
