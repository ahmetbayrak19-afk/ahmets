import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export function Fish3D({ fishRef }: { fishRef: any }) {
  const meshRef = useRef<THREE.Group>(null);

  // Balık modelini artık internetten değil, doğrudan kendi bilgisayarından (public/models) çekiyoruz
  const { scene } = useGLTF('/models/balik.glb'); 
  
  // Modelin sahnede düzgün çalışması için bir kopyasını (clone) oluşturuyoruz
  const clone = useMemo(() => scene.clone(), [scene]);

  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;

    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015;

    // Balığın oyun motorundaki x ve y koordinatlarını 3D sahneye uyarlıyoruz
    meshRef.current.position.x = fish.x * SCALE_FACTOR;
    meshRef.current.position.y = -fish.y * SCALE_FACTOR;
    
    // Balığın sağa/sola dönmesi ve yukarı/aşağı eğilmesi
    meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;
    meshRef.current.rotation.z = fish.rotation * (Math.PI / 180);
  });

  // Balığı ekrana basıyoruz. (Eğer balık çok büyük veya küçük gelirse scale={5.0} değerini değiştirebilirsin)
  return <primitive object={clone} ref={meshRef} scale={5.0} />;
}

// Oyun açılırken bekleme olmasın diye modeli önceden hafızaya yüklüyoruz
useGLTF.preload('/models/balik.glb');
