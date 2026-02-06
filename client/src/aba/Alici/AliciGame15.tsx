import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";
import * as THREE from "three";

/* ================= MODEL ================= */
const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

/* ================= MP3 (aynı klasör) ================= */
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
  acceptNames: string[]; // ✅ boyanacak hedef
};

/* ================= ACCEPT MAP ================= */
/** Not: bacak = Object_6 ve diz */
const ACCEPT = {
  kol: ["Object_0001_1", "Object_0001"],
  el: ["Object_0002", "Object_0002_1", "Object_0006", "Object_0006_1"],
  sac: ["sac"],
  alin: ["alin"],
  burun: ["burun"],
  kas: ["kas"], // sadece kaş boyansın
  goz: ["Object_3_1"], // sadece göz boyansın
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

/* ================= SOFT ACCEPT (DOĞRU SAYMA) ================= */
/**
 * Göz: mesh_20 + kas + Object_3_1 doğru sayılır ama sadece Object_3_1 boyanır.
 * Kaş: kas + Object_3_1 + alin doğru sayılır ama sadece kas boyanır.
 */
const SOFT_ACCEPT: Record<string, string[]> = {
  goz: ["mesh_20", "kas", "Object_3_1"],
  kas: ["kas", "Object_3_1", "alin"],
};

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
  { key: "bacak", label: "Bacak", audioUrl: bacakNerede, acceptNames: ACCEPT.bacak },
  { key: "diz", label: "Diz", audioUrl: dizNerede, acceptNames: ACCEPT.diz },
  { key: "ayak", label: "Ayak", audioUrl: ayakNerede, acceptNames: ACCEPT.ayak },

  { key: "sirt", label: "Sırt", audioUrl: sirtNerede, acceptNames: ACCEPT.sirt },
  { key: "bel", label: "Bel", audioUrl: belNerede, acceptNames: ACCEPT.bel },
  { key: "omuz", label: "Omuz", audioUrl: omuzNerede, acceptNames: ACCEPT.omuz },
  { key: "parmak", label: "Parmak", audioUrl: parmakNerede, acceptNames: ACCEPT.parmak },
  { key: "ozelbolge", label: "Özel Bölge", audioUrl: ozelBolgeNerede, acceptNames: ACCEPT.ozelbolge },
  { key: "tirnak", label: "Tırnak", audioUrl: tirnakNerede, acceptNames: ACCEPT.tirnak },
];

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
        audioRef.current = a;
        a.onended = () => resolve();
        a.onerror = () => resolve();
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
        const idx = o.morphTargetDictionary.Mouth_Open;
        if (Array.isArray(o.morphTargetInfluences)) targets.push({ mesh: o, idx });
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

/* ================= HIGHLIGHT (kalıcı boyanma fixli) ================= */
function ensureOriginalMaterial(mesh: THREE.Mesh) {
  const ud: any = mesh.userData || (mesh.userData = {});
  if (!ud.__origMat) ud.__origMat = mesh.material;
}

function restoreOriginalMaterial(mesh: THREE.Mesh) {
  const ud: any = mesh.userData;
  if (ud?.__origMat) mesh.material = ud.__origMat;
}

function highlightByNames(
  scene: THREE.Object3D | null,
  names: string[],
  ms: number,
  kind: "ok" | "bad"
) {
  if (!scene) return;

  const meshes: THREE.Mesh[] = [];
  scene.traverse((o: any) => {
    if (o?.isMesh && names.includes(o.name)) meshes.push(o);
  });
  if (meshes.length === 0) return;

  meshes.forEach((m) => ensureOriginalMaterial(m));

  meshes.forEach((m) => {
    restoreOriginalMaterial(m);
    const matAny: any = m.material;
    const cloned = matAny?.clone ? matAny.clone() : matAny;
    m.material = cloned;

    if (cloned?.emissive) {
      cloned.emissive.set(kind === "ok" ? 0x22c55e : 0xef4444);
      cloned.emissiveIntensity = 1.25;
    }
  });

  window.setTimeout(() => {
    meshes.forEach((m) => restoreOriginalMaterial(m));
  }, ms);
}

/* ================= MODEL ================= */
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
  const { play, stop } = useSingleAudio();

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);

  const [fatalError, setFatalError] = useState(false);
  const [clickedName, setClickedName] = useState("Bir yere dokun...");

  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [fit, setFit] = useState<FitInfo | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const [mode, setMode] = useState<Mode>("menu");
  const [phase, setPhase] = useState<"idle" | "intro" | "asking" | "finished">("idle");
  const [score, setScore] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [qList, setQList] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);

  // ✅ cevap beklerken kontrollere dokunma: OrbitControls disabled
  const [controlsEnabled, setControlsEnabled] = useState(true);

  const canPickRef = useRef(false);

  const [mouthEnabled, setMouthEnabled] = useState(false);
  useMouthTalk(scene, mouthEnabled, 0.9);

  const HEAD_KEYS = useMemo(
    () =>
      new Set([
        "kafa",
        "goz",
        "kas",
        "burun",
        "agiz",
        "cene",
        "kulak",
        "yanak",
        "alin",
        "sac",
        "ense",
        "boyun",
      ]),
    []
  );

  const getOutPose = () => {
    if (!fit) return null;
    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    // ✅ senin eski “tam karşı” mantığı: target ve pos aynı sistem
    const target = new THREE.Vector3(cx, cy + r * 0.15, cz);
    const pos = new THREE.Vector3(cx, cy + r * 0.35, cz + r * 2.6);
    return { target, pos, dist: r * 2.6 };
  };

  const getHeadPose = () => {
    if (!fit) return null;
    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    // ✅ yüze daha çok yaklaşsın (sen istedin)
    const target = new THREE.Vector3(cx, cy + r * 0.62, cz);
    const pos = new THREE.Vector3(cx, cy + r * 0.70, cz + r * 0.72);
    return { target, pos };
  };

  const applyOutPoseOnce = () => {
    const cam = cameraRef.current;
    const c = controlsRef.current;
    const out = getOutPose();
    if (!cam || !c || !out) return;

    c.target.copy(out.target);
    cam.position.copy(out.pos);

    cam.near = Math.max(0.01, out.dist / 200);
    cam.far = Math.max(5000, out.dist * 50);
    cam.updateProjectionMatrix();

    c.maxDistance = out.dist * 1.25;
    c.update();
  };

  useEffect(() => {
    if (!modelReady) return;
    requestAnimationFrame(() => applyOutPoseOnce());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelReady]);

  const tweenCamera = (target: THREE.Vector3, pos: THREE.Vector3, ms: number) =>
    new Promise<void>((resolve) => {
      const cam = cameraRef.current;
      const c = controlsRef.current;
      if (!cam || !c) return resolve();

      const t0 = performance.now();
      const startPos = cam.position.clone();
      const startTgt = c.target.clone();

      const step = () => {
        const t = (performance.now() - t0) / ms;
        const k = t >= 1 ? 1 : t * (2 - t);

        cam.position.lerpVectors(startPos, pos, k);
        c.target.lerpVectors(startTgt, target, k);

        cam.updateProjectionMatrix();
        c.update();

        if (k >= 1) resolve();
        else requestAnimationFrame(step);
      };

      requestAnimationFrame(step);
    });

  const autoFocusForQuestion = async (q: Question | null) => {
    if (!q) return;
    if (!fit || !controlsRef.current || !cameraRef.current) return;

    if (HEAD_KEYS.has(q.key)) {
      const head = getHeadPose();
      if (head) await tweenCamera(head.target, head.pos, 450);
    } else {
      const out = getOutPose();
      if (out) await tweenCamera(out.target, out.pos, 350);
    }
  };

  const isAccepted = (q: Question, pickedName: string) => {
    if (q.acceptNames.includes(pickedName)) return true;
    const soft = SOFT_ACCEPT[q.key];
    if (soft && soft.includes(pickedName)) return true;
    return false;
  };

  const nextQuestion = async (nextIdx: number, list: Question[]) => {
    if (nextIdx >= list.length) {
      setPhase("finished");
      setCurrentQ(null);
      canPickRef.current = false;
      setControlsEnabled(true);
      stop();
      return;
    }

    const q = list[nextIdx];
    setQIndex(nextIdx);
    setCurrentQ(q);

    // ✅ soru hazırlanırken pick kapalı + controls açık (isterse döndürsün)
    canPickRef.current = false;
    setControlsEnabled(true);

    await autoFocusForQuestion(q);

    // ✅ soruyu çal
    await play(q.audioUrl);

    // ✅ SORU BİTTİKTEN SONRA GERİ UZAKLAŞMA YOK!
    // çocuk kolay işaretlesin diye yakın konumda kalıyoruz (özellikle yüz)
    // sadece cevap beklerken controls kapatıyoruz ki tek parmak tap %100 çalışsın
    canPickRef.current = true;
    setControlsEnabled(false);
  };

  const startAssessment = async () => {
    if (!modelReady) return;

    setMode("assessment");
    setPhase("intro");
    setScore(0);
    setQIndex(0);
    setCurrentQ(null);

    const list = pickRandomN(QUESTIONS, 10);
    setQList(list);

    canPickRef.current = false;
    setControlsEnabled(true);

    setMouthEnabled(true);
    const head = getHeadPose();
    if (head) await tweenCamera(head.target, head.pos, 550);

    await play(degerlendirmeGiris);

    // intro bitince eski pozisyona dön (burası doğru)
    const out = getOutPose();
    if (out) await tweenCamera(out.target, out.pos, 500);

    setMouthEnabled(false);
    setPhase("asking");

    await nextQuestion(0, list);
  };

  const startTeaching = async () => {
    if (!modelReady) return;

    setMode("teaching");
    setPhase("intro");
    setScore(0);
    setQIndex(0);
    setQList([]);
    setCurrentQ(null);

    canPickRef.current = false;
    setControlsEnabled(true);

    setMouthEnabled(true);
    const head = getHeadPose();
    if (head) await tweenCamera(head.target, head.pos, 550);

    await play(calismaGiris);

    const out = getOutPose();
    if (out) await tweenCamera(out.target, out.pos, 500);

    setMouthEnabled(false);
    setPhase("idle");
  };

  const onMeshPick = async (obj: THREE.Object3D) => {
    const name = String(obj?.name || "unknown");
    setClickedName(name);

    if (mode === "menu") return;
    if (mode === "teaching") return;

    if (mode === "assessment") {
      if (phase !== "asking" || !currentQ) return;
      if (!canPickRef.current) return;

      canPickRef.current = false;

      const ok = isAccepted(currentQ, name);

      if (ok) {
        setScore((s) => s + 1);

        // ✅ her zaman sadece hedefi boya
        highlightByNames(scene, currentQ.acceptNames, 450, "ok");

        // ✅ doğru tıklayınca controls tekrar açılır (çocuk yeniden çevirebilir)
        setControlsEnabled(true);

        await new Promise((r) => setTimeout(r, 220));
        await nextQuestion(qIndex + 1, qList);
      } else {
        highlightByNames(scene, [name], 250, "bad");
        canPickRef.current = true;
        // yanlışta da controls kapalı kalsın ki tekrar tek parmakla rahat denesin
        setControlsEnabled(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      stop();
      if (scene) {
        scene.traverse((o: any) => {
          if (o?.isMesh) restoreOriginalMaterial(o);
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene]);

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
          onCreated={({ camera }) => {
            cameraRef.current = camera as THREE.PerspectiveCamera;
          }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          <OrbitControls makeDefault ref={controlsRef} enabled={controlsEnabled} />

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
