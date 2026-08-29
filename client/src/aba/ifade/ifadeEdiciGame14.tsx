import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ArrowLeft, Check, CheckCircle2, Play, RotateCcw, Volume2, X, XCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";
import logoImg from "@/logo.png";

type Part = { id: string; label: string; animName: string | string[] };
type Category = {
  id: string; title: string; desc: string; modelFile: string; scale: number;
  position: [number, number, number]; target: [number, number, number];
  cameraDistance: number; minDistance: number; maxDistance: number;
  gradient: string; border: string; badge: string; parts: Part[];
};

const GAME_DATA: Record<string, Category> = {
  bilgisayar: {
    id: "bilgisayar", title: "Bilgisayar", desc: "Ekran, klavye, mouse ve kasa",
    modelFile: "bilgisayar.glb", scale: 1, position: [0, -1, 0], target: [0, 0, 0],
    cameraDistance: 12, minDistance: 10, maxDistance: 14,
    gradient: "bg-gradient-to-br from-blue-600/25 to-blue-400/10", border: "border-blue-400/40", badge: "bg-blue-500",
    parts: [
      { id: "ekran", label: "Ekran", animName: "monitorAction" },
      { id: "klavye", label: "Klavye", animName: "klavyeAction.001" },
      { id: "mouse", label: "Mouse", animName: "mouseAction" },
      { id: "kasa", label: "Kasa", animName: "kasaAction" },
    ],
  },
  cicek: {
    id: "cicek", title: "Çiçek", desc: "Çiçek, yaprak, saksı ve toprak",
    modelFile: "cicek.glb", scale: 1, position: [0, -2.2, 0], target: [0, 0, 0],
    cameraDistance: 12, minDistance: 10, maxDistance: 14,
    gradient: "bg-gradient-to-br from-pink-600/25 to-pink-400/10", border: "border-pink-400/40", badge: "bg-pink-500",
    parts: [
      { id: "cicek_bas", label: "Çiçek", animName: "cicekact" },
      { id: "yaprak", label: "Yaprak", animName: "yaprak" },
      { id: "saksi", label: "Saksı", animName: "saksi" },
      { id: "toprak", label: "Toprak", animName: "toprak" },
    ],
  },
  ev: {
    id: "ev", title: "Ev", desc: "Çatı, kapı, pencereler ve baca",
    modelFile: "ev.glb", scale: 1, position: [0, -1.5, 0], target: [0, 0, 0],
    cameraDistance: 15, minDistance: 7, maxDistance: 19,
    gradient: "bg-gradient-to-br from-orange-600/25 to-orange-400/10", border: "border-orange-400/40", badge: "bg-orange-500",
    parts: [
      { id: "cati", label: "Çatı", animName: "catiev_1" },
      { id: "kapi", label: "Kapı", animName: "kapiev_1" },
      { id: "pencere", label: "Pencereler", animName: ["pen1", "pen2", "pen3", "penarka", "pencere"] },
      { id: "baca", label: "Baca", animName: "bacaev_1" },
    ],
  },
  araba: {
    id: "araba", title: "Araba", desc: "Tekerlek, kapı, far ve bagaj",
    modelFile: "araba.glb", scale: 1, position: [0, -0.5, 0], target: [0, 0, 0],
    cameraDistance: 13, minDistance: 11, maxDistance: 15,
    gradient: "bg-gradient-to-br from-indigo-600/25 to-indigo-400/10", border: "border-indigo-400/40", badge: "bg-indigo-500",
    parts: [
      { id: "tekerlek", label: "Tekerlek", animName: ["solarkateker", "sagonteker", "sagarkateker", "solonteker"] },
      { id: "kapi", label: "Kapı", animName: "kapiac" },
      { id: "far", label: "Far", animName: "FAR_YAK" },
      { id: "bagaj", label: "Bagaj", animName: "bagaj" },
    ],
  },
};

type Trial = { categoryId: string; part: Part };
type Answer = Trial & { correct: boolean };
const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const createTrials = () => shuffle(Object.values(GAME_DATA)).flatMap(c => shuffle(c.parts).map(part => ({ categoryId: c.id, part })));

function Loader3D() {
  return <Html center><div className="rounded-full bg-white/90 p-3 shadow-[0_0_30px_rgba(59,130,246,.65)]"><img src={logoImg} alt="" className="h-16 w-16 animate-spin object-contain" /></div></Html>;
}

function ActiveModel({ url, dracoBase, triggerAnim, category }: {
  url: string; dracoBase: string; triggerAnim: { name: string | string[]; id: number } | null; category: Category;
}) {
  useMemo(() => useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`), [dracoBase]);
  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);
  const toggles = useRef<Record<string, boolean>>({});
  useEffect(() => {
    scene.traverse((o: any) => {
      if (!o?.isMesh || !o.material) return;
      o.material.side = THREE.DoubleSide;
      if (o.name.toLowerCase().includes("isik")) {
        o.material = o.material.clone();
        o.material.emissive = new THREE.Color("#fff");
        o.material.emissiveIntensity = 0;
      }
    });
  }, [scene]);
  useEffect(() => {
    if (!triggerAnim) return;
    const names = Array.isArray(triggerAnim.name) ? triggerAnim.name : [triggerAnim.name];
    if (names[0] === "FAR_YAK") {
      const on = toggles.current.FAR_YAK;
      scene.traverse((o: any) => { if (o?.isMesh && o.name.toLowerCase().includes("isik")) o.material.emissiveIntensity = on ? 0 : 5; });
      toggles.current.FAR_YAK = !on;
      return;
    }
    const opening = !toggles.current[names[0]];
    names.forEach(name => {
      const action = actions[name];
      if (!action) return;
      action.paused = false; action.setLoop(THREE.LoopOnce, 1); action.clampWhenFinished = true; action.reset();
      if (opening) action.timeScale = 1;
      else { action.time = action.getClip().duration; action.timeScale = -1; }
      action.play(); toggles.current[name] = opening;
    });
  }, [triggerAnim, actions, scene]);
  return <group scale={category.scale} position={category.position}><primitive object={scene} /></group>;
}

interface Props { studentId: string; mode: "assessment" | "instruction"; onClose: () => void; onComplete: (success: boolean) => void }

export default function IfadeEdiciGame14({ mode, onClose, onComplete }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [triggerAnim, setTriggerAnim] = useState<{ name: string | string[]; id: number } | null>(null);
  const [urls, setUrls] = useState({ model: "", draco: "" });
  const [started, setStarted] = useState(false);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [locked, setLocked] = useState(true);
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const delayRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const trial = started ? trials[index] : null;
  const categoryId = mode === "assessment" ? trial?.categoryId ?? null : selectedCategory;
  const category = categoryId ? GAME_DATA[categoryId] : null;

  useEffect(() => {
    if (!categoryId) return;
    const base = new URL("/assets/public/", window.location.origin).toString();
    setUrls({ model: new URL(`models/${GAME_DATA[categoryId].modelFile}`, base).toString(), draco: new URL("draco/", base).toString() });
    setTriggerAnim(null);
  }, [categoryId]);

  const clearTimers = () => {
    if (delayRef.current !== null) clearTimeout(delayRef.current);
    if (timerRef.current !== null) clearInterval(timerRef.current);
    delayRef.current = timerRef.current = null;
  };
  const beginWindow = () => {
    setLocked(false); let left = 5; setSeconds(left);
    timerRef.current = window.setInterval(() => {
      left--; setSeconds(Math.max(0, left));
      if (left <= 0) clearTimers();
    }, 1000);
  };
  const playQuestion = (part: Part) => {
    clearTimers(); setLocked(true); setSeconds(5);
    setTriggerAnim({ name: part.animName, id: Date.now() });
    const audio = new Audio(new URL("./burasine.mp3", import.meta.url).href);
    audioRef.current = audio;
    audio.addEventListener("ended", beginWindow, { once: true });
    audio.play().catch(beginWindow);
  };

  useEffect(() => {
    if (mode !== "assessment" || !started || finished || !trial) return;
    clearTimers(); audioRef.current?.pause(); setLocked(true); setSeconds(5);
    delayRef.current = window.setTimeout(() => playQuestion(trial.part), 700);
    return () => { clearTimers(); audioRef.current?.pause(); };
  }, [mode, started, finished, index, trial]);

  const start = () => { setTrials(createTrials()); setIndex(0); setAnswers([]); setFinished(false); setStarted(true); };
  const record = (correct: boolean) => {
    if (!trial || locked) return;
    clearTimers(); setLocked(true); setAnswers(a => [...a, { ...trial, correct }]);
    if (index === trials.length - 1) setFinished(true); else setIndex(i => i + 1);
  };

  if (mode === "assessment" && !started) return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0f19] p-5 text-slate-100">
      <button onClick={onClose} className="absolute right-5 top-5 rounded-full bg-white/5 p-3"><X /></button>
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[.04] p-7 text-center">
        <Play className="mx-auto mb-4 text-blue-400" size={44} />
        <h2 className="text-2xl font-black">Objenin Parçalarını Adlandırma</h2>
        <p className="mt-3 text-sm text-slate-300">Dört modelde 16 parça sırayla hareket eder. “Burası ne?” sorusundan sonra çocuğun sözlü cevabını işaretleyin.</p>
        <div className="mt-5 grid grid-cols-3 gap-2 text-xs font-bold">
          <div className="rounded-xl bg-white/5 p-3"><b className="block text-lg">16</b>Deneme</div>
          <div className="rounded-xl bg-white/5 p-3"><b className="block text-lg">5 sn</b>Süre</div>
          <div className="rounded-xl bg-white/5 p-3"><b className="block text-lg">13+</b>Başarılı</div>
        </div>
        <button onClick={start} className="mt-6 w-full rounded-2xl bg-blue-500 p-4 font-black">Değerlendirmeyi Başlat</button>
      </div>
    </div>
  );

  if (mode === "assessment" && finished) {
    const correct = answers.filter(a => a.correct).length, success = correct >= 13;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b0f19] p-5 text-slate-100">
        <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[.04] p-7 text-center">
          {success ? <CheckCircle2 className="mx-auto text-emerald-400" size={60} /> : <XCircle className="mx-auto text-red-400" size={60} />}
          <h2 className="mt-4 text-2xl font-black">{success ? "Set Başarılı" : "Set Tekrar Edilmeli"}</h2>
          <div className="mt-3 text-4xl font-black">{correct} / 16</div>
          <div className="mt-6 flex gap-3">
            <button onClick={start} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white/10 p-3 font-bold"><RotateCcw size={18}/> Tekrarla</button>
            <button onClick={() => onComplete(success)} className={twMerge("flex flex-1 items-center justify-center gap-2 rounded-2xl p-3 font-black", success ? "bg-emerald-500 text-black" : "bg-red-500")}><Check size={18}/> Sonucu Kaydet</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "instruction" && !selectedCategory) return (
    <div className="fixed inset-0 z-[100] bg-[#0b0f19] p-6 text-slate-100">
      <div className="mx-auto max-w-2xl"><button onClick={onClose} className="rounded-full bg-white/5 p-2"><XCircle /></button>
        <h2 className="mt-4 text-center text-2xl font-black">Neyi İnceleyelim?</h2>
        <div className="mt-6 grid grid-cols-2 gap-4">{Object.values(GAME_DATA).map(c =>
          <button key={c.id} onClick={() => setSelectedCategory(c.id)} className={twMerge("min-h-[150px] rounded-3xl border p-5 text-left", c.gradient, c.border)}>
            <b className="text-lg">{c.title}</b><span className="mt-2 block text-xs text-white/70">{c.desc}</span><span className={twMerge("mt-8 block w-fit rounded-full px-3 py-1 text-xs font-bold", c.badge)}>Modele Git</span>
          </button>)}</div>
      </div>
    </div>
  );

  if (!category) return null;
  const half = Math.ceil(category.parts.length / 2), groups = [category.parts.slice(0, half), category.parts.slice(half)];
  return (
    <div className="fixed inset-0 z-[100] touch-none overflow-hidden bg-[#0b0f19]">
      <Canvas key={category.id} camera={{ position: [0, 0, category.cameraDistance], fov: 42 }}>
        <ambientLight intensity={4.5}/><hemisphereLight skyColor="#fff" groundColor="#888" intensity={3.5}/>
        <directionalLight position={[10,15,10]} intensity={5}/><directionalLight position={[-10,5,-10]} intensity={2.5}/>
        <OrbitControls enablePan={false} minDistance={category.minDistance} maxDistance={category.maxDistance} minPolarAngle={Math.PI/2} maxPolarAngle={Math.PI/2} target={category.target} rotateSpeed={.65} zoomSpeed={.55}/>
        <Suspense fallback={<Loader3D/>}>{urls.model && <ActiveModel url={urls.model} dracoBase={urls.draco} triggerAnim={triggerAnim} category={category}/>}</Suspense>
      </Canvas>
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
        <div className="flex justify-between p-4">
          <button onClick={mode === "instruction" ? () => setSelectedCategory(null) : onClose} className="pointer-events-auto flex items-center gap-2 rounded-xl bg-black/50 px-4 py-2 text-white"><ArrowLeft size={18}/>{mode === "instruction" ? "Menü" : "Çık"}</button>
          {mode === "assessment" && <div className="rounded-full bg-black/50 px-4 py-2 font-black text-white">{index + 1} / 16</div>}
        </div>
        {mode === "instruction" ? <div className="flex flex-1 justify-between px-5 pt-4">{groups.map((g,n) =>
          <div key={n} className="pointer-events-auto flex w-28 flex-col gap-2">{g.map(p => <button key={p.id} onClick={() => setTriggerAnim({name:p.animName,id:Date.now()})} className="rounded-xl border border-white/10 bg-black/50 p-2 text-sm font-black text-white">{p.label}</button>)}</div>)}</div>
        : <div className="mt-auto p-4"><div className="pointer-events-auto mx-auto max-w-xl rounded-3xl bg-black/70 p-4 backdrop-blur-lg">
            <div className="mb-3 flex items-center justify-between text-white"><div><small className="text-white/50">{category.title}</small><b className="block text-sm">Çocuğun sözlü cevabını işaretleyin</b></div>
              <button onClick={() => trial && playQuestion(trial.part)} disabled={locked} className="flex gap-1 rounded-xl bg-white/10 p-2 text-xs disabled:opacity-40"><Volume2 size={16}/>Tekrar sor</button></div>
            <div className="mb-3 h-1.5 rounded-full bg-white/10"><div className={twMerge("h-full rounded-full transition-all",seconds<=2?"bg-red-500":"bg-blue-500")} style={{width:`${seconds*20}%`}}/></div>
            <div className="grid grid-cols-2 gap-3"><button onClick={() => record(false)} disabled={locked} className="rounded-2xl bg-red-500 p-4 font-black text-white disabled:opacity-40"><X className="inline"/> Yanlış / Söylemedi</button><button onClick={() => record(true)} disabled={locked || seconds === 0} className="rounded-2xl bg-emerald-500 p-4 font-black text-black disabled:opacity-40"><Check className="inline"/> Doğru Söyledi</button></div>
          </div></div>}
      </div>
    </div>
  );
}
