import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { ArrowLeft } from "lucide-react";

const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media";

const INTRO_AUDIO = "/calismagiris.mp3";

const PART_MAP: Record<string, string[]> = {
  bacak: ["Object_6", "diz"],
  diz: ["diz"],
  göz: ["Object_3_1"],
  yanak: ["yanak"],
  burun: ["burun"],
};

const IGNORE_MESHES = ["mesh_20"];

function Loader() {
  return (
    <Html center>
      <div className="bg-white p-4 rounded-xl shadow">
        Yükleniyor…
      </div>
    </Html>
  );
}

/* ===================== MODEL ===================== */
function Model({ onSelect, allowSelect }: any) {
  const { scene } = useGLTF(MODEL_PATH);

  return (
    <primitive
      object={scene}
      onPointerDown={(e: any) => {
        if (!allowSelect.current) return;
        e.stopPropagation();

        const name = e.object?.name;
        if (!name || IGNORE_MESHES.includes(name)) return;

        onSelect(name);
      }}
    />
  );
}

/* ===================== AĞIZ ===================== */
function MouthControl({ scene, talking }: any) {
  useFrame(() => {
    scene?.traverse((o: any) => {
      if (!o.isMesh || !o.morphTargetInfluences) return;
      Object.entries(o.morphTargetDictionary || {}).forEach(([k, i]: any) => {
        if (k === "agiz_1" || k === "agiz_2") {
          o.morphTargetInfluences[i] = talking ? 0.6 : 0;
        }
      });
    });
  });
  return null;
}

/* ===================== KAMERA ===================== */
function CameraIntro({ play }: any) {
  const { camera, controls } = useThree();
  const startPos = useRef<THREE.Vector3 | null>(null);

  useEffect(() => {
    if (!controls) return;
    if (!startPos.current) startPos.current = camera.position.clone();

    if (play) {
      camera.position.z -= 1.2;
    } else if (startPos.current) {
      camera.position.copy(startPos.current);
    }
    controls.update();
  }, [play]);

  return null;
}

/* ===================== ANA ===================== */
export default function AliciGame15({ onClose }: any) {
  const [highlight, setHighlight] = useState<string | null>(null);
  const [introPlaying, setIntroPlaying] = useState(true);
  const allowSelect = useRef(false);

  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audio.current = new Audio(INTRO_AUDIO);
    audio.current.onended = () => {
      setIntroPlaying(false);
      allowSelect.current = true;
    };
    audio.current.play();
  }, []);

  const handleSelect = (name: string) => {
    setHighlight(null);
    setTimeout(() => setHighlight(name), 0);
  };

  return (
    <div className="fixed inset-0 bg-slate-900">
      <button onClick={onClose} className="absolute top-4 left-4 z-10 text-white">
        <ArrowLeft />
      </button>

      <Canvas camera={{ position: [0, 1.6, 4] }}>
        <ambientLight intensity={0.8} />
        <Environment preset="city" />
        <OrbitControls />

        <CameraIntro play={introPlaying} />

        <Suspense fallback={<Loader />}>
          <Model onSelect={handleSelect} allowSelect={allowSelect} />
          <MouthControl scene={useGLTF(MODEL_PATH).scene} talking={introPlaying} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
