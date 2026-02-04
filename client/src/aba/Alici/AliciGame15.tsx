import React, { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei'
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react"

// 🔥 KESİN VE SADE ÇÖZÜM 🔥
// Dosya 'client/public' içinde olduğu için ve vite.config'de base='./' olduğu için
// SADECE İSMİNİ yazmamız yeterlidir.
const MODEL_PATH = 'human.glb'

function Model({ onPartClick }: { onPartClick: (name: string) => void }) {
  // useGLTF artık bunu hemen yanındaki dosya gibi şak diye bulacak.
  const { nodes } = useGLTF(MODEL_PATH) as any
  
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    // 🔥 ADAM DÜZELTME AYARLARI (AYNEN KORUDUK) 🔥
    <group dispose={null} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} scale={2.5}>
      {Object.keys(nodes).map((key) => {
        const node = nodes[key]
        if (node.type === 'Mesh') {
          return (
            <mesh
              key={key}
              geometry={node.geometry}
              material={node.material}
              material-color={selected === key ? "#22c55e" : (hovered === key ? "#fcd34d" : undefined)}
              onClick={(e) => {
                e.stopPropagation()
                setSelected(key)
                onPartClick(key)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(key)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                setHovered(null)
                document.body.style.cursor = 'auto'
              }}
            />
          )
        }
        return null
      })}
    </group>
  )
}

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center bg-white/90 p-4 rounded-xl shadow-xl backdrop-blur-sm">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-gray-800 font-bold text-sm">Model Yükleniyor...</p>
      </div>
    </Html>
  )
}

class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error("Model Hatası:", error);
    this.props.setHasError(true);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...")
  const [hasError, setHasError] = useState(false)

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900 flex flex-col">
      <div className="absolute top-4 left-4 z-10">
        <button onClick={onClose} className="p-3 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 transition">
          <ArrowLeft size={24} />
        </button>
      </div>

      {hasError && (
        <div className="absolute top-20 left-4 right-4 z-50 bg-red-500/90 text-white p-4 rounded-xl flex items-center gap-3 shadow-lg backdrop-blur-md animate-bounce">
          <AlertCircle size={24} />
          <div>
            <p className="font-bold">Model Yüklenemedi!</p>
            <p className="text-xs opacity-90">Dosya yolu bulunamadı.</p>
          </div>
        </div>
      )}

      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400 relative">
        <Canvas 
            camera={{ position: [0, 1.5, 3.5], fov: 50 }} 
            onCreated={() => console.log("Sahne Hazır")}
        >
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <Environment preset="city" />

          <Suspense fallback={<Loader />}>
             <ErrorBoundary setHasError={setHasError}>
                <Model onPartClick={setClickedName} />
             </ErrorBoundary>
          </Suspense>

          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} enablePan={false} />
          <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={10} blur={2.5} />
        </Canvas>
      </div>

      <div className="absolute bottom-8 w-full flex justify-center pointer-events-none px-4">
        <div className="bg-blue-600/90 text-white w-full max-w-md py-4 rounded-2xl text-center shadow-lg backdrop-blur-md border border-blue-400/30">
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <MousePointer2 size={16} /> 
            <span className="font-bold text-xs tracking-widest uppercase">Tespit Edilen Bölge</span>
          </div>
          <p className="font-mono text-xl font-bold truncate px-4">{clickedName}</p>
        </div>
      </div>
    </div>
  )
}
