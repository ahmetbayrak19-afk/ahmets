import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2 } from "lucide-react";
import * as THREE from "three";

const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media";

function Loader() {
  return (
    <Html center>
      <div className="bg-white p-4 rounded-xl shadow">
        Model yükleniyor…
      </div>
    </Html>
  );
}

/* 🔥 SHAPE KEY DUMP + OYNAT */
function MorphDebugAndPlay({ scene }: { scene: any }) {
  useEffect(() => {
    if (!scene) return;

    console.log("=== MORPH DEBUG BAŞLADI ===");

    const morphMeshes: any[] = [];

    scene.traverse((o: any) => {
      if (o.isMesh) {
        console.log("MESH:", o.name);
        console.log("  morphDict:", o.morphTargetDictionary);
        console.log("  morphInfluences:", o.morphTargetInfluences);

        if (
          o.morphTargetInfluences &&
          o.morphTargetInfluences.length > 0
        ) {
          morphMeshes.push(o);
        }
      }
    });

    console.log("TOPLAM MORPH MESH:", morphMeshes.length);
    console.log("=== MORPH DEBUG BİTTİ ===");

    if (morphMeshes.length === 0) return;

    let start = performance.now();
    let raf = 0;

    const animate = () => {
      const t = (performance.now() - start) / 1000;

      const v = (Math.sin(t * 6) + 1) / 2; // 0–1

      morphMeshes.forEach((m) => {
        for (let i = 0; i < m.morphTargetInfluences.length; i++) {
          m.morphTargetInfluences[i] = v * 0.6;
        }
      });

      raf = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(raf);
  }, [scene]);

  return null;
}

type FitInfo = {
  center: [number, number, number];
  radius: number;
};

function Model({
  onPartClick,
  onLoaded,
}: {
  onPartClick: (n: string) => void;
  onLoaded: (f: FitInfo) => void;
}) {
  const gltf = useGLTF(MODEL_PATH) as any;

  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    return {
      center: [sphere.center.x, sphere.center.y, sphere.center.z] as any,
      radius: sphere.radius || 1,
    };
  }, [gltf]);

  useEffect(() => {
    onLoaded(fit);
  }, [fit]);

  return (
    <group
      onPointerDown={(e: any) => {
        e.stopPropagation();
        onPartClick(e.object?.name || "unknown");
      }}
    >
      <primitive object={gltf.scene} />
      {/* 🔥 BURASI ÖNEMLİ */}
      <MorphDebugAndPlay scene={gltf.scene} />
    </group>
  );
}

function CameraFit({ ready, fit }: { ready: boolean; fit: FitInfo | null }) {
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!ready || !fit || !controls) return;
    const c: any = controls;

    const [cx, cy, cz] = fit.center;
    const dist = fit.radius * 2.6;

    c.target.set(cx, cy + fit.radius * 0.15, cz);
    camera.position.set(cx, cy + fit.radius * 0.35, cz + dist);
    c.maxDistance = dist * 1.25;

    camera.updateProjectionMatrix();
    c.update();
  }, [ready, fit]);

  return null;
}

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clicked, setClicked] = useState("Bir yere dokun…");
  const [fit, setFit] = useState<FitInfo | null>(null);
  const [ready, setReady] = useState(false);

  return (
    <div className="fixed inset-0 bg-slate-900">
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-black/70 text-white rounded-full"
        >
          <ArrowLeft />
        </button>
      </div>

      <Canvas camera={{ fov: 50, near: 0.01, far: 5000 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.1} />
        <Environment preset="city" />
        <OrbitControls makeDefault />
        <CameraFit ready={ready} fit={fit} />

        <Suspense fallback={<Loader />}>
          <Model
            onPartClick={setClicked}
            onLoaded={(f) => {
              setFit(f);
              setReady(true);
            }}
          />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-6 w-full flex justify-center pointer-events-none">
        <div className="bg-blue-600 text-white px-6 py-3 rounded-xl">
          <div className="text-xs opacity-80 flex items-center gap-2">
            <MousePointer2 size={14} /> Tespit edilen bölge
          </div>
          <div className="font-mono text-lg">{clicked}</div>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
