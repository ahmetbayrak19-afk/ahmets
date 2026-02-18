import { useGLTF, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import balikModel from './balik.glb';

export function Fish3D({ fishRef }: { fishRef: any }) {
  const [loadError, setLoadError] = useState<string | null>(null);
  const { scene, error } = useGLTF(balikModel);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    console.log('📍 Model URL:', balikModel); // konsola yaz
    if (error) {
      console.error('❌ useGLTF hatası:', error);
      setLoadError(error.message || 'Bilinmeyen hata');
    } else if (scene) {
      console.log('✅ Model yüklendi');
      setLoadError(null);
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [scene, error]);

  useFrame(() => {
    if (!fishRef.current) return;
    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015;

    if (!loadError && meshRef.current) {
      meshRef.current.position.x = fish.x * SCALE_FACTOR;
      meshRef.current.position.y = -fish.y * SCALE_FACTOR;
      meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI/2 : -Math.PI/2;
      meshRef.current.rotation.z = fish.rotation * (Math.PI/180);
    }
  });

  // Hata varsa ekrana yazı bas
  if (loadError) {
    return (
      <Html center>
        <div style={{
          background: 'rgba(255,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          fontSize: '24px',
          fontWeight: 'bold',
          maxWidth: '300px',
          textAlign: 'center'
        }}>
          ❌ Model yüklenemedi<br/>
          <span style={{ fontSize: '16px' }}>{loadError}</span><br/>
          <span style={{ fontSize: '14px' }}>Dosya: {balikModel}</span>
        </div>
      </Html>
    );
  }

  // Normal model
  return <primitive object={scene} ref={meshRef} scale={5.0} />;
}

useGLTF.preload(balikModel);
