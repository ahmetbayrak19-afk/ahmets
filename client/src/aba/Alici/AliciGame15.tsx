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
  goz: ["Object_3_1", "mesh_20"], // 👈 göz zor seçiliyor demiştin, mesh_20 boşlukları da kabul
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
  bacak: ["Object_6", "diz"], // ✅ senin son dediğin
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
      stop();
      const a = new Audio(url);
      a.preload = "auto";
      audioRef.current = a;
      a.onended = () => resolve();
      a.play().catch(() => resolve());
    });

  return { play, stop };
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

    if (!targets.length) return;

    let raf = 0;
    const start = performance.now();

    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const v = (Math.sin(t * 10) + 1) / 2;
      targets.forEach(({ mesh, idx }) => {
        if (mesh?.morphTargetInfluences && mesh.morphTargetInfluences.length > idx) {
          mesh.morphTargetInfluences[idx] = v * 0.9; // ✅ daha belirgin
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

/* ================= HIGHLIGHT (KALICI BOYA BUG FIX) ================= */
type MatBackup = {
  material: THREE.Material | THREE.Material[];
  emissive?: THREE.Color;
  emissiveIntensity?: number;
};
function createHighlighter() {
  // mesh uuid -> backup
  const backup = new Map<string, MatBackup>();

  const restoreAll = () => {
    backup.forEach((b, uuid) => {
      // restore in traverse (uuid bulup)
      // bu restoreAll, dışarıdan scene verilince uygulanacak
    });
  };

  const highlight = (
    scene: THREE.Object3D | null,
    names: string[],
    ms: number,
    kind: "ok" | "bad"
  ) => {
    if (!scene) return;

    const meshes: THREE.Mesh[] = [];
    scene.traverse((o: any) => {
      if (!o?.isMesh) return;
      if (names.includes(o.name)) meshes.push(o);
    });
    if (!meshes.length) return;

    // önce o meshlerin eski halini backup'a al
    for (const m of meshes) {
      if (!backup.has(m.uuid)) {
        // materyal shared olabilir -> clone
        const mat = m.material as any;
        const cloned = mat?.clone ? mat.clone() : mat;
        m.material = cloned;

        const em = (cloned as any)?.emissive?.clone?.();
        backup.set(m.uuid, {
          material: cloned,
          emissive: em ?? undefined,
          emissiveIntensity: (cloned as any)?.emissiveIntensity,
        });
      }
    }

    // uygula
    for (const m of meshes) {
      const mat: any = m.material as any;
      if (mat?.emissive) {
        mat.emissive.set(kind === "ok" ? 0x22c55e : 0xef4444);
        mat.emissiveIntensity = 1.35;
      }
    }

    window.setTimeout(() => {
      // süre bitince geri koy
      for (const m of meshes) {
        const b = backup.get(m.uuid);
        if (!b) continue;
        const mat: any = m.material as any;
        if (mat?.emissive && b.emissive) {
          mat.emissive.copy(b.emissive);
          mat.emissiveIntensity = b.emissiveIntensity ?? mat.emissiveIntensity;
        }
      }
    }, ms);
  };

  const restoreScene = (scene: THREE.Object3D | null) => {
    if (!scene) return;
    scene.traverse((o: any) => {
      if (!o?.isMesh) return;
      const b = backup.get(o.uuid);
      if (!b) return;
      // material zaten clone’du; emissive’i geri koymak yeterli
      const mat: any = o.material as any;
      if (mat?.emissive && b.emissive) {
        mat.emissive.copy(b.emissive);
        mat.emissiveIntensity = b.emissiveIntensity ?? mat.emissiveIntensity;
      }
    });
  };

  const clear = () => {
    backup.clear();
  };

  return { highlight, restoreScene, clear };
}

/* ================= MODEL (fit + scene ref + pick) ================= */
function Model({
  onMeshPick,
  onLoaded,
  setSceneRef,
  setClickedName,
  canPickRef,
  dragRef,
}: {
  onMeshPick: (mesh: THREE.Object3D) => void;
  onLoaded: (fit: FitInfo) => void;
  setSceneRef: (scene: THREE.Object3D | null) => void;
  setClickedName: (s: string) => void;
  canPickRef: React.MutableRefObject<boolean>;
  dragRef: React.MutableRefObject<{ down: boolean; moved: boolean; x: number; y: number }>;
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

  // ✅ drag tespiti: kaydırıyorsa seçim sayma
  const onDown = (e: any) => {
    e.stopPropagation();
    dragRef.current.down = true;
    dragRef.current.moved = false;
    dragRef.current.x = e.clientX ?? 0;
    dragRef.current.y = e.clientY ?? 0;
  };
  const onMove = (e: any) => {
    if (!dragRef.current.down) return;
    const dx = Math.abs((e.clientX ?? 0) - dragRef.current.x);
    const dy = Math.abs((e.clientY ?? 0) - dragRef.current.y);
    if (dx + dy > 8) dragRef.current.moved = true;
  };
  const onUp = (e: any) => {
    e.stopPropagation();

    const obj = e?.object;
    const name =
      obj?.name || obj?.material?.name || obj?.geometry?.name || obj?.uuid || "unknown";
    setClickedName(String(name));

    // drag ise seçim yok
    if (dragRef.current.moved) {
      dragRef.current.down = false;
      return;
    }

    dragRef.current.down = false;

    if (!canPickRef.current) return;
    if (obj) onMeshPick(obj);
  };

  return (
    <group onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}>
      <primitive object={gltf.scene} />
    </group>
  );
}

/* ================= CAMERA (SENİN HESAP + ZOOM LIMIT) ================= */
function CameraFit({
  ready,
  fit,
  controlsRef,
}: {
  ready: boolean;
  fit: FitInfo | null;
  controlsRef: React.MutableRefObject<any>;
}) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!ready || !fit) return;

    let cancelled = false;

    const apply = (tries: number) => {
      if (cancelled) return;

      const c: any = controlsRef.current || controls;
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
  }, [ready, fit, camera, controls, controlsRef]);

  return null;
}

/* ================= MAIN ================= */
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const { play, stop } = useSingleAudio();

  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [fit, setFit] = useState<FitInfo | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [fatalError, setFatalError] = useState(false);

  const [mode, setMode] = useState<Mode>("menu");
  const [phase, setPhase] = useState<"idle" | "intro" | "asking" | "finished">("idle");

  const [score, setScore] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [qList, setQList] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);

  const [mouthEnabled, setMouthEnabled] = useState(false);
  useMouthTalk(scene, mouthEnabled);

  // ✅ seçim açık/kapalı
  const canPickRef = useRef(false);

  // ✅ drag tespiti
  const dragRef = useRef({ down: false, moved: false, x: 0, y: 0 });

  // ✅ highlight cache (kalıcı boya bug fix)
  const highlighterRef = useRef(createHighlighter());

  // component kapanınca her şeyi temizle
  useEffect(() => {
    return () => {
      stop();
      highlighterRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Kamera head zoom (intro) =====
  const tweenCamera = (toTarget: THREE.Vector3, toPos: THREE.Vector3, ms = 650) => {
    const cam = cameraRef.current;
    const c = controlsRef.current;
    if (!cam || !c) return Promise.resolve();

    const fromTarget = c.target.clone();
    const fromPos = cam.position.clone();

    const start = performance.now();

    return new Promise<void>((resolve) => {
      const tick = () => {
        const t = (performance.now() - start) / ms;
        const k = t >= 1 ? 1 : t;

        // smoothstep
        const s = k * k * (3 - 2 * k);

        c.target.lerpVectors(fromTarget, toTarget, s);
        cam.position.lerpVectors(fromPos, toPos, s);

        cam.updateProjectionMatrix();
        c.update();

        if (k >= 1) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  const getOutPose = () => {
    const c = controlsRef.current;
    if (!fit || !c) return null;
    const [cx, cy, cz] = fit.center;
    const r = fit.radius;
    const target = new THREE.Vector3(cx, cy + r * 0.15, cz);
    const pos = new THREE.Vector3(cx, cy + r * 0.35, cz + r * 2.6);
    return { target, pos };
  };

  const getHeadPose = () => {
    const c = controlsRef.current;
    if (!fit || !c) return null;
    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    // ✅ “Kafaya daha çok yaklaşsın” dediğin için biraz daha yaklaştırdım
    const target = new THREE.Vector3(cx, cy + r * 0.55, cz);
    const pos = new THREE.Vector3(cx, cy + r * 0.68, cz + r * 0.75);
    return { target, pos };
  };

  // ===== oyun akışı =====
  const nextQuestion = async (nextIdx: number, list: Question[]) => {
    if (nextIdx >= list.length) {
      setPhase("finished");
      setCurrentQ(null);
      canPickRef.current = false;
      stop();
      return;
    }

    const q = list[nextIdx];
    setQIndex(nextIdx);
    setCurrentQ(q);

    canPickRef.current = false;
    try {
      await play(q.audioUrl);
    } finally {
      canPickRef.current = true; // ✅ ses bitince çocuk seçsin
    }
  };

  const startAssessment = async () => {
    if (!modelReady || !fit || !controlsRef.current || !cameraRef.current) return;

    // önce eski highlight kalıntısı varsa temizle
    highlighterRef.current.restoreScene(scene);

    setMode("assessment");
    setPhase("intro");
    setScore(0);

    const list = pickRandomN(QUESTIONS, 10);
    setQList(list);
    setQIndex(0);
    setCurrentQ(null);

    // intro boyunca seçimi kapat
    canPickRef.current = false;

    // yüze yaklaş
    const headPose = getHeadPose();
    if (headPose) await tweenCamera(headPose.target, headPose.pos, 700);

    // intro konuşsun + ağız oynasın
    setMouthEnabled(true);
    await play(degerlendirmeGiris);
    setMouthEnabled(false);

    // geri dön
    const outPose = getOutPose();
    if (outPose) await tweenCamera(outPose.target, outPose.pos, 650);

    // sorular
    setPhase("asking");
    await nextQuestion(0, list);
  };

  const startTeaching = async () => {
    if (!modelReady) return;

    // temizle
    highlighterRef.current.restoreScene(scene);

    setMode("teaching");
    setPhase("intro");
    setScore(0);
    setQList([]);
    setQIndex(0);
    setCurrentQ(null);

    canPickRef.current = false;
    setMouthEnabled(true);
    await play(calismaGiris);
    setMouthEnabled(false);

    setPhase("idle");
    canPickRef.current = false; // öğretimde şimdilik değerlendirme yok
  };

  const onMeshPick = async (obj: THREE.Object3D) => {
    if (mode !== "assessment") return;
    if (phase !== "asking" || !currentQ) return;
    if (!canPickRef.current) return;

    const name = String(obj?.name || "unknown");

    const ok = currentQ.acceptNames.includes(name);

    if (ok) {
      canPickRef.current = false;

      setScore((s) => s + 1);
      highlighterRef.current.highlight(scene, currentQ.acceptNames, 450, "ok");

      await new Promise((r) => setTimeout(r, 220));
      await nextQuestion(qIndex + 1, qList);
    } else {
      // yanlış: sadece tıklananı yak
      highlighterRef.current.highlight(scene, [name], 250, "bad");
      // aynı soruda kal, tekrar seçebilir
      canPickRef.current = true;
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => {
            stop();
            // highlight reset (boyalı kalma fix)
            highlighterRef.current.restoreScene(scene);
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
          onCreated={({ camera }) => {
            cameraRef.current = camera as THREE.PerspectiveCamera;
          }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          <OrbitControls makeDefault ref={controlsRef} />

          {/* SENİN başlangıç kamera/target + zoom-out sınırı */}
          <CameraFit ready={modelReady} fit={fit} controlsRef={controlsRef} />

          <Suspense fallback={<Loader />}>
            <Model
              onMeshPick={onMeshPick}
              setSceneRef={(s) => setScene(s)}
              setClickedName={setClickedName}
              canPickRef={canPickRef}
              dragRef={dragRef}
              onLoaded={(f) => {
                setFit(f);
                setModelReady(true);
              }}
            />
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
