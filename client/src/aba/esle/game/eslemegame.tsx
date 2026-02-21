import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage, Html, useProgress } from "@react-three/drei";
import { Capacitor } from '@capacitor/core'; // Capacitor kütüphanesini ekledik

// --- CANLI DURUM RAPORLAYICI ---
function StatusLog({ logs }: { logs: string[] }) {
  return (
    <Html fullscreen pointerEvents="none">
      <div style={{
        position: 'absolute', top: '10px', left: '10px',
        background: 'rgba(0,0,0,0.8)', color: '#00ff00',
        padding: '12px', borderRadius: '8px', border: '1px solid #444',
        fontFamily: 'monospace', fontSize: '11px', zIndex: 9999
      }}>
        <div style={{ color: '#ffcc00', fontWeight: 'bold', marginBottom: '5px' }}>NATIVE BRIDGE RAPORU</div>
        {logs.map((l, i) => <div key={i}>{`> ${l}`}</div>)}
      </div>
    </Html>
  );
}

export default function EslemeGame() {
  const [logs, setLogs] = useState<string[]>(["Başlatılıyor..."]);
  const [finalModelUrl, setFinalModelUrl] = useState<string>("");
  const { progress } = useProgress();

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-6), msg]);

  useEffect(() => {
    // 1. ADIM: Ham dosya yolu
    const rawPath = "models/balik.glb"; 
    addLog(`Ham yol: ${rawPath}`);

    // 2. ADIM: Native Bridge ile Yolu Dönüştürme
    // Bu kısım "Failed to fetch" hatasını kırmak için kritik
    let convertedUrl = rawPath;

    if (Capacitor.isNativePlatform()) {
      addLog("Platform: Android/iOS (Native)");
      // window.location.origin ekleyerek WebView'ın kendi sunucusunu hedefliyoruz
      convertedUrl = `${window.location.origin}/${rawPath}`;
      addLog("Bridge adresi oluşturuldu.");
    } else {
      addLog("Platform: Web Tarayıcı");
    }

    setFinalModelUrl(convertedUrl);
    addLog(`Hedef: ${convertedUrl}`);

    // 3. ADIM: Erişim Testi
    fetch(convertedUrl)
      .then(res => {
        if (res.ok) addLog("ERİŞİM BAŞARILI: Dosya kilitleri açıldı.");
        else addLog(`ERİŞİM HATASI: ${res.status} (Dosya yerinde yok)`);
      })
      .catch(err => addLog(`NATIVE HATA: ${err.message}`));

  }, []);

  return (
    <div className="w-full h-screen bg-[#0a0a0a]">
      {finalModelUrl && (
        <Canvas shadows camera={{ position: [0, 0, 10] }}>
          <StatusLog logs={logs} />
          
          <Suspense fallback={<Html center><div style={{color:'white'}}>Varlıklar yükleniyor: %{progress.toFixed(0)}</div></Html>}>
            <Stage environment="city" intensity={0.6} adjustCamera={1.5}>
              <ModeliCiz 
                url={finalModelUrl} 
                onReport={(m) => addLog(m)} 
              />
            </Stage>
          </Suspense>
          
          <OrbitControls makeDefault />
        </Canvas>
      )}
    </div>
  );
}

function ModeliCiz({ url, onReport }: { url: string; onReport: (m: string) => void }) {
  try {
    // 286K poligonluk model için Draco desteği
    useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const { scene } = useGLTF(url);
    
    useEffect(() => {
      onReport("MODEL AKTİF: Balık sahneye eklendi.");
    }, []);

    return <primitive object={scene} />;
  } catch (e: any) {
    onReport(`ÇİZİM HATASI: ${e.message}`);
    return null;
  }
}

// Ön yükleme
useGLTF.preload("models/balik.glb");
                  
