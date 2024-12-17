"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import type { ThreeGeometry } from "@/lib/mesh-converter";
import { MOLD_CONSTANTS } from "@/types/mold/generator";
import { Progress } from "@/components/ui/progress";

interface ModelViewerProps {
  geometry: ThreeGeometry;
  className?: string;
}

export function ModelViewer({
  geometry,
  className = "h-[500px] w-full",
}: ModelViewerProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 创建加载管理器
    const loadingManager = new THREE.LoadingManager();

    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      setLoadingProgress(progress);
    };

    loadingManager.onLoad = () => {
      setIsLoading(false);
    };

    // 场景设置
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // 光照设置
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
    mainLight.position.set(5, 8, 5);
    scene.add(mainLight);

    const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight1.position.set(-3, 6, 2);
    scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight2.position.set(0, 4, -5);
    scene.add(fillLight2);

    // 相机设置
    const camera = new THREE.PerspectiveCamera(
      50,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000,
    );

    // 几何体设置
    const bufferGeometry = new THREE.BufferGeometry();
    bufferGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(geometry.positions, 3),
    );
    bufferGeometry.setIndex(Array.from(geometry.indices));

    if (geometry.normals) {
      bufferGeometry.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(geometry.normals, 3),
      );
    } else {
      bufferGeometry.computeVertexNormals();
    }

    // 材质设置 - 不透明的白色
    const material = new THREE.MeshPhysicalMaterial(
      MOLD_CONSTANTS.DEFAULT_MOLD_OPTIONS,
    );

    // 创建网格
    const mesh = new THREE.Mesh(bufferGeometry, material);

    // 计算包围盒并居中模型
    bufferGeometry.computeBoundingBox();
    const boundingBox = bufferGeometry.boundingBox!;
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);

    // 水平居中，但保持底部对齐
    mesh.position.x = -center.x;
    mesh.position.z = -center.z;
    mesh.position.y = -boundingBox.min.y; // 确保模型底部在 y=0 平面上

    scene.add(mesh);

    // 创建半透明的包围盒
    const boxGeometry = new THREE.BoxGeometry(
      boundingBox.max.x - boundingBox.min.x,
      boundingBox.max.y - boundingBox.min.y,
      boundingBox.max.z - boundingBox.min.z,
    );

    // 创建半透明的蓝色材质
    const boxMaterial = new THREE.MeshBasicMaterial({
      color: 0x88ccee,
      transparent: true,
      opacity: 0.75, // 非常透明
      side: THREE.BackSide, // 只渲染内侧，避免重叠
    });

    const box = new THREE.Mesh(boxGeometry, boxMaterial);

    // 调整包围盒位置，使其与模型对齐
    box.position.x = (boundingBox.max.x + boundingBox.min.x) / 2 - center.x;
    box.position.z = (boundingBox.max.z + boundingBox.min.z) / 2 - center.z;
    box.position.y = (boundingBox.max.y - boundingBox.min.y) / 2; // 包围盒高度的一半，确保底部在地面上

    scene.add(box);

    // 创建包围盒边框
    const edges = new THREE.EdgesGeometry(boxGeometry);
    const edgesMaterial = new THREE.LineBasicMaterial({
      color: 0x000000, // 黑色
      transparent: true,
      opacity: 0.1, // 半透明
      linewidth: 1, // 线条宽度
    });
    const edgesBox = new THREE.LineSegments(edges, edgesMaterial);
    edgesBox.position.copy(box.position); // 与包围盒位置相同
    scene.add(edgesBox);

    // 添加网格辅助线
    const size = Math.max(
      boundingBox.max.x - boundingBox.min.x,
      boundingBox.max.y - boundingBox.min.y,
      boundingBox.max.z - boundingBox.min.z,
    );
    const gridSize = Math.ceil(size * 2);
    const gridDivisions = 20;
    const gridHelper = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      0xcccccc,
      0xe5e5e5,
    );
    gridHelper.position.y = 0; // 确保网格在地面上
    scene.add(gridHelper);

    // 调整相机位置
    const maxDim = Math.max(
      boundingBox.max.x - boundingBox.min.x,
      boundingBox.max.y - boundingBox.min.y,
      boundingBox.max.z - boundingBox.min.z,
    );
    const fov = 50 * (Math.PI / 180);
    const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 1.5;

    camera.position.set(
      cameraDistance * 0.8,
      cameraDistance * 0.6,
      cameraDistance * 0.8,
    );
    camera.lookAt(0, 0, 0);

    // 渲染器设置
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
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 控制器设置
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // 动画循环
    function animate() {
      animationFrameId.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // 窗口大小调整处理
    function handleResize() {
      if (!containerRef.current || !renderer) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    window.addEventListener("resize", handleResize);

    // 在几何体处理完成后更新进度
    setLoadingProgress(100);
    setIsLoading(false);

    // 清理函数
    return () => {
      window.removeEventListener("resize", handleResize);

      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry instanceof THREE.BufferGeometry) {
            object.geometry.dispose();
          }
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => {
              if (material instanceof THREE.Material) {
                material.dispose();
              }
            });
          } else if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });

      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current.forceContextLoss();
        const canvas = rendererRef.current.domElement;
        canvas.parentNode?.removeChild(canvas);
      }
    };
  }, [geometry]);

  return (
    <div className="relative">
      <div ref={containerRef} className={className} />
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-[200px] space-y-4">
            <Progress value={loadingProgress} />
            <p className="text-center text-sm text-muted-foreground">
              加载中... {Math.round(loadingProgress)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
