import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect } from "react";
import * as THREE from "three";

const FISH_URL = "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/cartoon%20fish%203d%20model.glb?alt=media&token=537af2d2-8ae8-4c9e-bff5-3c86368c658c";

export function Fish3D({ fishRef }: { fishRef: any }) {
  const { scene } = useGLTF(FISH_URL);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene]);

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

  // 🔥 GÜNCELLEME: Boyut 2 katına çıktı (2.5 -> 5.0)
  return <primitive object={scene} ref={meshRef} scale={5.0} />;
}

useGLTF.preload(FISH_URL);
