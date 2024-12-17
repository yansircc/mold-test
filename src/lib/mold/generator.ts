import * as THREE from "three";
import { Brush, Evaluator, SUBTRACTION } from "three-bvh-csg";
import { type Product } from "@/types/domain/product";
import { type Rectangle } from "@/types/core/geometry";
import {
  calculate3DCenter,
  calculateDimensions,
  createLayoutItemWithHeight,
} from "@/lib/utils/coordinate";
import {
  type MoldGeneratorOptions,
  type MoldGeneratorResult,
  type MoldDimensions,
  MOLD_CONSTANTS,
} from "@/types/mold/generator";

const {
  DEFAULT_MARGIN,
  DEFAULT_CAVITY_MARGIN,
  DEFAULT_WIREFRAME_OPTIONS,
  DEFAULT_MOLD_OPTIONS,
} = MOLD_CONSTANTS;

/**
 * 创建模具材质
 */
function createMoldMaterial(
  options: MoldGeneratorOptions["material"] = {},
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    ...DEFAULT_MOLD_OPTIONS,
    ...options,
  });
}

/**
 * 创建基础模具及其线框
 */
function createBaseMold(
  dimensions: MoldDimensions,
  material: THREE.Material,
): { mold: Brush; wireframe: THREE.LineSegments } {
  // 创建基础模具
  const geometry = new THREE.BoxGeometry(
    dimensions.width / 100,
    dimensions.height / 100,
    dimensions.length / 100,
  );
  const mold = new Brush(geometry, material);
  mold.position.set(0, dimensions.height / 200, 0);
  mold.updateMatrixWorld();

  // 创建模具线框
  const wireframeGeometry = new THREE.BoxGeometry(
    (dimensions.width * MOLD_CONSTANTS.WIREFRAME_SCALE) / 100,
    (dimensions.height * MOLD_CONSTANTS.WIREFRAME_SCALE) / 100,
    (dimensions.length * MOLD_CONSTANTS.WIREFRAME_SCALE) / 100,
  );
  const edges = new THREE.EdgesGeometry(wireframeGeometry);
  const wireframeMaterial = new THREE.LineBasicMaterial(
    DEFAULT_WIREFRAME_OPTIONS,
  );
  const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
  wireframe.position.copy(mold.position);
  wireframe.renderOrder = 1;

  return { mold, wireframe };
}

/**
 * 创建产品凹槽及其线框
 */
function createProductCavity(
  layoutItem: Rectangle & { height: number },
  totalWidth: number,
  totalLength: number,
  moldHeight: number,
  margin: number = DEFAULT_CAVITY_MARGIN,
): { brush: Brush; wireframe: THREE.LineSegments } {
  const center = calculate3DCenter(layoutItem);
  const dimensions = calculateDimensions(layoutItem);

  // 计算位置：凹槽从顶部开始
  const position = new THREE.Vector3(
    (center.x - totalWidth / 2) / 100,
    moldHeight / 100, // 从顶部开始
    (center.z - totalLength / 2) / 100,
  );

  // 创建凹槽几何体，高度翻倍以确保完全穿透
  const geometry = new THREE.BoxGeometry(
    (dimensions.width + margin * 2) / 100,
    (dimensions.height * 2) / 100, // 高度翻倍
    (dimensions.length + margin * 2) / 100,
  );

  const material = new THREE.MeshBasicMaterial({
    visible: false,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
  });

  const brush = new Brush(geometry, material);
  brush.position.copy(position);
  brush.updateMatrixWorld();

  // 线框保持原来的高度，因为它只需要显示实际的凹槽大小
  const wireframeGeometry = new THREE.BoxGeometry(
    (dimensions.width + margin * 2) / 100,
    dimensions.height / 100, // 线框保持原始高度
    (dimensions.length + margin * 2) / 100,
  );
  const edges = new THREE.EdgesGeometry(wireframeGeometry);
  const wireframeMaterial = new THREE.LineBasicMaterial(
    DEFAULT_WIREFRAME_OPTIONS,
  );

  const wireframe = new THREE.LineSegments(edges, wireframeMaterial);
  const wireframePosition = position.clone();
  wireframePosition.y = position.y - dimensions.height / 200;
  wireframe.position.copy(wireframePosition);
  wireframe.renderOrder = 1;

  return { brush, wireframe };
}

/**
 * 生成带凹槽的模具
 */
export function generateMold(
  products: Product[],
  layout: Rectangle[],
  options: MoldGeneratorOptions = {},
  margins: {
    edgeMargin: number;
    bottomMargin: number;
  },
): MoldGeneratorResult {
  // 1. 计算布局尺寸
  const minX = Math.min(...layout.map((item) => item.x));
  const maxX = Math.max(...layout.map((item) => item.x + item.width));
  const minY = Math.min(...layout.map((item) => item.y));
  const maxY = Math.max(...layout.map((item) => item.y + item.length));

  const totalWidth = maxX - minX;
  const totalLength = maxY - minY;
  const maxHeight = Math.max(...products.map((p) => p.dimensions?.height ?? 0));

  // 2. 计算模具尺寸
  // Use margin values from options or defaults
  //TODO: 需要根据产品数量和尺寸来计算模具尺寸
  // const xyMargin = options.margin?.xy ?? DEFAULT_MARGIN.XY;
  // const zMargin = options.margin?.z ?? DEFAULT_MARGIN.Z;
  const xyMargin = margins.edgeMargin ?? DEFAULT_MARGIN.XY;
  const zMargin = margins.bottomMargin ?? DEFAULT_MARGIN.Z;

  const dimensions: MoldDimensions = {
    width: totalWidth + xyMargin * 2,
    length: totalLength + xyMargin * 2,
    height: maxHeight + zMargin * 2,
  };

  // 3. 创建基础模具及其线框
  const material = createMoldMaterial(options.material);
  const { mold: baseMold, wireframe: moldWireframe } = createBaseMold(
    dimensions,
    material,
  );

  // 4. 创建产品凹槽及其线框
  const cavities = layout
    .map((item, index) => {
      const product = products[index];
      if (!product?.dimensions) return null;

      const layoutItem = createLayoutItemWithHeight(
        item,
        product.dimensions.height,
      );
      return createProductCavity(
        layoutItem,
        totalWidth,
        totalLength,
        dimensions.height,
        options.cavity?.margin,
      );
    })
    .filter((cavity): cavity is NonNullable<typeof cavity> => cavity !== null);

  // 5. 从模具中减去凹槽
  const evaluator = new Evaluator();
  let currentMold = baseMold;

  cavities.forEach(({ brush }) => {
    const result = evaluator.evaluate(currentMold, brush, SUBTRACTION);
    if (result) {
      result.material = material;
      currentMold = result;
    }
  });

  // 6. 收集所有线框
  const allWireframes = [
    moldWireframe,
    ...cavities.map((cavity) => cavity.wireframe),
  ];

  return {
    mold: currentMold,
    wireframes: allWireframes,
    centerMarkers: [],
    dimensions,
  };
}
