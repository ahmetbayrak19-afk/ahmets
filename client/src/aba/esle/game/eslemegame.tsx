import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage, Html, useProgress } from "@react-three/drei";

// --- 1. EKRANA YAZI BASAN DURUM VE HATA PANELİ ---
// Konsola bakmana gerek kalmadan sorunu burada göreceğiz.
function BilgiEkrani({ mesaj, renk = "#38bdf8" }: { mesaj: string; renk?: string }) {
  return (
    <Html center>
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)', 
        color: renk, 
        padding: '20px', 
        borderRadius: '12px', 
        border: `2px solid ${renk}`, 
        width: '300px', 
        textAlign: 'center',
        fontFamily: 'monospace',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}>
        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>SİSTEM DURUMU</div>
        <div style={{ fontSize: '13px', lineHeight: '1.4' }}>{mesaj}</div>
        {renk === "red" && (
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '15px', padding: '5px 15px', cursor: 'pointer', background: 'red', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            TEKRAR DENE
          </button>
        )}
      </div>
    </Html>
  );
}

// --- 2. 3D MODEL BİLEŞENİ ---
function BalikModel({ url, hataVer }: { url: string; hataVer: (m: string) => void }) {
  try {
    // Draco decoder: Senin modelin sıkıştırılmış olduğu için bu yol şart
    useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    
    const { scene } = useGLTF(url);
    
    // Model yüklendiğinde gölgeleri aktifleştir
    scene.traverse((child) => {
      if ((child as any).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return <primitive object={scene} />;
  } catch (err: any) {
    hataVer("Model Çizim Hatası: " + err.message);
    return null;
  }
}

// --- 3. ANA OYUN EKRANI ---
export default function EslemeGame() {
  const [mesaj, setMesaj] = useState<string>("Başlatılıyor...");
  const [hataVarmi, setHataVarmi] = useState(false);
  const { progress } = useProgress();

  // Vite root: 'client' olduğu için modelin public içindeki yolu
  const modelUrl = "/models/balik.glb";

  useEffect(() => {
    // Paylaştığın makaledeki HTTPS/HTTP ve 0 KB sorununu test ediyoruz
    setMesaj("Dosya kontrol ediliyor (GET isteği)...");
    
    fetch(modelUrl, { method: 'GET' })
      .then(res => {
        if (!res.ok) throw new Error(`Dosya bulunamadı (404). Yol yanlış olabilir: ${modelUrl}`);
        
        // Dosya boyutu kontrolü (0 KB sorunu için)
        const size = res.headers.get("content-length");
        if (size === "0") throw new Error("Dosya bulundu ama 0 KB! Android yolu engelliyor olabilir.");
        
        setMesaj(`Dosya onaylandı. Model yükleniyor: %${progress.toFixed(0)}`);
      })
      .catch(err => {
        setHataVarmi(true);
        setMesaj(err.message);
      });
  }, [progress]);

  return (
    <div className="w-full h-screen bg-[#020617] relative">
      <Canvas shadows camera={{ position: [0, 0, 10], fov: 45 }}>
        <Suspense fallback={<BilgiEkrani mesaj={`Yükleniyor: %${progress.toFixed(0)}`} />}>
          {hataVarmi ? (
            <BilgiEkrani mesaj={mesaj} renk="red" />
          ) : (
            // Stage: Merkeze alma ve ışıklandırma
            <Stage environment="city" intensity={0.5} adjustCamera={1.5}>
              <BalikModel url={modelUrl} hataVer={(m) => { setHataVarmi(true); setMesaj(m); }} />
            </Stage>
          )}
        </Suspense>
        <OrbitControls makeDefault />
      </Canvas>

      {/* Oyun Arayüzü: Ses Eşleme Hedefi */}
      <div className="absolute top-10 w-full text-center pointer-events-none px-4">
        <h1 className="text-white font-bold text-xl drop-shadow-lg mb-2">UZAY MEKİĞİ TAMİRİ</h1>
        <p className="text-sky-400 text-sm font-mono opacity-80 uppercase tracking-widest">
          Kilitli sandığı açmak için sesleri eşle!
        </p>
      </div>

      {/* Alt Bilgi Paneli */}
      <div className="absolute bottom-5 right-5 text-[10px] text-white/20 font-mono">
        Model: 286K Poligon | Protocol: Capacitor Native
      </div>
    </div>
  );
}

// Modelin arka planda ön yüklemesi
useGLTF.preload("/models/balik.glb");
