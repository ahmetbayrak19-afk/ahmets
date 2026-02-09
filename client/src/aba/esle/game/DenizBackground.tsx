// DenizBackground.tsx
import React, { Suspense, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

type Crash = {
  where: string;
  message: string;
  stack?: string;
  extra?: string;
};

function DenizModel({
  url,
  onReady,
}: {
  url: string;
  onReady: () => void;
}) {
  const gltf = useGLTF(url) as any;

  useEffect(() => {
    onReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // preload try/catch
  useEffect(() => {
    try {
      // @ts-ignore
      useGLTF.preload(url);
    } catch (e: any) {
      onCrash({
        where: "useGLTF.preload",
        message: String(e?.message || e),
        stack: String(e?.stack || ""),
        extra: url,
      });
    }
  }, [url, onCrash]);

  return (
    <div className="absolute inset-0 z-0" style={{ pointerEvents: "none" }}>
      <Canvas
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        dpr={Math.min(1.25, window.devicePixelRatio || 1)}
        camera={{ position: [0, 1, 6], fov: 45, near: 0.01, far: 2000 }}
        onCreated={({ gl }) => {
          // bazı cihazlarda context kaybı oluyor -> yakala
          const canvas = gl.domElement;
          const lost = (e: any) => {
            e.preventDefault?.();
            onCrash({
              where: "webglcontextlost",
              message: "WebGL context lost",
            });
          };
          canvas.addEventListener("webglcontextlost", lost, false);
        }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 10, 6]} intensity={1.2} />
        <directionalLight position={[-6, 6, -4]} intensity={0.6} />

        <Suspense fallback={null}>
          <DenizModel url={url} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  );
        }
