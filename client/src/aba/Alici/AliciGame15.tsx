import React, { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, ContactShadows, Html } from '@react-three/drei'
import * as THREE from 'three'
import { ArrowLeft, MousePointer2, AlertCircle } from "lucide-react"

// --- 1. MODEL PARÇASI ---
function Model({ onPartClick }: { onPartClick: (name: string) => void }) {
  // DİKKAT: ', true' kısmını sildim. Standart yükleme yapıyoruz.
  const { nodes } = useGLTF('/human.glb') as any
  
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <group dispose={null}>
      {Object.keys(nodes).map((key) => {
        const node = nodes[key]
        if (node.type === 'Mesh') {
          return (
            <mesh
              key={key}
              geometry={node.geometry}
              material={node.material}
              material-color={
                selected === key ? "#22c55e" : (hovered === key ? "#fcd34d" : undefined)
              }
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

// --- YÜKLENİYOR EKRANI ---
function Loader() {
  return (
    <Html center>
      <div className="text-black font-bold bg-white/80 p-4 rounded-xl backdrop-blur-md shadow-lg flex flex-col items-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
        <p>Model Yükleniyor...</p>
      </div>
    </Html>
  )
}

// --- 2. OYUN EKRANI ---
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...")
  const [error, setError] = useState(false)

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col">
      
      {/* Geri Butonu */}
      <div className="absolute top-4 left-4 z-10">
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-white">
          <ArrowLeft />
        </button>
      </div>

      {/* Hata Mesajı (Dosya yoksa çıkar) */}
      {error && (
        <div className="absolute top-20 left-10 right-10 z-50 bg-red-500 text-white p-4 rounded-xl flex items-center gap-2">
          <AlertCircle />
          <p>Model yüklenemedi! Dosya yolunu kontrol et.</p>
        </div>
      )}

      {/* 3D Sahne */}
      <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400">
        <Canvas 
            camera={{ position: [0, 1.5, 3.5], fov: 50 }}
            onCreated={() => console.log("Canvas Yüklendi")} // Konsola bilgi basar
        >
          {/* Işıklar */}
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <Environment preset="city" />

          {/* Model Yüklenirken Bekleme Alanı (Suspense) */}
          <Suspense fallback={<Loader />}>
            <ErrorBoundary setHasError={setError}>
              <Model onPartClick={(name) => setClickedName(name)} />
            </ErrorBoundary>
          </Suspense>

          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
          <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={10} blur={2.5} />
        </Canvas>
      </div>

      {/* Alt Bilgi */}
      <div className="absolute bottom-10 w-full flex justify-center pointer-events-none">
        <div className="bg-blue-600/90 text-white px-8 py-4 rounded-2xl text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <MousePointer2 size={18} /> 
            <span className="font-bold text-sm tracking-widest">SEÇİLEN</span>
          </div>
          <p className="font-mono text-xl font-bold">{clickedName}</p>
        </div>
      </div>
    </div>
  )
}

// Basit Hata Yakalayıcı Bileşen
class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("3D Hata:", error, errorInfo);
    this.props.setHasError(true);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
