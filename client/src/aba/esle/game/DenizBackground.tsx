import React, { Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  // EslemeGame içindeki camera ref’ini aynen gönderiyoruz: { current: {x,y} }
  worldCameraRef: React.MutableRefObject<{ x: number; y: number }>;
  // 2D dünya boyutları
  worldWidth: number;
  worldHeight: number;
};

// ✅ Firebase Storage “alt=media&token=...”
const DENIZ_URL =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

function Scene({ worldCameraRef, worldWidth, worldHeight }: Props) {
  const { scene } = useGLTF(DENIZ_URL) as any;
  const { camera } = useThree();

  // Model ayarları (90° sola + büyüt)
  // Not: Eğer yön ters olursa rotationY işaretini değiştir (aşağıda belirttim)
  const modelRotation = useMemo(() => new THREE.Euler(0, -Math.PI / 2, 0), []);
  const modelScale = useMemo(() => new THREE.Vector3(2.2, 2.2, 2.2), []); // ✅ büyüttüm

  // 2D kamera -> 3D kamera map
  // Range değerlerini modeline göre ayarlıyoruz (şimdilik güvenli aralık)
  const RANGE_X = 18; // sağ-sol gezi alanı (arttırırsan daha çok gezinir)
  const RANGE_Y = 8;  // yukarı-aşağı
  const BASE_Z = 22;  // uzaklık (azaltırsan yakınlaşır, arttırırsan “daha çok alan” görür)

  useFrame(() => {
    const wc = worldCameraRef.current;

    // 0..1 normalize
    const nx = worldWidth > 0 ? wc.x / worldWidth : 0.5;
    const ny = worldHeight > 0 ? wc.y / worldHeight : 0.5;

    // -1..+1
    const sx = (nx - 0.5) * 2;
    const sy = (ny - 0.5) * 2;

    // 3D kamera hedefi
    const targetX = sx * RANGE_X;
    const targetY = -sy * RANGE_Y; // ekran Y ters olduğu için -
    const targetZ = BASE_Z;

    // yumuşak takip
    camera.position.x += (targetX - camera.position.x) * 0.08;
    camera.position.y += (targetY - camera.position.y) * 0.08;
    camera.position.z += (targetZ - camera.position.z) * 0.05;

    camera.lookAt(0, 0, 0);
  });

  return (
    <>
      {/* Işıklar (resim gibi durmasın diye) */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 10, 10]} intensity={1.1} />
      <directionalLight position={[-12, 6, 8]} intensity={0.6} />

      {/* Ortam yansıması */}
      <Environment preset="sunset" />

      {/* Model */}
      <primitive object={scene} rotation={modelRotation} scale={modelScale} />
    </>
  );
}

export default function DenizBackground(props: Props) {
  return (
    <div className="w-full h-full">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 45, position: [0, 0, 22], near: 0.1, far: 2000 }}
      >
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// preload
useGLTF.preload(DENIZ_URL);
