// DenizBackground.tsx
import React, { Suspense, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

type Crash = {
  where: string;
  message: string;
  stack?: string;
  extra?: string;
};

function OnceRender({ onReady }: { onReady: () => void }) {
  // GLB yüklendikten sonra sadece 1 frame çiz
  const { invalidate } = useThree();
  useEffect(() => {
    onReady();
    // tek frame render
    invalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function DenizModel({ url }: { url: string }) {
  const gltf = useGLTF(url) as any;
  return <primitive object={gltf.scene} />;
}

export default function DenizBackground({
  onReady,
  onCrash,
}: {
  onReady: () => void;
  onCrash: (c: Crash) => void;
}) {
  const url = useMemo(() => new URL("./deniz.glb", import.meta.url).href, []);

  // preload (opsiyonel)
  useEffect(() => {
    try {
      // @ts-ignore
      useGLTF.preload(url);
    } catch {}
  }, [url]);

  return (
    <div className="absolute inset-0 z-0" style={{ pointerEvents: "none" }}>
      <Canvas
        // ✅ sürekli render yok: sadece gerektiğinde
        frameloop="never"
        // ✅ mobilde dpr yükseltme yok
        dpr={1}
        camera={{ position: [0, 1, 6], fov: 45, near: 0.05, far: 500 }}
        gl={{
          alpha: true,
          antialias: false,
          depth: true,
          stencil: false,
          preserveDrawingBuffer: false,
          powerPreference: "low-power",
        }}
        onCreated={({ gl }) => {
          // Context lost yakala
          const canvas = gl.domElement;

          const lost = (e: any) => {
            e.preventDefault?.();
            onCrash({ where: "webglcontextlost", message: "WebGL context lost" });
          };
          const restored = () => {
            // restore olursa tek frame tekrar çizdiririz
            // ama çoğu cihazda restore olmaz, yine de loglayalım
            onCrash({ where: "webglcontextrestored", message: "WebGL context restored" });
          };

          canvas.addEventListener("webglcontextlost", lost, false);
          canvas.addEventListener("webglcontextrestored", restored, false);

          // ekstra: pixel ratio tekrar 1
          gl.setPixelRatio(1);
        }}
      >
        {/* Işıkları da hafif tut */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[6, 10, 6]} intensity={0.9} />
        <directionalLight position={[-6, 6, -4]} intensity={0.4} />

        <Suspense fallback={null}>
          <DenizModel url={url} />
          <OnceRender onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
          }
