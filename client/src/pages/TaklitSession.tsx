import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, Play, Pause, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { twMerge } from 'tailwind-merge';

interface TaklitSessionProps {
  itemCode: string;
  itemText: string;
  videoUrl: string; // Dışarıdan gelen video linki
  currentStatus: boolean | null;
  onClose: () => void;
  onSaveStatus: (status: boolean) => void;
}

export default function TaklitSession({ itemCode, itemText, videoUrl, currentStatus, onClose, onSaveStatus }: TaklitSessionProps) {
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sampleVideoRef = useRef<HTMLVideoElement>(null);

  // Kamera Açılışı
  useEffect(() => {
    let stream: MediaStream;
    const startCamera = async () => {
      try {
        // Ön kamerayı (user) aç
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error(err);
        toast.error("Kamera açılamadı. İzinleri kontrol edin.");
      }
    };
    startCamera();

    // Temizlik: Sayfa kapanınca kamerayı kapat
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in slide-in-from-bottom duration-300">
      
      {/* ÜST BAR */}
      <div className="bg-slate-900/90 p-4 flex items-center justify-between border-b border-slate-800 safe-area-top">
        <Button variant="ghost" onClick={onClose} className="text-white hover:bg-slate-800">
          <ArrowLeft className="mr-2" /> Listeye Dön
        </Button>
        <div className="text-right">
            <div className="text-xs text-slate-400 font-mono">{itemCode}</div>
            <div className="text-sm font-bold text-white truncate max-w-[150px] sm:max-w-[300px]">{itemText}</div>
        </div>
      </div>

      {/* ORTA ALAN (VİDEO + AYNA) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-black">
        
        {/* 1. SOL/ÜST: MODEL VİDEOSU */}
        <div className="flex-1 relative border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900">
          <video 
            ref={sampleVideoRef} 
            src={videoUrl} 
            className="w-full h-full object-contain" 
            playsInline 
            loop 
            // controls // İstersen standart kontrolleri açabilirsin
          />
          
          <div className="absolute top-2 left-2 bg-blue-600/80 text-white px-2 py-1 rounded text-[10px] font-bold uppercase z-10">MODEL</div>
          
          {/* Özel Video Kontrolleri */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-10 pointer-events-none">
            <div className="pointer-events-auto flex gap-4 bg-black/50 p-2 rounded-full backdrop-blur-sm">
                <button onClick={() => sampleVideoRef.current?.play()} className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95"><Play size={20} fill="currentColor" /></button>
                <button onClick={() => sampleVideoRef.current?.pause()} className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95"><Pause size={20} fill="currentColor" /></button>
                <button onClick={() => {if(sampleVideoRef.current) sampleVideoRef.current.currentTime = 0;}} className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95"><RotateCcw size={20} /></button>
            </div>
          </div>
        </div>

        {/* 2. SAĞ/ALT: ÖĞRENCİ KAMERASI (AYNA) */}
        <div className="flex-1 relative bg-black">
            {cameraStream ? (
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover transform -scale-x-100" // AYNA ETKİSİ İÇİN TERS ÇEVİRİYORUZ
                />
            ) : (
                <div className="flex h-full items-center justify-center text-slate-500 gap-2">
                    <Loader2 className="animate-spin" /> Kamera Başlatılıyor...
                </div>
            )}
            <div className="absolute top-2 left-2 bg-red-600/80 text-white px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div> SEN
            </div>
        </div>
      </div>

      {/* ALT BAR: PUANLAMA */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-center gap-4 pb-8 md:pb-4 safe-area-bottom">
        <button 
            onClick={() => { onSaveStatus(false); toast("Tekrar deneyelim."); }}
            className={twMerge(
                "flex-1 max-w-[150px] py-3 rounded-2xl border flex flex-col items-center gap-1 transition-all active:scale-95", 
                currentStatus === false ? "bg-red-900/40 border-red-500 text-red-400" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            )}
        >
            <XCircle size={28} /> <span className="font-bold text-xs">YAPAMADI</span>
        </button>

        <button 
            onClick={() => { onSaveStatus(true); toast.success("Harika! Başardı."); }}
            className={twMerge(
                "flex-1 max-w-[150px] py-3 rounded-2xl border flex flex-col items-center gap-1 transition-all active:scale-95", 
                currentStatus === true ? "bg-green-900/40 border-green-500 text-green-400" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
            )}
        >
            <CheckCircle2 size={28} /> <span className="font-bold text-xs">BAĞIMSIZ YAPTI</span>
        </button>
      </div>
    </div>
  );
        }
