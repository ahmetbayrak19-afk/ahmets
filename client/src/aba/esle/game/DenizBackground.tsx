// client/src/aba/esle/game/DenizBackground.tsx
import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  cameraRef: React.MutableRefObject<{ x: number; y: number }>;
};

const DENIZ_GLB_URL =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

function FallbackBg() {
  // 3D yüklenmezse arkaplan tamamen siyah olmasın
  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial color={"#0b1b2a"} />
    </mesh>
  );
}

function DenizModel({ cameraRef }: { cameraRef: Props["cameraRef"] }) {
  const group = useRef<THREE.Group>(null);
  const gltf = useGLTF(DENIZ_GLB_URL);

  const baseRotation = useMemo(() => new THREE.Euler(0, -Math.PI / 2, 0), []);
  const PARALLAX_X = 0.03;
  const PARALLAX_Y = 0.02;

  useFrame(() => {
    const g = group.current;
    if (!g) return;

    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;

    g.position.x = -camX * PARALLAX_X;
    g.position.y = camY * PARALLAX_Y;
  });

  return (
    <group ref={group}>
      <primitive
        object={gltf.scene}
        rotation={baseRotation}
        scale={1.25}
        position={[0, -2.2, 0]}
      />
    </group>
  );
}

export default function DenizBackground({ cameraRef }: Props) {
  const [glError, setGlError] = useState<string | null>(null);

  return (
    <div className="absolute inset-0">
      {/* Hata olursa üstte minicik yaz */}
      {glError && (
        <div className="absolute top-2 left-2 z-50 bg-black/60 text-red-200 text-[10px] px-2 py-1 rounded">
          3D HATA: {glError}
        </div>
      )}

      <Canvas
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
        gl={{
          antialias: true,
          alpha: false,
          // bazı Android WebView’da context kayması için:
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#06121c"), 1);
        }}
        camera={{ position: [0, 0, 10], fov: 45 }}
        onError={(e) => setGlError(String(e))}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 10, 8]} intensity={1.2} />
        <directionalLight position={[-8, 4, -6]} intensity={0.6} />

        <Suspense fallback={<FallbackBg />}>
          <DenizModel cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
        }
