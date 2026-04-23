'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsType } from 'three/examples/jsm/controls/OrbitControls.js';

type ModelViewportProps = {
  modelUrl?: string;
  className?: string;
  autoRotate?: boolean;
};

export function ModelViewport({ modelUrl, className = '', autoRotate = true }: ModelViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 1.2, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x2a2a2a, 1.1);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(5, 8, 6);
    scene.add(dir);

    const rim = new THREE.DirectionalLight(0x9c7dff, 0.55);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    let activeObject: THREE.Object3D | null = null;
    let fallbackMesh: THREE.Mesh | null = null;
    let frame = 0;
    let controls: OrbitControlsType | null = null;
    let isDisposed = false;

    const fitToView = (obj: THREE.Object3D) => {
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      const targetSize = 2;
      const scale = targetSize / maxDimension;
      obj.scale.setScalar(scale);
      obj.position.sub(center.multiplyScalar(scale));
    };

    const mountFallback = () => {
      if (fallbackMesh) return;
      const geometry = new THREE.TorusKnotGeometry(0.62, 0.2, 180, 24);
      const material = new THREE.MeshStandardMaterial({
        color: 0x9f8cff,
        metalness: 0.45,
        roughness: 0.35,
        transparent: true,
        opacity: 0.95,
      });
      fallbackMesh = new THREE.Mesh(geometry, material);
      fallbackMesh.position.y = 0.1;
      scene.add(fallbackMesh);
      activeObject = fallbackMesh;
    };

    const disposeActiveObject = () => {
      if (!activeObject) return;
      scene.remove(activeObject);
      activeObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      if (activeObject === fallbackMesh) fallbackMesh = null;
      activeObject = null;
    };

    const setupControls = async () => {
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      if (isDisposed) return;
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.autoRotate = autoRotate;
      controls.autoRotateSpeed = 1.15;
      controls.enablePan = false;
      controls.minDistance = 1.5;
      controls.maxDistance = 8;
      controls.target.set(0, 0.3, 0);
      controls.update();
    };

    const loadModel = async () => {
      disposeActiveObject();
      if (!modelUrl?.trim()) {
        mountFallback();
        return;
      }

      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        if (isDisposed) return;

        const loader = new GLTFLoader();
        loader.load(
          modelUrl,
          (gltf) => {
            if (isDisposed) return;
            const root = gltf.scene || gltf.scenes?.[0];
            if (!root) {
              mountFallback();
              return;
            }
            fitToView(root);
            scene.add(root);
            activeObject = root;
          },
          undefined,
          () => {
            if (!isDisposed) mountFallback();
          }
        );
      } catch {
        mountFallback();
      }
    };

    const resize = () => {
      const width = container.clientWidth || 320;
      const height = container.clientHeight || 220;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    resize();
    setupControls();
    loadModel();

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const animate = () => {
      if (isDisposed) return;
      frame = requestAnimationFrame(animate);
      if (fallbackMesh) {
        fallbackMesh.rotation.y += 0.008;
        fallbackMesh.rotation.x += 0.003;
      }
      controls?.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls?.dispose();
      disposeActiveObject();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [autoRotate, modelUrl]);

  return <div ref={containerRef} className={`relative h-full w-full overflow-hidden rounded-2xl ${className}`} />;
}
