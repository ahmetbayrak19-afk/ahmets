import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';

// 🔥 İŞTE O SİHİRLİ SATIR: Sonuna ?url ekleyerek dosyayı bir linke dönüştürüyoruz
import balikModelUrl from './balik.glb?url';

function SadeceBalik() {
  // balikModelUrl artık bir dosya değil, doğrudan "http://..." veya "file:///..." şeklinde bir linktir.
  const { scene } = useGLTF(balikModelUrl);

  return (
    <primitive 
      object={scene} 
      scale={3} 
      position={[0, 0, 0]} 
      rotation={[0, Math.PI / 2, 0]} 
    />
  );
}

export default function EslemeGame() {
  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#020617' }}>
      <Canvas camera={{ position: [0, 0, 12], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        
        <Suspense fallback={null}>
           <SadeceBalik />
           <Environment preset="city" />
        </Suspense>

        <OrbitControls makeDefault />
      </Canvas>

      <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'white' }}>
        URL Yöntemiyle Yükleniyor: {balikModelUrl}
      </div>
    </div>
  );
}

// Önden yükleme yaparken de URL'i kullanıyoruz
useGLTF.preload(balikModelUrl);
