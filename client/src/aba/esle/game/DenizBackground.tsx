import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";

// Resmini import ediyoruz (Dosya yolu doğru olmalı)
import gokResmi from "./gok.png";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

// --- 1. GÖKYÜZÜ BİLEŞENİ (Senin Resmin) ---
function Gokyuzu() {
  // Resmi doku (texture) olarak yükle
  const texture = useTexture(gokResmi);
  
  return (
    <mesh position={[0, 0, -50]}> {/* Denizin bayağı arkasına koyduk */}
      {/* Kocaman bir perde (500x500) */}
      <planeGeometry args={[500, 500]} /> 
      {/* Işıktan etkilenmesin, direkt resmi göstersin (BasicMaterial) */}
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} /> 
    </mesh>
  );
}

// --- 2. DENİZ MODELİ ---
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

// --- 3. HAREKETLİ SAHNE ---
function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;
    
    // Sadece Deniz Hareket Etsin, Gökyüzü Sabit Kalsın (Veya o da hafif kaysın istersen buraya ekleriz)
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
    <div className="absolute inset-0 bg-black"> 
      <Canvas
        camera={{ position: [0, 0, 20], fov: 45 }}
        style={{ pointerEvents: 'none' }}
      >
        {/* 🔥 KRİTİK: SUYUN GÖRÜNMESİ İÇİN YANSIMA 🔥 */}
        {/* background={false} dedik, yani bu şehir görüntüsü arkada gözükmesin (bizim gok.png gözüksün) ama su bunu yansıtsın. */}
        <Environment preset="city" background={false} />

        {/* Senin Gökyüzü Resmin (En arkada duracak) */}
        <Suspense fallback={null}>
           <Gokyuzu />
        </Suspense>

        {/* Işıklar */}
        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" />

        <Suspense fallback={null}>
            <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
