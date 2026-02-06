import React, {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { ArrowLeft, MousePointer2 } from "lucide-react";
import * as THREE from "three";

/* ================= MODEL ================= */
const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

/* ================= MP3 ================= */
import degerlendirmeGiris from "./degerlendirmegiris.mp3";
import kolNerede from "./kolnerede.mp3";
import gozNerede from "./goznerede.mp3";
import kafaNerede from "./kafanerede.mp3";

/* ================= TYPES ================= */
type FitInfo = {
  center: [number, number, number];
  radius: number;
};

type Question = {
  label: string;
  audio: string;
  accept: string[];
};

/* ================= QUESTIONS ================= */
const QUESTIONS: Question[] = [
  { label: "Kol", audio: kolNerede, accept: ["Object_0001", "Object_0001_1"] },
  { label: "Göz", audio: gozNerede, accept: ["Object_3_1"] },
  {
    label: "Kafa",
    audio: kafaNerede,
    accept: ["mesh_20", "sac", "alin", "burun", "kas"],
  },
];

/* ================= AUDIO ================= */
function useSingleAudio() {
  const ref = useRef<HTMLAudioElement | null>(null);

  const play = (url: string) =>
    new Promise<void>((resolve) => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
      const a = new Audio(url);
      ref.current = a;
      a.onended = () => resolve();
      a.play().catch(() => resolve());
    });

  const stop = () => {
    if (ref.current) {
      ref.current.pause();
      ref.current.currentTime = 0;
    }
  };

  return { play, stop };
}

/* ================= MOUTH ================= */
function useMouthTalk(scene: THREE.Object3D | null, enabled: boolean) {
  useEffect(() => {
    if (!scene || !enabled) return;

    const targets: { mesh: any; idx: number }[] = [];
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
      const v = (Math.sin(performance.now() * 0.01) + 1) / 2;
      targets.forEach(({ mesh, idx }) => {
        mesh.morphTargetInfluences[idx] = v * 0.9;
      });
      raf = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(raf);
      targets.forEach(({ mesh, idx }) => {
        mesh.morphTargetInfluences[idx] = 0;
      });
    };
  }, [scene, enabled]);
}

/* ================= CAMERA FIT (1 KERE) ================= */
function CameraFit({
  fit,
  controlsRef,
  onBase,
}: {
  fit: FitInfo | null;
  controlsRef: any;
  onBase: (p: THREE.Vector3, t: THREE.Vector3) => void;
}) {
  const { camera } = useThree();
  const done = useRef(false);

  useEffect(() => {
    if (!fit || done.current) return;
    const c = controlsRef.current;
    if (!c) return;

    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    c.target.set(cx, cy + r * 0.15, cz);
    camera.position.set(cx, cy + r * 0.35, cz + r * 2.6);
    camera.updateProjectionMatrix();
    c.update();

    onBase(camera.position.clone(), c.target.clone());
    done.current = true;
  }, [fit, camera, controlsRef, onBase]);

  return null;
}

/* ================= MAIN ================= */
export default function AliciGame15() {
  const { play } = useSingleAudio();

  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [fit, setFit] = useState<FitInfo | null>(null);

  const [baseCam, setBaseCam] = useState<{
    pos: THREE.Vector3;
    target: THREE.Vector3;
  } | null>(null);

  const [mouth, setMouth] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [current, setCurrent] = useState<Question | null>(null);

  useMouthTalk(scene, mouth);

  const focusHead = (inOut: "in" | "out") => {
    if (!cameraRef.current || !controlsRef.current || !fit || !baseCam)
      return;

    const cam = cameraRef.current;
    const c = controlsRef.current;
    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    if (inOut === "in") {
      c.target.set(cx, cy + r * 0.55, cz);
      cam.position.set(cx, cy + r * 0.6, cz + r * 0.9);
    } else {
      cam.position.copy(baseCam.pos);
      c.target.copy(baseCam.target);
    }

    cam.updateProjectionMatrix();
    c.update();
  };

  const startAssessment = async () => {
    setMouth(true);
    focusHead("in");
    await play(degerlendirmeGiris);
    setMouth(false);
    focusHead("out");

    const q = QUESTIONS[0];
    setCurrent(q);
    await play(q.audio);
  };

  return (
    <div className="fixed inset-0 bg-slate-900">
      <Canvas
        camera={{ fov: 50, near: 0.01, far: 5000 }}
        onCreated={({ camera }) => (cameraRef.current = camera)}
      >
        <ambientLight intensity={0.8} />
        <Environment preset="city" />
        <OrbitControls makeDefault ref={controlsRef} />

        {fit && (
          <CameraFit
            fit={fit}
            controlsRef={controlsRef}
            onBase={(p, t) => setBaseCam({ pos: p, target: t })}
          />
        )}

        <Suspense fallback={null}>
          <Model
            onScene={(s, f) => {
              setScene(s);
              setFit(f);
            }}
          />
        </Suspense>
      </Canvas>

      <button
        onClick={startAssessment}
        className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-xl"
      >
        Değerlendirme Başla
      </button>

      {current && (
        <div className="absolute bottom-6 w-full flex justify-center">
          <div className="bg-blue-600 text-white px-6 py-3 rounded-xl flex gap-2">
            <MousePointer2 size={18} />
            Şimdi: <b>{current.label}</b>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= MODEL ================= */
function Model({
  onScene,
}: {
  onScene: (scene: THREE.Object3D, fit: FitInfo) => void;
}) {
  const gltf = useGLTF(MODEL_PATH) as any;

  const fit = useMemo<FitInfo>(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    return {
      center: [sphere.center.x, sphere.center.y, sphere.center.z],
      radius: sphere.radius,
    };
  }, [gltf]);

  useEffect(() => {
    onScene(gltf.scene, fit);
  }, [gltf, fit, onScene]);

  return <primitive object={gltf.scene} />;
}

useGLTF.preload(MODEL_PATH);
