import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";
import * as THREE from "three";

const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

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

/* 🔥 SADECE EKLENEN BÖLÜM: AĞIZ 3 SN OYNASIN 🔥 */
function MouthIntroPlay({ scene }: { scene: any }) {
  useEffect(() => {
    if (!scene) return;

    const mouths: { mesh: any; index: number }[] = [];

    scene.traverse((o: any) => {
      if (o.isMesh && o.morphTargetDictionary?.Mouth_Open !== undefined) {
        mouths.push({
          mesh: o,
          index: o.morphTargetDictionary.Mouth_Open,
        });
      }
    });

    if (mouths.length === 0) return;

    let start = performance.now();
    let raf = 0;

    const tick = () => {
      const t = (performance.now() - start) / 1000;
      if (t <= 3) {
        const v = (Math.sin(t * 8) + 1) / 2;
        mouths.forEach(({ mesh, index }) => {
          mesh.morphTargetInfluences[index] = v * 0.4;
        });
        raf = requestAnimationFrame(tick);
      } else {
        mouths.forEach(({ mesh, index }) => {
          mesh.morphTargetInfluences[index] = 0;
        });
      }
    };

    tick();
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  return null;
}

type FitInfo = {
  center: [number, number, number];
  radius: number;
  meshes: number;
};

function Model({
  onPartClick,
  onLoaded,
}: {
  onPartClick: (name: string) => void;
  onLoaded: (fit: FitInfo) => void;
}) {
  const gltf = useGLTF(MODEL_PATH) as any;

  const fit = useMemo<FitInfo>(() => {
    const scene = gltf?.scene;
    if (!scene) return { center: [0, 0, 0], radius: 1, meshes: 0 };

    let meshes = 0;
    scene.traverse?.((o: any) => o.isMesh && meshes++);

    const box = new THREE.Box3().setFromObject(scene);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    const r =
      Number.isFinite(sphere.radius) && sphere.radius > 0 ? sphere.radius : 1;

    return {
      center: [sphere.center.x, sphere.center.y, sphere.center.z],
      radius: r,
      meshes,
    };
  }, [gltf]);

  useEffect(() => {
    onLoaded(fit);
  }, [fit]);

  return (
    <group
      onPointerDown={(e: any) => {
        e.stopPropagation();
        const o = e.object;
        onPartClick(
          o?.name || o?.material?.name || o?.geometry?.name || "unknown"
        );
      }}
    >
      <primitive object={gltf.scene} />
      {/* 👇 AĞIZ INTRO BURADA */}
      <MouthIntroPlay scene={gltf.scene} />
    </group>
  );
}

function CameraFit({ ready, fit }: { ready: boolean; fit: FitInfo | null }) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!ready || !fit || !controls) return;

    const c: any = controls;
    const [cx, cy, cz] = fit.center;
    const r = fit.radius;

    c.target.set(cx, cy + r * 0.15, cz);
    const dist = r * 2.6;
    camera.position.set(cx, cy + r * 0.35, cz + dist);

    c.maxDistance = dist * 1.25;
    camera.updateProjectionMatrix();
    c.update();
  }, [ready, fit, camera, controls]);

  return null;
}

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [fit, setFit] = useState<FitInfo | null>(null);
  const [ready, setReady] = useState(false);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={onClose}
          className="p-3 bg-slate-800/80 rounded-full text-white"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400">
        <Canvas camera={{ fov: 50, near: 0.01, far: 5000 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />
          <OrbitControls makeDefault />
          <CameraFit ready={ready} fit={fit} />

          <Suspense fallback={<Loader />}>
            <Model
              onPartClick={setClickedName}
              onLoaded={(f) => {
                setFit(f);
                setReady(true);
              }}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute bottom-8 w-full flex justify-center pointer-events-none px-4">
        <div className="bg-blue-600/90 text-white w-full max-w-md py-4 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <MousePointer2 size={16} />
            <span className="font-bold text-xs uppercase">Tespit Edilen Bölge</span>
          </div>
          <p className="font-mono text-xl font-bold truncate">{clickedName}</p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
