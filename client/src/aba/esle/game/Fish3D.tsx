import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// 👇 MANUEL HESAPLANMIŞ DOĞRU YOL
// game -> esle (1 geri)
// esle -> aba (2 geri)
// aba -> src (3 geri)
// src -> assets -> balik.glb
import balikModelUrl from '../../../assets/balik.glb'; 

interface Fish3DProps {
  fishRef: React.MutableRefObject<{
    x: number;
    y: number;
    rotation: number;
    lastDirection: number;
  }>;
}

export function Fish3D({ fishRef }: Fish3DProps) {
  const meshRef = useRef<THREE.Group>(null);

  // Modeli yükle
  const { scene } = useGLTF(balikModelUrl);

  // Klonla (Sorunsuz render için)
  const clone = scene.clone();

  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;
    
    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015;

    meshRef.current.position.x = fish.x * SCALE_FACTOR;
    meshRef.current.position.y = -fish.y * SCALE_FACTOR;
    
    // Yön (Sağa/Sola bakma)
    meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;
    
    // Dönüş (Açı)
    meshRef.current.rotation.z = fish.rotation * (Math.PI / 180);
  });

  return (
    <primitive 
      object={clone} 
      ref={meshRef} 
      scale={5.0} 
    />
  );
}

// Preload yapalım ki takılmasın
useGLTF.preload(balikModelUrl);
    
