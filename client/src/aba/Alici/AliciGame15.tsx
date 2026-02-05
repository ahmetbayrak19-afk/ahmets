import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";

// ✅ Firebase Linkin (Aynen kalıyor)
const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center bg-white/90 p-4 rounded-xl shadow-xl">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-800 font-bold text-sm">Model Yükleniyor…</p>
      </div>
    </Html>
  );
}

function Model({ onPartClick }: { onPartClick: (name: string) => void }) {
  const gltf = useGLTF(MODEL_PATH) as any;

  return (
    <group
      onPointerDown={(e: any) => {
        e.stopPropagation();
        const obj = e.object;
        const name =
          obj?.name || obj?.material?.name || obj?.geometry?.name || obj?.uuid || "unknown";
        onPartClick(String(name));
      }}
    >
      {/* ✅ ESKİ SAĞLAM AYAR: ADAM DİK DURUYOR */}
      <primitive 
        object={gltf.scene} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1, 0]} 
        scale={2.5} 
      />
    </group>
  );
}

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [hasError, setHasError] = useState(false);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 transition"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {hasError && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-red-500/90 text-white p-4 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-md">
          <AlertCircle size={24} />
          <div className="min-w-0">
            <p className="font-bold">Model Yüklenemedi!</p>
            <p className="text-xs opacity-90">İnternet bağlantını kontrol et.</p>
          </div>
        </div>
      )}

      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        {/* ✅ KAMERA AYARI: Göz hizasından bak */}
        <Canvas camera={{ position: [0, 1.5, 4], fov: 50, near: 0.01, far: 2000 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          <Suspense fallback={<Loader />}>
            <Model onPartClick={setClickedName} />
          </Suspense>

          {/* 🔥 ÇÖZÜM BURADA: TARGET (HEDEF) AYARI 🔥 */}
          {/* target={[0, 1.3, 0]} -> Bu satır kameraya "Ayaklara değil, göğse (1.3 metre yukarı) bak" der. */}
          {/* Böylece adamı ortalar ve bacak arasına girmez. */}
          <OrbitControls 
            makeDefault 
            target={[0, 1.3, 0]} 
          />
        </Canvas>
      </div>

      <div className="absolute bottom-8 w-full flex justify-center pointer-events-none px-4">
        <div className="bg-blue-600/90 text-white w-full max-w-md py-4 rounded-2xl text-center shadow-lg backdrop-blur-md border border-blue-400/30">
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <MousePointer2 size={16} />
            <span className="font-bold text-xs tracking-widest uppercase">Tespit Edilen Bölge</span>
          </div>
          <p className="font-mono text-xl font-bold truncate px-4">{clickedName}</p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
      
