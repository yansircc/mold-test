declare module "occt-import-js" {
  export interface OCCTMeshAttributes {
    position: {
      array: Float32Array | number[];
    };
    normal?: {
      array: Float32Array | number[];
    };
  }

  export interface OCCTBrepFace {
    first: number;
    last: number;
    color: [number, number, number] | null;
  }

  export interface OCCTMesh {
    name: string;
    attributes: OCCTMeshAttributes;
    index: {
      array: Uint32Array | number[];
    };
    color?: [number, number, number];
    brep_faces: OCCTBrepFace[];
  }

  export interface OCCTNode {
    name: string;
    meshes: number[];
    children: OCCTNode[];
  }

  export interface OCCTResult {
    success: boolean;
    root: OCCTNode;
    meshes: OCCTMesh[];
  }

  export interface OCCTOptions {
    /** Defines the linear unit of the output. Default is 'millimeter'. */
    linearUnit?: "millimeter" | "centimeter" | "meter" | "inch" | "foot";

    /** Defines what the linear deflection value means. Default is 'bounding_box_ratio'. */
    linearDeflectionType?: "bounding_box_ratio" | "absolute_value";

    /** The linear deflection value based on the value of the linearDeflectionType parameter. */
    linearDeflection?: number;

    /** The angular deflection value. */
    angularDeflection?: number;
  }

  export interface OCCTInstance {
    ReadStepFile(
      content: Uint8Array,
      params: OCCTOptions | null,
    ): Promise<OCCTResult>;
    ReadBrepFile(
      content: Uint8Array,
      params: OCCTOptions | null,
    ): Promise<OCCTResult>;
    ReadIgesFile(
      content: Uint8Array,
      params: OCCTOptions | null,
    ): Promise<OCCTResult>;
  }

  export type OCCTModule = (options: {
    locateFile: (path: string) => string;
  }) => Promise<OCCTInstance>;

  const occtModule: OCCTModule;
  export default occtModule;
}
