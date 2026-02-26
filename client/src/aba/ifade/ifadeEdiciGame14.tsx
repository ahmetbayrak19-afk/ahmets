import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";

/** ==== OYUN VERİLERİ (Aşağı Yukarı Kaydırma ve Ölçek) ==== */
const GAME_DATA = {
  bilgisayar: {
    id: "bilgisayar",
    title: "Bilgisayar",
    desc: "Ekran, Kasa, Mouse...",
    modelFile: "bilgisayar.glb",
    scale: 1.0,
    position: [0, -1, 0], // Modeli biraz aşağı çeker
    gradient: "bg-gradient-to-br from-blue-600/25 to-blue-400/10",
    border: "border-blue-400/40",
    badge: "bg-blue-500",
    parts: [
      { id: "ekran", label: "Ekran", animName: "monitorAction" },
      { id: "klavye", label: "Klavye", animName: "klavyeAction.001" },
      { id: "mouse", label: "Mouse", animName: "mouseAction" },
      { id: "kasa", label: "Kasa", animName: "kasaAction" },
    ],
  },
  cicek: {
    id: "cicek",
    title: "Çiçek",
    desc: "Yaprak, Kök, Toprak...",
    modelFile: "cicek.glb",
    scale: 1.0, 
    position: [0, -2.5, 0], // ❗ Çiçek çok yukarıdaysa buradaki -2.5 değeri onu tam ortaya indirir
    gradient: "bg-gradient-to-br from-pink-600/25 to-pink-400/10",
    border: "border-pink-400/40",
    badge: "bg-pink-500",
    parts: [
      { id: "cicek_bas", label: "Çiçek", animName: "cicekact" },
      { id: "yaprak", label: "Yaprak", animName: "yaprak" },
      { id: "saksi", label: "Saksı", animName: "saksi" },
      { id: "toprak", label: "Toprak", animName: "toprak" },
    ],
  },
  ev: {
    id: "ev",
    title: "Ev",
    desc: "Çatı, Kapı, Pencere...",
    modelFile: "ev.glb",
    scale: 1.0, 
    position: [0, -1.5, 0], // Evi biraz aşağı çeker
    gradient: "bg-gradient-to-br from-orange-600/25 to-orange-400/10",
    border: "border-orange-400/40",
    badge: "bg-orange-500",
    parts: [
      { id: "cati", label: "Çatı", animName: "catiev_1" },
      { id: "kapi", label: "Kapı", animName: "kapiev_1" },
      { id: "pencere", label: "Pencereler", animName: ["pen1", "pen2", "pen3", "penarka", "pencere"] }, 
      { id: "baca", label: "Baca", animName: "bacaev_1" },
    ],
  },
  araba: {
    id: "araba",
    title: "Araba",
    desc: "Tekerlek, Kapı, Bagaj...",
    modelFile: "araba.glb",
    scale: 1.0,
    position: [0, -0.5, 0],
    gradient: "bg-gradient-to-br from-indigo-600/25 to-indigo-400/10",
    border: "border-indigo-400/40",
    badge: "bg-indigo-500",
    parts: [
      { id: "tekerlek", label: "Tekerlek", animName: ["solarkateker", "sagonteker", "sagarkateker", "solonteker"] },
      { id: "kapi", label: "Kapı", animName: "kapiac" },
      { id: "far", label: "Far", animName: "FAR_YAK" }, 
      { id: "bagaj", label: "Bagaj", animName: "bagaj" },
    ],
  },
};

/** ---- Yükleyici Bileşeni ---- */
function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="text-white bg-white/10 px-4 py-2 rounded-xl font-mono text-sm border border-white/20 backdrop-blur-md whitespace-nowrap shadow-xl">
        Yükleniyor... %{progress.toFixed(0)}
      </div>
    </Html>
  );
}

/** ---- 3D Model ve Animasyon Oynatıcı ---- */
function ActiveModel({ url, dracoBase, triggerAnim, modelScale, modelPosition }: { url: string; dracoBase: string; triggerAnim: {name: string | string[], id: number} | null; modelScale: number; modelPosition: number[] }) {
  useMemo(() => {
    useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`);
  }, [dracoBase]);

  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);
  
  const toggleStates = useRef<Record<string, boolean>>({});

  useEffect(() => {
    scene.traverse((o: any) => {
      if (o?.isMesh && o.material) {
        o.material.side = THREE.DoubleSide;
        if (o.name.toLowerCase().includes("isik")) {
          o.material = o.material.clone();
          o.material.emissive = new THREE.Color("#ffffff");
          o.material.emissiveIntensity = 0; 
        }
      }
    });
  }, [scene]);

  useEffect(() => {
    if (triggerAnim) {
      const names = Array.isArray(triggerAnim.name) ? triggerAnim.name : [triggerAnim.name];

      if (names[0] === "FAR_YAK") {
        const isCurrentlyOn = toggleStates.current["FAR_YAK"];
        scene.traverse((o: any) => {
          if (o?.isMesh && o.name.toLowerCase().includes("isik")) {
            o.material.emissiveIntensity = isCurrentlyOn ? 0 : 5; 
          }
        });
        toggleStates.current["FAR_YAK"] = !isCurrentlyOn;
      } 
      else {
        const isOpening = !toggleStates.current[names[0]];

        names.forEach((animName) => {
          if (actions[animName]) {
            const action = actions[animName];
            action.paused = false;
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;

            if (isOpening) {
              action.reset();
              action.timeScale = 1;
              action.play();
            } else {
              action.reset(); 
              action.time = action.getClip().duration; 
              action.timeScale = -1; 
              action.play();
            }
            toggleStates.current[animName] = isOpening;
          }
        });
      }
    }
  }, [triggerAnim, actions, scene]);

  return (
    // ❗ Modeli GAME_DATA'daki position değerine göre aşağı/yukarı kaydırıyoruz
    <group scale={modelScale} position={modelPosition as [number, number, number]}>
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
  const [triggerAnim, setTriggerAnim] = useState<{name: string | string[], id: number} | null>(null);
  const [urls, setUrls] = useState({ model: "", draco: "" });

  useEffect(() => {
    if (selectedCategory) {
      const base = new URL("/assets/public/", window.location.origin).toString();
      const modelFile = GAME_DATA[selectedCategory as keyof typeof GAME_DATA].modelFile;
      
      setUrls({
        model: new URL(`models/${modelFile}`, base).toString(),
        draco: new URL("draco/", base).toString(),
      });
      setTriggerAnim(null);
    }
  }, [selectedCategory]);

  // 1. EKRAN: KATEGORİ SEÇİM MENÜSÜ
  if (!selectedCategory) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0b0f19] text-slate-100 flex flex-col font-sans select-none overflow-hidden touch-none overscroll-none min-h-screen">
        <div className="flex-1 flex flex-col p-6 gap-4 max-w-2xl mx-auto w-full relative">
          
          <div className="p-4 flex justify-between items-center">
            <button onClick={onClose} className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
              <XCircle className="text-white/60" />
            </button>
            <div className="text-xs font-bold text-white/70 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              {mode === 'assessment' ? 'Değerlendirme Modu' : 'Öğretim Modu'}
            </div>
          </div>

          <div className="text-center mt-2 mb-4">
            <div className="text-2xl font-black text-white">Neyi İnceleyelim?</div>
            <div className="text-xs text-white/60 mt-1">3 Boyutlu modeli görmek için birini seç.</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            {Object.values(GAME_DATA).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={twMerge(
                  "rounded-3xl border p-5 text-left min-h-[150px] flex flex-col justify-between shadow-lg transition-all hover:scale-[1.02] active:scale-95",
                  cat.gradient,
                  cat.border
                )}
              >
                <div>
                  <div className="font-black text-lg text-white">{cat.title}</div>
                  <div className="text-[11px] text-white/70 mt-1">{cat.desc}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className={twMerge("text-[11px] font-black px-3 py-1 rounded-full w-fit text-white shadow-sm", cat.badge)}>
                    Modele Git
                  </div>
                </div>
              </button>
            ))}
          </div>

        </div>
      </div>
    );
  }

  // 2. EKRAN: 3D MODEL VE PARÇALAR
  const categoryData = GAME_DATA[selectedCategory as keyof typeof GAME_DATA];
  const half = Math.ceil(categoryData.parts.length / 2);
  const leftParts = categoryData.parts.slice(0, half);
  const rightParts = categoryData.parts.slice(half);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0b0f19] overflow-hidden font-sans select-none touch-none overscroll-none min-h-screen">
      
      {/* 3D KANVAS */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
          
          {/* ❗ IŞIKLANDIRMA GÜÇLENDİRİLDİ (Ortam daha aydınlık olacak) */}
          <ambientLight intensity={4.5} />
          <hemisphereLight skyColor={"#ffffff"} groundColor={"#888888"} intensity={3.5} />
          <directionalLight position={[10, 15, 10]} intensity={5} />
          <directionalLight position={[-10, 5, -10]} intensity={2.5} /> {/* Arka taraftan ekstra aydınlatma */}
          
          <OrbitControls enablePan={true} enableZoom={true} minDistance={1} maxDistance={200} />
          
          <Suspense fallback={<Loader3D />}>
            {urls.model && (
              <ActiveModel 
                url={urls.model} 
                dracoBase={urls.draco} 
                triggerAnim={triggerAnim} 
                modelScale={categoryData.scale} 
                modelPosition={categoryData.position} // Konum verisi modele iletildi
              />
            )}
          </Suspense>
        </Canvas>
      </div>

      {/* ARAYÜZ (UI) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col z-10">
        
        {/* Üst Bar */}
        <div className="p-4 flex items-center justify-between mt-2 shrink-0">
          <button 
            onClick={() => setSelectedCategory(null)}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 backdrop-blur-md transition-all active:scale-95"
          >
            <ArrowLeft size={18} className="text-white/70" /> Menü
          </button>

          {mode === 'assessment' && (
            <button 
              onClick={() => onComplete(true)}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-black rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all active:scale-95"
            >
              <CheckCircle2 size={18} /> Tamamla
            </button>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex-1 flex justify-between items-start px-4 md:px-8 pt-4">
          
          <div className="flex flex-col gap-2 w-24 md:w-32 pointer-events-auto">
            {leftParts.map((part) => (
              <button 
                key={part.id} 
                onClick={() => setTriggerAnim({ name: part.animName, id: Date.now() })}
                className="w-full py-2 px-2 text-xs md:text-sm font-black rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md active:scale-95 transition-all shadow-md"
              >
                {part.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 w-24 md:w-32 pointer-events-auto">
            {rightParts.map((part) => (
              <button 
                key={part.id} 
                onClick={() => setTriggerAnim({ name: part.animName, id: Date.now() })}
                className="w-full py-2 px-2 text-xs md:text-sm font-black rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md active:scale-95 transition-all shadow-md"
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
