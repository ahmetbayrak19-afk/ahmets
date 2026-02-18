import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

export function Fish3D({ fishRef }: { fishRef: any }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;
    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015;
    meshRef.current.position.x = fish.x * SCALE_FACTOR;
    meshRef.current.position.y = -fish.y * SCALE_FACTOR;
  });

  return (
    <mesh ref={meshRef} scale={2}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}
