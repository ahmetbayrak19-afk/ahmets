import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage, Html, useProgress } from "@react-three/drei";
import { Capacitor } from '@capacitor/core';

// --- RAPOR PANELI (EKRANDAN AYRILMAZ) ---
function StatusLog({ logs }: { logs: string[] }) {
  return (
    <Html fullscreen pointerEvents="none">
      <div style={{
        position: 'absolute', top: '10px', left: '10px',
        background: 'rgba(0,0,0,0.9)', color: '#00ff00',
        padding: '12px', borderRadius: '8px', border: '1px solid #444',
        fontFamily: 'monospace', fontSize: '11px', zIndex: 9999
      }}>
        <div style={{ color: '#ffcc00', fontWeight: 'bold', marginBottom: '5px' }}>NATIVE BRIDGE RAPORU</div>
        {logs.map((l, i) => <div key={i} style={{ color: l.includes('HATA') ? 'red' : '#00ff00' }}>{`> ${l}`}</div>)}
      </div>
    </Html>
  );
}

export default function EslemeGame() {
  const [logs, setLogs] = useState<string[]>(["Sistem başlatılıyor..."]);
  const [modelUrl, setModelUrl] = useState<string>("");
  const { progress } = useProgress();

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-8), msg]);

  useEffect(() => {
    // 1. ADIM: Ham yolu belirle (Public klasöründeki yer)
    const rawPath = "models/balik.glb"; 
    
    // 2. ADIM: Yolu WebView'ın anlayacağı hale getir
    // Capacitor.convertFileSrc() kullanmıyoruz çünkü asset'ler zaten localhost'ta.
    // Doğru yol: window.location.origin + dosya adı
    const finalUrl = window.location.origin + "/" + rawPath;
    
    addLog(`Ham Yol: ${rawPath}`);
    addLog(`Dönüştürülen: ${finalUrl}`);
    setModelUrl(finalUrl);

    // Erişim Testi
    fetch(finalUrl)
      .then(res => {
        if (res.ok) addLog("ERİŞİM ONAYLANDI: Dosya kapıda.");
        else addLog(`HATA ${res.status}: Dosya bulunamadı.`);
      })
      .catch(err => addLog(`NATIVE HATA: ${err.message}`));
  }, []);

  return (
    <div className="w-full h-screen bg-[#020617]">
      <Canvas shadows camera={{ position: [0, 0, 10] }}>
        <StatusLog logs={logs} />
        
        {modelUrl && (
          <Suspense fallback={<Html center><div className="text-white">Balık Yükleniyor: %{progress.toFixed(0)}</div></Html>}>
            <Stage environment="city" intensity={0.5} adjustCamera={1.8}>
              <ModeliCiz 
                url={modelUrl} 
                onReport={addLog} 
              />
            </Stage>
          </Suspense>
        )}
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}

function ModeliCiz({ url, onReport }: { url: string; onReport: (m: string) => void }) {
  try {
    // 286,367 poligonluk model için Draco şifre çözücü
    useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const { scene } = useGLTF(url);
    
    useEffect(() => {
      onReport("BAŞARILI: Balık çizildi!");
    }, []);

    return <primitive object={scene} />;
  } catch (e: any) {
    onReport(`ÇİZİM HATASI: ${e.message}`);
    return null;
  }
    }
