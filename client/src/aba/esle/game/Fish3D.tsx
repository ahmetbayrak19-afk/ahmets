import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export function Fish3D({ fishRef }: { fishRef: any }) {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Denenecek yollar (APK'da var olduğunu bildiğin yollar)
    const urls = [
      '/models/balik.glb',
      '/assets/models/balik.glb',
      '/public/models/balik.glb',
      'models/balik.glb',
      './models/balik.glb',
    ];

    const loader = new GLTFLoader();
    let isMounted = true;

    const tryLoad = async (url: string) => {
      try {
        const gltf = await loader.loadAsync(url);
        if (isMounted) {
          console.log('✅ Yüklendi:', url);
          setModel(gltf.scene);
        }
      } catch (err) {
        console.warn(`❌ Başarısız: ${url}`, err);
      }
    };

    // Tüm yolları dene
    urls.forEach(url => tryLoad(url));

    return () => { isMounted = false; };
  }, []);

  useFrame(() => {
    if (!meshRef.current || !fishRef.current) return;
    const fish = fishRef.current;
    const SCALE_FACTOR = 0.015;
    meshRef.current.position.x = fish.x * SCALE_FACTOR;
    meshRef.current.position.y = -fish.y * SCALE_FACTOR;
    meshRef.current.rotation.y = fish.lastDirection === 1 ? Math.PI/2 : -Math.PI/2;
    meshRef.current.rotation.z = fish.rotation * (Math.PI/180);
  });

  // Model yoksa kırmızı küp göster
  if (!model) {
    return (
      <mesh ref={meshRef as any} scale={2}>
        <boxGeometry args={[2,2,2]} />
        <meshStandardMaterial color="red" />
      </mesh>
    );
  }

  // Model varsa onu göster
  return <primitive object={model} ref={meshRef} scale={5.0} />;
}
