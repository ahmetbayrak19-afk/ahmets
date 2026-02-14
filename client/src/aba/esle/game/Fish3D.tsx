import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

// 🔥 SENİN VERDİĞİN BALIK MODELİ 🔥
const FISH_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/cartoon%20fish%203d%20model.glb?alt=media&token=537af2d2-8ae8-4c9e-bff5-3c86368c658c";

export function Fish3D({ fishRef }: { fishRef: any }) {
  // Modeli yükle
  const { scene } = useGLTF(FISH_URL);
  const meshRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;
    
    const fish = fishRef.current;

    // --- 1. POZİSYON EŞİTLEME (2D -> 3D) ---
    // Fizik motorundaki koordinatları 3D sahneye uyarlıyoruz.
    // 0.02 çarpanı, 2D'deki 100 birimi 3D'de 2 birim yapar (Ölçekleme).
    // Bunu sahne büyüklüğüne göre artırıp azaltabilirsin.
    const WORLD_SCALE = 0.02; 

    meshRef.current.position.x = fish.x * WORLD_SCALE;
    
    // Y ekseni: Fizikte aşağısı +, 3D'de yukarısı + olabilir. 
    // Genelde -1 ile çarpmak gerekebilir ama senin kamerana göre düz de olabilir.
    // Şimdilik düz eşliyoruz, ters gelirse başına eksi (-) koyarız.
    meshRef.current.position.y = fish.y * -WORLD_SCALE; 
    
    // Z ekseni: Balık derinlikte hep 0 noktasında dursun (veya biraz önde)
    meshRef.current.position.z = 0;

    // --- 2. ROTASYON (DÖNÜŞLER) ---
    
    // SAĞ / SOL DÖNÜŞ:
    // Balık sola (-1) gidiyorsa Y ekseninde 180 derece (Math.PI) döndür
    // Sağa (1) gidiyorsa 90 derece (Math.PI / 2) döndür (Modelin yönüne göre değişir)
    // Modelin orijinali yan duruyorsa bu açılarla oynayacağız.
    // Genelde modeller +Z veya +X'e bakar.
    const isLeft = fish.lastDirection === -1;
    
    // Modelin orijinal yönüne göre burayı düzelteceğiz.
    // Şimdilik: Sol için 180 derece, Sağ için 0 derece varsayalım.
    const targetY = isLeft ? -Math.PI / 2 : Math.PI / 2; 
    
    // Yumuşak dönüş
    meshRef.current.rotation.y += (targetY - meshRef.current.rotation.y) * 0.1;

    // ZIPLAMA / EĞİM (Burnunu dikme):
    // Fizikteki 'rotation' derecesini radyana çevirip Z eksenine uyguluyoruz.
    // Eğer balık ters dönüyorsa buradaki değeri - ile çarp.
    meshRef.current.rotation.z = fish.rotation * (Math.PI / 180);

  });

  // Modelin boyutu çok büyükse scale={0.5} gibi küçült
  return <primitive object={scene} ref={meshRef} scale={1.5} />;
}

// Modeli önceden yükle ki takılmasın
useGLTF.preload(FISH_URL);
    
