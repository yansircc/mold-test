"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { generateMold } from "@/lib/mold/generator";
import { type Product } from "@/types/domain/product";
import { type Rectangle } from "@/types/core/geometry";
import { MOLD_CONSTANTS } from "@/types/mold/generator";
import { useMoldStore } from "@/stores/useMoldStore";

interface SceneProps {
  product?: Product;
  products?: Product[];
  layout?: Rectangle[];
}

/**
 * 3D场景组件
 */
export const Scene: React.FC<SceneProps> = ({ product, products, layout }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const { edgeMargin, moldDimensions } = useMoldStore();
  useEffect(() => {
    if (!containerRef.current) return;

    // 清理之前的 WebGL 上下文和渲染器
    const existingCanvas = containerRef.current.querySelector("canvas");
    if (existingCanvas) {
      const gl =
        existingCanvas.getContext("webgl") ??
        existingCanvas.getContext("webgl2");
      if (gl) {
        const ext = gl.getExtension("WEBGL_lose_context");
        if (ext) {
          ext.loseContext();
        }
      }
      containerRef.current.removeChild(existingCanvas);
    }

    // 确保数据有效性
    const isSingleProduct = !!product?.dimensions;
    const isMultiProduct = products && layout?.length === products?.length;
    if (!isSingleProduct && !isMultiProduct) {
      return;
    }

    // 检查布局数据
    if (
      isMultiProduct &&
      (!layout || !products || layout.length !== products.length)
    ) {
      return;
    }

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // 环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // 主光源 - 从右上方照射
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 8, 5);
    scene.add(mainLight);

    // 辅助光源1 - 从左前方照射
    const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight1.position.set(-3, 6, 2);
    scene.add(fillLight1);

    // 辅助光源2 - 从后方照射
    const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight2.position.set(0, 4, -5);
    scene.add(fillLight2);

    // 底部柔光 - 增加底部细节可见度
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.2);
    bottomLight.position.set(0, -5, 0);
    scene.add(bottomLight);

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    );

    // 生成模具
    let sceneSize = 0;
    if (isMultiProduct && layout && products) {
      const { mold, wireframes, dimensions } = generateMold(products, layout, {
        material: {
          color: 0x88ccee, // 淡蓝色
          opacity: 0.85, // 略微透明
          metalness: 0.1, // 低金属度，更像塑料
          roughness: 0.2, // 较光滑
          clearcoat: 1.0, // 强清漆效果
          clearcoatRoughness: 0.1, // 光滑的清漆
        },  
      },
      {
        edgeMargin,
        bottomMargin: moldDimensions.height,
      },
    );

      // 添加到场景
      scene.add(mold);
      wireframes.forEach((wireframe) => scene.add(wireframe));

      // 添加网格辅助线在原点，使用更细腻的网格
      const gridHelper = new THREE.GridHelper(10, 20, 0xcccccc, 0xe5e5e5);
      gridHelper.position.y = -0.01;
      scene.add(gridHelper);

      // 计算场景尺寸
      sceneSize = Math.max(dimensions.width, dimensions.length) / 100;
    } else if (isSingleProduct && product.dimensions) {
      const singleLayout: Rectangle[] = [
        {
          x: 0,
          y: 0,
          width: product.dimensions.width,
          length: product.dimensions.length,
        },
      ];

      const { mold, wireframes, dimensions } = generateMold(
        [product],
        singleLayout,
        {
          material: MOLD_CONSTANTS.DEFAULT_MOLD_OPTIONS,
          
        },
        {
          edgeMargin,
          bottomMargin: moldDimensions.height,
        },
      );

      // 添加到场景
      scene.add(mold);
      wireframes.forEach((wireframe) => scene.add(wireframe));

      // 添加网格辅助线在原点，使用更细腻的网格
      const gridHelper = new THREE.GridHelper(10, 20, 0xcccccc, 0xe5e5e5);
      gridHelper.position.y = -0.01;
      scene.add(gridHelper);

      // 计算场景尺寸
      sceneSize = Math.max(dimensions.width, dimensions.length) / 100;
    }

    // 调整相机位置以获得更好的视角
    const cameraDistance = Math.max(sceneSize * 2, 5);
    camera.position.set(
      cameraDistance * 0.8,
      cameraDistance * 0.6,
      cameraDistance * 0.8,
    );
    camera.lookAt(0, 0, 0);

    // 创建渲染器，启用抗锯齿和物理正确的光照
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight,
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // 使用新的颜色管理 API
    renderer.outputColorSpace = "srgb";
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);

    // 添加轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 渲染循环
    function animate() {
      animationFrameId.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // 处理窗口大小变化
    function handleResize() {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    window.addEventListener("resize", handleResize);

    // 增强清理函数
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener("resize", handleResize);

      // 释放 Three.js 资源
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            (object.geometry as THREE.BufferGeometry).dispose();
          }
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material: THREE.Material) => {
                if (material.dispose) {
                  material.dispose();
                }
              });
            } else if (
              object.material instanceof THREE.Material &&
              object.material.dispose
            ) {
              object.material.dispose();
            }
          }
        }
      });

      // 释放渲染器资源
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.parentNode?.removeChild(renderer.domElement);
      }

      // 清理 OrbitControls
      if (controls) {
        controls.dispose();
      }
    };
  }, [product, products, layout, edgeMargin, moldDimensions]);

  return <div ref={containerRef} className="h-full w-full" />;
};
