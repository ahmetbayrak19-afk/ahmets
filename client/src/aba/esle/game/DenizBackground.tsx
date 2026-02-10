import React, { Suspense, useRef, useLayoutEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// NOT: Modelin adresi doğru olmalı. Hata verirse localdeki bir dosyayı kullan.
const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

// DÜNYA ÖLÇEKLERİ (Physics ile uyumlu olmalı)
// 3D dünyada 1 birim, 2D dünyada yaklaşık 100 piksel gibi düşünelim.
const SCALE_FACTOR = 0.015; 

function DenizModel({ offset = 0 }) {
  const { scene } = useGLTF(DENIZ_GLB_URL);
  
  // Modeli klonlayalım ki aynısından 3 tane koyabilelim
  const clone = React.useMemo(() => scene.clone(), [scene]);

  return (
    <primitive 
      object={clone} 
      position={[offset, -8, -10]} // Biraz aşağı ve geriye ittik
      scale={[20, 20, 20]}         // Modeli kocaman yaptık
      rotation={[0, -Math.PI / 2, 0]} 
    />
  );
}

function InfiniteSea({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  // Hungry Shark Hissiyatı: Kamera balığı takip ederken
  // Arkaplan (Kayalıklar) daha yavaş hareket etmeli (Parallax)
  useFrame(() => {
    if (!group.current || !cameraRef.current) return;

    // Kameranın 2D dünyadaki pozisyonunu 3D'ye çevir
    const camX = cameraRef.current.x * SCALE_FACTOR;
    
    // Kamerayı takip et
    group.current.position.x = camX;
  });

  return (
    <group ref={group}>
      {/* 3 Tane Yan Yana Deniz Koyuyoruz (Sonsuzluk İçin) */}
      <DenizModel offset={-60} />
      <DenizModel offset={0} />
      <DenizModel offset={60} />
    </group>
  );
}

export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    <div className="absolute inset-0 bg-[#06121c]">
      <Canvas
        gl={{ antialias: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 20], fov: 50 }}
        style={{ pointerEvents: 'none' }}
      >
        <color attach="background" args={["#06121c"]} />
        
        {/* Işıklandırma (Dramatik Su Altı) */}
        <ambientLight intensity={0.5} color="#004080" />
        <directionalLight position={[10, 20, 10]} intensity={1.5} color="#00aaff" />
        <fog attach="fog" args={['#06121c', 10, 90]} /> {/* İlerisi sisli olsun */}

        <Suspense fallback={null}>
            <InfiniteSea cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
