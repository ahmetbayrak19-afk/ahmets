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
        scale={[1, 1, 1]} 
        position={[0, 0, 0]} 
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;
    
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;

    group.current.position.x = -camX * 0.015;
    group.current.position.y = camY * 0.015;
  });

  return (
    <group ref={group}>
      <DenizModel />
    </group>
  );
}

export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    // 🔥 1. DEĞİŞİKLİK: ARKAPLAN BEYAZ 🔥
    <div className="absolute inset-0 bg-white"> 
      <Canvas
        camera={{ position: [0, 0, 20], fov: 50 }}
        style={{ pointerEvents: 'none' }}
      >
        {/* 🔥 2. DEĞİŞİKLİK: CANVAS İÇİNİ DE BEYAZ YAPTIK 🔥 */}
        <color attach="background" args={["white"]} />

        {/* Işıkları çok güçlü açtım ki model karanlıkta kalmasın */}
        <ambientLight intensity={2} color="#ffffff" /> 
        <directionalLight position={[5, 10, 5]} intensity={3} color="#ffffff" />
        <pointLight position={[0, -10, 5]} intensity={1} color="#ffffff" />

        <Suspense fallback={null}>
            <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
  
