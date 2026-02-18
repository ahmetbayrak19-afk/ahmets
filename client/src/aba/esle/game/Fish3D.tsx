import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// 👇 ÖNEMLİ: Dosya yolunu senin klasör yapına göre ayarla.
// Eğer bu dosya 'client/src/components' içindeyse ve model 'client/src/assets' içindeyse:
// '../assets/balik.glb' doğru yoldur.
import balikModelUrl from '../assets/balik.glb'; 

// TypeScript için prop tipleri
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

  // 1. Modeli Yükle (useGLTF otomatik cache yapar ve Suspense tetikler)
  const { scene } = useGLTF(balikModelUrl);

  // 2. Modeli Klonla (Her balık için bağımsız bir kopya oluşturur)
  // useMemo gerekmez, useGLTF zaten optimize eder ama sahne klonlamak iyidir.
  const clone = scene.clone();

  // 3. Animasyon Döngüsü (Her karede çalışır)
  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;
    
    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015; // Balığın ekrandaki hareket hızı/oranı

    // Pozisyon Güncelleme
    meshRef.current.position.x = fish.x * SCALE_FACTOR;
    meshRef.current.position.y = -fish.y * SCALE_FACTOR;

    // Yön (Sağ/Sol) Güncelleme
    // lastDirection 1 ise sağa, -1 ise sola bakar
    meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;

    // Dönüş (Açı) Güncelleme
    meshRef.current.rotation.z = fish.rotation * (Math.PI / 180);
  });

  // 4. Sahneye Yerleştir
  return (
    <primitive 
      object={clone} 
      ref={meshRef} 
      scale={5.0} // Balığın boyutu (ihtiyaca göre değiştir)
    />
  );
}

// Performans İpucu: Modeli önceden yüklemesi için tarayıcıya/webview'a sinyal gönderir.
useGLTF.preload(balikModelUrl);
