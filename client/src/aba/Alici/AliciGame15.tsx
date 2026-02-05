import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";

// ✅ Firebase Linkin
const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center bg-white/90 p-4 rounded-xl shadow-xl max-w-[280px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-800 font-bold text-sm">Model Yükleniyor...</p>
      </div>
    </Html>
  );
}

// 🔥 HEDEF: "agiz_1" veya "Mouth_Open" Bul ve Oynat 🔥
function MouthAnimation({ scene }: { scene: any }) {
  useEffect(() => {
    if (!scene) return;

    let targetMesh: any = null;
    let morphIndex: number = -1;

    // 1. Sahneyi gez
    scene.traverse((child: any) => {
      if (child.isMesh && child.morphTargetDictionary) {
        
        // Blender resminde gördüğümüz "Mouth_Open" özelliği bu parçada var mı?
        // VE İsmi senin dediğin gibi "agiz_1" mi (veya orijinal "agiz" mi)?
        if (
          child.morphTargetDictionary.hasOwnProperty("Mouth_Open")
        ) {
           console.log("✅ PARÇA BULUNDU:", child.name); // Konsola yazar: agiz veya agiz_1
           targetMesh = child;
           morphIndex = child.morphTargetDictionary["Mouth_Open"];
        }
      }
    });

    if (!targetMesh) {
      console.warn("❌ HATA: 'Mouth_Open' yeteneği olan parça bulunamadı!");
      return;
    }

    // 2. Animasyonu Başlat
    let start = performance.now();
    let raf = 0;

    const animate = () => {
      const elapsed = (performance.now() - start) / 1000;

      // İlk 3 saniye boyunca konuşsun
      if (elapsed < 3) {
        // Hızlı konuşma hareketi (Sinüs dalgası)
        const value = (Math.sin(elapsed * 15) + 1) / 2;
        
        // 0.8 şiddetinde ağzı aç (Çok yapay durmaması için)
        targetMesh.morphTargetInfluences[morphIndex] = value * 0.8;
        
        raf = requestAnimationFrame(animate);
      } else {
        // Süre bitince kapat
        targetMesh.morphTargetInfluences[morphIndex] = 0;
      }
    };

    animate();
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  return null;
}

function Model({ onPartClick }: { onPartClick: (name: string) => void }) {
  const gltf = useGLTF(MODEL_PATH) as any;

  return (
    <group
      onPointerDown={(e: any) => {
        e.stopPropagation();
        const obj = e.object;
        // Tıklanan objenin ismini alıyoruz
        const name =
          obj?.name || obj?.material?.name || obj?.geometry?.name || obj?.uuid || "unknown";
        onPartClick(String(name));
      }}
    >
      {/* ADAM AYARLARI (Dik duruş, yerleşim) */}
      <primitive 
        object={gltf.scene} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -1, 0]} 
        scale={2.5} 
      />
      
      {/* Animasyon Başlatıcı */}
      <MouthAnimation scene={gltf.scene} />
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
            <p className="font-bold">Hata!</p>
            <p className="text-xs opacity-90">Model yüklenemedi.</p>
          </div>
        </div>
      )}

      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        {/* KAMERA: Göz hizasında ve geride */}
        {/* near: 0.01 sayesinde modelin içine girsen de görüntü kesilmez */}
        <Canvas camera={{ position: [0, 1.6, 4], fov: 50, near: 0.01, far: 2000 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          <Suspense fallback={<Loader />}>
            <Model onPartClick={setClickedName} />
          </Suspense>

          {/* HEDEF: Göğüs hizası (Bacak arasına bakmaz) */}
          <OrbitControls 
            makeDefault 
            target={[0, 1.35, 0]} 
            minPolarAngle={0.2} 
            maxPolarAngle={Math.PI / 1.8} 
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
