import type { OCCTResult } from "./occt-types";

export interface ThreeGeometry {
  positions: Float32Array | number[];
  indices: Uint32Array | number[];
  normals?: Float32Array | number[];
}

export function convertOCCTToThreeGeometry(
  occtResult: OCCTResult,
): ThreeGeometry | null {
  const mesh = occtResult.meshes?.[0];
  if (!mesh) return null;

  return {
    positions: mesh.attributes.position.array,
    indices: mesh.index.array,
    normals: mesh.attributes.normal?.array,
  };
}
