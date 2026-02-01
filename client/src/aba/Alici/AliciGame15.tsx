import React from 'react';
import '@google/model-viewer'; // 3D göstericiyi çağırıyoruz
import { ArrowLeft } from 'lucide-react';

// Dosyanın aynı klasörde (client/src/aba/Alici/human.glb) olduğunu varsayıyorum
// React bu import sayesinde dosyanın yolunu otomatik bulacak.
import humanModel from './human.glb';

interface GameProps {
  onClose: () => void;
}

// TypeScript'in <model-viewer> etiketini tanıması için bu satırı ekliyoruz
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

export default function AliciGame15({ onClose }: GameProps) {
  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-100">
      
      {/* ÜST BAR (Geri Dön Butonu) */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center bg-slate-900/50 backdrop-blur-sm z-10">
         <button 
           onClick={onClose} 
           className="p-3 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"
         >
            <ArrowLeft size={24} className="text-white"/>
         </button>
         <h2 className="ml-4 text-xl font-bold">Model Test Ekranı</h2>
      </div>

      {/* 3D MODEL ALANI */}
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-900 to-black">
        
        {/* MODEL VIEWER */}
        <model-viewer
          // @ts-ignore
          src={humanModel}        // Senin .glb dosyan
          alt="3D İnsan Modeli"
          camera-controls         // Fareyle/parmakla çevirme
          auto-rotate             // Kendi kendine dönme
          ar                      // Telefondaysa AR butonu çıkar
          shadow-intensity="1"
          style={{ width: '100%', height: '80%' }} // Ekranı kaplasın
        >
        </model-viewer>

      </div>

      <div className="absolute bottom-10 bg-black/50 px-4 py-2 rounded-lg text-sm text-slate-400">
          Parmağınla çevirip kontrol et
      </div>
    </div>
  );
}
