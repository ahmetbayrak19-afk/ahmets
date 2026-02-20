import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage, Html, useProgress } from "@react-three/drei";

// --- EKRANA HATA BASAN PANEL ---
function HataEkrani({ mesaj }: { mesaj: string }) {
  return (
    <Html center>
      <div style={{
        background: '#fef2f2', color: '#991b1b', padding: '20px', 
        borderRadius: '8px', border: '4px solid #ef4444', width: '320px',
        fontFamily: 'sans-serif', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>⚠️ SİSTEM HATASI</h2>
        <p style={{ fontSize: '14px', fontWeight: 'bold' }}>{mesaj}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ marginTop: '10px', background: '#ef4444', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px' }}
        >
          SİSTEMİ YENİLE
        </button>
      </div>
    </Html>
  );
}

// --- MODEL BİLEŞENİ ---
function BalikModel({ url, hataVer }: { url: string; hataVer: (m: string) => void }) {
  try {
    // 286 bin poligonluk modeller genelde Draco sıkıştırmalıdır.
    useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
  } catch (err: any) {
    hataVer("Çizim Hatası: " + err.message);
    return null;
  }
}

// --- ANA OYUN ---
export default function EslemeGame() {
  const [hataMesaji, setHataMesaji] = useState<string | null>(null);
  const { progress } = useProgress();
  const modelYolu = "/models/balik.glb";

  useEffect(() => {
    // Siyah ekranın 1 numaralı sebebi: Dosya gerçekten orada mı?
    fetch(modelYolu)
      .then(res => {
        if (!res.ok) setHataMesaji(`BALIK BULUNAMADI (404): ${modelYolu} adresinde dosya yok.`);
        if (res.headers.get("content-length") === "0") setHataMesaji("DOSYA BOŞ (0 KB): İndirme başarısız.");
      })
      .catch(err => setHataMesaji("BAĞLANTI HATASI: " + err.message));
  }, []);

  return (
    <div className="w-full h-screen bg-slate-900 relative">
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 10] }}
        onCreated={({ gl }) => {
          // WebGL hatasını yakala (Siyah ekranın 2 numaralı sebebi)
          gl.getContext().canvas.addEventListener('webglcontextlost', () => {
            setHataMesaji("EKRAN KARTI ÇÖKTÜ: Model çok ağır (286K Poligon)!");
          }, false);
        }}
      >
        <Suspense fallback={<Html center><div className="text-white">Yükleniyor: %{progress.toFixed(0)}</div></Html>}>
          {hataMesaji ? (
            <HataEkrani mesaj={hataMesaji} />
          ) : (
            <Stage environment="city" intensity={0.5} adjustCamera={1.5}>
              <BalikModel url={modelYolu} hataVer={setHataMesaji} />
            </Stage>
          )}
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>

      {/* React'ın çalıştığını gösteren canlı ibare */}
      {!hataMesaji && (
        <div className="absolute top-4 left-4 text-[10px] text-green-400 font-mono">
          SYSTEM_READY // MODEL_PATH: {modelYolu}
        </div>
      )}
    </div>
  );
}

// Ön yükleme
useGLTF.preload("/models/balik.glb");
