import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls, Stage, Html, useProgress } from "@react-three/drei";

// --- RAPOR PANELI ---
function StatusLog({ logs }: { logs: string[] }) {
  return (
    <Html fullscreen pointerEvents="none">
      <div style={{
        position: 'absolute', top: '10px', left: '10px',
        background: 'rgba(0,0,0,0.85)', color: '#00ff00',
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
  // ✅ KRİTİK: window.location.origin ekleyerek yolu mutlak hale getirdik
  const modelUrl = window.location.origin + "/models/balik.glb"; 
  const { progress } = useProgress();

  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-6), msg]);

  useEffect(() => {
    addLog(`Hedef URL: ${modelUrl}`);
    
    // Erişim testi
    fetch(modelUrl)
      .then(res => {
        if (res.ok) addLog("ERİŞİM BAŞARILI: Dosya bulundu.");
        else addLog(`HATA: ${res.status} - Dosya adreste yok.`);
      })
      .catch(err => addLog(`NATIVE FETCH HATASI: ${err.message}`));
  }, []);

  return (
    <div className="w-full h-screen bg-[#050505]">
      <Canvas shadows camera={{ position: [0, 0, 10] }}>
        <StatusLog logs={logs} />
        
        <Suspense fallback={<Html center><div style={{color:'white'}}>Varlıklar: %{progress.toFixed(0)}</div></Html>}>
          <Stage environment="city" intensity={0.5} adjustCamera={1.8}>
            <BalikModel url={modelUrl} onReport={addLog} />
          </Stage>
        </Suspense>
        
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}

function BalikModel({ url, onReport }: { url: string; onReport: (m: string) => void }) {
  try {
    // 286,367 poligonluk model için Draco
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

// Ön yükleme
useGLTF.preload(window.location.origin + "/models/balik.glb");
      
