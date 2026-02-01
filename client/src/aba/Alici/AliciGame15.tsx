import React, { useState } from 'react';
import '@google/model-viewer'; 
import { ArrowLeft, Loader2, AlertTriangle, Wifi } from 'lucide-react';

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
            {loadStatus === 'loading' && <span className="text-yellow-400 flex items-center"><Loader2 className="animate-spin mr-2 h-3 w-3"/> İnternetten Çekiliyor...</span>}
            {loadStatus === 'success' && <span className="text-green-400 flex items-center"><Wifi className="mr-2 h-3 w-3"/> Test Başarılı!</span>}
            {loadStatus === 'error' && <span className="text-red-400 flex items-center"><AlertTriangle className="mr-2 h-3 w-3"/> Bağlantı Hatası</span>}
        </div>
      </div>

      {/* 3D MODEL ALANI */}
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        
        {/* TEST MODU: Google'ın sunucusundan astronot çekiyoruz */}
        <model-viewer
          src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"        
          alt="3D Test Modeli"
          camera-controls          
          auto-rotate              
          camera-target="auto"
          shadow-intensity="1"     
          environment-image="neutral" 
          
          on-error={(e: any) => {
              console.log("Model Hatası:", e);
              setLoadStatus('error');
          }}
          on-load={() => setLoadStatus('success')}

          style={{ width: '100%', height: '100%' }}
        >
             <div slot="poster" className="flex items-center justify-center w-full h-full text-slate-500">
               Test Modeli Yükleniyor...
            </div>
        </model-viewer>

      </div>

      {/* Bilgilendirme */}
      <div className="absolute bottom-10 left-0 right-0 text-center px-4 pointer-events-none">
          <p className="text-xs text-slate-500 bg-black/50 p-2 rounded inline-block">
              Bu test internet bağlantısı gerektirir.
          </p>
      </div>
    </div>
  );
}
