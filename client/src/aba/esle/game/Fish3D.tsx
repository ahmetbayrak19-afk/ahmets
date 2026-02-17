import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

// Aşağıdaki satırı sırayla değiştirerek dene:
// const FISH_URL = "/models/balik.glb";                 // (şu anki)
// const FISH_URL = "file:///android_asset/models/balik.glb";
// const FISH_URL = "/public/models/balik.glb";
// const FISH_URL = "models/balik.glb";
// const FISH_URL = "file:///android_asset/public/models/balik.glb";
const FISH_URL = "/models/balik.glb";

export function Fish3D({ fishRef }: { fishRef: any }) {
  // useGLTF'den scene ve error'ü al
  const { scene, error } = useGLTF(FISH_URL);
  const meshRef = useRef<THREE.Group>(null);

  // Hata veya başarı durumunu logla
  useEffect(() => {
    if (error) {
      console.error("❌ Model yüklenemedi:", error);
      alert("Model yüklenemedi: " + error.message);
    } else if (scene) {
      console.log("✅ Model yüklendi:", FISH_URL);
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene, error]);

  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;
    
    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015; 

    meshRef.current.position.x = fish.x * SCALE_FACTOR;
    meshRef.current.position.y = -fish.y * SCALE_FACTOR; 
    meshRef.current.position.z = 0; 

    const targetY = fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;
    meshRef.current.rotation.y += (targetY - meshRef.current.rotation.y) * 0.1;
    
    const targetZ = fish.rotation * (Math.PI / 180);
    meshRef.current.rotation.z = targetZ;
  });

  return <primitive object={scene} ref={meshRef} scale={5.0} />;
}

useGLTF.preload(FISH_URL);
