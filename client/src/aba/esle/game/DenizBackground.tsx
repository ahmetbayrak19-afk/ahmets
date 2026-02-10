import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";
import gokResmi from "./gok.png";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";
const WATER_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/water.glb?alt=media&token=8d3f648f-3952-4802-8008-20a8865b0426";

function Gokyuzu() {
  const texture = useTexture(gokResmi);
  return (
    <mesh position={[0, 0, -50]}>
      <planeGeometry args={[500, 500]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

// 🔥 YENİ SU MODELİ 🔥
function TestWaterModel() {
  const { scene } = useGLTF(WATER_GLB_URL);
  const clone = useMemo(() => scene.clone(), [scene]);

  return (
    <primitive 
      object={clone} 
      // AYAR 1: Boyutu 3'te 1'ine düşürdüm (15 -> 5)
      scale={[5, 5, 5]} 
      // AYAR 2: Yüksekliği 5 yaptım
      position={[0, 5, 0]} 
    />
  );
}

// ESKİ DENİZ MODELİ
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
        position={[0, -5, -5]} 
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

// 🔥 HAREKETLİ GRUP (MovingScene) 🔥
function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;
    
    // Dünyayı ters yöne kaydırarak hareket hissi veriyoruz
    group.current.position.x = -camX * 0.015;
    group.current.position.y = camY * 0.015;
  });

  return (
    <group ref={group}>
      {/* İkisini de bu grubun içine koydum ki beraber hareket etsinler */}
      <DenizModel />
      <TestWaterModel />
    </group>
  );
}

export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    <div className="absolute inset-0 bg-black"> 
      <Canvas
        camera={{ position: [0, 0, 20], fov: 45 }}
        style={{ pointerEvents: 'none' }}
      >
        <Environment preset="city" background={false} />

        <Suspense fallback={null}>
           <Gokyuzu />
        </Suspense>

        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" />

        <Suspense fallback={null}>
            <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
