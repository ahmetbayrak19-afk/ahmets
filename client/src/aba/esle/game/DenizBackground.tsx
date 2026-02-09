// DenizBackground.tsx
import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

function DenizModel({ url }: { url: string }) {
  const gltf = useGLTF(url) as any;

  // Biraz optimize: gölge / materyal ayarları
  useMemo(() => {
    if (!gltf?.scene) return;
    gltf.scene.traverse((obj: any) => {
      if (obj?.isMesh) {
        obj.frustumCulled = true;
        obj.castShadow = false;
        obj.receiveShadow = false;

        // Çok ağır PBR ise hafifletmek için (istersen kapat)
        if (obj.material) {
          obj.material.side = THREE.FrontSide;
        }
      }
    });
  }, [gltf]);

  // Sahnenin “tiyatro sahnesi” gibi görünmesi senin GLB’de zaten var.
  // Burada sadece konum/ölçek veriyoruz. Gerekirse değiştirirsin.
  return (
    <primitive
      object={gltf.scene}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
      scale={1}
    />
  );
}

export default function DenizBackground() {
  // ✅ deniz.glb aynı klasörde
  const url = useMemo(() => new URL("./deniz.glb", import.meta.url).href, []);

  // preload (opsiyonel ama iyi)
  // @ts-ignore
  useGLTF.preload(url);

  return (
    <div
      className="absolute inset-0 z-0"
      style={{
        // ✅ 3D katman hiçbir tıklamayı/drag’i yemesin
        pointerEvents: "none",
      }}
    >
      <Canvas
        // ✅ arka plan şeffaf, üstte 2D canvas var
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.6, 5.5], fov: 45, near: 0.01, far: 2000 }}
      >
        <Suspense fallback={null}>
          {/* Işıklar */}
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 10, 6]} intensity={1.2} />
          <directionalLight position={[-6, 6, -4]} intensity={0.6} />

          {/* Model */}
          <DenizModel url={url} />
        </Suspense>
      </Canvas>
    </div>
  );
}
