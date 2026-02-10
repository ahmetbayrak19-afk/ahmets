import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html, useGLTF } from "@react-three/drei";

// Firebase Storage public download URL (token ile)
const DENIZ_GLB_URL =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

function DenizModel() {
  const gltf = useGLTF(DENIZ_GLB_URL);

  // Sahne “tiyatro” gibi görünsün diye: biraz öne, biraz aşağı.
  // 90 derece sola çevir (yanlış duvar görüyorsun demiştin)
  // Rotation ekseni genelde Y olur.
  const transform = useMemo(
    () => ({
      rotation: [0, -Math.PI / 2, 0] as [number, number, number],
      position: [0, -1.2, 0] as [number, number, number],
      scale: 1.25,
    }),
    []
  );

  return (
    <group rotation={transform.rotation} position={transform.position} scale={transform.scale}>
      <primitive object={gltf.scene} />
    </group>
  );
}

export default function DenizBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        camera={{ position: [0, 2.2, 8], fov: 45, near: 0.1, far: 2000 }}
      >
        {/* Işıklar */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 10, 6]} intensity={1.2} />
        <directionalLight position={[-6, 8, -4]} intensity={0.6} />

        <Suspense
          fallback={
            <Html center style={{ color: "white", fontWeight: 800 }}>
              3D yükleniyor…
            </Html>
          }
        >
          <DenizModel />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}

// drei cache
useGLTF.preload(DENIZ_GLB_URL);
