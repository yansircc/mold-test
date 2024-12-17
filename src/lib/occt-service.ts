import type { GeometricProperties } from "./occt-utils";
import { analyzeMeshGeometry } from "./occt-utils";
import type {
  OCCTModule,
  OCCTInstance,
  OCCTResult,
  OCCTOptions,
} from "occt-import-js";

export class OCCTService {
  private static instance: OCCTService;
  private occtModule: OCCTModule | null = null;
  private occtInstance: OCCTInstance | null = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): OCCTService {
    if (!OCCTService.instance) {
      OCCTService.instance = new OCCTService();
    }
    return OCCTService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.occtInstance) return;

    if (this.isInitializing && this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    this.initPromise = this.initializeInternal();

    try {
      await this.initPromise;
    } finally {
      this.isInitializing = false;
    }
  }

  private async initializeInternal(): Promise<void> {
    try {
      // 仅在客户端环境下导入
      if (typeof window !== "undefined") {
        // 使用 dynamic import 替代 require
        const occtImport = await import("occt-import-js");
        this.occtModule = occtImport.default;

        this.occtInstance = await this.occtModule({
          locateFile: (path: string) => {
            if (path.endsWith(".wasm")) {
              return "/node_modules/occt-import-js/dist/occt-import-js.wasm";
            }
            return path;
          },
        });
      }
    } catch (error) {
      console.error("Failed to initialize OCCT:", error);
      throw error;
    }
  }

  private async processFile(
    fileBuffer: Uint8Array,
    options: OCCTOptions,
    method: "ReadStepFile" | "ReadBrepFile" | "ReadIgesFile",
  ): Promise<{
    modelData: OCCTResult;
    geometryData: GeometricProperties;
  }> {
    await this.initialize();

    if (!this.occtInstance) {
      throw new Error("OCCT not initialized");
    }

    const result = await this.occtInstance[method](fileBuffer, options);

    if (!result.success) {
      throw new Error(
        `Failed to process ${method.replace("Read", "").replace("File", "")} file`,
      );
    }

    if (!result.meshes?.[0]) {
      throw new Error("No mesh data found in the file");
    }

    const positions = result.meshes[0].attributes.position.array;
    const indices = result.meshes[0].index.array;

    if (!Array.isArray(positions) || !Array.isArray(indices)) {
      throw new Error("Invalid mesh data format");
    }

    const geometryData = analyzeMeshGeometry(positions, indices);

    return {
      modelData: result,
      geometryData,
    };
  }

  public async processSTEPFile(
    fileBuffer: Uint8Array,
    options: OCCTOptions = {
      linearDeflection: 0.1,
      angularDeflection: 0.5,
    },
  ) {
    return this.processFile(fileBuffer, options, "ReadStepFile");
  }

  public async processBREPFile(
    fileBuffer: Uint8Array,
    options: OCCTOptions = {
      linearDeflection: 0.1,
      angularDeflection: 0.5,
    },
  ) {
    return this.processFile(fileBuffer, options, "ReadBrepFile");
  }

  public async processIGESFile(
    fileBuffer: Uint8Array,
    options: OCCTOptions = {
      linearDeflection: 0.1,
      angularDeflection: 0.5,
    },
  ) {
    return this.processFile(fileBuffer, options, "ReadIgesFile");
  }
}
