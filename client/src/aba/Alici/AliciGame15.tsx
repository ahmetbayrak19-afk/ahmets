import React, { useState } from 'react';
import '@google/model-viewer'; 
import { ArrowLeft, Loader2 } from 'lucide-react';

// @ts-ignore
import humanModelSrc from './human.glb'; // Bu dursun ama kullanmayacağız

export default function AliciGame15({ onClose }: GameProps) {
  const [loadStatus, setLoadStatus] = useState<string>('loading'); 
  const [errorMsg, setErrorMsg] = useState<string>('');

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col font-sans text-slate-100">
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex items-center justify-between pointer-events-none">
        <button onClick={onClose} className="p-3 bg-slate-800 pointer-events-auto rounded-full"><ArrowLeft size={24}/></button>
      </div>

      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center">
        
        <model-viewer
          // 🟢 TEST 1: İNTERNETTEKİ ASTRONOT
          // Eğer bu çalışırsa: Senin Manifest ayarların sağlam, sorun senin yerel dosyanda.
          // Eğer bu da çalışmazsa: Senin Manifest (GPU) ayarların bozuk.
          src="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
          
          alt="Test Modeli"
          camera-controls          
          auto-rotate              
          camera-target="auto"
          shadow-intensity="1"     
          environment-image="neutral" 
          
          on-error={(e: any) => {
              console.log("Hata:", e);
              setLoadStatus('error');
              setErrorMsg("Hata: " + (e.detail?.type || 'Bilinmiyor'));
          }}
          on-load={() => setLoadStatus('success')}

          style={{ width: '100%', height: '100%' }}
        >
             <div slot="poster" className="flex flex-col items-center justify-center w-full h-full text-slate-500 gap-2">
               <Loader2 className="animate-spin w-8 h-8"/>
               <span>Astronot Çağırılıyor...</span>
            </div>
        </model-viewer>

      </div>
       {/* Hata Mesajı */}
      {loadStatus === 'error' && (
          <div className="absolute bottom-20 left-4 right-4 pointer-events-none">
              <div className="bg-red-950/90 text-red-200 p-4 rounded-xl border border-red-800 text-center text-sm">
                  <p className="font-bold">Astronot Gelmedi!</p>
                  <p className="mt-1 text-xs opacity-80">{errorMsg}</p>
                  <p className="mt-1 text-xs text-yellow-200">Sebep: Manifest hardwareAccelerated eksik olabilir.</p>
              </div>
          </div>
      )}
    </div>
  );
}
