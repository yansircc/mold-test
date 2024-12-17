import { Point3D } from "@/types/core/geometry";
import { Material } from "three";
import { z } from "zod";


export const productDimensionsSchema = z.object({
  length: z.number(),
  width: z.number(),
  height: z.number(),
  isRotated: z.boolean().optional(),
});

export type ProductDimensions = z.infer<typeof productDimensionsSchema>;

export const productPriceDimensionsSchema = z.object({
  length: z.number(),
  width: z.number(),
  height:z.number(),
  volume: z.number(),
  productMaterial: z.string(),
  productQuantity: z.number(),
  color: z.string(),
  density: z.number(),
});

export type ProductPriceDimensions = z.infer<typeof productPriceDimensionsSchema>;

export const moldDimensionsSchema = z.object({
  length: z.number(),
  width: z.number(),
  height: z.number(),
  moldMaterial: z.string().default(""),
  moldWeight: z.number().optional().default(0),
  moldPrice: z.number().optional().default(0),
  maxInnerLength: z.number().optional().default(0),
  maxInnerWidth: z.number().optional().default(0),
  verticalMargin: z.number().optional().default(0),
  horizontalMargin: z.number().optional().default(0),
});

export type MoldDimensions = z.infer<typeof moldDimensionsSchema>;

export const processingCostSchema = z.object({
  productMakingQuantity: z.number(),
  productMakingPrice: z.number(),
  productSinglePrice: z.number(),
  productTotalPrice: z.number(),
});

export const productPriceSchema = z.object({
  length: z.number(),
  width: z.number(),
  height: z.number(),
  volume: z.number(),
  productMaterial: z.string(),
  productQuantity: z.number(),
  materialPrice: z.number(),
  weight: z.number(),
  remainingQuantity: z.number(),
  processingCost: z.array(processingCostSchema),
  finalPrice: z.number(),
  color: z.string(),
  density: z.number(),
});
export type ProductPrice = z.infer<typeof productPriceSchema>;

export const groupedProductPriceSchema = z.array(productPriceSchema);
export type ProductPriceGroup = z.infer<typeof groupedProductPriceSchema>;

export const  Dimensions3DSchema = z.object({
  width: z.number(),
  length: z.number(),
  height: z.number(),
});

export type Dimensions3D = z.infer<typeof Dimensions3DSchema>;


// 创建与 Point3D 类型对应的 Zod schema
const Point3DSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
}) satisfies z.ZodType<Point3D>;

export type Point3DType = z.infer<typeof Point3DSchema>;

/**
 * CAD 边界盒
 */
export const CADBoundingBoxSchema = z.object({
  center: Point3DSchema,
  dimensions: Point3DSchema,
  rotation: Point3DSchema.optional(),
});
export type CADBoundingBox = z.infer<typeof CADBoundingBoxSchema>;

/**
 * CAD 拓扑信息
 */
export const CADTopologySchema = z.object({
  vertices: z.number(),
  edges: z.number(),
  faces: z.number(),
  shells: z.number(),
});

export type CADTopology = z.infer<typeof CADTopologySchema>;

/**
 * CAD 特征信息
 */
export const CADFeaturesSchema = z.object({
  holes: z.number().optional(),
  ribs: z.number().optional(),
  bosses: z.number().optional(),
  fillets: z.number().optional(),
  chamfers: z.number().optional(),
});

export type CADFeatures = z.infer<typeof CADFeaturesSchema>;

/**
 * CAD 数据
 */
export const CADDataSchema = z.object({
  boundingBox: CADBoundingBoxSchema,
  topology: CADTopologySchema.optional(),
  features: CADFeaturesSchema.optional(),
  volume: z.number(),
  surfaceArea: z.number(),
  centerOfMass: Point3DSchema,
  momentOfInertia: Point3DSchema.optional(),
  format: z.string().optional(),
  version: z.string().optional(),
  lastModified: z.date().optional(),  
});

export type CADDataNew = z.infer<typeof CADDataSchema>;

export const productGroupItemSchema = z.object({
  length: z.number(),
  width: z.number(),
  height: z.number(),
  volume: z.number(),
  material: z.string(),
  quantity: z.number(),
  color: z.string(),
  density: z.number(),
  name: z.string(),
  id: z.number(),
  cadData: CADDataSchema,
});

// 产品组（一组产品）的 schema
export const productGroupSchema = z.array(productGroupItemSchema);

export const productGroupWithScoreSchema = z.object({
  group: productGroupSchema,
  score: z.number(),
  mold: moldDimensionsSchema.optional(),
  productsWithPrice:  z.array(groupedProductPriceSchema).optional(),
});

// 一个分组方案（多个产品组）的 schema
export const groupedProductsSchema = z.array(productGroupSchema);

export const groupedProductsWithScoreItemSchema = z.array(productGroupWithScoreSchema);

export type groupedProductsWithScoreItem = z.infer<typeof groupedProductsWithScoreItemSchema>;

export const groupedProductsWithScoreSchema = z.object({
  groups: groupedProductsWithScoreItemSchema,
  solutionsScore: z.number(),
  solutionsName: z.string(),
  totalMoldPrice: z.number(),
  totalProductPrice: z.number(),
  totalPrice: z.number(),
});

// 所有可能的分组方案的 schema
export const productGroupOutputResultSchema = z.array(groupedProductsWithScoreSchema);



export type ProductGroupItem = z.infer<typeof productGroupItemSchema>;

export type productGroup = z.infer<typeof productGroupSchema>;

export type groupedProducts = z.infer<typeof groupedProductsSchema>;

export type groupedProductsSchemas = z.infer<typeof productGroupOutputResultSchema>;


