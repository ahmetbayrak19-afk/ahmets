import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Html, Stage, OrbitControls } from "@react-three/drei";

function HataEkrani({ mesaj, detay }: { mesaj: string, detay?: string }) {
  return (
    <Html center>
      <div style={{ background: 'white', color: 'red', padding: '20px', border: '4px solid red', width: '300px' }}>
        <b>⚠️ DURUM RAPORU</b><br/>
        <small>{mesaj}</small><br/>
        <hr/>
        <code style={{ fontSize: '10px', color: 'black' }}>{detay}</code>
      </div>
    </Html>
  );
}

export default function EslemeGame() {
  const [rapor, setRapor] = useState<string>("Başlatılıyor...");
  const [hataVarmi, setHataVarmi] = useState(false);
  const modelUrl = "/models/balik.glb";

  useEffect(() => {
    // Senin bulduğun makaledeki "GET" mantığını test ediyoruz
    fetch(modelUrl, { method: 'GET' }) // Zorla GET yapıyoruz
      .then(res => {
        const boyutu = res.headers.get("content-length");
        if (!res.ok) {
          throw new Error(`Sunucu Hatası: ${res.status}`);
        }
        if (boyutu === "0") {
          throw new Error("Dosya bulundu ama içi boş (0 KB)! Protokol hatası olabilir.");
        }
        setRapor(`Dosya onaylandı: ${boyutu || "Boyut bilinmiyor"} byte`);
      })
      .catch(err => {
        setHataVarmi(true);
        setRapor(err.message);
      });
  }, []);

  return (
    <div className="w-full h-screen bg-black">
      <Canvas>
        <Suspense fallback={<Html center style={{color:'white'}}>{rapor}</Html>}>
          {hataVarmi ? (
            <HataEkrani mesaj="Yükleme Başarısız" detay={rapor} />
          ) : (
            <Stage environment="city">
               <primitive object={useGLTF(modelUrl).scene} />
            </Stage>
          )}
        </Suspense>
        <OrbitControls />
      </Canvas>
    </div>
  );
}
