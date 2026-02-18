import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// ⚠️ DİKKAT: Dosya 'public/models' klasöründe olduğu için
// build alındığında 'dist/models' içine gider.
// Başındaki nokta (.) çok önemli, APK içinde "bulunduğun klasörden ara" demektir.
const MODEL_PATH = './models/balik.glb';

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

  // 1. Modeli Yükle
  // Import kullanmıyoruz, direkt string path veriyoruz.
  // Bu sayede "Could not resolve" hatası ALMAZSIN.
  const { scene } = useGLTF(MODEL_PATH);

  // 2. Sahneyi Klonla
  // Aynı balıktan birden fazla olursa veya sahne yönetimi için klonlamak şarttır.
  const clone = scene.clone();

  // 3. Animasyon Döngüsü
  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;
    
    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015;

    // Pozisyon
    meshRef.current.position.x = fish.x * SCALE_FACTOR;
    meshRef.current.position.y = -fish.y * SCALE_FACTOR;

    // Yön (Sağ/Sol)
    meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;

    // Dönüş (Açı)
    meshRef.current.rotation.z = fish.rotation * (Math.PI / 180);
  });

  // 4. Render
  return (
    <primitive 
      object={clone} 
      ref={meshRef} 
      scale={5.0} // Balığın boyutunu buradan ayarla
    />
  );
}

// 5. Ön Yükleme (Preload)
// Modeli önceden hafızaya alır, takılmayı önler.
useGLTF.preload(MODEL_PATH);
      
