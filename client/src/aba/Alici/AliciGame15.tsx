import React, { useEffect, useRef, useState } from "react";
import "@google/model-viewer";
import { ArrowLeft, MousePointer2 } from "lucide-react";

const ANDROID_ASSET_PATH = "https://assets/human.glb";

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const mvRef = useRef<any>(null);
  const [clickedName, setClickedName] = useState("Bir yere dokun...");

  // 🔥 YENİ SİHİRLİ FONKSİYON 🔥
  // Bu sefer Materyale değil, direkt modele (Node) bakıyoruz.
  const handleModelClick = (event: any) => {
    const mv = mvRef.current;
    if (!mv) return;

    const { clientX, clientY } = event;
    
    // 1. Tıklanan noktanın 3D koordinatlarını bul
    const hit = mv.positionAndNormalFromPoint(clientX, clientY);
    
    if (hit) {
        // Konsola modelin tüm yapısını bas ki içinde ne var görelim
        console.log("Tıklanan nokta:", hit);
        
        // Hileli Yöntem: Model Viewer'ın içindeki sahne yapısına erişmeye çalışalım
        // Not: <model-viewer> doğrudan node ismini vermez, ama materyali verir.
        const material = mv.materialFromPoint(clientX, clientY);
        
        if (material) {
             setClickedName(`MATERYAL: ${material.name}`);
             // Eğer burada hep aynı isim çıkıyorsa, yukarıda dediğim "Boya" sorunu vardır.
        }
    } else {
        setClickedName("Boşluğa tıkladın.");
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col">
      <div className="absolute top-4 left-4 z-10">
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full"><ArrowLeft className="text-white"/></button>
      </div>

      <div className="w-full h-full">
        <model-viewer
          ref={mvRef}
          src={ANDROID_ASSET_PATH} 
          alt="3D Model"
          camera-controls
          auto-rotate
          disable-tap
          onClick={handleModelClick}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div className="absolute bottom-10 w-full flex justify-center pointer-events-none">
          <div className="bg-blue-600/90 text-white p-4 rounded-xl text-center">
            <div className="flex justify-center gap-2 mb-1"><MousePointer2/> <span className="font-bold">ANALİZ</span></div>
            <p className="font-mono text-lg">{clickedName}</p>
          </div>
      </div>
    </div>
  );
      }
    
