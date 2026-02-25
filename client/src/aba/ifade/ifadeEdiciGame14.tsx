import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

/** ==== OYUN VERİLERİ ==== */
const GAME_DATA = {
  bilgisayar: {
    id: "bilgisayar",
    title: "Bilgisayar",
    modelFile: "bilgisayar.glb",
    parts: [
      { id: "ekran", label: "Ekran", animName: "ekran_anim" },
      { id: "klavye", label: "Klavye", animName: "klavye_anim" },
      { id: "mouse", label: "Mouse", animName: "mouse_anim" },
      { id: "kasa", label: "Kasa", animName: "kasa_anim" },
    ],
  },
  cicek: {
    id: "cicek",
    title: "Çiçek",
    modelFile: "cicek.glb",
    parts: [
      { id: "yaprak", label: "Yaprak", animName: "yaprak_anim" },
      { id: "tac_yaprak", label: "Taç Yaprak", animName: "tac_yaprak_anim" },
      { id: "kok", label: "Kök", animName: "kok_anim" },
      { id: "govde", label: "Gövde", animName: "govde_anim" },
    ],
  },
  ev: {
    id: "ev",
    title: "Ev",
    modelFile: "ev.glb",
    parts: [
      { id: "cati", label: "Çatı", animName: "cati_anim" },
      { id: "kapi", label: "Kapı", animName: "kapi_anim" },
      { id: "pencere", label: "Pencere", animName: "pencere_anim" },
      { id: "baca", label: "Baca", animName: "baca_anim" },
    ],
  },
  araba: {
    id: "araba",
    title: "Araba",
    modelFile: "araba.glb",
    parts: [
      { id: "tekerlek", label: "Tekerlek", animName: "tekerlek_anim" },
      { id: "kapi", label: "Kapı", animName: "kapi_anim" },
      { id: "far", label: "Far", animName: "far_anim" },
      { id: "bagaj", label: "Bagaj", animName: "bagaj_anim" },
    ],
  },
};

/** ---- Yükleyici Bileşeni ---- */
function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-white bg-slate-900/80 px-4 py-2 rounded-xl font-mono text-sm border border-slate-700">
        Yükleniyor: %{progress.toFixed(0)}
      </div>
    </Html>
  );
}

/** ---- 3D Model ve Animasyon Oynatıcı ---- */
function ActiveModel({ url, dracoBase, activeAnim }: { url: string; dracoBase: string; activeAnim: string | null }) {
  useMemo(() => {
    useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`);
  }, [dracoBase]);

  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    scene.traverse((o: any) => {
      if (o?.isMesh && o.material) o.material.side = THREE.DoubleSide;
    });
  }, [scene]);

  useEffect(() => {
    if (activeAnim && actions[activeAnim]) {
      const action = actions[activeAnim];
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
    }
  }, [activeAnim, actions]);

  return (
    <group scale={3.0}>
      <primitive object={scene} />
    </group>
  );
}

/** ==== ANA BİLEŞEN PROPLARI ==== */
interface IfadeEdiciGame14Props {
  studentId: string;
  mode: 'assessment' | 'instruction';
  onClose: () => void;
  onComplete: (success: boolean) => void;
}

export default function IfadeEdiciGame14({ studentId, mode, onClose, onComplete }: IfadeEdiciGame14Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeAnim, setActiveAnim] = useState<string | null>(null);
  const [urls, setUrls] = useState({ model: "", draco: "" });

  useEffect(() => {
    if (selectedCategory) {
      const base = new URL("/assets/public/", window.location.origin).toString();
      const modelFile = GAME_DATA[selectedCategory as keyof typeof GAME_DATA].modelFile;
      
      setUrls({
        model: new URL(`models/${modelFile}`, base).toString(),
        draco: new URL("draco/", base).toString(),
      });
      setActiveAnim(null);
    }
  }, [selectedCategory]);

  // 1. EKRAN: KATEGORİ SEÇİMİ (Ana Temaya Uygun)
  if (!selectedCategory) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-200">
        {/* Üst Bar */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
            <span className="font-medium">Geri Dön</span>
          </button>
          <div className="text-sm font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {mode === 'assessment' ? 'Değerlendirme Modu' : 'Öğretim Modu'}
          </div>
        </div>

        {/* İçerik */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">Neyi İnceleyelim?</h1>
          <div className="grid grid-cols-2 gap-4 md:gap-6 max-w-md w-full">
            {Object.values(GAME_DATA).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="aspect-square rounded-2xl text-xl md:text-2xl font-bold bg-slate-800 border-2 border-slate-700 text-slate-200 hover:bg-slate-700 hover:border-blue-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center justify-center"
              >
                {cat.title}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. EKRAN: MODEL VE PARÇALAR
  const categoryData = GAME_DATA[selectedCategory as keyof typeof GAME_DATA];
  const half = Math.ceil(categoryData.parts.length / 2);
  const leftParts = categoryData.parts.slice(0, half);
  const rightParts = categoryData.parts.slice(half);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 overflow-hidden">
      
      {/* 3D KANVAS */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 10]} intensity={2} />
          {/* ✅ 3D Modeli döndürmeyi sağlayan kontrolcü */}
          <OrbitControls enablePan={false} enableZoom={true} minDistance={3} maxDistance={20} />
          <Suspense fallback={<Loader3D />}>
            {urls.model && <ActiveModel url={urls.model} dracoBase={urls.draco} activeAnim={activeAnim} />}
          </Suspense>
        </Canvas>
      </div>

      {/* ARAYÜZ (UI) - Kanvasın Üzerinde */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10">
        
        {/* Üst Bar */}
        <div className="p-4 flex items-center justify-between">
          <button 
            onClick={() => setSelectedCategory(null)}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl border border-slate-700 backdrop-blur-md transition-all active:scale-95"
          >
            <ArrowLeft size={18} /> Menü
          </button>

          {mode === 'assessment' && (
            <button 
              onClick={() => onComplete(true)}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/50 transition-all active:scale-95"
            >
              <CheckCircle2 size={18} /> Tamamla
            </button>
          )}
        </div>

        {/* Sağ ve Sol Butonlar */}
        <div className="flex-1 flex justify-between items-center px-4 md:px-12 pb-10">
          
          {/* SOL BUTONLAR */}
          <div className="flex flex-col gap-3 w-32 md:w-48 pointer-events-auto">
            {leftParts.map((part) => (
              <button 
                key={part.id} 
                onClick={() => setActiveAnim(part.animName)}
                className="w-full py-3 md:py-4 px-2 text-sm md:text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
              >
                {part.label}
              </button>
            ))}
          </div>

          {/* SAĞ BUTONLAR */}
          <div className="flex flex-col gap-3 w-32 md:w-48 pointer-events-auto">
            {rightParts.map((part) => (
              <button 
                key={part.id} 
                onClick={() => setActiveAnim(part.animName)}
                className="w-full py-3 md:py-4 px-2 text-sm md:text-lg font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
              >
                {part.label}
              </button>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
  }
