import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// 🔥 İŞTE BURADA: Balığı doğrudan import ediyoruz!
import balikModelUrl from "./balik.glb";

export function Fish3D({ fishRef }: { fishRef: any }) {
  const meshRef = useRef<THREE.Group>(null);

  // Import ettiğimiz değişkeni kullanıyoruz
  const { scene } = useGLTF(balikModelUrl); 
  const clone = useMemo(() => scene.clone(), [scene]);

  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;

    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015;

    meshRef.current.position.x = fish.x * SCALE_FACTOR;
    meshRef.current.position.y = -fish.y * SCALE_FACTOR;
    
    meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;
    meshRef.current.rotation.z = fish.rotation * (Math.PI / 180);
  });

  return <primitive object={clone} ref={meshRef} scale={5.0} />;
}

// Preload kısmına da aynı değişkeni veriyoruz
useGLTF.preload(balikModelUrl);
  
