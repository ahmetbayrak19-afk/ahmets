import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

export function Fish3D({ fishRef }: { fishRef: any }) {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // APK içinde denenebilecek tüm olası yollar
    const candidatePaths = [
      '/models/balik.glb',
      '/assets/models/balik.glb',
      '/assets/assets/models/balik.glb',
      '/public/models/balik.glb',
      'models/balik.glb',
      './models/balik.glb',
      'assets/models/balik.glb',
      './assets/models/balik.glb',
      'file:///android_asset/models/balik.glb',
      'file:///android_asset/public/models/balik.glb',
      'file:///android_asset/assets/models/balik.glb',
    ];

    let isMounted = true;

    const tryPaths = async () => {
      for (const path of candidatePaths) {
        try {
          const response = await fetch(path, { method: 'HEAD' });
          if (response.ok) {
            // Dosya bulundu, şimdi tam fetch yap
            const fullResponse = await fetch(path);
            const blob = await fullResponse.blob();
            if (!isMounted) return;
            const url = URL.createObjectURL(blob);
            setModelUrl(url);
            console.log('✅ Model yüklendi:', path, '->', url);
            return;
          }
        } catch (err) {
          // sessizce devam et
        }
      }
      // Hiçbir yol çalışmadı
      if (isMounted) {
        setError('Model dosyası bulunamadı');
      }
    };

    tryPaths();

    return () => {
      isMounted = false;
      if (modelUrl) URL.revokeObjectURL(modelUrl);
    };
  }, []);

  const { scene } = useGLTF(modelUrl || '');

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
    meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI / 2 : -Math.PI / 2;
    meshRef.current.rotation.z = fish.rotation * (Math.PI / 180);
  });

  if (error) {
    return (
      <mesh position={[0, 0, 0]} scale={2}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }

  if (!modelUrl) {
    return null; // veya bir yükleniyor göstergesi
  }

  return <primitive object={scene} ref={meshRef} scale={5.0} />;
                 }
