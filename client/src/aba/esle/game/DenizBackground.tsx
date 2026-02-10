// DenizBackground.tsx
import React, { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  cameraRef: React.MutableRefObject<{ x: number; y: number }>;
};

// ✅ Buraya Firebase'den aldığın HTTPS download URL gelecek
const DENIZ_GLB_URL =
  "PASTE_FIREBASE_DOWNLOAD_URL_HERE";

function Scene({ cameraRef }: { cameraRef: Props["cameraRef"] }) {
  const group = useRef<THREE.Group>(null);

  // GLB
  const gltf = useGLTF(DENIZ_GLB_URL);

  // başlangıç transformları
  const baseRotation = useMemo(() => {
    // 90 derece sola (Y ekseni)
    return new THREE.Euler(0, -Math.PI / 2, 0);
  }, []);

  useFrame(() => {
    const g = group.current;
    if (!g) return;

    // Kamera world koordinatları (2D) -> 3D sahne kaydırma
    // Bu oran en kritik nokta. Büyük world'de gezmek için X'i daha çok aç.
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;

    // 2D world px -> 3D unit dönüşüm (tune edeceğiz)
    // Daha fazla "gezsin" istiyorsan PARALLAX_X'i büyüt
    const PARALLAX_X = 0.012; // 0.008-0.02 arası dene
    const PARALLAX_Y = 0.010;

    // 3D sahne ters kayar (kamera sağa -> sahne sola)
    g.position.x = -camX * PARALLAX_X;
    g.position.y = (camY * PARALLAX_Y); // Y ekseninde ters/ düz ihtiyaca göre değişir
  });

  return (
    <group ref={group}>
      <primitive
        object={gltf.scene}
        rotation={baseRotation}
        // büyüklük (çok küçük/büyük ise burayı ayarla)
        scale={1.0}
        // sahneyi ekrana oturtmak için başlangıç offset
        position={[0, -2, 0]}
      />
    </group>
  );
}

export default function DenizBackground({ cameraRef }: Props) {
  return (
    <Canvas
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      gl={{ antialias: true, alpha: false }}
      camera={{ position: [0, 0, 10], fov: 45 }} // perspektif
    >
      {/* ışıklar (resim gibi durmasın) */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[6, 10, 8]} intensity={1.2} />
      <directionalLight position={[-8, 4, -6]} intensity={0.6} />

      <Suspense fallback={null}>
        <Scene cameraRef={cameraRef} />
      </Suspense>
    </Canvas>
  );
}
