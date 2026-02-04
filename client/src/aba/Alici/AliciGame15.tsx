import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { ArrowLeft, MousePointer2 } from "lucide-react"

// --- 1. MODEL PARÇASI (Bütün sihir burada) ---
function Model({ onPartClick }: { onPartClick: (name: string) => void }) {
  // Dosyayı 'client/public/human.glb' adresinden çeker
  // Eğer sıkıştırma varsa 'true', yoksa silinebilir ama kalsın zararı yok.
  const { nodes, materials } = useGLTF('/human.glb', true) as any
  
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <group dispose={null}>
      {Object.keys(nodes).map((key) => {
        const node = nodes[key]
        // Sadece Mesh (Görünür parça) olanları çiz
        if (node.type === 'Mesh') {
          return (
            <mesh
              key={key}
              geometry={node.geometry}
              material={node.material}
              // Tıklanınca veya üstüne gelince renk değişimi
              material-color={
                selected === key ? "#22c55e" : (hovered === key ? "#fcd34d" : undefined)
              }
              
              // MOUSE OLAYLARI
              onClick={(e) => {
                e.stopPropagation() // Arkadakine tıklamayı engelle
                setSelected(key)    // Seçili yap (Yeşil)
                onPartClick(key)    // İsmi yukarı gönder
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(key)     // Üstüne gelince (Sarı)
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={(e) => {
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

// --- 2. OYUN EKRANI (AliciGame15) ---
export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const [clickedName, setClickedName] = useState("Bir yere dokun...")

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col">
      
      {/* Geri Butonu */}
      <div className="absolute top-4 left-4 z-10">
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
          <ArrowLeft className="text-white" />
        </button>
      </div>

      {/* 3D Sahne */}
      <div className="w-full h-full">
        <Canvas camera={{ position: [0, 1.5, 3.5], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <Environment preset="city" />

          {/* Modeli Çağırıyoruz */}
          <Model onPartClick={(name) => setClickedName(name)} />

          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.8} />
          <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={10} blur={2.5} />
        </Canvas>
      </div>

      {/* Alt Bilgi Paneli */}
      <div className="absolute bottom-10 w-full flex justify-center pointer-events-none">
        <div className="bg-blue-600/90 text-white px-8 py-4 rounded-2xl text-center shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 mb-1 opacity-80">
            <MousePointer2 size={18} /> 
            <span className="font-bold text-sm tracking-widest">TESPİT EDİLEN</span>
          </div>
          <p className="font-mono text-xl font-bold">{clickedName}</p>
        </div>
      </div>
    </div>
  )
}

// Performans için önden yükleme
useGLTF.preload('/human.glb', true)
