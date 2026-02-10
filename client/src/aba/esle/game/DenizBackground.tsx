import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

function DenizModel() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(DENIZ_GLB_URL);
  const { actions } = useAnimations(animations, group);

  // Animasyonlar çalışsın (Dalgalanma)
  useEffect(() => {
    Object.keys(actions).forEach((key) => {
      actions[key]?.reset().fadeIn(0.5).play();
    });
  }, [actions]);

  const clone = useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={group}>
      <primitive 
        object={clone} 
        // 🔥 BURAYI KÜÇÜLTTÜM 🔥
        // 15 yerine 3 yaptık. Artık minicik bir maket gibi.
        scale={[3, 3, 3]} 
        
        // Tam ortalasın diye pozisyonu sıfırladım
        position={[0, -2, 0]} 
        
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

// Hareket mantığı AYNI KALIYOR (Bozmadım)
function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;
    
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;

    // Kamera hareketine göre ters yöne kaysın (Parallax)
    group.current.position.x = -camX * 0.015;
    group.current.position.y = camY * 0.015;
  });

  return (
    <group ref={group}>
      <DenizModel />
      
      {/* İstersen yanlara da koyabilirsin ama küçült dediğin için tek bıraktım */}
      {/* <group position={[20, 0, 0]}><DenizModel /></group> */}
    </group>
  );
}

export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    <div className="absolute inset-0 bg-[#001e36]">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 50 }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.7} color="#004488" />
        <directionalLight position={[10, 20, 10]} intensity={1.5} color="#00aaff" />
        <fog attach="fog" args={['#001e36', 15, 90]} />

        <Suspense fallback={null}>
            <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
