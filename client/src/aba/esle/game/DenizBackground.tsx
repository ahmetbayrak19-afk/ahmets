import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber"; 
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

// 🗿 BALIK MODELİ
function DenizModel() {
  const group = useRef(null);
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
        scale={[1.3, 1.3, 1.3]} 
        position={[0, -2, 0]} // Balık kameranın tam ortasında dursun
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

// 🎮 OYUN MOTORU (Hareket ve Kamera Kontrolü)
// İşte burası sildiğimiz için hareket edemiyordun. Şimdi düzelttik.
function GameLogic({ cameraRef }) {
  useFrame((state) => {
    if (!cameraRef.current) return;

    // 1. Senin ana kodundan gelen X ve Y konumunu alıyoruz
    const targetX = cameraRef.current.x;
    const targetY = cameraRef.current.y;

    // 2. KAMERAYI HAREKET ETTİRİYORUZ
    // Kamera senin gittiğin yere (X, Y) geliyor.
    state.camera.position.x = targetX;
    
    // 🔥 ÖNEMLİ AYAR: Kamera seninle aynı yüksekliğe çıkıyor
    // (Eskiden burada +15 falan vardı, o yüzden tepeden bakıyordu)
    state.camera.position.y = targetY; 
    
    // Z ekseninde (derinlikte) 25 birim geride sabit duruyor
    state.camera.position.z = 25; 

    // 3. KAMERA AÇISINI KİLİTLİYORUZ
    // Kamera her zaman tam karşıya (senin olduğun konuma) baksın.
    // Böylece yukarı çıkınca aşağı eğilmez, dümdüz bakar.
    state.camera.lookAt(targetX, targetY, 0);
  });

  return null;
}

export default function DenizBackground({ cameraRef }) {
  return (
    <div className="absolute inset-0 bg-black"> 
      <Canvas
        // Başlangıç pozisyonu (GameLogic bunu hemen değiştirecek zaten)
        camera={{ position: [0, 0, 25], fov: 45 }}
        style={{ pointerEvents: 'none' }}
      >
        {/* Hareket Mantığını İçeri Ekledik */}
        <GameLogic cameraRef={cameraRef} />

        <ambientLight intensity={2} color="#ffffff" />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />

        <Suspense fallback={null}>
            <DenizModel />
        </Suspense>
        
        {/* Balığın üstünde güzel yansıma olsun diye */}
        <Environment preset="city" background={false} />

      </Canvas>
    </div>
  );
}
