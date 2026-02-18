import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import balikModel from './balik.glb';

export function Fish3D({ fishRef }: { fishRef: any }) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const { scene, error } = useGLTF(balikModel);
  const meshRef = useRef<THREE.Group>(null);
  const fallbackRef = useRef<THREE.Mesh>(null);

  // Model yükleme hatası kontrolü
  useEffect(() => {
    if (error) {
      console.error('❌ useGLTF hatası:', error);
      setLoadError(error.message);
      alert('Model yüklenemedi, yedek küre gösteriliyor: ' + error.message);
    } else if (scene) {
      console.log('✅ Model yüklendi:', balikModel);
      setLoadError(null);
      // Gölge ayarları
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene, error]);

  // Hareket (hem model hem yedek küre için)
  useFrame(() => {
    if (!fishRef.current) return;
    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015;

    // Model varsa onu hareket ettir
    if (!loadError && meshRef.current) {
      meshRef.current.position.x = fish.x * SCALE_FACTOR;
      meshRef.current.position.y = -fish.y * SCALE_FACTOR;
      meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI/2 : -Math.PI/2;
      meshRef.current.rotation.z = fish.rotation * (Math.PI/180);
    }
    // Yedek küre varsa onu hareket ettir
    if (loadError && fallbackRef.current) {
      fallbackRef.current.position.x = fish.x * SCALE_FACTOR;
      fallbackRef.current.position.y = -fish.y * SCALE_FACTOR;
    }
  });

  // Hata varsa kocaman kırmızı bir küre göster
  if (loadError) {
    return (
      <mesh ref={fallbackRef} scale={2.0}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshStandardMaterial color="red" emissive="darkred" />
      </mesh>
    );
  }

  // Model yüklendiyse onu göster
  return <primitive object={scene} ref={meshRef} scale={5.0} />;
}

useGLTF.preload(balikModel);
