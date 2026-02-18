import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Modelin Yeri: client/public/models/balik.glb
const MODEL_PATH = './models/balik.glb';

export function Fish3D({ fishRef }: { fishRef: any }) {
  const meshRef = useRef<THREE.Group>(null);

  // 🔥 KRİTİK NOKTA 🔥
  // 1. Parametre: Modelin yolu ('./models/balik.glb')
  // 2. Parametre: Draco Decoder yolu ('./') -> Çünkü dosyaları direkt public içine attın.
  const { scene } = useGLTF(MODEL_PATH, './');

  // Sahne yönetimi için klonluyoruz
  const clone = scene.clone();

  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;
    
    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015;

    // Pozisyon
    meshRef.current.position.x = fish.x * SCALE_FACTOR;
    meshRef.current.position.y = -fish.y * SCALE_FACTOR;
    
    // Yön
    meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;
    
    // Dönüş
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

// Ön Yükleme (Decoder yoluyla birlikte)
useGLTF.preload(MODEL_PATH, './');
