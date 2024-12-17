import { findOptimalDistribution } from "../distributing";
import type { Product } from "@/types/domain/product";
import { calculateProductGroupSchemas } from "../product-group";
import { productGroup } from "@/lib/validations/mold-calculator";

describe("findOptimalDistribution", () => {
//   it("should find optimal distribution for three products", () => {
// //     // 准备三个测试产品
//     const products: Product[] = [
//       {
//         id: 1,
//         name: "产品1",
//         dimensions: { length: 50, width: 30, height: 20 },
//         volume: 30000, // 50 * 30 * 20
//         weight: 36,    // 体积 * 密度 = 30000 * 0.0012
//         density: 1.2,  // g/cm³
//         materialName: "ABS",
//         color: "红色",
//         quantity: 1000
//       },
//       {
//         id: 2,
//         name: "产品2",
//         dimensions: { length: 40, width: 25, height: 15 },
//         volume: 15000, // 40 * 25 * 15
//         weight: 33,    // 15000 * 0.0022
//         density: 2.2,  // g/cm³
//         materialName: "ABS",
//         color: "红色",
//         quantity: 1000
//       },
//       {
//         id: 3,
//         name: "产品3",
//         dimensions: { length: 45, width: 28, height: 18 },
//         volume: 22680, // 45 * 28 * 18
//         weight: 34,    // 22680 * 0.0015
//         density: 1.5,  // g/cm³
//         materialName: "ABS",
//         color: "红色",
//         quantity: 800
//       }
//     ];

//     const result = findOptimalDistribution(products, false);
//     console.log("Three Products Distribution Result:", JSON.stringify(result, null, 2));

// //     // 验证结果
// //     // expect(result.totalSolutions).toBeGreaterThan(0);
// //     // expect(result.solutions.length).toBeGreaterThan(0);
// //     // expect(result.message.general).toContain("找到");
//    });

   it("should find optimal distribution for three products", () => {
    //     // 准备三个测试产品
        const products: productGroup = [
          {
            length: 500,
            width: 250,
            height: 105,
            quantity: 3000,
            volume: 262500,
            material: "PC",
            color: "405C",
            density: 1.2
          },
          {
            length: 250,
            width: 100,
            height: 85,
            quantity: 5000,
            volume: 208333,
            material: "ABS",
            color: "302C",
            density: 1.2
          },
          {
            length: 230,
            width: 180,
            height: 90,
            quantity: 3000,
            volume: 125000,
            material: "PC",
            color: "302C",
            density: 1.2
          }
        ];
    
        const result = calculateProductGroupSchemas(products);
        console.log("Three Products Distribution Result:", JSON.stringify(result, null, 2));
    
    //     // 验证结果
    //     // expect(result.totalSolutions).toBeGreaterThan(0);
    //     // expect(result.solutions.length).toBeGreaterThan(0);
    //     // expect(result.message.general).toContain("找到");
       });

  // it("should find optimal distribution for four products", () => {
  //   // 准备四个测试产品
  //   const products: Product[] = [
  //     {
  //       id: 1,
  //       name: "产品1",
  //       dimensions: { length: 50, width: 30, height: 20 },
  //       volume: 30000,
  //       weight: 45,    // 30000 * 0.0015
  //       density: 1.5,  // g/cm³
  //       materialName: "ABS",
  //       color: "红色",
  //       quantity: 1000
  //     },
  //     {
  //       id: 2,
  //       name: "产品2",
  //       dimensions: { length: 40, width: 25, height: 15 },
  //       volume: 15000,
  //       weight: 42,    // 15000 * 0.0028
  //       density: 2.8,  // g/cm³
  //       materialName: "ABS",
  //       color: "红色",
  //       quantity: 1000
  //     },
  //     {
  //       id: 3,
  //       name: "产品3",
  //       dimensions: { length: 45, width: 28, height: 18 },
  //       volume: 22680,
  //       weight: 43,    // 22680 * 0.0019
  //       density: 1.9,  // g/cm³
  //       materialName: "PC",
  //       color: "蓝色",
  //       quantity: 800
  //     },
  //     {
  //       id: 4,
  //       name: "产品4",
  //       dimensions: { length: 35, width: 20, height: 12 },
  //       volume: 8400,
  //       weight: 44,    // 8400 * 0.00524
  //       density: 5.24, // g/cm³
  //       materialName: "PC",
  //       color: "蓝色",
  //       quantity: 1500
  //     }
  //   ];

  //   const result = findOptimalDistribution(products);
  //   console.log("Four Products Distribution Result:", JSON.stringify(result, null, 2));

  //   // 验证结果
  //   // expect(result.totalSolutions).toBeGreaterThan(0);
  //   // expect(result.solutions.length).toBeGreaterThan(0);
  //   // expect(result.message.general).toContain("找到");

  //   // // 验证分组逻辑
  //   // result.solutions.forEach(solution => {
  //   //   // 检查每个解决方案中的分组
  //   //   solution.distributions.forEach(dist => {
  //   //     // 验证相同材料和颜色的产品是否被分到一起
  //   //     const products = dist.products;
  //   //     const firstProduct = products[0];
  //   //     expect(products.every(p => 
  //   //       p.materialName === firstProduct.materialName && 
  //   //       p.color === firstProduct.color
  //   //     )).toBe(true);
  //   //   });
  //   // });
  // });

  
});