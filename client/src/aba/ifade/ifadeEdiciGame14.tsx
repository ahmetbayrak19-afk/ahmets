import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Html, useAnimations, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";

/** ==== OYUN VERİLERİ ==== */
// ❗ ÖNEMLİ: animName kısımlarını Blender'da verdiğin aksiyon (action) isimleriyle birebir aynı yapmalısın.
const GAME_DATA = {
  bilgisayar: {
    id: "bilgisayar",
    title: "Bilgisayar",
    modelFile: "bilgisayar.glb",
    parts: [
      { id: "ekran", label: "Ekran", animName: "ekran_anim" },
      { id: "klavye", label: "Klavye", animName: "klavye_anim" },
      { id: "mouse", label: "Mouse", animName: "mouse_anim" },
      { id: "kasa", label: "Kasa", animName: "kasa_anim" },
    ],
  },
  cicek: {
    id: "cicek",
    title: "Çiçek",
    modelFile: "cicek.glb",
    parts: [
      { id: "yaprak", label: "Yaprak", animName: "yaprak_anim" },
      { id: "tac_yaprak", label: "Taç Yaprak", animName: "tac_yaprak_anim" },
      { id: "kok", label: "Kök", animName: "kok_anim" },
      { id: "govde", label: "Gövde", animName: "govde_anim" },
    ],
  },
  ev: {
    id: "ev",
    title: "Ev",
    modelFile: "ev.glb",
    parts: [
      { id: "cati", label: "Çatı", animName: "cati_anim" },
      { id: "kapi", label: "Kapı", animName: "kapi_anim" },
      { id: "pencere", label: "Pencere", animName: "pencere_anim" },
      { id: "baca", label: "Baca", animName: "baca_anim" },
    ],
  },
  araba: {
    id: "araba",
    title: "Araba",
    modelFile: "araba.glb",
    parts: [
      { id: "tekerlek", label: "Tekerlek", animName: "tekerlek_anim" },
      { id: "kapi", label: "Kapı", animName: "kapi_anim" },
      { id: "far", label: "Far", animName: "far_anim" },
      { id: "bagaj", label: "Bagaj", animName: "bagaj_anim" },
    ],
  },
};

const BG_COLOR = "#0b2a46"; // Referans kodundaki arka plan rengi

/** ---- Yükleyici Bileşeni ---- */
function Loader3D() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{ color: "white", background: "rgba(0,0,0,0.75)", padding: "10px 12px", borderRadius: 10, fontFamily: "monospace" }}>
        Yükleniyor: %{progress.toFixed(0)}
      </div>
    </Html>
  );
}

/** ---- 3D Model ve Animasyon Oynatıcı ---- */
function ActiveModel({ url, dracoBase, activeAnim }: { url: string; dracoBase: string; activeAnim: string | null }) {
  useMemo(() => {
    useGLTF.setDecoderPath(dracoBase.endsWith("/") ? dracoBase : `${dracoBase}/`);
  }, [dracoBase]);

  const { scene, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    // Model yüklendiğinde materyalleri çift taraflı yap (referans koddaki gibi)
    scene.traverse((o: any) => {
      if (o?.isMesh && o.material) o.material.side = THREE.DoubleSide;
    });
  }, [scene]);

  useEffect(() => {
    // Butona basıldığında ilgili animasyonu tetikle
    if (activeAnim && actions[activeAnim]) {
      const action = actions[activeAnim];
      action.reset();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
    }
  }, [activeAnim, actions]);

  return (
    <group scale={3.0}> {/* FISH_SCALE gibi genel bir ölçek */}
      <primitive object={scene} />
    </group>
  );
}

/** ==== ANA BİLEŞEN ==== */
export default function IfadeEdiciGame14() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeAnim, setActiveAnim] = useState<string | null>(null);
  const [urls, setUrls] = useState({ model: "", draco: "" });

  // Seçim yapıldığında referans koddaki mantıkla URL'leri oluştur
  useEffect(() => {
    if (selectedCategory) {
      const base = new URL("/assets/public/", window.location.origin).toString();
      const modelFile = GAME_DATA[selectedCategory as keyof typeof GAME_DATA].modelFile;
      
      setUrls({
        model: new URL(`models/${modelFile}`, base).toString(),
        draco: new URL("draco/", base).toString(),
      });
      setActiveAnim(null);
    }
  }, [selectedCategory]);

  // 1. EKRAN: KATEGORİ SEÇİMİ (Kare Butonlar)
  if (!selectedCategory) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: BG_COLOR, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", touchAction: "none" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {Object.values(GAME_DATA).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                width: "150px", height: "150px", borderRadius: "20px", fontSize: "1.5rem", fontWeight: "bold",
                backgroundColor: "white", border: "none", color: "#0b2a46", cursor: "pointer",
                boxShadow: "0 8px 15px rgba(0,0,0,0.3)"
              }}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. EKRAN: MODEL VE PARÇALAR
  const categoryData = GAME_DATA[selectedCategory as keyof typeof GAME_DATA];
  
  // Butonları sağa ve sola bölmek için
  const half = Math.ceil(categoryData.parts.length / 2);
  const leftParts = categoryData.parts.slice(0, half);
  const rightParts = categoryData.parts.slice(half);

  const ButtonStyle: React.CSSProperties = {
    padding: "15px 20px", fontSize: "1.5rem", fontWeight: "bold", borderRadius: "15px",
    backgroundColor: "#FFD700", border: "none", color: "#333", cursor: "pointer",
    boxShadow: "0 6px 0 #FFA500", pointerEvents: "auto", marginBottom: "15px", width: "100%"
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: BG_COLOR, touchAction: "none", position: "relative" }}>
      
      {/* 3D KANVAS */}
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 10]} intensity={2} />
        <Suspense fallback={<Loader3D />}>
          {urls.model && <ActiveModel url={urls.model} dracoBase={urls.draco} activeAnim={activeAnim} />}
        </Suspense>
      </Canvas>

      {/* ARAYÜZ (UI) */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", display: "flex", justifyContent: "space-between", padding: "20px", boxSizing: "border-box", alignItems: "center" }}>
        
        {/* SOL BUTONLAR */}
        <div style={{ display: "flex", flexDirection: "column", width: "180px" }}>
          {leftParts.map((part) => (
            <button key={part.id} style={ButtonStyle} onClick={() => setActiveAnim(part.animName)}>
              {part.label}
            </button>
          ))}
        </div>

        {/* SAĞ BUTONLAR */}
        <div style={{ display: "flex", flexDirection: "column", width: "180px" }}>
          {rightParts.map((part) => (
            <button key={part.id} style={ButtonStyle} onClick={() => setActiveAnim(part.animName)}>
              {part.label}
            </button>
          ))}
        </div>

      </div>

      {/* GERİ BUTONU */}
      <button 
        onClick={() => setSelectedCategory(null)}
        style={{ position: "absolute", top: "20px", left: "20px", padding: "10px 20px", fontSize: "1.2rem", fontWeight: "bold", borderRadius: "10px", backgroundColor: "#FF4500", color: "white", border: "none", cursor: "pointer", pointerEvents: "auto" }}
      >
        Menüye Dön
      </button>

    </div>
  );
}
