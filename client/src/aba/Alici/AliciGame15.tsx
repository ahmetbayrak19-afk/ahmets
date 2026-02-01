import React, { useState } from 'react';
import '@google/model-viewer'; 
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

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
            {loadStatus === 'loading' && <span className="text-yellow-400 flex items-center"><Loader2 className="animate-spin mr-2 h-3 w-3"/> Model Aranıyor...</span>}
            {loadStatus === 'success' && <span className="text-green-400">Başarılı!</span>}
            {loadStatus === 'error' && <span className="text-red-400 flex items-center"><AlertTriangle className="mr-2 h-3 w-3"/> Dosya Bulunamadı</span>}
        </div>
      </div>

      {/* 3D MODEL ALANI */}
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        
        <model-viewer
          // DİKKAT: Başında / yok, klasör adı yok. Direkt dosya ismi.
          // Çünkü public'e attığın dosya, uygulamanın ana dizininde olur.
          src="human.glb"        
          
          alt="3D İnsan Modeli"
          
          // Kamera Ayarları
          camera-controls          
          auto-rotate              
          camera-target="auto"     // Adamı zorla merkeze al
          shadow-intensity="1"     
          environment-image="neutral" 
          
          // Hata kontrolü
          on-error={(e: any) => {
              console.log("Model Hatası:", e);
              setLoadStatus('error');
          }}
          on-load={() => setLoadStatus('success')}

          style={{ width: '100%', height: '100%' }}
        >
             <div slot="poster" className="flex items-center justify-center w-full h-full text-slate-500">
               Yükleniyor...
            </div>
        </model-viewer>

      </div>

      {/* Hata Mesajı - Yol Gösterici */}
      {loadStatus === 'error' && (
          <div className="absolute bottom-20 left-4 right-4 text-center pointer-events-none">
              <div className="bg-red-950/90 text-red-200 p-4 rounded-xl border border-red-800 text-sm shadow-xl backdrop-blur-md">
                  <p className="font-bold mb-1">Model Yüklenemedi!</p>
                  <p className="opacity-80 text-xs">
                      1. Dosya isminin <b>human.glb</b> (küçük harflerle) olduğundan emin ol.<br/>
                      2. Dosyanın <b>client/public</b> klasöründe olduğundan emin ol.
                  </p>
              </div>
          </div>
      )}
    </div>
  );
}
