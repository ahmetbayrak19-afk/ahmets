import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";
import * as THREE from "three";

/* ================= MODEL ================= */
const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

/* ================= MP3 ================= */
import calismaGiris from "./calismagiris.mp3";
import degerlendirmeGiris from "./degerlendirmegiris.mp3";

import agizNerede from "./agiznerede.mp3";
import alinNerede from "./alinnerede.mp3";
import ayakNerede from "./ayaknerede.mp3";
import bacakNerede from "./bacaknerede.mp3";
import belNerede from "./belnerede.mp3";
import boyunNerede from "./boyunnerede.mp3";
import burunNerede from "./burunnerede.mp3";
import ceneNerede from "./cenenerede.mp3";
import dizNerede from "./diznerede.mp3";
import elNerede from "./elnerede.mp3";
import enseNerede from "./ensenerede.mp3";
import gogusNerede from "./gogusnerede.mp3";
import kafaNerede from "./kafanerede.mp3";
import karinNerede from "./karinnerede.mp3";
import kasNerede from "./kasnerede.mp3";
import kolNerede from "./kolnerede.mp3";
import kulakNerede from "./kulaknerede.mp3";
import omuzNerede from "./omuznerede.mp3";
import ozelBolgeNerede from "./ozelbolgenerede.mp3";
import parmakNerede from "./parmaknerede.mp3";
import sacNerede from "./sacnerede.mp3";
import sirtNerede from "./sirtnerede.mp3";
import tirnakNerede from "./tirnaknerede.mp3";
import yanakNerede from "./yanaknerede.mp3";
import gozNerede from "./goznerede.mp3";

/* ================= UI ================= */
function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center bg-white/90 p-4 rounded-xl shadow-xl max-w-[280px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-800 font-bold text-sm">Model Yükleniyor…</p>
      </div>
    </Html>
  );
}

/* ================= TYPES ================= */
type FitInfo = {
  center: [number, number, number];
  radius: number;
  meshes: number;
};

type Mode = "menu" | "teaching" | "assessment";

type Question = {
  key: string;
  label: string;
  audioUrl: string;
  acceptNames: string[];
  isFace?: boolean; // yüz sorusuysa yakınlaştırma için
};

/* ================= ACCEPT MAP ================= */
/** NOT: sirt için üç varyant ekliyorum çünkü sende tıklayınca "sirt" geliyor */
const ACCEPT = {
  kol: ["Object_0001_1", "Object_0001"],
  el: ["Object_0002", "Object_0002_1", "Object_0006", "Object_0006_1"],
  sac: ["sac"],
  alin: ["alin"],
  burun: ["burun"],
  kas: ["kas"],
  goz: ["Object_3_1", "mesh_20", "kas"], // senin son dediğin: mesh_20 + kas + goz göz sayılacak
  yanak: ["yanak"],
  kulak: ["Object_5001", "Object_5001_1"],
  boyun: ["Object_10008"],
  agiz: ["agiz_1", "agiz_2", "agiz2"],
  cene: ["cene"],
  ense: ["Object_5004_1"],
  kafa: [
    "mesh_20",
    "sac",
    "alin",
    "burun",
    "kas",
    "Object_3_1",
    "yanak",
    "Object_5001",
    "Object_5001_1",
    "agiz_1",
    "agiz_2",
    "agiz2",
    "cene",
    "Object_5004_1",
  ],
  gogus: ["gogus"],
  karin: ["karin"],
  ozelbolge: ["ozelbolge"],
  bacak: ["Object_6", "diz"], // senin dediğin
  diz: ["diz"],
  ayak: ["ayak", "Object_0006_2"],
  tirnak: ["tirnak"],
  // ✅ SIRT FIX
  sirt: ["Siirt", "Sirt", "sirt"],
  bel: ["bel"],
  omuz: ["Object_0005", "Object_0005_1"],
  parmak: ["Object_0006", "Object_0006_1", "Object_0006_2"],
} as const;

/* ================= QUESTIONS ================= */
const QUESTIONS: Question[] = [
  { key: "kol", label: "Kol", audioUrl: kolNerede, acceptNames: ACCEPT.kol },
  { key: "el", label: "El", audioUrl: elNerede, acceptNames: ACCEPT.el },
  { key: "sac", label: "Saç", audioUrl: sacNerede, acceptNames: ACCEPT.sac, isFace: true },
  { key: "alin", label: "Alın", audioUrl: alinNerede, acceptNames: ACCEPT.alin, isFace: true },
  { key: "burun", label: "Burun", audioUrl: burunNerede, acceptNames: ACCEPT.burun, isFace: true },

  // ✅ KAŞ: kas+goz+alin kaş sayılacak (senin dediğin)
  { key: "kas", label: "Kaş", audioUrl: kasNerede, acceptNames: ["kas", "Object_3_1", "alin"], isFace: true },

  // ✅ GÖZ: mesh_20+kas+goz göz sayılacak ama sadece gözü boyamak isteyebilirsin
  { key: "goz", label: "Göz", audioUrl: gozNerede, acceptNames: ACCEPT.goz, isFace: true },

  { key: "yanak", label: "Yanak", audioUrl: yanakNerede, acceptNames: ACCEPT.yanak, isFace: true },
  { key: "kulak", label: "Kulak", audioUrl: kulakNerede, acceptNames: ACCEPT.kulak, isFace: true },
  { key: "agiz", label: "Ağız", audioUrl: agizNerede, acceptNames: ACCEPT.agiz, isFace: true },
  { key: "cene", label: "Çene", audioUrl: ceneNerede, acceptNames: ACCEPT.cene, isFace: true },
  { key: "ense", label: "Ense", audioUrl: enseNerede, acceptNames: ACCEPT.ense, isFace: true },
  { key: "kafa", label: "Kafa", audioUrl: kafaNerede, acceptNames: ACCEPT.kafa, isFace: true },

  { key: "boyun", label: "Boyun", audioUrl: boyunNerede, acceptNames: ACCEPT.boyun },
  { key: "gogus", label: "Göğüs", audioUrl: gogusNerede, acceptNames: ACCEPT.gogus },
  { key: "karin", label: "Karın", audioUrl: karinNerede, acceptNames: ACCEPT.karin },
  { key: "bacak", label: "Bacak", audioUrl: bacakNerede, acceptNames: ACCEPT.bacak },
  { key: "diz", label: "Diz", audioUrl: dizNerede, acceptNames: ACCEPT.diz },
  { key: "ayak", label: "Ayak", audioUrl: ayakNerede, acceptNames: ACCEPT.ayak },
  { key: "tirnak", label: "Tırnak", audioUrl: tirnakNerede, acceptNames: ACCEPT.tirnak },
  { key: "sirt", label: "Sırt", audioUrl: sirtNerede, acceptNames: ACCEPT.sirt },
  { key: "bel", label: "Bel", audioUrl: belNerede, acceptNames: ACCEPT.bel },
  { key: "omuz", label: "Omuz", audioUrl: omuzNerede, acceptNames: ACCEPT.omuz },
  { key: "parmak", label: "Parmak", audioUrl: parmakNerede, acceptNames: ACCEPT.parmak },
  { key: "ozelbolge", label: "Özel Bölge", audioUrl: ozelBolgeNerede, acceptNames: ACCEPT.ozelbolge },
];

/* ================= HELPERS ================= */
function pickRandomN<T>(arr: T[], n: number) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

/* ================= AUDIO ================= */
function useSingleAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  const play = (url: string) =>
    new Promise<void>((resolve) => {
      try {
        stop();
        const a = new Audio(url);
        a.preload = "auto";
        a.onended = () => resolve();
        a.onerror = () => resolve();
        audioRef.current = a;
        a.play().catch(() => resolve());
      } catch {
        resolve();
      }
    });

  return { play, stop };
}

/* ================= MOUTH SHAPE KEY ================= */
function useMouthTalk(scene: THREE.Object3D | null, enabled: boolean, strength = 0.9) {
  useEffect(() => {
    if (!scene || !enabled) return;

    const targets: { mesh: any; idx: number }[] = [];
    scene.traverse((o: any) => {
      if (o?.isMesh && o.morphTargetDictionary?.Mouth_Open !== undefined) {
        targets.push({ mesh: o, idx: o.morphTargetDictionary.Mouth_Open });
      }
    });
    if (targets.length === 0) return;

    let raf = 0;
    const start = performance.now();

    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const v = (Math.sin(t * 10) + 1) / 2;
      const val = v * strength;

      targets.forEach(({ mesh, idx }) => {
        if (mesh?.morphTargetInfluences && mesh.morphTargetInfluences.length > idx) {
          mesh.morphTargetInfluences[idx] = val;
        }
      });

      raf = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(raf);
      targets.forEach(({ mesh, idx }) => {
        if (mesh?.morphTargetInfluences && mesh.morphTargetInfluences.length > idx) {
          mesh.morphTargetInfluences[idx] = 0;
        }
      });
    };
  }, [scene, enabled, strength]);
}

/* ================= HIGHLIGHT MANAGER (STUCK FIX) ================= */
type MatSnap = {
  mat: any;
  emissive: THREE.Color | null;
  emissiveIntensity: number;
};

function useHighlighter(scene: THREE.Object3D | null) {
  const baseMap = useRef(new WeakMap<THREE.Mesh, MatSnap>());
  const timerMap = useRef(new WeakMap<THREE.Mesh, number>());

  const ensureSnap = (m: THREE.Mesh) => {
    if (baseMap.current.has(m)) return;

    const mat: any = m.material;
    // shared mat ise clone edip bu meshe bağla
    const cloned = mat?.clone ? mat.clone() : mat;
    m.material = cloned;

    baseMap.current.set(m, {
      mat: cloned,
      emissive: cloned?.emissive?.clone?.() ?? null,
      emissiveIntensity: cloned?.emissiveIntensity ?? 0,
    });
  };

  const setHighlight = (m: THREE.Mesh, kind: "ok" | "bad") => {
    ensureSnap(m);
    const snap = baseMap.current.get(m);
    if (!snap?.mat) return;

    if (snap.mat.emissive) {
      snap.mat.emissive.set(kind === "ok" ? 0x22c55e : 0xef4444);
      snap.mat.emissiveIntensity = 1.35;
    }
  };

  const clearHighlight = (m: THREE.Mesh) => {
    const snap = baseMap.current.get(m);
    if (!snap?.mat) return;

    if (snap.mat.emissive && snap.emissive) {
      snap.mat.emissive.copy(snap.emissive);
      snap.mat.emissiveIntensity = snap.emissiveIntensity;
    }
  };

  const highlightNames = (names: string[], ms: number, kind: "ok" | "bad") => {
    if (!scene) return;

    const meshes: THREE.Mesh[] = [];
    scene.traverse((o: any) => {
      if (o?.isMesh && names.includes(o.name)) meshes.push(o);
    });
    if (meshes.length === 0) return;

    meshes.forEach((m) => {
      // önce eski timer’ı iptal et (stuck fix)
      const prev = timerMap.current.get(m);
      if (prev) window.clearTimeout(prev);

      setHighlight(m, kind);

      const t = window.setTimeout(() => {
        clearHighlight(m);
        timerMap.current.delete(m);
      }, ms);

      timerMap.current.set(m, t);
    });
  };

  const resetAll = () => {
    if (!scene) return;
    scene.traverse((o: any) => {
      if (!o?.isMesh) return;
      clearHighlight(o);
      const prev = timerMap.current.get(o);
      if (prev) window.clearTimeout(prev);
    });
  };

  // sayfadan çıkınca reset
  useEffect(() => {
    return () => resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

  return { highlightNames, resetAll };
}

/* ================= MODEL (click fix: onPointerUp + delta) ================= */
function Model({
  onMeshPick,
  onLoaded,
  setSceneRef,
}: {
  onMeshPick: (mesh: THREE.Object3D) => void;
  onLoaded: (fit: FitInfo) => void;
  setSceneRef: (scene: THREE.Object3D | null) => void;
}) {
  const gltf = useGLTF(MODEL_PATH) as any;

  const fit = useMemo<FitInfo>(() => {
    const scene = gltf?.scene;
    if (!scene) return { center: [0, 0, 0], radius: 1, meshes: 0 };

    let meshes = 0;
    scene.traverse?.((o: any) => o?.isMesh && meshes++);

    const box = new THREE.Box3().setFromObject(scene);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    const r = Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 1;

    return {
      center: [sphere.center.x, sphere.center.y, sphere.center.z],
      radius: r,
      meshes,
    };
  }, [gltf]);

  useEffect(() => {
    onLoaded(fit);
    setSceneRef(gltf?.scene ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fit.center[0], fit.center[1], fit.center[2], fit.radius, fit.meshes, gltf?.scene]);

  return (
    <group
      onPointerUp={(e: any) => {
        e.stopPropagation();
        // ✅ drag ile click ayrımı (tek parmak click daha stabil)
        // e.delta: pointer-down’dan pointer-up’a hareket mesafesi (px)
        if (typeof e?.delta === "number" && e.delta > 5) return;
        if (e?.object) onMeshPick(e.object);
      }}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

/* ================= CAMERA FIT (SENİN BAŞLANGICIN + MAXDIST) ================= */
function CameraFit({ ready, fit }: { ready: boolean; fit: FitInfo | null }) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!ready || !fit) return;

    let cancelled = false;

    const apply = (tries: number) => {
      if (cancelled) return;

      const c: any = controls;
      if (!c) {
        if (tries < 120) requestAnimationFrame(() => apply(tries + 1));
        return;
      }

      const [cx, cy, cz] = fit.center;
      const r = fit.radius;

      // ✅ SENİN KODUN (DOKUNMADIM)
      c.target.set(cx, cy + r * 0.15, cz);
      const dist = r * 2.6;
      camera.position.set(cx, cy + r * 0.35, cz + dist);

      camera.near = Math.max(0.01, dist / 200);
      camera.far = Math.max(5000, dist * 50);
      camera.updateProjectionMatrix();

      // ✅ SADECE: çok küçülmesin diye zoom-out sınırı
      c.maxDistance = dist * 1.25;

      c.update();
    };

    requestAnimationFrame(() => apply(0));
    return () => {
      cancelled = true;
    };
  }, [ready, fit, camera, controls]);

  return null;
}

class ErrorBoundary extends React.Component<
  { onError: () => void; children: any },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/* ================= MAIN ================= */
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const { play, stop } = useSingleAudio();

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);

  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [fatalError, setFatalError] = useState(false);

  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [fit, setFit] = useState<FitInfo | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const [mode, setMode] = useState<Mode>("menu");
  const [phase, setPhase] = useState<"idle" | "intro" | "asking" | "finished">("idle");

  const [score, setScore] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [qList, setQList] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);

  // ağız konuşma (sadece intro)
  const [mouthEnabled, setMouthEnabled] = useState(false);
  useMouthTalk(scene, mouthEnabled, 0.95);

  // highlight (stuck fix)
  const { highlightNames, resetAll } = useHighlighter(scene);

  // soru bekleme
  const awaitingRef = useRef(false);

  const focusHead = (zoomIn: boolean) => {
    if (!cameraRef.current || !controlsRef.current || !fit) return;

    const cam = cameraRef.current;
    const c = controlsRef.current;
    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    // ⚠️ sadece kamera/target değişiyor; controls asla kilitlenmiyor
    if (zoomIn) {
      c.target.set(cx, cy + r * 0.55, cz);
      cam.position.set(cx, cy + r * 0.65, cz + r * 0.95);
    } else {
      c.target.set(cx, cy + r * 0.15, cz);
      cam.position.set(cx, cy + r * 0.35, cz + r * 2.6);
    }

    cam.updateProjectionMatrix();
    c.update();
  };

  const nextQuestion = async (idx: number, list: Question[]) => {
    if (idx >= list.length) {
      setPhase("finished");
      setCurrentQ(null);
      awaitingRef.current = false;
      stop();
      // bitince highlight kalmasın
      resetAll();
      return;
    }

    const q = list[idx];
    setQIndex(idx);
    setCurrentQ(q);

    // yüz sorusuysa yaklaştır, değilse normale dön
    if (q.isFace) focusHead(true);
    else focusHead(false);

    try {
      await play(q.audioUrl);
    } catch {}

    awaitingRef.current = true;
  };

  const startAssessment = async () => {
    if (!modelReady) return;

    setMode("assessment");
    setPhase("intro");
    setScore(0);
    resetAll();

    const list = pickRandomN(QUESTIONS, 10);
    setQList(list);
    setQIndex(0);
    setCurrentQ(null);

    // intro yakınlaş + konuşma
    setMouthEnabled(true);
    focusHead(true);
    await play(degerlendirmeGiris);
    setMouthEnabled(false);

    setPhase("asking");
    await nextQuestion(0, list);
  };

  const startTeaching = async () => {
    if (!modelReady) return;

    setMode("teaching");
    setPhase("intro");
    setScore(0);
    resetAll();
    setQList([]);
    setQIndex(0);
    setCurrentQ(null);

    setMouthEnabled(true);
    focusHead(true);
    await play(calismaGiris);
    setMouthEnabled(false);

    // öğretimde serbest; kamera normal
    focusHead(false);
    setPhase("idle");
  };

  const onMeshPick = async (obj: THREE.Object3D) => {
    const name = String(obj?.name || "unknown");
    setClickedName(name);

    if (mode !== "assessment") return;
    if (phase !== "asking" || !currentQ) return;
    if (!awaitingRef.current) return;

    // ✅ Parent zincirinde kabul kontrolü (hem sırt hem küçük yüz parçaları için sağlam)
    const accept = new Set(currentQ.acceptNames);
    let cur: any = obj;
    let ok = false;
    for (let i = 0; i < 20 && cur; i++) {
      if (accept.has(String(cur.name))) {
        ok = true;
        break;
      }
      cur = cur.parent;
    }

    awaitingRef.current = false;

    if (ok) {
      setScore((s) => s + 1);

      // ✅ Boyama: sadece hedef parçaları boyasın
      // (göz sorusunda accept listesi geniş; sen "sadece gözü boya" istersen burada değiştirebiliriz)
      highlightNames(currentQ.acceptNames, 420, "ok");

      await new Promise((r) => setTimeout(r, 220));
      await nextQuestion(qIndex + 1, qList);
    } else {
      highlightNames([name], 260, "bad");
      awaitingRef.current = true;
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => {
            stop();
            resetAll();
            onClose();
          }}
          className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 transition"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {fatalError && (
        <div className="absolute top-20 left-4 right-4 z-30 bg-red-500/90 text-white p-4 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-md">
          <AlertCircle size={24} />
          <div className="min-w-0">
            <p className="font-bold">Model Yüklenemedi!</p>
          </div>
        </div>
      )}

      {/* Mod seçimi */}
      {mode === "menu" && (
        <div className="absolute top-4 right-4 z-20 bg-black/60 text-white p-3 rounded-xl w-[260px]">
          <div className="text-sm font-bold">Mod Seç</div>
          <div className="text-[11px] opacity-80 mt-1">(Model yüklendikten sonra başlat)</div>
          <div className="mt-3 flex flex-col gap-2">
            <button
              disabled={!modelReady}
              onClick={startTeaching}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                modelReady ? "bg-slate-200 text-slate-900" : "bg-slate-600 text-slate-300"
              }`}
            >
              Öğretim
            </button>
            <button
              disabled={!modelReady}
              onClick={startAssessment}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                modelReady ? "bg-blue-500 text-white" : "bg-slate-600 text-slate-300"
              }`}
            >
              Değerlendirme (10 soru)
            </button>
          </div>
        </div>
      )}

      {/* Üst bilgi */}
      {mode !== "menu" && (
        <div className="absolute top-4 right-4 z-20 bg-black/55 text-white px-3 py-2 rounded-xl text-[12px]">
          <div className="font-bold">{mode === "assessment" ? "Değerlendirme" : "Öğretim"}</div>
          {mode === "assessment" && (
            <div className="opacity-85">
              Soru: {Math.min(qIndex + 1, 10)}/10 · Puan: {score}
            </div>
          )}
          {mode === "assessment" && currentQ && phase === "asking" && (
            <div className="mt-1 text-[11px] opacity-85">
              Şimdi: <b>{currentQ.label}</b>
            </div>
          )}
          {phase === "finished" && mode === "assessment" && (
            <div className="mt-1 text-[11px] opacity-90">Bravo! Bitti ✅</div>
          )}
        </div>
      )}

      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        <Canvas
          camera={{ fov: 50, near: 0.01, far: 5000 }}
          onCreated={({ camera }) => (cameraRef.current = camera as any)}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          <OrbitControls ref={controlsRef} makeDefault />

          <CameraFit ready={modelReady} fit={fit} />

          <Suspense fallback={<Loader />}>
            <ErrorBoundary onError={() => setFatalError(true)}>
              <Model
                onMeshPick={onMeshPick}
                setSceneRef={(s) => setScene(s)}
                onLoaded={(f) => {
                  setFit(f);
                  setModelReady(true);
                }}
              />
            </ErrorBoundary>
          </Suspense>
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
