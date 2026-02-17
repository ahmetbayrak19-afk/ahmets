import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

// Bu satırı her denemede değiştir
const FISH_URL = "/models/balik.glb";

export function Fish3D({ fishRef }: { fishRef: any }) {
  const [loadError, setLoadError] = useState(null);
  const { scene, error } = useGLTF(FISH_URL);
  const meshRef = useRef<THREE.Group>(null);

  // Fetch ile dosya erişimini test et
  useEffect(() => {
    fetch(FISH_URL)
      .then(res => {
        if (!res.ok) {
          console.error(`❌ HTTP ${res.status}: ${FISH_URL}`);
          setLoadError(`HTTP ${res.status}`);
        } else {
          console.log(`✅ Dosya bulundu: ${FISH_URL}, boyut: ${res.headers.get('content-length')}`);
        }
      })
      .catch(err => {
        console.error(`❌ Fetch hatası: ${FISH_URL}`, err);
        setLoadError(err.message);
      });
  }, []);

  useEffect(() => {
    if (error) {
      console.error("❌ useGLTF hatası:", error);
      alert("useGLTF hatası: " + error.message);
    } else if (scene) {
      console.log("✅ useGLTF yüklendi:", FISH_URL);
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
