import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
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
type Phase = "idle" | "intro" | "asking" | "finished";

type Question = {
  key: string;
  label: string;
  audioUrl: string;
  acceptNames: string[];
  highlightNames?: string[]; // sadece boyanacak meshler (opsiyonel)
};

/* ================= ACCEPT MAP ================= */
/**
 * ⚠️ Senin son dediğin kurallar:
 * - GÖZ sorusunda: mesh_20 + kas + Object_3_1 kabul; ama SADECE göz boyansın => highlightNames: ["Object_3_1"]
 * - KAŞ sorusunda: kas + Object_3_1 + alin kabul; ama SADECE kaş boyansın => highlightNames: ["kas"]
 * - Bacak: Object_6 + diz kabul
 */
const ACCEPT = {
  kol: ["Object_0001_1", "Object_0001"],
  el: ["Object_0002", "Object_0002_1", "Object_0006", "Object_0006_1"],
  sac: ["sac"],
  alin: ["alin"],
  burun: ["burun"],
  kas: ["kas", "Object_3_1", "alin"], // ✅ kabul geniş
  goz: ["mesh_20", "kas", "Object_3_1"], // ✅ kabul geniş
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
  bacak: ["Object_6", "diz"], // ✅ güncel
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

  // ✅ kaş: kabul geniş, boya dar
  {
    key: "kas",
    label: "Kaş",
    audioUrl: kasNerede,
    acceptNames: ACCEPT.kas,
    highlightNames: ["kas"],
  },

  // ✅ göz: kabul geniş, boya dar
  {
    key: "goz",
    label: "Göz",
    audioUrl: gozNerede,
    acceptNames: ACCEPT.goz,
    highlightNames: ["Object_3_1"],
  },

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

function isFaceKey(key: string) {
  return (
    key === "sac" ||
    key === "alin" ||
    key === "burun" ||
    key === "kas" ||
    key === "goz" ||
    key === "yanak" ||
    key === "kulak" ||
    key === "agiz" ||
    key === "cene" ||
    key === "ense" ||
    key === "kafa"
  );
}

/* ================= AUDIO ================= */
function useSingleAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  const play = useCallback(
    (url: string) =>
      new Promise<void>((resolve) => {
        stop();
        const a = new Audio(url);
        a.preload = "auto";
        audioRef.current = a;
        a.onended = () => resolve();
        a.onerror = () => resolve();
        a.play().catch(() => resolve());
      }),
    [stop]
  );

  return { play, stop };
}

/* ================= MOUTH SHAPE KEY ================= */
function useMouthTalk(scene: THREE.Object3D | null, enabled: boolean, strength = 0.95) {
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

/* ================= HIGHLIGHT (NO STICKY) ================= */
function useHighlighter(scene: THREE.Object3D | null) {
  const originalMap = useRef(
    new Map<
      string,
      { mat: any; emissive: THREE.Color | null; emissiveIntensity: number; timeoutId?: number }
    >()
  );

  const restoreAll = useCallback(() => {
    originalMap.current.forEach((v) => {
      if (v.timeoutId) window.clearTimeout(v.timeoutId);
      if (v.mat?.emissive && v.emissive) {
        v.mat.emissive.copy(v.emissive);
        v.mat.emissiveIntensity = v.emissiveIntensity;
      }
    });
    originalMap.current.clear();
  }, []);

  useEffect(() => restoreAll, [restoreAll]);

  const flash = useCallback(
    (names: string[], ms: number, kind: "ok" | "bad") => {
      if (!scene) return;

      const picked: THREE.Mesh[] = [];
      scene.traverse((o: any) => {
        if (!o?.isMesh) return;
        if (names.includes(o.name)) picked.push(o);
      });

      if (picked.length === 0) return;

      picked.forEach((mesh) => {
        const uuid = mesh.uuid;

        // önce varsa restore timeout iptal
        const prev = originalMap.current.get(uuid);
        if (prev?.timeoutId) window.clearTimeout(prev.timeoutId);

        // material clone (shared olmasın)
        const mat = (mesh.material as any) || null;
        const cloned = mat?.clone ? mat.clone() : mat;
        mesh.material = cloned;

        const emissiveBackup =
          cloned?.emissive?.clone?.() ? (cloned.emissive.clone() as THREE.Color) : null;
        const intensityBackup = typeof cloned?.emissiveIntensity === "number" ? cloned.emissiveIntensity : 0;

        originalMap.current.set(uuid, {
          mat: cloned,
          emissive: emissiveBackup,
          emissiveIntensity: intensityBackup,
        });

        if (cloned?.emissive) {
          cloned.emissive.set(kind === "ok" ? 0x22c55e : 0xef4444);
          cloned.emissiveIntensity = 1.35;
        }

        const timeoutId = window.setTimeout(() => {
          const rec = originalMap.current.get(uuid);
          if (!rec) return;
          if (rec.mat?.emissive && rec.emissive) {
            rec.mat.emissive.copy(rec.emissive);
            rec.mat.emissiveIntensity = rec.emissiveIntensity;
          }
          originalMap.current.delete(uuid);
        }, ms);

        const now = originalMap.current.get(uuid);
        if (now) now.timeoutId = timeoutId;
      });
    },
    [scene]
  );

  return { flash, restoreAll };
}

/* ================= MODEL (fit + scene ref) ================= */
function Model({
  onObjectPick,
  onLoaded,
  setSceneRef,
}: {
  onObjectPick: (obj: THREE.Object3D) => void;
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
        if (e?.object) onObjectPick(e.object);
      }}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

/* ================= CAMERA (your baseline + maxDistance) ================= */
function CameraFit({
  ready,
  fit,
  controlsRef,
  baselineRef,
}: {
  ready: boolean;
  fit: FitInfo | null;
  controlsRef: React.MutableRefObject<any>;
  baselineRef: React.MutableRefObject<{
    basePos: THREE.Vector3;
    baseTarget: THREE.Vector3;
    headPos: THREE.Vector3;
    headTarget: THREE.Vector3;
    dist: number;
    inited: boolean;
  }>;
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

      // ✅ SENİN BAŞLANGIÇ HESABIN (DOKUNMADIM)
      const baseTarget = new THREE.Vector3(cx, cy + r * 0.15, cz);
      const dist = r * 2.6;
      const basePos = new THREE.Vector3(cx, cy + r * 0.35, cz + dist);

      c.target.copy(baseTarget);
      camera.position.copy(basePos);

      camera.near = Math.max(0.01, dist / 200);
      camera.far = Math.max(5000, dist * 50);
      camera.updateProjectionMatrix();

      // ✅ zoom-out sınırı (çok küçülmesin)
      c.maxDistance = dist * 1.25;

      // (istersen yakınlaşmayı da kıs):
      // c.minDistance = dist * 0.65;

      c.update();

      // baseline + head preset (kafa daha yakın)
      const headTarget = new THREE.Vector3(cx, cy + r * 0.58, cz);
      // Kafaya yaklaşma (daha yakın ve biraz yukarı)
      const headPos = new THREE.Vector3(cx, cy + r * 0.65, cz + r * 0.95);

      baselineRef.current.basePos = basePos.clone();
      baselineRef.current.baseTarget = baseTarget.clone();
      baselineRef.current.headPos = headPos.clone();
      baselineRef.current.headTarget = headTarget.clone();
      baselineRef.current.dist = dist;
      baselineRef.current.inited = true;
    };

    requestAnimationFrame(() => apply(0));
    return () => {
      cancelled = true;
    };
  }, [ready, fit, camera, controls, controlsRef, baselineRef]);

  return null;
}

/* ================= CAMERA DIRECTOR (no lock) ================= */
function CameraDirector({
  controlsRef,
  baselineRef,
  wantHead,
  userInteractingRef,
}: {
  controlsRef: React.MutableRefObject<any>;
  baselineRef: React.MutableRefObject<{
    basePos: THREE.Vector3;
    baseTarget: THREE.Vector3;
    headPos: THREE.Vector3;
    headTarget: THREE.Vector3;
    dist: number;
    inited: boolean;
  }>;
  wantHead: boolean;
  userInteractingRef: React.MutableRefObject<boolean>;
}) {
  const { camera } = useThree();
  const tweenRef = useRef<{
    active: boolean;
    t0: number;
    dur: number;
    fromPos: THREE.Vector3;
    fromTgt: THREE.Vector3;
    toPos: THREE.Vector3;
    toTgt: THREE.Vector3;
  } | null>(null);

  const startTween = useCallback(
    (toPos: THREE.Vector3, toTgt: THREE.Vector3, dur = 420) => {
      const c: any = controlsRef.current;
      if (!c) return;

      tweenRef.current = {
        active: true,
        t0: performance.now(),
        dur,
        fromPos: camera.position.clone(),
        fromTgt: c.target.clone(),
        toPos: toPos.clone(),
        toTgt: toTgt.clone(),
      };
    },
    [camera, controlsRef]
  );

  // wantHead değişince tween başlat
  useEffect(() => {
    if (!baselineRef.current.inited) return;
    if (!controlsRef.current) return;

    const toPos = wantHead ? baselineRef.current.headPos : baselineRef.current.basePos;
    const toTgt = wantHead ? baselineRef.current.headTarget : baselineRef.current.baseTarget;

    startTween(toPos, toTgt, 420);
  }, [wantHead, baselineRef, controlsRef, startTween]);

  useFrame(() => {
    const tw = tweenRef.current;
    const c: any = controlsRef.current;
    if (!tw || !tw.active || !c) return;

    // kullanıcı dokunup çevirmeye başladıysa otomatiği bırak
    if (userInteractingRef.current) {
      tw.active = false;
      return;
    }

    const now = performance.now();
    const a = THREE.MathUtils.clamp((now - tw.t0) / tw.dur, 0, 1);
    const k = a < 1 ? 1 - Math.pow(1 - a, 3) : 1; // easeOutCubic

    camera.position.lerpVectors(tw.fromPos, tw.toPos, k);
    c.target.lerpVectors(tw.fromTgt, tw.toTgt, k);

    camera.updateProjectionMatrix();
    c.update();

    if (a >= 1) tw.active = false;
  });

  return null;
}

/* ================= MAIN ================= */
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const { play, stop } = useSingleAudio();

  const controlsRef = useRef<any>(null);
  const userInteractingRef = useRef(false);

  const baselineRef = useRef<{
    basePos: THREE.Vector3;
    baseTarget: THREE.Vector3;
    headPos: THREE.Vector3;
    headTarget: THREE.Vector3;
    dist: number;
    inited: boolean;
  }>({
    basePos: new THREE.Vector3(0, 0, 5),
    baseTarget: new THREE.Vector3(0, 1, 0),
    headPos: new THREE.Vector3(0, 1.7, 2.2),
    headTarget: new THREE.Vector3(0, 1.6, 0),
    dist: 5,
    inited: false,
  });

  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [fatalError, setFatalError] = useState(false);

  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [fit, setFit] = useState<FitInfo | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const { flash, restoreAll } = useHighlighter(scene);

  // Mod / akış
  const [mode, setMode] = useState<Mode>("menu");
  const [phase, setPhase] = useState<Phase>("idle");
  const [score, setScore] = useState(0);

  const [qList, setQList] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);

  // mouth sadece intro
  const [mouthEnabled, setMouthEnabled] = useState(false);
  useMouthTalk(scene, mouthEnabled, 0.95);

  // seçim kapısı (soru sorulduktan sonra)
  const awaitingRef = useRef(false);

  // DRAG vs TAP (çevirmek için dokununca yanlış saymasın)
  const pointerRef = useRef<{
    down: boolean;
    startX: number;
    startY: number;
    moved: boolean;
    downAt: number;
    lastObj: THREE.Object3D | null;
  }>({ down: false, startX: 0, startY: 0, moved: false, downAt: 0, lastObj: null });

  const [wantHead, setWantHead] = useState(false);

  // currentQ değişince: yüz sorusuysa yaklaş, değilse geri dön
  useEffect(() => {
    if (mode !== "assessment") return;
    if (phase !== "asking") return;
    if (!currentQ) return;

    setWantHead(isFaceKey(currentQ.key));
  }, [mode, phase, currentQ]);

  const startTeaching = async () => {
    if (!modelReady) return;

    restoreAll();
    setMode("teaching");
    setPhase("intro");
    setScore(0);
    setQList([]);
    setQIndex(0);
    setCurrentQ(null);
    awaitingRef.current = false;

    try {
      setMouthEnabled(true);
      setWantHead(true); // öğretim girişinde de yüz yakın olsun
      await play(calismaGiris);
    } finally {
      setMouthEnabled(false);
      setPhase("idle");
      setWantHead(false);
    }
  };

  const nextQuestion = async (idx: number, list: Question[]) => {
    if (idx >= list.length) {
      setPhase("finished");
      setCurrentQ(null);
      awaitingRef.current = false;
      setWantHead(false);
      stop();
      return;
    }

    const q = list[idx];
    setQIndex(idx);
    setCurrentQ(q);

    // soru çalarken de çocuk çevirebilsin; seçim sadece "tap" ile ve awaiting=true iken.
    try {
      await play(q.audioUrl);
    } finally {
      awaitingRef.current = true;
    }
  };

  const startAssessment = async () => {
    if (!modelReady) return;

    restoreAll();
    setMode("assessment");
    setPhase("intro");
    setScore(0);

    const list = pickRandomN(QUESTIONS, 10);
    setQList(list);
    setQIndex(0);
    setCurrentQ(null);
    awaitingRef.current = false;

    // intro: yaklaştır + ağız
    try {
      setWantHead(true);
      setMouthEnabled(true);
      await play(degerlendirmeGiris);
    } finally {
      setMouthEnabled(false);
    }

    // intro bitti: ilk soruya geç
    setPhase("asking");
    await nextQuestion(0, list);
  };

  const evaluatePick = useCallback(
    async (obj: THREE.Object3D) => {
      const name = String(obj?.name || "unknown");
      setClickedName(name);

      if (mode !== "assessment") return;
      if (phase !== "asking" || !currentQ) return;
      if (!awaitingRef.current) return;

      const ok = currentQ.acceptNames.includes(name);
      awaitingRef.current = false;

      const paintNames = currentQ.highlightNames?.length
        ? currentQ.highlightNames
        : currentQ.acceptNames;

      if (ok) {
        setScore((s) => s + 1);
        flash(paintNames, 520, "ok");
        await new Promise((r) => setTimeout(r, 200));
        await nextQuestion(qIndex + 1, qList);
      } else {
        flash([name], 280, "bad");
        // aynı soru devam
        awaitingRef.current = true;
      }
    },
    [mode, phase, currentQ, qIndex, qList, flash]
  );

  const onObjectPick = (obj: THREE.Object3D) => {
    // pointer down'da sadece "son objeyi" tutuyoruz (tap olursa up'ta değerlendiriyoruz)
    pointerRef.current.lastObj = obj;
  };

  const onCloseSafe = () => {
    stop();
    restoreAll();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      {/* Back */}
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={onCloseSafe}
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

      {/* Menü */}
      {mode === "menu" && (
        <div className="absolute top-4 right-4 z-30 bg-black/60 text-white p-3 rounded-xl w-[260px]">
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
        <div className="absolute top-4 right-4 z-30 bg-black/55 text-white px-3 py-2 rounded-xl text-[12px]">
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

      {/* Scene */}
      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        <Canvas
          camera={{ fov: 50, near: 0.01, far: 5000 }}
          // ✅ drag/tap ayrımı: Canvas seviyesinde pointer yakalıyoruz
          onPointerDown={(e) => {
            pointerRef.current.down = true;
            pointerRef.current.moved = false;
            pointerRef.current.downAt = performance.now();
            pointerRef.current.startX = e.clientX ?? 0;
            pointerRef.current.startY = e.clientY ?? 0;
          }}
          onPointerMove={(e) => {
            if (!pointerRef.current.down) return;
            const x = e.clientX ?? 0;
            const y = e.clientY ?? 0;
            const dx = x - pointerRef.current.startX;
            const dy = y - pointerRef.current.startY;
            const dist = Math.hypot(dx, dy);

            // ✅ çok az hareket varsa tap say, biraz hareket varsa drag say
            if (dist > 10) pointerRef.current.moved = true;
          }}
          onPointerUp={async () => {
            const wasDown = pointerRef.current.down;
            const moved = pointerRef.current.moved;
            pointerRef.current.down = false;

            if (!wasDown) return;
            if (moved) {
              // drag ise seçim yok
              pointerRef.current.lastObj = null;
              return;
            }

            const obj = pointerRef.current.lastObj;
            pointerRef.current.lastObj = null;
            if (obj) await evaluatePick(obj);
          }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          {/* OrbitControls HEP açık (kilit yok) */}
          <OrbitControls
            makeDefault
            ref={controlsRef}
            // kullanıcı etkileşimi başlayınca otomatik tween'i kesiyoruz
            onStart={() => (userInteractingRef.current = true)}
            onEnd={() => {
              // küçük bir gecikme ile serbest bırak
              window.setTimeout(() => {
                userInteractingRef.current = false;
              }, 120);
            }}
          />

          {/* Kamera baseline + zoom-out sınırı (senin hesabın) */}
          <CameraFit
            ready={modelReady}
            fit={fit}
            controlsRef={controlsRef}
            baselineRef={baselineRef}
          />

          {/* Otomatik yaklaş/geri dön (kontrol kilitlemeden) */}
          <CameraDirector
            controlsRef={controlsRef}
            baselineRef={baselineRef}
            wantHead={wantHead}
            userInteractingRef={userInteractingRef}
          />

          <Suspense fallback={<Loader />}>
            <ErrorBoundary onError={() => setFatalError(true)}>
              <Model
                onObjectPick={onObjectPick}
                setSceneRef={setScene}
                onLoaded={(f) => {
                  setFit(f);
                  setModelReady(true);
                }}
              />
            </ErrorBoundary>
          </Suspense>
        </Canvas>
      </div>

      {/* Alt bilgi */}
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

useGLTF.preload(MODEL_PATH);
