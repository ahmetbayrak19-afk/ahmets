import React, { useEffect, useRef, useState } from "react";
import "@google/model-viewer";
import { ArrowLeft, Loader2 } from "lucide-react";

// 🟢 VITE URL IMPORT (En sağlam yöntem)
// Dosya adının sonuna "?url" ekleyerek Vite'tan çalışan adresi alıyoruz.
// @ts-ignore
import humanModelUrl from "./human.glb?url";

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const mvRef = useRef<any>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [debugInfo, setDebugInfo] = useState<string>(""); 

  // 1. ADIM: Dosya gerçekten okunabiliyor mu testi
  useEffect(() => {
    console.log("Model URL:", humanModelUrl);
    setDebugInfo(`Hedef URL: ${humanModelUrl}\n`);

    fetch(humanModelUrl)
      .then(async (r) => {
        console.log("Fetch Durumu:", r.status, r.statusText);
        const buf = await r.arrayBuffer();
        console.log("Dosya Boyutu:", buf.byteLength);
        
        // Ekrana teknik bilgiyi basalım
        setDebugInfo(prev => prev + `Durum Kodu: ${r.status}\nBoyut: ${(buf.byteLength / 1024 / 1024).toFixed(2)} MB`);
        
        if (r.status !== 200 && r.status !== 0) {
            setLoadStatus("error");
            setErrorMsg(`Dosya Bulunamadı (Kod: ${r.status})`);
        }
      })
      .catch((err) => {
        console.error("Fetch Hatası:", err);
        setDebugInfo(prev => prev + `Fetch Hatası: ${err.message}`);
        setLoadStatus("error");
        setErrorMsg("Dosyaya Erişilemiyor");
      });
  }, []);

  // 2. ADIM: Model Viewer Olaylarını (Events) Yakalama
  useEffect(() => {
    const el = mvRef.current;
    if (!el) return;

    const onLoad = () => {
        console.log("Model başarıyla yüklendi!");
        setLoadStatus("success");
    };

    const onError = (e: any) => {
      console.log("model-viewer hatası:", e);
      setLoadStatus("error");
      // Hata detayını yakalamaya çalışalım
      const detay = e?.detail?.type || e?.type || "Bilinmeyen Hata";
      setErrorMsg(detay);
    };

    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* Üst Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center justify-between pointer-events-none">
        <button onClick={onClose} className="p-3 bg-slate-800 pointer-events-auto rounded-full">
          <ArrowLeft size={24} className="text-white" />
        </button>
      </div>

      {/* 3D Sahne */}
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        <model-viewer
          ref={mvRef}
          src={humanModelUrl}
          alt="3D İnsan Modeli"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          style={{ width: "100%", height: "100%" }}
        >
          <div slot="poster" className="flex flex-col items-center justify-center w-full h-full text-slate-500 gap-2">
            <Loader2 className="animate-spin w-8 h-8" />
            <span>Model Yükleniyor...</span>
            {/* Debug Bilgisi */}
            <pre className="text-[10px] opacity-60 bg-black/50 p-2 rounded max-w-[80%] overflow-hidden text-center">
                {debugInfo || "Bağlanıyor..."}
            </pre>
          </div>
        </model-viewer>
      </div>

      {/* Hata Kutusu */}
      {loadStatus === "error" && (
        <div className="absolute bottom-20 left-4 right-4 pointer-events-none">
          <div className="bg-red-950/90 text-red-200 p-4 rounded-xl border border-red-800 text-center text-sm">
            <p className="font-bold">Model Açılamadı!</p>
            <p className="mt-1 text-xs opacity-80">Viewer Hatası: {errorMsg}</p>
            <hr className="my-2 border-red-800/50"/>
            <p className="text-[10px] font-mono text-left opacity-70 whitespace-pre-wrap">
                {debugInfo}
            </p>
          </div>
        </div>
      )}
    </div>
  );
        }
