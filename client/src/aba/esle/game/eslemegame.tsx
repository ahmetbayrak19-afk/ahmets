import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';

function SadeceBalik() {
  // Capacitor 'https' scheme kullandığında, public klasöründeki her şeye 
  // bu adres üzerinden erişilebilir. Bu, Firebase yüklemesiyle aynı mantıktır.
  const modelUrl = "https://localhost/balik.glb";
  
  const { scene } = useGLTF(modelUrl);

  return (
    <primitive 
      object={scene} 
      scale={3} 
      position={[0, 0, 0]} 
      rotation={[0, Math.PI / 2, 0]} 
    />
  );
}

export default function EslemeGame({ onClose }: { onClose?: () => void }) {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#020617' }}>
      <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
        {/* Aydınlatma Ayarları */}
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        
        <Suspense fallback={null}>
           <SadeceBalik />
           <Environment preset="city" />
        </Suspense>

        {/* Modeli incelemek için kontrolcü */}
        <OrbitControls makeDefault />
      </Canvas>

      {/* Arayüz Elemanları */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'white', pointerEvents: 'none' }}>
        <h1 style={{ margin: 0, fontSize: '20px', opacity: 0.8 }}>3D Test Modu</h1>
        <p style={{ margin: 0, fontSize: '12px', opacity: 0.5 }}>Yükleme: https://localhost/balik.glb</p>
      </div>
    </div>
  );
}

// Modelin önceden yüklenmesi için
useGLTF.preload("https://localhost/balik.glb");
