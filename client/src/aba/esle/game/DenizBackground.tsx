// DenizBackground.tsx
import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

function DenizModel({ url }: { url: string }) {
  const gltf = useGLTF(url) as any;
  return <primitive object={gltf.scene} position={[0, 0, 0]} />;
}

export default function DenizBackground() {
  // deniz.glb aynı klasörde
  const url = useMemo(() => new URL("./deniz.glb", import.meta.url).href, []);

  // @ts-ignore
  useGLTF.preload(url);

  return (
    <div className="absolute inset-0 z-0" style={{ pointerEvents: "none" }}>
      <Canvas
        gl={{ alpha: true, antialias: false }}
        dpr={1}
        camera={{ position: [0, 1.6, 5.5], fov: 45, near: 0.01, far: 2000 }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 10, 6]} intensity={1.2} />
        <directionalLight position={[-6, 6, -4]} intensity={0.6} />

        <Suspense fallback={null}>
          <DenizModel url={url} />
        </Suspense>
      </Canvas>
    </div>
  );
        }
