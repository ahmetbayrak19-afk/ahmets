import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";
import * as THREE from "three";

// ✅ Firebase Linkin
const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center bg-white/90 p-4 rounded-xl shadow-xl">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-800 font-bold text-sm">Model Yükleniyor...</p>
      </div>
    </Html>
  );
}

// 🔥 BU YENİ PARÇA: Model yüklendiği an kamerayı ayarlar 🔥
function CameraRig({ controlsRef }: { controlsRef: any }) {
  const { camera, scene } = useThree();
  const ranOnce = useRef(false);

  useEffect(() => {
    if (ranOnce.current) return; // Sadece 1 kere çalışsın

    // Modelin yüklenmesi için minik bir bekleme (Garanti olsun)
    const timer = setTimeout(() => {
      // 1. Sahnedeki adamın sınırlarını (Kutusunu) hesapla
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      
      box.getSize(size);    // Adamın boyu eni ne kadar?
      box.getCenter(center); // Adamın tam ortası neresi?

      if (size.y === 0) return; // Model yoksa işlem yapma

      // 2. HEDEF BELİRLE (GÖĞÜS HİZASI)
      // Center.y adamın kemer hizasıdır. Biz boyunun %20'si kadar yukarı çıkıyoruz.
      const chestHeight = center.y + (size.y * 0.2); 
      
      // 3. KAMERA POZİSYONU
      // Göğüs hizasında, ama adamdan biraz uzakta (Z ekseninde geri)
      const cameraDist = size.y * 1.5; // Adamın boyuna göre mesafe ayarla

      // Kamerayı ve Hedefi Güncelle
      camera.position.set(center.x, chestHeight, center.z + cameraDist);
      
      if (controlsRef.current) {
        controlsRef.current.target.set(center.x, chestHeight, center.z);
        controlsRef.current.update();
      }

      console.log("Kamera göğüs hizasına odaklandı! ✅");
      ranOnce.current = true;
    }, 100); // 100ms gecikme ile çalışır

    return () => clearTimeout(timer);
  }, [camera, scene, controlsRef]);

  return null;
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
      {/* ADAM DİK DURUYOR */}
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
  
  // Kontrolcüyü referans alıyoruz ki CameraRig ona müdahale edebilsin
  const controlsRef = useRef<any>(null);

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
            <p className="font-bold">Hata!</p>
            <p className="text-xs opacity-90">Model yüklenemedi.</p>
          </div>
        </div>
      )}

      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        <Canvas camera={{ fov: 50, near: 0.01, far: 2000 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          <Suspense fallback={<Loader />}>
            <Model onPartClick={setClickedName} />
            {/* 🔥 SİHİR BURADA: Model yüklendikten sonra bu çalışır ve kamerayı düzeltir */}
            <CameraRig controlsRef={controlsRef} />
          </Suspense>

          <OrbitControls 
            ref={controlsRef} 
            makeDefault 
            enablePan={true}
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
