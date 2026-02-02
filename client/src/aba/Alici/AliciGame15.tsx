import React, { useState } from 'react';
import '@google/model-viewer'; 
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ✅ DOSYAYI BURADA IMPORT EDİYORUZ
// (Dosya AliciGame15.tsx ile aynı klasörde olmalı!)
// @ts-ignore
import humanModel from './human.glb';

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
            {loadStatus === 'loading' && <span className="text-yellow-400 flex items-center"><Loader2 className="animate-spin mr-2 h-3 w-3"/> Yükleniyor...</span>}
            {loadStatus === 'success' && <span className="text-green-400 flex items-center"><CheckCircle2 className="mr-2 h-3 w-3"/> Hazır!</span>}
            {loadStatus === 'error' && <span className="text-red-400 flex items-center"><AlertTriangle className="mr-2 h-3 w-3"/> Dosya Hatası</span>}
        </div>
      </div>

      {/* 3D MODEL ALANI */}
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        
        <model-viewer
          // ✅ ARTIK IMPORT ETTİĞİMİZ DEĞİŞKENİ VERİYORUZ
          src={humanModel}        
          
          alt="3D İnsan Modeli"
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
               Yükleniyor...
            </div>
        </model-viewer>

      </div>
    </div>
  );
      }
