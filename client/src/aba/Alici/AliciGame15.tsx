import React, { useState, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  OrbitControls,
  Environment,
  ContactShadows,
  Html,
} from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";

// 🔥 Firebase Storage – PUBLIC DOWNLOAD URL
const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

/* =========================
   LOADER
========================= */
function Loader() {
  return (
    <Html center>
      <div className="bg-white/90 px-4 py-3 rounded-xl shadow-lg text-sm font-bold">
        Model yükleniyor…
      </div>
    </Html>
  );
}

/* =========================
   MODEL
========================= */
function Model({ onPartClick }: { onPartClick: (name: string) => void }) {
  const gltf = useGLTF(MODEL_PATH) as any;
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // SADECE gerçek Mesh'leri al
  const meshes = useMemo(() => {
    return Object.entries(gltf.nodes || {})
      .filter(([, n]: any) => n?.type === "Mesh" && n.geometry)
      .map(([key, node]: any) => ({ key, node }));
  }, [gltf]);

  return (
    <group
      dispose={null}
      position={[0, -1.1, 0]}   // 🔥 AYAK ALTI GÖRÜNÜMÜ BİTTİ
      rotation={[0, 0, 0]}      // 🔥 MODEL ARTIK TERS DEĞİL
      scale={1.7}
    >
      {meshes.map(({ key, node }) => (
        <mesh
          key={key}
          geometry={node.geometry}
          material={node.material}
          material-color={
            selected === key
              ? "#22c55e"
              : hovered === key
              ? "#fde047"
              : undefined
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

/* =========================
   ANA SAYFA
========================= */
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun…");
  const [hasError, setHasError] = useState(false);

  return (
    <div className="fixed inset-0 bg-slate-900 z-[500]">
      {/* GERİ */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-10 p-3 bg-slate-800 rounded-full text-white"
      >
        <ArrowLeft />
      </button>

      {/* HATA */}
      {hasError && (
        <div className="absolute top-20 left-4 right-4 z-20 bg-red-600 text-white p-3 rounded-xl text-sm">
          Model yüklenemedi – internet / Firebase erişimini kontrol et
        </div>
      )}

      {/* SAHNE */}
      <Canvas
        camera={{
          position: [0, 1.6, 3.2], // 🔥 GÖVDE MERKEZİNDEN BAKIŞ
          fov: 45,
        }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />

        <Environment preset="city" />

        <Suspense fallback={<Loader />}>
          <Model onPartClick={setClickedName} />
        </Suspense>

        {/* 🔥 TELEFON DOSTU KAMERA */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}          // 2 parmak zoom
          enableRotate={true}        // tek parmak rotate
          rotateSpeed={0.6}
          zoomSpeed={0.8}
          minDistance={1.8}
          maxDistance={6}
          minPolarAngle={0.35}       // çok aşağı bakamaz
          maxPolarAngle={1.65}       // çok yukarı bakamaz
          target={[0, 0.9, 0]}       // 🔥 ODAK GÖĞÜS HİZASI
        />

        <ContactShadows
          position={[0, -1.15, 0]}
          opacity={0.35}
          scale={10}
          blur={2}
        />
      </Canvas>

      {/* ALT PANEL */}
      <div className="absolute bottom-6 left-4 right-4 pointer-events-none">
        <div className="bg-blue-600 text-white rounded-2xl py-4 text-center shadow-xl">
          <div className="flex justify-center items-center gap-2 text-xs opacity-80 mb-1">
            <MousePointer2 size={14} />
            TESPİT EDİLEN BÖLGE
          </div>
          <div className="font-mono font-bold truncate px-4">
            {clickedName}
          </div>
        </div>
      </div>
    </div>
  );
}

// preload
useGLTF.preload(MODEL_PATH);
