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

// ✅ EN GARANTİLİ: GLB'yi build'e zorla dahil eder (dist/assets içine girer)
import humanUrl from "@/assets/human.glb?url";

// Not: Vite base: "./" olsa bile bu URL doğru şekilde çözümlenir.
const MODEL_PATH = humanUrl;

type ModelProps = {
  onPartClick: (name: string) => void;
};

function Model({ onPartClick }: ModelProps) {
  const gltf = useGLTF(MODEL_PATH) as any;

  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // nodes içinden Mesh olanları filtreleyelim (daha temiz)
  const meshes = useMemo(() => {
    const nodes = gltf?.nodes || {};
    return Object.entries(nodes)
      .filter(([, n]: any) => n?.type === "Mesh" && n?.geometry && n?.material)
      .map(([key, node]: any) => ({ key, node }));
  }, [gltf]);

  return (
    <group
      dispose={null}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1, 0]}
      scale={2.5}
    >
      {meshes.map(({ key, node }) => (
        <mesh
          key={key}
          geometry={node.geometry}
          material={node.material}
          // highlight (sadece renk override)
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

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center bg-white/90 p-4 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-gray-800 font-bold text-sm">Model Yükleniyor...</p>
        <p className="text-[10px] text-gray-500 mt-2 max-w-[240px] break-words text-center">
          {MODEL_PATH}
        </p>
      </div>
    </Html>
  );
}

// Hata yakalayıcı (React componenti olmalı)
class ErrorBoundary extends React.Component<
  { setHasError: (v: boolean) => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error("GLTF/Scene Error:", error);
    this.props.setHasError(true);
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children as any;
  }
}

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [hasError, setHasError] = useState(false);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      {/* Geri Butonu */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 transition"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Hata Mesajı */}
      {hasError && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-red-500/90 text-white p-4 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-md">
          <AlertCircle size={24} />
          <div className="min-w-0">
            <p className="font-bold">Model Yüklenemedi!</p>
            <p className="text-xs opacity-90">
              GLB dosyası build’e dahil olmuyor olabilir.
            </p>
            <p className="text-[10px] mt-2 opacity-80 break-words">
              Path: {MODEL_PATH}
            </p>
            <p className="text-[10px] mt-1 opacity-80">
              Dosya şu konumda olmalı: <b>client/src/assets/human.glb</b>
            </p>
          </div>
        </div>
      )}

      {/* 3D Sahne */}
      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        <Canvas camera={{ position: [0, 1.5, 3.5], fov: 50 }}>
          <ambientLight intensity={0.7} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
          />

          <Environment preset="city" />

          <Suspense fallback={<Loader />}>
            <ErrorBoundary setHasError={setHasError}>
              <Model onPartClick={setClickedName} />
            </ErrorBoundary>
          </Suspense>

          <OrbitControls
            makeDefault
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 1.8}
            enablePan={false}
          />

          <ContactShadows
            position={[0, -0.01, 0]}
            opacity={0.4}
            scale={10}
            blur={2.5}
          />
        </Canvas>
      </div>

      {/* Alt Bilgi */}
      <div className="absolute bottom-8 w-full flex justify-center pointer-events-none px-4">
        <div className="bg-blue-600/90 text-white w-full max-w-md py-4 rounded-2xl text-center shadow-lg backdrop-blur-md border border-blue-400/30">
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <MousePointer2 size={16} />
            <span className="font-bold text-xs tracking-widest uppercase">
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

// ✅ optional: preload (ilk açılış hızlanır)
useGLTF.preload(MODEL_PATH);
