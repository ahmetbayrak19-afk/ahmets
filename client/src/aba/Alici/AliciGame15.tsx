// ==========================
// ALICI GAME 15 – FINAL
// ==========================
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";
import * as THREE from "three";

/* ---------------- MODEL ---------------- */
const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

/* ---------------- MP3 ---------------- */
import calismaGiris from "./calismagiris.mp3";
import degerlendirmeGiris from "./degerlendirmegiris.mp3";
import kolNerede from "./kolnerede.mp3";
import gozNerede from "./goznerede.mp3";
// (diğer mp3’ler sende olduğu gibi duruyor)

/* ---------------- TYPES ---------------- */
type FitInfo = {
  center: [number, number, number];
  radius: number;
};

type Mode = "menu" | "teaching" | "assessment";

type Question = {
  label: string;
  audioUrl: string;
  acceptNames: string[];
};

/* ---------------- ACCEPT ---------------- */
const ACCEPT = {
  kol: ["Object_0001", "Object_0001_1"],
  goz: ["Object_3_1", "yanak", "kas"], // kolaylaştırdık
};

/* ---------------- QUESTIONS ---------------- */
const QUESTIONS: Question[] = [
  { label: "Kol", audioUrl: kolNerede, acceptNames: ACCEPT.kol },
  { label: "Göz", audioUrl: gozNerede, acceptNames: ACCEPT.goz },
];

/* ---------------- AUDIO ---------------- */
function useSingleAudio() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const stop = () => {
    if (ref.current) {
      ref.current.pause();
      ref.current.currentTime = 0;
      ref.current = null;
    }
  };
  const play = (url: string) =>
    new Promise<void>((resolve) => {
      stop();
      const a = new Audio(url);
      a.onended = () => resolve();
      ref.current = a;
      a.play().catch(() => resolve());
    });
  return { play, stop };
}

/* ---------------- MOUTH ---------------- */
function useMouthTalk(scene: THREE.Object3D | null, enabled: boolean) {
  useEffect(() => {
    if (!scene || !enabled) return;

    const targets: any[] = [];
    scene.traverse((o: any) => {
      if (o.isMesh && o.morphTargetDictionary?.Mouth_Open !== undefined) {
        targets.push({
          mesh: o,
          idx: o.morphTargetDictionary.Mouth_Open,
        });
      }
    });

    let raf = 0;
    const tick = () => {
      const v = (Math.sin(performance.now() / 120) + 1) / 2;
      targets.forEach(({ mesh, idx }) => {
        mesh.morphTargetInfluences[idx] = v * 0.9;
      });
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      targets.forEach(({ mesh, idx }) => (mesh.morphTargetInfluences[idx] = 0));
    };
  }, [scene, enabled]);
}

/* ---------------- MODEL ---------------- */
function Model({
  onPick,
  onLoaded,
  setScene,
}: {
  onPick: (obj: THREE.Object3D) => void;
  onLoaded: (fit: FitInfo) => void;
  setScene: (s: THREE.Object3D) => void;
}) {
  const gltf = useGLTF(MODEL_PATH) as any;

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    return {
      center: [sphere.center.x, sphere.center.y, sphere.center.z] as any,
      radius: sphere.radius,
    };
  }, [gltf]);

  useEffect(() => {
    onLoaded(fit);
    setScene(gltf.scene);
  }, [fit]);

  return (
    <group
      onPointerUp={(e) => {
        if (e.delta < 5) onPick(e.object); // ✅ DRAG vs TAP
      }}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

/* ---------------- CAMERA ---------------- */
function CameraFit({
  fit,
  zoomToFace,
}: {
  fit: FitInfo | null;
  zoomToFace: boolean;
}) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!fit || !controls) return;
    const c: any = controls;
    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    if (zoomToFace) {
      camera.position.set(cx, cy + r * 0.6, cz + r * 1.1);
    } else {
      camera.position.set(cx, cy + r * 0.35, cz + r * 2.6);
    }
    c.target.set(cx, cy + r * 0.3, cz);
    c.maxDistance = r * 3;
    camera.updateProjectionMatrix();
    c.update();
  }, [fit, zoomToFace]);

  return null;
}

/* ---------------- MAIN ---------------- */
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const { play, stop } = useSingleAudio();

  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [fit, setFit] = useState<FitInfo | null>(null);

  const [mode, setMode] = useState<Mode>("menu");
  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);

  const [mouth, setMouth] = useState(false);
  const [zoomFace, setZoomFace] = useState(false);

  useMouthTalk(scene, mouth);

  const startAssessment = async () => {
    setMode("assessment");
    setScore(0);

    setZoomFace(true);
    setMouth(true);
    await play(degerlendirmeGiris);
    setMouth(false);
    setZoomFace(false);

    setQuestion(QUESTIONS[0]);
    await play(QUESTIONS[0].audioUrl);
  };

  const onPick = async (obj: THREE.Object3D) => {
    if (!question) return;
    const ok = question.acceptNames.includes(obj.name);
    if (ok) {
      setScore((s) => s + 1);
      setQuestion(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900">
      <button onClick={onClose} className="absolute top-4 left-4 z-10 text-white">
        <ArrowLeft />
      </button>

      {mode === "menu" && (
        <button
          onClick={startAssessment}
          className="absolute top-4 right-4 z-10 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Değerlendirme
        </button>
      )}

      <Canvas>
        <ambientLight intensity={0.8} />
        <Environment preset="city" />
        <OrbitControls makeDefault />
        <CameraFit fit={fit} zoomToFace={zoomFace} />

        <Suspense fallback={null}>
          <Model onPick={onPick} onLoaded={setFit} setScene={setScene} />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-6 w-full text-center text-white">
        <div className="text-sm">Puan: {score}</div>
        <div className="text-xl font-bold">{question?.label}</div>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
