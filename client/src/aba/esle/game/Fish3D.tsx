import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// 1. Balık modelini doğru klasörden içeri aktarıyoruz (3 kere geri çıkarak src'ye ulaşıyoruz)
import balikModeli from '../../../assets/balik.glb'; 

export function Fish3D({ fishRef }: { fishRef: any }) {
  const meshRef = useRef<THREE.Group>(null);

  // 2. Android'in kafasını karıştırmadan, direkt import ettiğimiz değişkeni veriyoruz
  const { scene } = useGLTF(balikModeli);
  
  // 3. Performans için modeli klonluyoruz (Oyun kasmasın diye)
  const clone = useMemo(() => scene.clone(), [scene]);

  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;
    
    const fish = fishRef.current;
    
    // Balığın ekrandaki büyüklüğünü/küçüklüğünü buradan ayarlayabilirsin
    const SCALE_FACTOR = 0.015; 

    meshRef.current.position.x = fish.x * SCALE_FACTOR;
    meshRef.current.position.y = -fish.y * SCALE_FACTOR;
    
    // Sağa ve sola dönüşleri ayarlıyor
    meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;
    meshRef.current.rotation.z = fish.rotation * (Math.PI / 180);
  });

  return <primitive object={clone} ref={meshRef} scale={5.0} />;
}

// 4. Modelin oyun açılırken önden yüklenmesini sağlıyoruz
useGLTF.preload(balikModeli);
