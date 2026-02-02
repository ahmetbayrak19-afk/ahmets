import React, { useState } from 'react';
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
             {/* Durum mesajı */}
             {loadStatus === 'loading' && <span className="text-yellow-400 flex items-center gap-2"><Loader2 className="animate-spin w-3 h-3"/> Yükleniyor...</span>}
             {loadStatus === 'success' && <span className="text-green-400">Model Hazır!</span>}
             {loadStatus === 'error' && <span className="text-red-400">Yükleme Hatası</span>}
        </div>
      </div>

      {/* 3D MODEL ALANI */}
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        
        <model-viewer
          // 🟢 KRİTİK NOKTA: Başına NOKTA koyuyoruz. 
          // Android APK içinde "assets" klasöründeki dosyayı bulması için şart.
          src="./human.glb"        
          
          alt="3D İnsan Modeli"
          camera-controls          
          auto-rotate              
          camera-target="auto"
          shadow-intensity="1"     
          environment-image="neutral" 
          
          // Debug (Hata Yakalama)
          on-error={(e: any) => {
              console.log("Hata Detayı:", e);
              setLoadStatus('error');
              setErrorMsg(e.detail?.type || 'Bilinmeyen Hata');
          }}
          on-load={() => setLoadStatus('success')}

          style={{ width: '100%', height: '100%' }}
        >
             <div slot="poster" className="flex flex-col items-center justify-center w-full h-full text-slate-500 animate-pulse gap-2">
               <Loader2 className="animate-spin w-8 h-8"/>
               <span>Model Hazırlanıyor...</span>
               <span className="text-xs opacity-50 font-mono">Yol: ./human.glb</span>
            </div>
        </model-viewer>

      </div>
      
       {/* Hata Olursa Ekrana Bas */}
      {loadStatus === 'error' && (
          <div className="absolute bottom-20 left-4 right-4 pointer-events-none">
              <div className="bg-red-950/90 text-red-200 p-4 rounded-xl border border-red-800 text-center text-sm">
                  <p className="font-bold">Model Açılamadı!</p>
                  <p className="mt-1 text-xs opacity-80">
                      Hata: {errorMsg}<br/>
                      Lütfen dosyanın <b>client/public</b> klasöründe olduğundan emin ol.
                  </p>
              </div>
          </div>
      )}
    </div>
  );
             }
