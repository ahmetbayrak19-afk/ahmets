import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage, Html } from "@react-three/drei";

// --- 1. EKRANA YAZI BASAN HATA PANELİ ---
function HataPaneli({ mesaj }: { mesaj: string }) {
  return (
    <Html center>
      <div style={{
        background: 'white', 
        color: '#dc2626', 
        padding: '25px', 
        borderRadius: '12px', 
        border: '4px solid #dc2626',
        width: '320px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        fontFamily: 'sans-serif',
        zIndex: 999
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>⚠️ SİSTEM HATASI</h2>
        <p style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
          <b>Hata Nedeni:</b> <br />
          <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '4px' }}>{mesaj}</code>
        </p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: '15px', 
            padding: '8px 15px', 
            background: '#dc2626', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          UYGULAMAYI YENİDEN BAŞLAT
        </button>
      </div>
    </Html>
  );
}

// --- 2. MODEL YÜKLEYİCİ ---
function BalikModel({ url, hataVer }: { url: string, hataVer: (m: string) => void }) {
  try {
    // Draco decoder ayarı (Sıkıştırılmış modeller için şart)
    useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
  } catch (error: any) {
    hataVer("Model yükleme hatası: " + error.message);
    return null;
  }
}

// --- 3. ANA OYUN EKRANI ---
export default function EslemeGame() {
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  
  // Balık modelinin public içindeki tam yolu
  const modelUrl = "/models/balik.glb";

  useEffect(() => {
    // Dosya gerçekten yerinde mi diye bir "ön kontrol" yapıyoruz
    fetch(modelUrl)
      .then(res => {
        if (!res.ok) {
          setHata(`Dosya Bulunamadı (404): ${modelUrl} adresinde balık yok! Build ve Sync yaptığından emin ol.`);
        }
        setYukleniyor(false);
      })
      .catch(err => {
        setHata("Bağlantı Hatası: " + err.message);
        setYukleniyor(false);
      });
  }, []);

  return (
    <div className="w-full h-screen bg-slate-900">
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 5] }}
        // WebGL (ekran kartı) çökerse yakala
        onCreated={({ gl }) => {
          gl.getContext().canvas.addEventListener('webglcontextlost', () => {
            setHata("Ekran Kartı Çöktü! 286 bin poligon ağır gelmiş olabilir.");
          }, false);
        }}
      >
        <Suspense fallback={<Html center><div className="text-white">Model Hazırlanıyor...</div></Html>}>
          {hata ? (
            <HataPaneli mesaj={hata} />
          ) : (
            <Stage environment="city" intensity={0.5} adjustCamera={2}>
              <BalikModel url={modelUrl} hataVer={setHata} />
            </Stage>
          )}
        </Suspense>
        <OrbitControls />
      </Canvas>

      {/* Sesleri eşleme hatırlatması */}
      {!hata && !yukleniyor && (
        <div className="absolute bottom-5 w-full text-center text-white/50 text-xs pointer-events-none">
          Kaptan, uzay mekiğini tamir etmek için sesleri eşle!
        </div>
      )}
    </div>
  );
}
