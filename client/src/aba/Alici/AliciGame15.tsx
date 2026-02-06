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
      if (o.isMesh && o.morphTargetDictionary?.Mouth_Open !== undefined) {
        targets.push({ mesh: o, idx: o.morphTargetDictionary.Mouth_Open });
      }
    });

    let raf = 0;
    const start = performance.now();

    const tick = () => {
      const t = (performance.now() - start) / 1000;
      const v = (Math.sin(t * 10) + 1) / 2;
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

/* ================= MAIN ================= */
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const { play, stop } = useSingleAudio();

  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);

  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [fit, setFit] = useState<FitInfo | null>(null);
  const [mode, setMode] = useState<Mode>("menu");
  const [mouthEnabled, setMouthEnabled] = useState(false);

  useMouthTalk(scene, mouthEnabled);

  const focusHead = (zoomIn: boolean) => {
    if (!cameraRef.current || !controlsRef.current || !fit) return;

    const cam = cameraRef.current;
    const c = controlsRef.current;
    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    if (zoomIn) {
      c.target.set(cx, cy + r * 0.5, cz);
      cam.position.set(cx, cy + r * 0.6, cz + r * 0.9);
    } else {
      c.target.set(cx, cy + r * 0.15, cz);
      cam.position.set(cx, cy + r * 0.35, cz + r * 2.6);
    }

    cam.updateProjectionMatrix();
    c.update();
  };

  const startAssessment = async () => {
    setMode("assessment");
    setMouthEnabled(true);
    focusHead(true);
    await play(degerlendirmeGiris);
    focusHead(false);
    setMouthEnabled(false);
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
        <Suspense fallback={null}>
          <primitive
            object={useGLTF(MODEL_PATH).scene}
            onUpdate={(o: any) => setScene(o)}
          />
        </Suspense>
      </Canvas>

      <button
        onClick={startAssessment}
        className="absolute top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-xl"
      >
        Değerlendirme Başla
      </button>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
