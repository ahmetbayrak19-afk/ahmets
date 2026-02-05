import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";

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
          obj?.name ||
          obj?.material?.name ||
          obj?.geometry?.name ||
          obj?.uuid ||
          "unknown";
        onPartClick(String(name));
      }}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [hasError] = useState(false);

  // 🔎 KANIT PANELİ
  const [dbg, setDbg] = useState<string>("Başlıyor…");

  const controlsRef = useRef<any>(null);
  const appliedRef = useRef(false);

  useEffect(() => {
    // 3 frame sonra dene (kontrolün dolması için)
    const step = () => {
      const c = controlsRef.current;

      if (!c) {
        setDbg("OrbitControls REF = null (ref dolmadı) ❌");
        return;
      }

      // Çok bariz bir değişiklik yapalım ki gözle görünür olsun:
      // Kamerayı aşırı yukarı + geri alıyoruz.
      // Eğer hala değişmiyorsa, gerçekten override ediliyor demektir.
      c.target.set(0, 1.4, 0);
      c.object.position.set(0, 6, 12); // 🔥 bariz, kaçırılmaz
      c.update();

      appliedRef.current = true;

      setDbg(
        `APPLY ✅\n` +
          `cam = [${c.object.position.x.toFixed(2)}, ${c.object.position.y.toFixed(
            2
          )}, ${c.object.position.z.toFixed(2)}]\n` +
          `tgt = [${c.target.x.toFixed(2)}, ${c.target.y.toFixed(2)}, ${c.target.z.toFixed(2)}]`
      );
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(step);
      });
    });
  }, []);

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
          <div>
            <p className="font-bold">Model Yüklenemedi!</p>
            <p className="text-xs opacity-90">Firebase / internet kontrol et.</p>
          </div>
        </div>
      )}

      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        <Canvas camera={{ fov: 50, near: 0.01, far: 5000 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          <Suspense fallback={<Loader />}>
            <Model onPartClick={setClickedName} />
          </Suspense>

          <OrbitControls ref={controlsRef} makeDefault />
        </Canvas>

        {/* 🔎 Debug overlay */}
        <div className="absolute top-4 right-4 bg-black/70 text-white text-[11px] p-3 rounded-lg max-w-[70%] whitespace-pre-wrap">
          {dbg}
          <div className="opacity-70 mt-2">
            applied: {appliedRef.current ? "true" : "false"}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 w-full flex justify-center pointer-events-none px-4">
        <div className="bg-blue-600/90 text-white w-full max-w-md py-4 rounded-2xl text-center shadow-lg backdrop-blur-md border border-blue-400/30">
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <MousePointer2 size={16} />
            <span className="font-bold text-xs tracking-widest uppercase">
              Tespit Edilen Bölge
            </span>
          </div>
          <p className="font-mono text-xl font-bold truncate px-4">
            {clickedName}
          </p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
