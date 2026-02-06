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
};

/* ================= ACCEPT MAP ================= */
const ACCEPT = {
  kol: ["Object_0001_1", "Object_0001"],
  el: ["Object_0002", "Object_0002_1", "Object_0006", "Object_0006_1"],
  sac: ["sac"],
  alin: ["alin"],
  burun: ["burun"],
  kas: ["kas"],
  goz: ["Object_3_1"],
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
  bacak: ["Object_6", "diz"],
  diz: ["diz"],
  ayak: ["ayak", "Object_0006_2"],
  tirnak: ["tirnak"],
  sirt: ["Siirt"],
  bel: ["bel"],
  omuz: ["Object_0005", "Object_0005_1"],
  parmak: ["Object_0006", "Object_0006_1", "Object_0006_2"],
} as const;

/* ================= QUESTIONS ================= */
const QUESTIONS: Question[] = [
  { key: "kol", label: "Kol", audioUrl: kolNerede, acceptNames: ACCEPT.kol },
  { key: "el", label: "El", audioUrl: elNerede, acceptNames: ACCEPT.el },
  { key: "sac", label: "Saç", audioUrl: sacNerede, acceptNames: ACCEPT.sac },
  { key: "alin", label: "Alın", audioUrl: alinNerede, acceptNames: ACCEPT.alin },
  { key: "burun", label: "Burun", audioUrl: burunNerede, acceptNames: ACCEPT.burun },
  { key: "kas", label: "Kaş", audioUrl: kasNerede, acceptNames: ACCEPT.kas },
  { key: "goz", label: "Göz", audioUrl: gozNerede, acceptNames: ACCEPT.goz },
  { key: "yanak", label: "Yanak", audioUrl: yanakNerede, acceptNames: ACCEPT.yanak },
  { key: "kulak", label: "Kulak", audioUrl: kulakNerede, acceptNames: ACCEPT.kulak },
  { key: "boyun", label: "Boyun", audioUrl: boyunNerede, acceptNames: ACCEPT.boyun },
  { key: "agiz", label: "Ağız", audioUrl: agizNerede, acceptNames: ACCEPT.agiz },
  { key: "cene", label: "Çene", audioUrl: ceneNerede, acceptNames: ACCEPT.cene },
  { key: "ense", label: "Ense", audioUrl: enseNerede, acceptNames: ACCEPT.ense },
  { key: "kafa", label: "Kafa", audioUrl: kafaNerede, acceptNames: ACCEPT.kafa },
  { key: "gogus", label: "Göğüs", audioUrl: gogusNerede, acceptNames: ACCEPT.gogus },
  { key: "karin", label: "Karın", audioUrl: karinNerede, acceptNames: ACCEPT.karin },
  { key: "ozelbolge", label: "Özel Bölge", audioUrl: ozelBolgeNerede, acceptNames: ACCEPT.ozelbolge },
  { key: "bacak", label: "Bacak", audioUrl: bacakNerede, acceptNames: ACCEPT.bacak },
  { key: "diz", label: "Diz", audioUrl: dizNerede, acceptNames: ACCEPT.diz },
  { key: "ayak", label: "Ayak", audioUrl: ayakNerede, acceptNames: ACCEPT.ayak },
  { key: "tirnak", label: "Tırnak", audioUrl: tirnakNerede, acceptNames: ACCEPT.tirnak },
  { key: "sirt", label: "Sırt", audioUrl: sirtNerede, acceptNames: ACCEPT.sirt },
  { key: "bel", label: "Bel", audioUrl: belNerede, acceptNames: ACCEPT.bel },
  { key: "omuz", label: "Omuz", audioUrl: omuzNerede, acceptNames: ACCEPT.omuz },
  { key: "parmak", label: "Parmak", audioUrl: parmakNerede, acceptNames: ACCEPT.parmak },
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

/* ================= AUDIO (unlock + single channel) ================= */
function useSingleAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // Android/WebView için: ilk gesture’da WebAudio unlock
  const unlockOnce = async () => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;

    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;

      const ctx = new Ctx();
      await ctx.resume();

      // minik sessiz buffer (unlock için)
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      source.stop(0.01);
    } catch {
      // unlock başarısız olsa bile devam
    }
  };

  const play = async (url: string) =>
    new Promise<void>((resolve) => {
      stop();
      const a = new Audio(url);
      a.preload = "auto";
      audioRef.current = a;

      a.onended = () => resolve();
      a.onerror = () => resolve();

      // Not: unlockOnce çağrısı start butonunda yapılacak
      a.play().catch(() => {
        // bloklanırsa: kullanıcı bir kez daha dokunmak zorunda kalmasın diye
        // hemen resolve etmiyoruz; 1 kere retry yapıyoruz (microtask + küçük timeout)
        setTimeout(() => {
          a.play().then(() => {}).catch(() => resolve());
        }, 0);
      });
    });

  return { play, stop, unlockOnce };
}

/* ================= HIGHLIGHT (stuck fix) ================= */
function createHighlighter() {
  const originalByMesh = new WeakMap<THREE.Mesh, any>();
  const timeoutByMesh = new WeakMap<THREE.Mesh, number>();

  const highlight = (
    scene: THREE.Object3D | null,
    names: string[],
    ms: number,
    kind: "ok" | "bad"
  ) => {
    if (!scene) return;

    const meshes: THREE.Mesh[] = [];
    scene.traverse((o: any) => {
      if (o?.isMesh && names.includes(o.name)) meshes.push(o);
    });
    if (meshes.length === 0) return;

    meshes.forEach((m) => {
      // önceki timeout varsa iptal
      const prev = timeoutByMesh.get(m);
      if (prev) window.clearTimeout(prev);

      // original material yakala (1 kere)
      if (!originalByMesh.has(m)) originalByMesh.set(m, m.material);

      // mesh’e özel clone ver (shared materyali bozmayalım)
      const base = originalByMesh.get(m);
      const cloned = base?.clone ? base.clone() : base;
      m.material = cloned;

      if (cloned?.emissive) {
        cloned.emissive.set(kind === "ok" ? 0x22c55e : 0xef4444);
        cloned.emissiveIntensity = 1.25;
      }

      const tid = window.setTimeout(() => {
        const orig = originalByMesh.get(m);
        if (orig) m.material = orig;
        timeoutByMesh.delete(m);
      }, ms);

      timeoutByMesh.set(m, tid);
    });
  };

  return { highlight };
}

/* ================= MODEL (fit + click) ================= */
function Model({
  onLoaded,
  setSceneRef,
  onMeshPick,
}: {
  onLoaded: (fit: FitInfo) => void;
  setSceneRef: (scene: THREE.Object3D | null) => void;
  onMeshPick: (obj: THREE.Object3D) => void;
}) {
  const gltf = useGLTF(MODEL_PATH) as any;

  const fit = useMemo<FitInfo>(() => {
    const scene = gltf?.scene;
    if (!scene) return { center: [0, 0, 0], radius: 1, meshes: 0 };

    let meshes = 0;
    scene.traverse?.((o: any) => {
      if (o?.isMesh) meshes++;
    });

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
      onPointerDown={(e: any) => {
        e.stopPropagation();
        if (e?.object) onMeshPick(e.object);
      }}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

/* ================= CAMERA FIT (SENİN BAZ + base capture) ================= */
function CameraFit({
  ready,
  fit,
  controlsRef,
  onBaseCaptured,
}: {
  ready: boolean;
  fit: FitInfo | null;
  controlsRef: React.MutableRefObject<any>;
  onBaseCaptured: (camPos: THREE.Vector3, target: THREE.Vector3, dist: number) => void;
}) {
  const { camera } = useThree();

  useEffect(() => {
    if (!ready || !fit) return;

    let cancelled = false;

    const apply = (tries: number) => {
      if (cancelled) return;

      const c = controlsRef.current;
      if (!c) {
        if (tries < 120) requestAnimationFrame(() => apply(tries + 1));
        return;
      }

      const [cx, cy, cz] = fit.center;
      const r = fit.radius;

      // ✅ SENİN BAZ HESABIN (DOKUNMADIM)
      c.target.set(cx, cy + r * 0.15, cz);
      const dist = r * 2.6;
      camera.position.set(cx, cy + r * 0.35, cz + dist);

      camera.near = Math.max(0.01, dist / 200);
      camera.far = Math.max(5000, dist * 50);
      camera.updateProjectionMatrix();

      // ✅ zoom-out sınırı
      c.maxDistance = dist * 1.25;

      c.update();

      onBaseCaptured(camera.position.clone(), c.target.clone(), dist);
    };

    requestAnimationFrame(() => apply(0));
    return () => {
      cancelled = true;
    };
  }, [ready, fit, camera, controlsRef, onBaseCaptured]);

  return null;
}

/* ================= MOUTH SHAPE KEY ================= */
function useMouthTalk(scene: THREE.Object3D | null, enabled: boolean) {
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
      const v = (Math.sin(t * 10) + 1) / 2; // 0..1
      const val = v * 0.95; // ✅ daha belirgin
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
  }, [scene, enabled]);
}

/* ================= ERROR BOUNDARY ================= */
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
  const { play, stop, unlockOnce } = useSingleAudio();
  const { highlight } = useMemo(() => createHighlighter(), []);

  const controlsRef = useRef<any>(null);
  const draggingRef = useRef(false);

  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [fatalError, setFatalError] = useState(false);

  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [fit, setFit] = useState<FitInfo | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const [mode, setMode] = useState<Mode>("menu");
  const [phase, setPhase] = useState<"idle" | "intro" | "asking" | "finished">("idle");
  const [score, setScore] = useState(0);

  const [qList, setQList] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);

  const awaitingRef = useRef(false);

  // mouth only intro
  const [mouthEnabled, setMouthEnabled] = useState(false);
  useMouthTalk(scene, mouthEnabled);

  // base camera snapshot
  const baseCamPosRef = useRef<THREE.Vector3 | null>(null);
  const baseTargetRef = useRef<THREE.Vector3 | null>(null);
  const baseDistRef = useRef<number>(0);
  const [baseReady, setBaseReady] = useState(false);

  const focusHead = (zoomIn: boolean) => {
    const c = controlsRef.current;
    if (!c || !fit) return;
    if (!baseCamPosRef.current || !baseTargetRef.current) return;

    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    if (zoomIn) {
      // daha çok yaklaş (dev model)
      const headTarget = new THREE.Vector3(cx, cy + r * 0.68, cz);
      const headCam = new THREE.Vector3(cx, cy + r * 0.78, cz + r * 0.95);
      c.target.copy(headTarget);
      c.object.position.copy(headCam);
      c.update();
      c.object.updateProjectionMatrix?.();
      return;
    }

    // baz'a BİREBİR geri dön
    c.target.copy(baseTargetRef.current);
    c.object.position.copy(baseCamPosRef.current);
    c.update();
    c.object.updateProjectionMatrix?.();
  };

  const startTeaching = async () => {
    if (!modelReady || !baseReady) return;

    setMode("teaching");
    setPhase("intro");
    setScore(0);
    setQList([]);
    setQIndex(0);
    setCurrentQ(null);

    await unlockOnce();

    setMouthEnabled(true);
    focusHead(true);
    await play(calismaGiris);
    focusHead(false);
    setMouthEnabled(false);

    setPhase("idle");
  };

  const startAssessment = async () => {
    if (!modelReady || !baseReady) return;

    setMode("assessment");
    setPhase("intro");
    setScore(0);

    const list = pickRandomN(QUESTIONS, 10);
    setQList(list);
    setQIndex(0);
    setCurrentQ(null);

    await unlockOnce();

    // intro (yaklaş + ağız + mp3)
    setMouthEnabled(true);
    focusHead(true);
    await play(degerlendirmeGiris);
    focusHead(false);
    setMouthEnabled(false);

    // sorular
    setPhase("asking");
    const first = list[0] ?? null;
    setCurrentQ(first);
    if (first) {
      await play(first.audioUrl);
      awaitingRef.current = true;
    }
  };

  const nextQuestion = async (idx: number) => {
    if (idx >= qList.length) {
      setPhase("finished");
      setCurrentQ(null);
      awaitingRef.current = false;
      stop();
      return;
    }
    const q = qList[idx];
    setQIndex(idx);
    setCurrentQ(q);
    await play(q.audioUrl);
    awaitingRef.current = true;
  };

  const onMeshPick = async (obj: THREE.Object3D) => {
    const name = String(obj?.name || "unknown");
    setClickedName(name);

    // model döndürürken seçim sayma
    if (draggingRef.current) return;

    if (mode !== "assessment") return;
    if (phase !== "asking") return;
    if (!currentQ) return;
    if (!awaitingRef.current) return;

    const ok = currentQ.acceptNames.includes(name);

    if (ok) {
      awaitingRef.current = false;
      setScore((s) => s + 1);
      highlight(scene, currentQ.acceptNames, 450, "ok");
      await new Promise((r) => setTimeout(r, 200));
      await nextQuestion(qIndex + 1);
    } else {
      // yanlış: kırmızı yanıp sönsün, soru devam
      highlight(scene, [name], 250, "bad");
      awaitingRef.current = true;
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => {
            stop();
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
          <div className="text-[11px] opacity-80 mt-1">
            (Model ve kamera hazır olunca aktif)
          </div>
          <div className="mt-3 flex flex-col gap-2">
            <button
              disabled={!modelReady || !baseReady}
              onClick={startTeaching}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                modelReady && baseReady
                  ? "bg-slate-200 text-slate-900"
                  : "bg-slate-600 text-slate-300"
              }`}
            >
              Öğretim
            </button>
            <button
              disabled={!modelReady || !baseReady}
              onClick={startAssessment}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                modelReady && baseReady
                  ? "bg-blue-500 text-white"
                  : "bg-slate-600 text-slate-300"
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
          <div className="font-bold">
            {mode === "assessment" ? "Değerlendirme" : "Öğretim"}
          </div>
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
        <Canvas camera={{ fov: 50, near: 0.01, far: 5000 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          <OrbitControls
            makeDefault
            ref={controlsRef}
            onStart={() => (draggingRef.current = true)}
            onEnd={() => {
              // küçük gecikme: parmak kalkarken tık saymasın
              setTimeout(() => (draggingRef.current = false), 80);
            }}
          />

          <CameraFit
            ready={modelReady}
            fit={fit}
            controlsRef={controlsRef}
            onBaseCaptured={(camPos, target, dist) => {
              if (!baseCamPosRef.current || !baseTargetRef.current) {
                baseCamPosRef.current = camPos;
                baseTargetRef.current = target;
                baseDistRef.current = dist;
                setBaseReady(true);
              }
            }}
          />

          <Suspense fallback={<Loader />}>
            <ErrorBoundary onError={() => setFatalError(true)}>
              <Model
                onMeshPick={onMeshPick}
                onLoaded={(f) => {
                  setFit(f);
                  setModelReady(true);
                }}
                setSceneRef={(s) => setScene(s)}
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
