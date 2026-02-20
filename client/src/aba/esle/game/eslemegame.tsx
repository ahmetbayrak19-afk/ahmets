import React, { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls, Stage, useProgress, Html } from "@react-three/drei";
import * as THREE from "three";

// Yükleme Göstergesi (Model ağır olduğu için progres bar önemli)
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: 'white', background: 'rgba(15, 23, 42, 0.9)', padding: '20px', borderRadius: '12px', border: '1px solid #38bdf8' }}>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>%{progress.toFixed(0)}</div>
        <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>Balık Yükleniyor...</div>
      </div>
    </Html>
  );
}

function BalikModel({ url }: { url: string }) {
  const group = useRef<THREE.Group>(null);
  // Dosya public/models içinde olduğu için yolu buna göre veriyoruz
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (animations.length > 0 && actions) {
      // Varsa ilk animasyonu (yüzme vb.) başlat
      const firstAnim = animations[0].name;
      actions[firstAnim]?.play();
    }
  }, [animations, actions]);

  return <primitive ref={group} object={scene} dispose={null} />;
}

export default function EslemeGame() {
  // Public klasöründeki tam yolumuz
  const modelYolu = "/models/balik.glb";

  return (
    <div className="w-full h-screen bg-[#0f172a]">
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 45 }}>
        {/* Stage: Modeli otomatik merkeze alır ve ışıklandırır */}
        <Stage intensity={0.6} environment="city" adjustCamera={1.8}>
          <Suspense fallback={<Loader />}>
            <BalikModel url={modelYolu} />
          </Suspense>
        </Stage>

        <OrbitControls makeDefault />
      </Canvas>

      {/* Oyun Bilgisi */}
      <div className="absolute bottom-10 w-full text-center pointer-events-none">
        <p className="text-sky-400 font-mono text-sm opacity-60">
          Kilitli sandığı açmak için sesleri eşle
        </p>
      </div>
    </div>
  );
}

// Performans için ön yükleme
useGLTF.preload("/models/balik.glb");
