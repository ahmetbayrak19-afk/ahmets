import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber"; // useThree, useLoader sildim
import { useGLTF, useAnimations, Environment } from "@react-three/drei";
import * as THREE from "three";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

// 🗿 SADECE 3D MODEL (Efektsiz)
function DenizModel() {
  const group = useRef(null);
  const { scene, animations } = useGLTF(DENIZ_GLB_URL);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Animasyon varsa çalıştır
    Object.keys(actions).forEach((key) => {
      actions[key]?.reset().fadeIn(0.5).play();
    });
  }, [actions]);

  const clone = useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={group}>
      {/* Modelin pozisyonunu 0,0,0 yapıyorum ki kamera tam karşısında dursun.
         Dönme açısı (rotation) sende -Math.PI/2 idi, onu korudum.
      */}
      <primitive 
        object={clone} 
        scale={[1.3, 1.3, 1.3]} 
        position={[0, -2, 0]} 
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

// 🎥 KAMERA TAKİPÇİSİ (Basit)
function CameraController({ cameraRef }) {
  useFrame((state) => {
    // Eğer kameranın balığı takip etmesini istiyorsan buraya kod yazarız.
    // Şimdilik sabit dursun, açıyı görelim.
    
    // Kamerayı her karede dümdüz baktıralım:
    state.camera.lookAt(0, 0, 0); 
  });
  return null;
}

export default function DenizBackground({ cameraRef }) {
  return (
    <div className="absolute inset-0 bg-black"> 
      <Canvas
        // 🔥 KAMERA AYARI BURASI 🔥
        // Eski: position: [0, 15, 20] -> Tepeden bakıyordu.
        // Yeni: position: [0, 0, 25] -> Tam karşıdan (Göz hizası).
        camera={{ position: [0, 0, 25], fov: 45 }}
        style={{ pointerEvents: 'none' }}
      >
        {/* Kamerayı sürekli merkeze baktıran kontrolcü */}
        <CameraController cameraRef={cameraRef} />

        {/* Işıklandırma */}
        <ambientLight intensity={2} color="#ffffff" />
        <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />

        {/* Model */}
        <Suspense fallback={null}>
            <DenizModel />
        </Suspense>
        
        {/* Şehir yansıması (Balığın üstünde parlama olsun diye bıraktım, istersen sil) */}
        <Environment preset="city" background={false} />

      </Canvas>
    </div>
  );
      }
