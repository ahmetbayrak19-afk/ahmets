import React, { Suspense, useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, useTexture } from "@react-three/drei";
import * as THREE from "three";

// Resmini import ediyoruz
import gokResmi from "./gok.png";

const DENIZ_GLB_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/deniz.glb?alt=media&token=6ecb1237-70e1-43c8-b997-77b6e3943497";

// --- 1. GÖKYÜZÜ BİLEŞENİ ---
function Gokyuzu() {
  const texture = useTexture(gokResmi);
  return (
    <mesh position={[0, 0, -50]}>
      <planeGeometry args={[500, 500]} />
      <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
    </mesh>
  );
}

// --- 2. DENİZ MODELİ (TAMİR EDİLMİŞ) ---
function DenizModel() {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(DENIZ_GLB_URL);
  const { actions } = useAnimations(animations, group);

  // 🔥 İŞTE O SİHİRLİ KOD BURADA 🔥
  useEffect(() => {
    // Sahnedeki her parçayı tek tek kontrol et
    scene.traverse((child: any) => {
      if (child.isMesh) {
        // Hepsine zorla bu ayarları veriyoruz:
        
        // 1. Hem alttan hem üstten görünsün (Ters dursa bile)
        child.material.side = THREE.DoubleSide; 
        
        // 2. Şeffaflık ayarlarını sıfırla, katı olsun
        child.material.transparent = false; 
        child.material.opacity = 1;
        child.material.depthWrite = true;

        // 3. Eğer materyal "Cam" (Transmission) ise onu iptal et
        if (child.material.transmission) {
            child.material.transmission = 0; // Cam özelliğini kapat
            child.material.roughness = 0.3;  // Biraz parlak olsun
            child.material.metalness = 0;    // Metal olmasın
        }
      }
    });

    // Animasyonları başlat
    Object.keys(actions).forEach((key) => {
      actions[key]?.reset().fadeIn(0.5).play();
    });
  }, [scene, actions]); // Sahne yüklendiğinde bir kere çalışır

  const clone = useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={group}>
      <primitive 
        object={clone} 
        scale={[1, 1, 1]} 
        position={[0, -5, -5]} 
        rotation={[0, -Math.PI / 2, 0]} 
      />
    </group>
  );
}

// --- 3. HAREKETLİ SAHNE ---
function MovingScene({ cameraRef }: { cameraRef: any }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current || !cameraRef.current) return;
    const camX = cameraRef.current.x;
    const camY = cameraRef.current.y;
    
    group.current.position.x = -camX * 0.015;
    group.current.position.y = camY * 0.015;
  });

  return (
    <group ref={group}>
      <DenizModel />
    </group>
  );
}

export default function DenizBackground({ cameraRef }: { cameraRef: any }) {
  return (
    <div className="absolute inset-0 bg-black"> 
      <Canvas
        camera={{ position: [0, 0, 20], fov: 45 }}
        style={{ pointerEvents: 'none' }}
      >
        <Environment preset="city" background={false} />

        <Suspense fallback={null}>
           <Gokyuzu />
        </Suspense>

        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[10, 20, 10]} intensity={2} color="#ffffff" />

        <Suspense fallback={null}>
            <MovingScene cameraRef={cameraRef} />
        </Suspense>
      </Canvas>
    </div>
  );
    }
