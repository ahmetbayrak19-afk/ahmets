import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { ArrowLeft, MousePointer2 } from "lucide-react";
import * as THREE from "three";

const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

/* ---------------- LOADER ---------------- */
function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center bg-white/90 p-4 rounded-xl shadow-xl">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-800 font-bold text-sm">Model Yükleniyor…</p>
      </div>
    </Html>
  );
}

/* ---------------- MODEL ---------------- */
function Model({ onPartClick }: { onPartClick: (name: string) => void }) {
  const gltf = useGLTF(MODEL_PATH) as any;

  return (
    <group
      onPointerDown={(e: any) => {
        e.stopPropagation();
        const o = e.object;
        onPartClick(o?.name || "bilinmeyen");
      }}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

/* ---------------- MAIN ---------------- */
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const controlsRef = useRef<any>(null);
  const fittedRef = useRef(false);

  /* 🔥 ASIL OLAY BURASI */
  const fitCameraToModel = () => {
    const controls = controlsRef.current;
    if (!controls || fittedRef.current) return;

    const camera = controls.object as THREE.PerspectiveCamera;
    const target = new THREE.Vector3();

    // SAHNEDEKİ TÜM MESH'LERDEN BOUNDING BOX AL
    const box = new THREE.Box3();
    camera.parent?.traverse((obj: any) => {
      if (obj.isMesh) box.expandByObject(obj);
    });

    if (box.isEmpty()) return;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let distance = maxDim / (2 * Math.tan(fov / 2));

    distance *= 1.35; // 🔑 rahat açı

    camera.position.set(
      center.x,
      center.y + maxDim * 0.15,
      center.z + distance
    );

    controls.target.copy(center);
    controls.update();

    // 🔒 ZOOM SINIRI (SENİN İSTEDİĞİN KISIM)
    const d = controls.getDistance();
    controls.minDistance = d * 0.7;
    controls.maxDistance = d * 1.25; // ASLA nokta olmaz

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    controls.update();
    fittedRef.current = true;
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      {/* Geri */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-slate-800/80 rounded-full text-white"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* SAHNE */}
      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400">
        <Canvas camera={{ fov: 50, near: 0.01, far: 5000 }}>
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 10, 5]} intensity={1.1} />
          <Environment preset="city" />

          <Suspense fallback={<Loader />}>
            <Model
              onPartClick={(n) => setClickedName(n)}
            />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enablePan={false}
            onChange={fitCameraToModel}
          />
        </Canvas>
      </div>

      {/* ALT PANEL */}
      <div className="absolute bottom-8 w-full flex justify-center px-4 pointer-events-none">
        <div className="bg-blue-600/90 text-white w-full max-w-md py-4 rounded-2xl text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <MousePointer2 size={16} />
            <span className="text-xs font-bold tracking-widest uppercase">
              Tespit Edilen Bölge
            </span>
          </div>
          <p className="font-mono text-xl font-bold truncate px-4">
            {clickedName}
          </p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
