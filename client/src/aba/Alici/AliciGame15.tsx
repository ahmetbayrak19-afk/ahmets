import React from 'react';
import '@google/model-viewer'; 
import { ArrowLeft } from 'lucide-react';

// --- KRİTİK NOKTA BURASI ---
// Dosyan 'src' içinde olduğu için onu kod gibi import ediyoruz.
// Senin verdiğin yola göre: ./human/human.glb
import humanModel from './human/human.glb';

interface GameProps {
  onClose: () => void;
}

// TypeScript'in model-viewer'ı ve .glb uzantısını tanıması için ayar
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export default function AliciGame15({ onClose }: GameProps) {
  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col font-sans text-slate-100">
      
      {/* ÜST BAR */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center">
        <button 
          onClick={onClose} 
          className="p-3 bg-slate-800/80 backdrop-blur-md rounded-full border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={24} className="text-white"/>
        </button>
        <div className="ml-4 px-4 py-2 bg-slate-800/80 backdrop-blur-md rounded-lg border border-slate-700">
            <span className="font-bold text-green-400">Test:</span> Adam Geldi mi?
        </div>
      </div>

      {/* 3D MODEL ALANI */}
      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        
        <model-viewer
          // React import ettiği dosyayı buraya veriyoruz
          src={humanModel}        
          alt="3D İnsan Modeli"
          camera-controls         
          auto-rotate             
          ar                      
          shadow-intensity="1"
          style={{ width: '100%', height: '100%' }}
        >
        </model-viewer>

      </div>
    </div>
  );
}
