import React, { Suspense, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react";

// ✅ Firebase Storage Download URL (HTTPS)
const MODEL_PATH =
  "https://firebasestorage.googleapis.com/v0/b/ogrencitakip-2a775.firebasestorage.app/o/human.glb?alt=media&token=7b979206-e91e-4e34-95ce-370e4c537998";

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center bg-white/90 p-4 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-gray-800 font-bold text-sm">Model Yükleniyor...</p>
      </div>
    </Html>
  );
}

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
    console.error("Model Hatası:", error);
    this.props.setHasError(true);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children as any;
  }
}

// ✅ Modeli BOZMAYAN yöntem: gltf.scene'i olduğu gibi çiziyoruz (rig/transform korunur)
function Model({ onPartClick }: { onPartClick: (name: string) => void }) {
  const gltf = useGLTF(MODEL_PATH) as any;

  const pickName = (obj: any) =>
    String(
      obj?.name ||
        obj?.userData?.name ||
        obj?.material?.name ||
        obj?.geometry?.name ||
        obj?.uuid ||
        "unknown"
    );

  const onPointerDown = (e: any) => {
    e.stopPropagation();
    onPartClick(pickName(e.object));
  };

  return (
    <group onPointerDown={onPointerDown}>
      <primitive object={gltf.scene} />
    </group>
  );
}

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...");
  const [hasError, setHasError] = useState(false);

  const controlsRef = useRef<any>(null);

  const pretty = useMemo(() => {
    if (!clickedName) return "—";
    return clickedName.length > 48 ? clickedName.slice(0, 48) + "…" : clickedName;
  }, [clickedName]);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      {/* Geri */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 transition"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* Hata */}
      {hasError && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-red-500/90 text-white p-4 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-md">
          <AlertCircle size={24} />
          <div className="min-w-0">
            <p className="font-bold">Model Yüklenemedi!</p>
            <p className="text-xs opacity-90">Firebase URL / internet / erişim izni kontrol et.</p>
            <p className="text-[10px] mt-2 opacity-80 break-words">Path: {MODEL_PATH}</p>
          </div>
        </div>
      )}

      {/* Sahne */}
      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        <Canvas
          // ✅ Kamera "ayak altı" değil, gövdeden başlasın
          camera={{ position: [0, 1.55, 3.2], fov: 45, near: 0.01, far: 200 }}
          onCreated={({ camera }) => {
            // ✅ İlk bakış hedefi (göğüs hizası)
            camera.lookAt(0, 1.15, 0);
          }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[5, 10, 5]} intensity={1.15} />
          <Environment preset="city" />

          <Suspense fallback={<Loader />}>
            <ErrorBoundary setHasError={setHasError}>
              <Model onPartClick={setClickedName} />
            </ErrorBoundary>
          </Suspense>

          {/* ✅ Telefon kontrolü:
              - 1 parmak: rotate
              - 2 parmak pinch: zoom
              - 2 parmak sürükle: pan (sağa/sola/yukarı/aşağı) */}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            target={[0, 1.15, 0]}
            enableRotate={true}
            enableZoom={true}
            enablePan={true}
            rotateSpeed={0.7}
            zoomSpeed={0.9}
            panSpeed={0.9}
            // Çok alttan bakmayı engelle
            minPolarAngle={0.25}
            maxPolarAngle={Math.PI - 0.35}
            // Çok yakın/uzak gitmesin
            minDistance={1.6}
            maxDistance={12}
          />

          <ContactShadows position={[0, -1.05, 0]} opacity={0.35} scale={12} blur={2.5} />
        </Canvas>
      </div>

      {/* Alt bilgi */}
      <div className="absolute bottom-8 w-full flex justify-center pointer-events-none px-4">
        <div className="bg-blue-600/90 text-white w-full max-w-md py-4 rounded-2xl text-center shadow-lg backdrop-blur-md border border-blue-400/30">
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <MousePointer2 size={16} />
            <span className="font-bold text-xs tracking-widest uppercase">Tespit Edilen Bölge</span>
          </div>
          <p className="font-mono text-xl font-bold truncate px-4">{pretty}</p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(MODEL_PATH);
```0
