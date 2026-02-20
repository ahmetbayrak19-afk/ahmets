import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage, Html, useProgress } from "@react-three/drei";

// --- CANLI HATA VE DURUM PANELİ (EKRANDAN HİÇ GİTMEZ) ---
function StatusReporter({ logs }: { logs: string[] }) {
  return (
    <Html fullscreen pointerEvents="none">
      <div style={{
        position: 'absolute', top: '10px', left: '10px',
        background: 'rgba(0,0,0,0.85)', color: '#00ff00',
        padding: '15px', borderRadius: '8px', border: '1px solid #333',
        fontFamily: 'monospace', fontSize: '12px', maxWidth: '90vw',
        zIndex: 9999, pointerEvents: 'none'
      }}>
        <div style={{ borderBottom: '1px solid #333', marginBottom: '8px', fontWeight: 'bold', color: '#ffcc00' }}>
          SİSTEM RAPORU // 7/24 CANLI
        </div>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '4px', color: log.includes('HATA') ? '#ff4444' : '#00ff00' }}>
            {`> ${log}`}
          </div>
        ))}
      </div>
    </Html>
  );
}

export default function EslemeGame() {
  const [logs, setLogs] = useState<string[]>(["Sistem başlatıldı..."]);
  const { progress } = useProgress();
  
  // Vite 'base: ./' ayarı için en güvenli yol (Baştaki '/' silindi)
  const modelUrl = "models/balik.glb";

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-8), msg]); // Son 9 mesajı gösterir
  };

  useEffect(() => {
    addLog(`Dosya aranıyor: ${modelUrl}`);
    
    // FETCH KONTROLÜ
    fetch(modelUrl)
      .then(res => {
        if (res.ok) {
          addLog("DOSYA BULUNDU: Sunucu yanıt verdi (200 OK)");
          const size = res.headers.get("content-length");
          addLog(`Boyut: ${size ? (parseInt(size) / 1024 / 1024).toFixed(2) + " MB" : "Bilinmiyor"}`);
        } else {
          addLog(`HATA 404: Dosya adreste yok! Durum: ${res.status}`);
        }
      })
      .catch(err => addLog(`HATA (Fetch): ${err.message}`));
  }, []);

  useEffect(() => {
    if (progress > 0) addLog(`Yükleme: %${progress.toFixed(0)}`);
    if (progress === 100) addLog("Model verisi alındı, çiziliyor...");
  }, [progress]);

  return (
    <div className="w-full h-screen bg-[#050505]">
      <Canvas 
        shadows 
        camera={{ position: [0, 0, 10] }}
        onCreated={({ gl }) => {
          addLog("WebGL Hazır");
          gl.getContext().canvas.addEventListener('webglcontextlost', () => {
            addLog("HATA: WebGL Çöktü! (Bellek yetersiz)");
          }, false);
        }}
      >
        <StatusReporter logs={logs} />
        
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} adjustCamera={1.8}>
            <ModeliGetir 
              url={modelUrl} 
              onReport={(msg) => addLog(msg)} 
            />
          </Stage>
        </Suspense>
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}

function ModeliGetir({ url, onReport }: { url: string; onReport: (m: string) => void }) {
  try {
    // 286 bin poligonluk model için Draco şart
    useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    const { scene } = useGLTF(url);
    
    // Eğer buraya gelirse model render edilmiştir
    useEffect(() => {
      onReport("BAŞARILI: Balık ekrana çizildi!");
    }, []);

    return <primitive object={scene} />;
  } catch (e: any) {
    onReport(`HATA (Çizim): ${e.message}`);
    return null;
  }
}

// Ön yükleme
useGLTF.preload("models/balik.glb");
