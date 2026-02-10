import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

// Bu çarpan ne kadar küçükse arka plan o kadar "uzakta" ve "dev" hissettirir.
const PARALLAX_FACTOR = 0.05; 

function DenizModel({ offset = 0 }) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(DENIZ_GLB_URL);
  
  // 🔥 1. ÇÖZÜM: ANİMASYONLARI BAŞLAT 🔥
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Modelin içindeki tüm animasyonları bul ve oynat (Dalgalanma vb.)
    Object.keys(actions).forEach((key) => {
      const action = actions[key];
      if (action) {
        action.reset().fadeIn(0.5).play(); // Yumuşak geçişle başlat
      }
    });
  }, [actions]);

  // Modeli her seferinde yeniden yüklememek için klonluyoruz
  const clone = useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={group}>
      <primitive 
        object={clone} 
        position={[offset, -15, -10]} // Biraz daha aşağı aldım, balık ortada yüzsün
        scale={[35, 35, 35]} // Modeli devasa yaptık
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

function InfiniteSea({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;
    
    const camX = cameraRef.current.x;
    
    // 🔥 2. ÇÖZÜM: KAMERA YÖNÜNÜ TERSİNE ÇEVİR (- işareti) 🔥
    // Balık sağa gidince (+X), Arka plan sola (-X) gitmeli ki ileri gidiyormuşuz gibi olsun.
    group.current.position.x = -camX * PARALLAX_FACTOR;
  });

  return (
    <group ref={group}>
      {/* 3 Parça Deniz: Sonsuzluk hissi için yan yana dizdik */}
      {/* Offset değerlerini modelin genişliğine göre ayarladım */}
      <DenizModel offset={-100} />
      <DenizModel offset={0} />
      <DenizModel offset={100} />
    </group>
  );
}

export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    <div className="absolute inset-0 bg-[#001e36]">
      <Canvas
        gl={{ antialias: true }} // Kenarlar pürüzsüz olsun
        camera={{ position: [0, 0, 20], fov: 60 }} 
        style={{ pointerEvents: 'none' }}
      >
        {/* Sis: Derinlik hissi verir ve sonu görünmez kılar */}
        <fog attach="fog" args={['#001e36', 10, 90]} />

        {/* Işıklandırma */}
        <ambientLight intensity={0.6} color="#004488" />
        <directionalLight position={[10, 50, 20]} intensity={1.5} color="#00aaff" />
        <pointLight position={[0, -10, 5]} intensity={0.8} color="#00ffcc" />

        <Suspense fallback={null}>
            <InfiniteSea cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
      }
        
