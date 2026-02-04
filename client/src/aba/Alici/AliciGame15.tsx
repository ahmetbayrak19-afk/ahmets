import React, { useEffect, useRef, useState } from "react";
import "@google/model-viewer";
import { ArrowLeft, Loader2, MousePointer2 } from "lucide-react";

// ✅ ADRES: Java tarafında "endsWith('human.glb')" dediğimiz için bu çalışacak.
const ANDROID_ASSET_PATH = "https://assets/human.glb";

export default function AliciGame15({ onClose }: { onClose: () => void }) {
  const mvRef = useRef<any>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [debugInfo, setDebugInfo] = useState<string>(""); 
  
  // 🔥 YENİ: Tıklanan parçanın adını burada tutacağız
  const [clickedPartName, setClickedPartName] = useState<string>("Lütfen bir parçaya dokun...");

  // 1. ADIM: Bağlantı Testi (Senin yazdığın kısım aynen duruyor)
  useEffect(() => {
    setDebugInfo(`Hedef: ${ANDROID_ASSET_PATH}\n`);

    fetch(ANDROID_ASSET_PATH)
      .then(async (r) => {
        const blob = await r.blob();
        setDebugInfo(prev => prev + `Durum: ${r.status}\nBoyut: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        
        if (blob.size < 100) {
            setLoadStatus("error");
            setErrorMsg("Dosya boş veya bozuk");
        }
      })
      .catch((err) => {
        setDebugInfo(prev => prev + `Fetch Hatası: ${err.message}`);
      });
  }, []);

  // 2. ADIM: Eventler
  useEffect(() => {
    const el = mvRef.current;
    if (!el) return;

    const onLoad = () => {
        setLoadStatus("success");
        setDebugInfo(prev => prev + "\n✅ Model Viewer Yüklendi!");
    };

    const onError = (e: any) => {
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

  // 🔥 3. ADIM: TIKLAMA VE İSİM BULMA (RÖNTGEN) 🔥
  const handleModelClick = (event: any) => {
    const mv = mvRef.current;
    if (!mv) return;

    const { clientX, clientY } = event;
    
    // Tıklanan noktadaki materyali bul
    const material = mv.materialFromPoint(clientX, clientY);

    if (material) {
        console.log("Tıklanan Parça:", material.name);
        setClickedPartName(`BULUNAN İSİM: "${material.name}"`);
    } else {
        setClickedPartName("Boşluğa veya tanımsız bir yere tıkladın.");
    }
  };

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
          disable-tap // Varsayılan zoom'u kapat ki bizim tıklamamız çalışsın
          onClick={handleModelClick} // 🔥 TIKLAMAYI BURADAN YAKALIYORUZ
          style={{ width: "100%", height: "100%" }}
        >
          {/* Yükleniyor Ekranı */}
          <div slot="poster" className="flex flex-col items-center justify-center w-full h-full text-slate-500 gap-2 bg-slate-900">
            <Loader2 className="animate-spin w-10 h-10 text-blue-500" />
            <span className="text-sm font-medium">Model Yükleniyor...</span>
          </div>
        </model-viewer>
      </div>

      {/* 🔥 ANALİZ SONUCU GÖSTERGESİ 🔥 */}
      <div className="absolute bottom-10 left-4 right-4 flex justify-center pointer-events-none">
          <div className="bg-blue-600/90 text-white p-4 rounded-xl border border-blue-400 text-center shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-center gap-2 mb-1">
                <MousePointer2 size={20} className="animate-bounce" />
                <p className="font-bold text-lg">PARÇA ANALİZİ</p>
            </div>
            <p className="text-xl font-mono bg-black/20 px-4 py-2 rounded-lg border border-white/20">
                {clickedPartName}
            </p>
            <p className="text-[10px] opacity-70 mt-2">
                (Bu ismi bana söyle hocam, kodlamayı ona göre yapacağız)
            </p>
          </div>
      </div>

      {/* Hata Kutusu */}
      {loadStatus === "error" && (
        <div className="absolute top-20 left-4 right-4 pointer-events-none flex justify-center">
          <div className="bg-red-950/90 text-red-200 p-4 rounded-xl border border-red-800 text-center text-sm max-w-md">
            <p className="font-bold">Model Açılamadı 😔</p>
            <p className="text-xs opacity-80">{errorMsg}</p>
            <p className="text-[10px] mt-2 opacity-50">{debugInfo}</p>
          </div>
        </div>
      )}
    </div>
  );
      }
