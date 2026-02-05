import React, { useState, Suspense, useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
} from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";

// 🔗 Firebase / internetten yüklenen model
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
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const meshes = useMemo(() => {
    const nodes = gltf?.nodes || {};
    return Object.entries(nodes)
      .filter(([, n]: any) => n?.type === "Mesh")
      .map(([key, node]: any) => ({ key, node }));
  }, [gltf]);

  return (
    <group dispose={null} scale={2.5}>
      {meshes.map(({ key, node }) => (
        <mesh
          key={key}
          geometry={node.geometry}
          material={node.material}
          material-color={
            selected === key ? "#22c55e" : hovered === key ? "#fcd34d" : undefined
          }
          onClick={(e) => {
            e.stopPropagation();
            setSelected(key);
            onPartClick(key);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(key);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(null);
            document.body.style.cursor = "auto";
          }}
        />
      ))}
    </group>
  );
}

/* ---------------- MAIN ---------------- */
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [hasError, setHasError] = useState(false);

  const controlsRef = useRef<any>(null);

  // 🔥 SADECE BAŞLANGIÇ KAMERASI
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    // Kamera: geri + yukarı
    controls.object.position.set(0, 1.3, 3.8);

    // Adamın göğsüne bak
    controls.target.set(0, 0.9, 0);

    controls.update();
  }, []);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      {/* Geri Butonu */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-slate-800/80 rounded-full text-white"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Hata */}
      {hasError && (
        <div className="absolute top-20 left-4 right-4 z-50
