import { generateRandomProducts } from "@/lib/utils/product-generator";
import { calculateProductGroup, calculateProductGroupSchemasSync } from "../product-group";
import { type Rectangle2D } from "@/types/core/geometry";
import { calculateBottomMargin, calculateEdgeMargin, calculateMinArea, calculateMoldWeight, getRandomMold } from "../min-area";
import { getMoldPrice, getProductPriceByGroup } from "@/actions/mold-price";
import { calculateInjectionPoint } from "../balance";
import { calculateBalanceScore } from "@/lib/algorithm/balance/scores";


describe('findOptimalDistribution', () => {
  it('应该找到所有可能的分组方案', async () => {
    
    const newProducts = generateRandomProducts(4,undefined, false);
    // console.log("newProducts:", newProducts);


    const productGroupSchemas = calculateProductGroupSchemasSync(newProducts.map((p) => ({
      // 基本尺寸属性
      length: p.dimensions?.length ?? 0,
      width: p.dimensions?.width ?? 0,
      height: p.dimensions?.height ?? 0,

      // 体积和材料属性
      volume: p.volume ?? 0,
      material: p.materialName ?? '',
      density: p.density ?? 0,

      // 产品基本信息
      quantity: p.quantity ?? 0,
      color: p.color ?? '',
      name: p.name ?? '',
      id: p.id ?? 0,
      // CAD 相关数据
      cadData: {
        boundingBox: {
          center: { 
            x: p.cadData?.boundingBox?.center?.x ?? 0, 
            y: p.cadData?.boundingBox?.center?.y ?? 0, 
            z: p.cadData?.boundingBox?.center?.z ?? 0 
          },
          dimensions: {
            x: p.cadData?.boundingBox?.dimensions?.x ?? 0,
            y: p.cadData?.boundingBox?.dimensions?.y ?? 0,
            z: p.cadData?.boundingBox?.dimensions?.z ?? 0
          }
        },
        volume: p.cadData?.volume ?? 0,
        surfaceArea: p.cadData?.surfaceArea ?? 0,
        centerOfMass: p.cadData?.centerOfMass ?? { x: 0, y: 0, z: 0 },
        topology: p.cadData?.topology,
        features: p.cadData?.features,
        momentOfInertia: p.cadData?.momentOfInertia,
        format: p.cadData?.format,
        version: p.cadData?.version,
        lastModified: p.cadData?.lastModified
      }

    })), false, false);

    
    
    
    console.log("共产生方案数量: ", productGroupSchemas.length);
    //循环方案
    for(const schema of productGroupSchemas) {
      if(schema && schema.groups.length > 0){
      
        const groupResults =await Promise.all(schema.groups.map(async (groupWithScore) => {
          
          
          const rectangles: Rectangle2D[] = groupWithScore.group.map((product) => ({
            width: product.width ?? 0,
            length: product.length ?? 0,
          }));
  
          // 2. 计算最小面积布局
          const layoutResult = calculateMinArea(rectangles);
  
          // 根据布局的长宽，计算模具的边缘间距
          const moldEdgeMargin = await calculateEdgeMargin(
            layoutResult.length,
            layoutResult.width,
          );
          // 根据Product最大高度计算模具底部间距
          const maxProductHeight = Math.max(...groupWithScore.group.map((p) => p.height ?? 0));
          const moldBottomMargin = await calculateBottomMargin(maxProductHeight);
  
          
          // 生成临时的随机模具材料、密度和单位价格
          const randomMold = getRandomMold();
          // 此时，有了产品的总体积，模具的体积以及模具的边缘间距和底部间距，可��计算出模具的重量
          const moldWeight = calculateMoldWeight(
            layoutResult.length,
            layoutResult.width,
            moldBottomMargin,
            moldEdgeMargin,
          );
          // 模具的总价格也能计算出来
          const moldPriceResult = await getMoldPrice(
            randomMold?.name ?? 'NAK80',
            moldWeight
          );
          
          const convertedProducts = groupWithScore.group.map((product) => ({
            // 基本尺寸
            dimensions: {
              length: product.length ?? 0,
              width: product.width ?? 0,
              height: product.height ?? 0,
            },
      
            // 体积和材料属性
            volume: product.volume ?? 0,
            material: product.material ?? '',
            density: product.density ?? 0,
            
            // 产品基本信息
            quantity: product.quantity ?? 0,
            color: product.color ?? '',
            id: product.id ?? 0,
            name: product.name ?? '',
  
            // CAD 数据
            cadData: {
              boundingBox: {
                center: product.cadData.boundingBox.center,
                dimensions: product.cadData.boundingBox.dimensions,
                rotation: product.cadData.boundingBox.rotation,
              },
              volume: product.cadData.volume,
              surfaceArea: product.cadData.surfaceArea,
              centerOfMass: product.cadData.centerOfMass,
              topology: product.cadData.topology,
              features: product.cadData.features,
              momentOfInertia: product.cadData.momentOfInertia,
              format: product.cadData.format,
              version: product.cadData.version,
              lastModified: product.cadData.lastModified,
            },  
          }));
  
          const layout = layoutResult.layout;
          const injectionPoint = calculateInjectionPoint(layout);
  
          // console.log("injectionPoint: ", injectionPoint);
          const moldDimensions = {
            length: layoutResult.length + moldEdgeMargin * 2,
            width: layoutResult.width + moldEdgeMargin * 2,
            height: moldBottomMargin,
            moldMaterial: randomMold?.name ?? 'NAK80',
            moldWeight: moldWeight,
            moldPrice: moldPriceResult.data ?? 0,
            maxInnerLength: layoutResult.length,
            maxInnerWidth: layoutResult.width,
            verticalMargin: moldEdgeMargin,
            horizontalMargin: moldEdgeMargin,
          };
  
          let groupScore = 0;
          if(convertedProducts.length > 1) {
            const score = calculateBalanceScore(layout, convertedProducts, injectionPoint);
            // console.log("group scores: ", score);
            groupScore = Number(score?.total ?? 0);
            groupWithScore.score = groupScore;
            
          }
          // groupWithScore.mold = moldDimensions;
          
  
          
  
          const convertedGroup = calculateProductGroup(groupWithScore.group.map((p) => ({
            length: p?.length ?? 0,
            width: p?.width ?? 0,
            height: p?.height ?? 0,
            volume: p?.volume ?? 0,
            material: p?.material ?? '',
            quantity: p?.quantity ?? 0,
            color: p?.color ?? '',
            density: p.density ?? 0,
            name: p?.name ?? '',
            id: p?.id ?? 0,
            cadData: p?.cadData ?? {},
          })));
  
          
          // console.log("convertedGroup:", convertedGroup);
  
          const productPriceGroupedResult = await getProductPriceByGroup(moldDimensions, convertedGroup);
        
          // console.log("groupResults:", groupResults);
          if(productPriceGroupedResult.success && productPriceGroupedResult.data) {
            // console.log("productPriceGroupedResult:", productPriceGroupedResult.data);
  
            // groupWithScore.productsWithPrice = productPriceGroupedResult.data;
            const groupData = productPriceGroupedResult.data;
            
            // 计算这一组的模具价格和产品总价
            const groupMoldPrice = moldPriceResult.data ?? 0;
  
            const groupProductPrice = groupData.reduce((outerTotal, productGroup) => {
              // 处理每个内部数组
              const groupPrice = productGroup.reduce((innerTotal, product) => {
                return innerTotal + (product.finalPrice ?? 0);
              }, 0);
              return outerTotal + groupPrice;
            }, 0);
            
            // console.log("groupProductPrice:", groupProductPrice);
            
            return {
              moldPrice: groupMoldPrice,
              productPrice: groupProductPrice
            };
  
          } 
          
          return { moldPrice: 0, productPrice: 0 };
        }));
  
        // 计算方案的总价格
        const schemaTotalMoldPrice = groupResults.reduce((total, group) => 
          total + group.moldPrice, 0);
        const schemaTotalProductPrice = groupResults.reduce((total, group) => 
          total + group.productPrice, 0);
        
        // 更新方案的价格信息
        schema.totalMoldPrice = schemaTotalMoldPrice;
        schema.totalProductPrice = schemaTotalProductPrice;
        schema.totalPrice = schemaTotalMoldPrice + schemaTotalProductPrice;
  
        console.log("\n=== 方案总价格信息 ===");
        
        console.log("方案信息:", schema);
      }
    }

    // 方案1
    // const schema1 = productGroupSchemas[0];


    
    // if(schema1 && schema1.groups.length > 0){
      
    //   // console.log("Schema 1 Details:");
    //   // console.log(`方案名称: ${schema1.solutionsName}`);
    //   // console.log(`方案总分: ${schema1.solutionsScore}`);
    //   // console.log("\n分组详情:");

    //   const groupResults =await Promise.all(schema1.groups.map(async (groupWithScore) => {
    //     // console.log(`\n=== 组 ${groupIndex + 1} ===`);
    //     // console.log(`组得分: ${groupWithScore.score}`);
    //     // console.log("组内产品:");
        
    //     const rectangles: Rectangle2D[] = groupWithScore.group.map((product) => ({
    //       width: product.width ?? 0,
    //       length: product.length ?? 0,
    //     }));

    //     // 2. 计算最小面积布局
    //     const layoutResult = calculateMinArea(rectangles);

    //     // 根据布局的长宽，计算模具的边缘间距
    //     const moldEdgeMargin = await calculateEdgeMargin(
    //       layoutResult.length,
    //       layoutResult.width,
    //     );
    //     // 根据Product最大高度计算模具底部间距
    //     const maxProductHeight = Math.max(...groupWithScore.group.map((p) => p.height ?? 0));
    //     const moldBottomMargin = await calculateBottomMargin(maxProductHeight);


    //     // const moldBottomMargin = await calculateBottomMargin(
    //     //   Math.max(...newProducts.map((p) => p.dimensions?.height ?? 0)),
    //     // );
    //     // 生成临时的随机模具材料、密度和单位价格
    //     const randomMold = getRandomMold();
    //     // 此时，有了产品的总体积，模具的体积以及模具的边缘间距和底部间距，可��计算出模具的重量
    //     const moldWeight = calculateMoldWeight(
    //       layoutResult.length,
    //       layoutResult.width,
    //       moldBottomMargin,
    //       moldEdgeMargin,
    //     );
    //     // 模具的总价格也能计算出来
    //     const moldPriceResult = await getMoldPrice(
    //       randomMold?.name ?? 'NAK80',
    //       moldWeight
    //     );
        
    //     const convertedProducts = groupWithScore.group.map((product) => ({
    //       // 基本尺寸
    //       dimensions: {
    //         length: product.length ?? 0,
    //         width: product.width ?? 0,
    //         height: product.height ?? 0,
    //       },
    
    //       // 体积和材料属性
    //       volume: product.volume ?? 0,
    //       material: product.material ?? '',
    //       density: product.density ?? 0,
          
    //       // 产品基本信息
    //       quantity: product.quantity ?? 0,
    //       color: product.color ?? '',
    //       id: product.id ?? 0,
    //       name: product.name ?? '',

    //       // CAD 数据
    //       cadData: {
    //         boundingBox: {
    //           center: product.cadData.boundingBox.center,
    //           dimensions: product.cadData.boundingBox.dimensions,
    //           rotation: product.cadData.boundingBox.rotation,
    //         },
    //         volume: product.cadData.volume,
    //         surfaceArea: product.cadData.surfaceArea,
    //         centerOfMass: product.cadData.centerOfMass,
    //         topology: product.cadData.topology,
    //         features: product.cadData.features,
    //         momentOfInertia: product.cadData.momentOfInertia,
    //         format: product.cadData.format,
    //         version: product.cadData.version,
    //         lastModified: product.cadData.lastModified,
    //       },  
    //     }));

    //     const layout = layoutResult.layout;
    //     const injectionPoint = calculateInjectionPoint(layout);

    //     // console.log("injectionPoint: ", injectionPoint);
    //     const moldDimensions = {
    //       length: layoutResult.length + moldEdgeMargin * 2,
    //       width: layoutResult.width + moldEdgeMargin * 2,
    //       height: moldBottomMargin,
    //       moldMaterial: randomMold?.name ?? 'NAK80',
    //       moldWeight: moldWeight,
    //       moldPrice: moldPriceResult.data ?? 0,
    //       maxInnerLength: layoutResult.length,
    //       maxInnerWidth: layoutResult.width,
    //       verticalMargin: moldEdgeMargin,
    //       horizontalMargin: moldEdgeMargin,
    //     };

    //     let groupScore = 0;
    //     if(convertedProducts.length > 1) {
    //       const score = calculateBalanceScore(layout, convertedProducts, injectionPoint);
    //       // console.log("group scores: ", score);
    //       groupScore = Number(score?.total ?? 0);
    //       groupWithScore.score = groupScore;
          
    //     }
    //     groupWithScore.mold = moldDimensions;
        

        

    //     const convertedGroup = calculateProductGroup(groupWithScore.group.map((p) => ({
    //       length: p?.length ?? 0,
    //       width: p?.width ?? 0,
    //       height: p?.height ?? 0,
    //       volume: p?.volume ?? 0,
    //       material: p?.material ?? '',
    //       quantity: p?.quantity ?? 0,
    //       color: p?.color ?? '',
    //       density: p.density ?? 0,
    //       name: p?.name ?? '',
    //       id: p?.id ?? 0,
    //       cadData: p?.cadData ?? {},
    //     })));

        
    //     // console.log("convertedGroup:", convertedGroup);

    //     const productPriceGroupedResult = await getProductPriceByGroup(moldDimensions, convertedGroup);
      
    //     // console.log("groupResults:", groupResults);
    //     if(productPriceGroupedResult.success && productPriceGroupedResult.data) {
    //       // console.log("productPriceGroupedResult:", productPriceGroupedResult.data);

    //       groupWithScore.productsWithPrice = productPriceGroupedResult.data;
    //       const groupData = productPriceGroupedResult.data;
          
    //       // 计算这一组的模具价格和产品总价
    //       const groupMoldPrice = moldPriceResult.data ?? 0;

    //       const groupProductPrice = groupData.reduce((outerTotal, productGroup) => {
    //         // 处理每个内部数组
    //         const groupPrice = productGroup.reduce((innerTotal, product) => {
    //           return innerTotal + (product.finalPrice ?? 0);
    //         }, 0);
    //         return outerTotal + groupPrice;
    //       }, 0);
          
    //       console.log("groupProductPrice:", groupProductPrice);
          
    //       return {
    //         moldPrice: groupMoldPrice,
    //         productPrice: groupProductPrice
    //       };


    //       // return productPriceGroupedResult.data ?? [];
    //     } 
    //     // else {
    //     //   console.error('Error getting product price by group:', productPriceGroupedResult.message);
    //     //   return [];
    //     // }
    //     return { moldPrice: 0, productPrice: 0 };
    //   }));

    //   // 计算方案的总价格
    //   const schemaTotalMoldPrice = groupResults.reduce((total, group) => 
    //     total + group.moldPrice, 0);
    //   const schemaTotalProductPrice = groupResults.reduce((total, group) => 
    //     total + group.productPrice, 0);
      
    //   // 更新方案的价格信息
    //   schema1.totalMoldPrice = schemaTotalMoldPrice;
    //   schema1.totalProductPrice = schemaTotalProductPrice;
    //   schema1.totalPrice = schemaTotalMoldPrice + schemaTotalProductPrice;

    //   console.log("\n=== 方案总价格信息 ===");
    //   // console.log(`模具总价: ${schema1.totalMoldPrice.toFixed(3)}`);
    //   // console.log(`产品总价: ${schema1.totalProductPrice.toFixed(3)}`);
    //   // console.log(`总价: ${schema1.totalPrice.toFixed(3)}`);

    //   console.log("方案信息:", schema1);
    // }

    



  });
});