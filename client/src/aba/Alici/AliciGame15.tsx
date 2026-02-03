import React, { useEffect, useRef, useState } from "react";
import "@google/model-viewer";
import { ArrowLeft, Loader2 } from "lucide-react";

// ✅ YENİ ADRES:
// Biz bu adresi Java tarafında yakalayacağız.
// Gerçekte böyle bir site yok, biz "mış gibi" yapıyoruz.
const ANDROID_ASSET_PATH = "https://assets/human.glb";

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const mvRef = useRef<any>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [debugInfo, setDebugInfo] = useState<string>(""); 

  // 1. ADIM: Bağlantı Testi
  useEffect(() => {
    console.log("Hedef Model Yolu:", ANDROID_ASSET_PATH);
    setDebugInfo(`Hedef: ${ANDROID_ASSET_PATH}\n`);

    fetch(ANDROID_ASSET_PATH)
      .then(async (r) => {
        console.log("Fetch Durumu:", r.status, r.statusText);
        
        const blob = await r.blob();
        console.log("Dosya Boyutu:", blob.size);
        
        setDebugInfo(prev => prev + `Durum: ${r.status}\nBoyut: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        
        if (blob.size < 100) {
            setLoadStatus("error");
            setErrorMsg("Dosya boş veya bozuk");
        }
      })
      .catch((err) => {
        console.error("Fetch Hatası:", err);
        setDebugInfo(prev => prev + `Fetch Hatası: ${err.message}`);
      });
  }, []);

  // 2. ADIM: Model Viewer Eventleri
  useEffect(() => {
    const el = mvRef.current;
    if (!el) return;

    const onLoad = () => {
        console.log("Model başarıyla yüklendi!");
        setLoadStatus("success");
        setDebugInfo(prev => prev + "\n✅ Model Viewer Yüklendi!");
    };

    const onError = (e: any) => {
      console.log("model-viewer hatası:", e);
      setLoadStatus("error");
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
        <button onClick={onClose} className="p-3 bg-slate-800 pointer-events-auto rounded-full active:scale-95 transition-transform">
          <ArrowLeft size={24} className="text-white" />
        </button>
      </div>

      {/* 3D Sahne */}
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        <model-viewer
          ref={mvRef}
          src={ANDROID_ASSET_PATH} 
          alt="3D İnsan Modeli"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          environment-image="neutral"
          style={{ width: "100%", height: "100%" }}
        >
          <div slot="poster" className="flex flex-col items-center justify-center w-full h-full text-slate-500 gap-2 bg-slate-900">
            <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
            <span className="text-sm font-medium">Model Yükleniyor...</span>
            <pre className="text-[10px] opacity-60 bg-black/50 p-2 rounded max-w-[90%] overflow-hidden text-center mt-4 border border-slate-800">
                {debugInfo || "Başlatılıyor..."}
            </pre>
          </div>
        </model-viewer>
      </div>

      {/* Hata Kutusu */}
      {loadStatus === "error" && (
        <div className="absolute bottom-10 left-4 right-4 pointer-events-none flex justify-center">
          <div className="bg-red-950/90 text-red-200 p-4 rounded-xl border border-red-800 text-center text-sm max-w-md shadow-2xl backdrop-blur-sm">
            <p className="font-bold text-lg mb-1">Model Açılamadı 😔</p>
            <p className="text-xs opacity-80 mb-2">Hata: {errorMsg}</p>
            <div className="w-full h-px bg-red-800/50 my-2"/>
            <p className="text-[10px] font-mono text-left opacity-70 whitespace-pre-wrap">
                {debugInfo}
            </p>
          </div>
        </div>
      )}
    </div>
  );
            }
        
