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
      stop();
      const a = new Audio(url);
      a.preload = "auto";
      audioRef.current = a;
      a.onended = () => resolve();
      a.onerror = () => resolve();
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

/* ================= MODEL (fit + scene ref) ================= */
function Model({
  onLoaded,
  setSceneRef,
}: {
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

  return <primitive object={gltf.scene} />;
}

/* ================= CAMERA FIT (SENİN BAZ) ================= */
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

      // ✅ çok küçülmesin
      c.maxDistance = dist * 1.25;

      c.update();

      // ✅ bazı ref'e kilitle (sonra buraya BİREBİR geri döneceğiz)
      onBaseCaptured(camera.position.clone(), c.target.clone(), dist);
    };

    requestAnimationFrame(() => apply(0));

    return () => {
      cancelled = true;
    };
  }, [ready, fit, camera, controlsRef, onBaseCaptured]);

  return null;
}

/* ================= MAIN ================= */
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const { play, stop } = useSingleAudio();

  const controlsRef = useRef<any>(null);

  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [fit, setFit] = useState<FitInfo | null>(null);
  const [modelReady, setModelReady] = useState(false);

  const [mode, setMode] = useState<Mode>("menu");
  const [fatalError, setFatalError] = useState(false);

  const [mouthEnabled, setMouthEnabled] = useState(false);
  useMouthTalk(scene, mouthEnabled);

  // ✅ baz kamera/target saklanacak
  const baseCamPosRef = useRef<THREE.Vector3 | null>(null);
  const baseTargetRef = useRef<THREE.Vector3 | null>(null);
  const baseDistRef = useRef<number>(0);

  const focusHead = (zoomIn: boolean) => {
    const c = controlsRef.current;
    if (!c || !fit) return;

    // baz kayıt yoksa hiç zorlamayalım
    if (!baseCamPosRef.current || !baseTargetRef.current) return;

    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    if (zoomIn) {
      // ✅ Dev modele göre: hedefi kafaya yaklaştır, kamera daha öne gelsin
      // (bacak altı yapmaz; çünkü target yukarı taşınıyor)
      const headTarget = new THREE.Vector3(cx, cy + r * 0.65, cz);
      const headCam = new THREE.Vector3(cx, cy + r * 0.75, cz + r * 1.15); // daha yakın

      c.target.copy(headTarget);
      c.object.position.copy(headCam);

      // zoom-out sınırı aynı kalsın
      c.update();
      c.object.updateProjectionMatrix?.();
      return;
    }

    // ✅ konuşma bitince baz'a BİREBİR geri dön (hesap yok!)
    c.target.copy(baseTargetRef.current);
    c.object.position.copy(baseCamPosRef.current);
    c.update();
    c.object.updateProjectionMatrix?.();
  };

  const startAssessment = async () => {
    if (!modelReady) return;

    setMode("assessment");

    // intro: yaklaş + ağız oyna + mp3
    setMouthEnabled(true);
    focusHead(true);
    await play(degerlendirmeGiris);
    focusHead(false);
    setMouthEnabled(false);

    // NOT: Soruları sonra bağlayacağız; şimdilik intro düzgün çalışsın diye burada bitiriyorum.
    // (İstersen hemen 10 soruluk akışı da bu dosyaya eklerim; ama önce kamera "tam" otursun.)
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

      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        <Canvas camera={{ fov: 50, near: 0.01, far: 5000 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          {/* ✅ Controls ref ile yönetiyoruz */}
          <OrbitControls makeDefault ref={controlsRef} />

          {/* ✅ Model yüklenince senin baz kamera oturtma + baz'ı kaydet */}
          <CameraFit
            ready={modelReady}
            fit={fit}
            controlsRef={controlsRef}
            onBaseCaptured={(camPos, target, dist) => {
              // sadece ilk kez yaz (sonraki re-render’da baz kaymasın)
              if (!baseCamPosRef.current || !baseTargetRef.current) {
                baseCamPosRef.current = camPos;
                baseTargetRef.current = target;
                baseDistRef.current = dist;
              }
            }}
          />

          <Suspense fallback={<Loader />}>
            <ErrorBoundary onError={() => setFatalError(true)}>
              <Model
                onLoaded={(f) => {
                  setFit(f);
                  setModelReady(true);
                }}
                setSceneRef={(s) => setScene(s)}
              />
            </ErrorBoundary>
          </Suspense>
        </Canvas>

        {/* ✅ test butonu */}
        <div className="absolute top-4 right-4 z-20">
          <button
            disabled={!modelReady}
            onClick={startAssessment}
            className={`px-4 py-2 rounded-xl font-semibold ${
              modelReady ? "bg-blue-600 text-white" : "bg-slate-500 text-slate-200"
            }`}
          >
            Değerlendirme Başla (Intro)
          </button>
        </div>
      </div>
    </div>
  );
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

useGLTF.preload(MODEL_PATH);
