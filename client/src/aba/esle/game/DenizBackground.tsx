import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

function DenizModel() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(DENIZ_GLB_URL);
  const { actions } = useAnimations(animations, group);

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
        // Eskiden 35'ti, şimdi 5 yaptık. Oyuncak gibi oldu.
        scale={[5, 5, 5]} 
        
        // Tam ortaya (0,0,0) koydum ki balık etrafında dönsün
        position={[0, -2, 0]} 
        
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    <div className="absolute inset-0 bg-[#001e36]">
      <Canvas
        camera={{ position: [0, 5, 15], fov: 50 }} // Kamerayı biraz geriye ve yukarı çektim
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Suspense fallback={null}>
            {/* Sonsuz deniz yerine tek bir tane koydum, rahat gör diye */}
            <DenizModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
