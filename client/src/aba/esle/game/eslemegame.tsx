import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";

// 🔥 BALIK MODELİNİ BURADAN ÇEKİYORUZ
// Not: balik.glb dosyasının EslemeGame.tsx ile aynı klasörde olduğundan emin ol!
import balikModelUrl from "./balik.glb";

function BalikModeli() {
  // Modeli yüklüyoruz
  const { scene } = useGLTF(balikModelUrl);

  return (
    <primitive 
      object={scene} 
      scale={2.5} 
      position={[0, 0, 0]} 
      rotation={[0, Math.PI / 2, 0]} 
    />
  );
}

export default function EslemeGame() {
  return (
    <div className="w-full h-screen bg-slate-900">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        {/* Işıklandırma: Balığı görebilmemiz için şart */}
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        
        {/* Çevre aydınlatması: Modelin daha gerçekçi durmasını sağlar */}
        <Environment preset="city" />

        <Suspense fallback={null}>
          <BalikModeli />
        </Suspense>

        {/* Fare ile balığı döndürüp her yerine bakabilmen için kontrolcü */}
        <OrbitControls enableZoom={true} />
      </Canvas>

      {/* Bilgilendirme Yazısı */}
      <div className="absolute bottom-10 left-10 text-white font-mono opacity-50">
        Balığı döndürmek için fareyle sürükle...
      </div>
    </div>
  );
}

// Modeli önceden belleğe alıyoruz
useGLTF.preload(balikModelUrl);
