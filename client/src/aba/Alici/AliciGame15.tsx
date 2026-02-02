import React, { useState, useEffect, useRef } from 'react';
import '@google/model-viewer'; 
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface GameProps {
  onClose: () => void;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export default function AliciGame15({ onClose }: GameProps) {
  const [loadStatus, setLoadStatus] = useState<string>('loading'); 
  const [errorMsg, setErrorMsg] = useState<string>('');
  const modelRef = useRef<HTMLElement>(null);

  // 🟢 SENİN ÖNERDİĞİN GARANTİ YÖNTEM
  // React event'lerine güvenmeyip direkt elemente kanca atıyoruz.
  useEffect(() => {
    const modelViewer = modelRef.current;
    if (!modelViewer) return;

    const onModelLoad = () => {
        console.log("✅ MODEL_VIEWER_LOADED: Yükleme Başarılı");
        setLoadStatus('success');
    };

    const onModelError = (e: any) => {
        console.error("❌ MODEL_VIEWER_ERROR:", e);
        // Hata detayını yakalamaya çalışalım
        const detail = e.detail?.type || e.type || "Bilinmeyen Hata";
        setErrorMsg(detail);
        setLoadStatus('error');
    };

    // Dinleyicileri ekle
    modelViewer.addEventListener('load', onModelLoad);
    modelViewer.addEventListener('error', onModelError);

    // Temizlik (Cleanup)
    return () => {
        modelViewer.removeEventListener('load', onModelLoad);
        modelViewer.removeEventListener('error', onModelError);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* ÜST BAR */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center justify-between pointer-events-none">
        <button 
          onClick={onClose} 
          className="p-3 bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-700 hover:bg-slate-700 transition-colors pointer-events-auto"
        >
          <ArrowLeft size={24} className="text-white"/>
        </button>
        
        <div className="px-4 py-2 bg-slate-800/80 backdrop-blur-md rounded-lg border border-slate-700 text-xs font-mono">
             {loadStatus === 'loading' && <span className="text-yellow-400 flex items-center gap-2"><Loader2 className="animate-spin w-3 h-3"/> Yükleniyor...</span>}
             {loadStatus === 'success' && <span className="text-green-400">Model Hazır!</span>}
             {loadStatus === 'error' && <span className="text-red-400">Yükleme Hatası</span>}
        </div>
      </div>

      {/* 3D MODEL ALANI */}
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        
        <model-viewer
          ref={modelRef}
          // 🟢 DOĞRU YOL: Public klasöründeki dosyayı, uygulamanın çalıştığı dizinde ara.
          src="./human.glb"        
          
          alt="3D İnsan Modeli"
          camera-controls          
          auto-rotate              
          camera-target="auto"
          shadow-intensity="1"     
          environment-image="neutral" 
          style={{ width: '100%', height: '100%' }}
        >
             <div slot="poster" className="flex flex-col items-center justify-center w-full h-full text-slate-500 animate-pulse gap-2">
               <Loader2 className="animate-spin w-8 h-8"/>
               <span>Model Hazırlanıyor...</span>
               <span className="text-xs opacity-50 font-mono">Yol: ./human.glb</span>
            </div>
        </model-viewer>

      </div>
      
       {/* Hata Detay Ekranı */}
      {loadStatus === 'error' && (
          <div className="absolute bottom-20 left-4 right-4 pointer-events-none">
              <div className="bg-red-950/90 text-red-200 p-4 rounded-xl border border-red-800 text-center text-sm">
                  <p className="font-bold">Model Açılamadı!</p>
                  <p className="mt-2 text-xs opacity-80 font-mono bg-black/30 p-2 rounded">
                      Hata Detayı: {errorMsg}
                  </p>
                  <p className="mt-2 text-xs">
                      1. android/app/src/main/assets klasöründe <b>human.glb</b> var mı?<br/>
                      2. Hardware Acceleration açık mı?
                  </p>
              </div>
          </div>
      )}
    </div>
  );
      }
